// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, externalEuint64, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {AccessController} from "./AccessController.sol";

/**
 * @title   EmployeeRegistry
 * @notice  Stores employee records with fully encrypted salaries.
 *          Only the employer (ADMIN) and the respective employee themselves
 *          can view and decrypt salary values via FHE ACL.
 *
 * @dev     Encrypted salaries are stored as euint64 handles.
 *          ACL grants:
 *            - FHE.allowThis  → this contract can use the salary in payroll execution
 *            - FHE.allow(employer) → employer can decrypt for aggregate analytics
 *            - FHE.allow(employee) → employee can decrypt their own salary client-side
 */
contract EmployeeRegistry is ZamaEthereumConfig {
    // ─── Types ───────────────────────────────────────────────────────────────
    enum PaymentFrequency {
        Monthly,
        Biweekly,
        Weekly
    }
    enum EmployeeStatus {
        Active,
        Inactive,
        Removed
    }

    struct Employee {
        string name;
        string role;
        string department;
        euint64 encryptedSalary; // FHE-encrypted salary handle
        address paymentToken; // Which ERC7984 token to pay in
        PaymentFrequency frequency;
        EmployeeStatus status;
        uint256 addedAt;
        uint256 lastSalaryUpdate;
    }

    // ─── Storage ──────────────────────────────────────────────────────────────
    AccessController public immutable accessController;

    mapping(address => Employee) private _employees;
    address[] private _employeeList;
    mapping(address => bool) private _isRegistered;

    // Company metadata
    string public companyName;
    address public employer;
    address public payrollManager;

    // ─── Events ───────────────────────────────────────────────────────────────
    event EmployeeAdded(
        address indexed wallet,
        string name,
        string role,
        uint256 timestamp
    );
    event SalaryUpdated(address indexed wallet, uint256 timestamp);
    event EmployeeRemoved(address indexed wallet, uint256 timestamp);
    event EmployeeStatusChanged(address indexed wallet, EmployeeStatus status);
    event PayrollManagerSet(address indexed manager);

    // ─── Errors ───────────────────────────────────────────────────────────────
    error NotAdmin();
    error EmployeeAlreadyExists(address wallet);
    error EmployeeNotFound(address wallet);
    error EmployeeNotActive(address wallet);
    error ZeroAddress();
    error EmptyName();
    error InvalidSalaryHandle();

    // ─── Modifiers ────────────────────────────────────────────────────────────
    modifier onlyAdmin() {
        if (!accessController.isAdmin(msg.sender)) revert NotAdmin();
        _;
    }

    modifier employeeExists(address wallet) {
        if (!_isRegistered[wallet]) revert EmployeeNotFound(wallet);
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor(
        address _employer,
        string memory _companyName,
        address _accessController
    ) {
        if (_employer == address(0)) revert ZeroAddress();
        employer = _employer;
        companyName = _companyName;
        accessController = AccessController(_accessController);
    }

    function setPayrollManager(address _payrollManager) external onlyAdmin {
        if (_payrollManager == address(0)) revert ZeroAddress();
        payrollManager = _payrollManager;
        emit PayrollManagerSet(_payrollManager);
    }

    // ─── Employee CRUD ────────────────────────────────────────────────────────

    /**
     * @notice  Add a new employee with an encrypted salary.
     * @dev     The salary must be encrypted client-side using the Relayer SDK
     *          before calling this function.
     *          ACL is configured so only employer + employee can decrypt salary.
     *
     * @param   wallet           Employee's wallet address
     * @param   name             Full name (stored plaintext for UI)
     * @param   role             Job title (stored plaintext for UI)
     * @param   department       Department name
     * @param   encryptedSalary  Encrypted salary handle from Zama SDK
     * @param   inputProof       Proof of knowledge of the encrypted value
     * @param   paymentToken     ERC7984 token address for payroll
     * @param   frequency        Payment frequency (Monthly / Biweekly / Weekly)
     */
    function addEmployee(
        address wallet,
        string calldata name,
        string calldata role,
        string calldata department,
        externalEuint64 encryptedSalary,
        bytes calldata inputProof,
        address paymentToken,
        PaymentFrequency frequency
    ) external onlyAdmin {
        if (wallet == address(0)) revert ZeroAddress();
        if (_isRegistered[wallet]) revert EmployeeAlreadyExists(wallet);
        if (bytes(name).length == 0) revert EmptyName();

        // Convert external encrypted input into FHEVM internal handle
        euint64 salary = FHE.fromExternal(encryptedSalary, inputProof);

        // Configure ACL:
        // - Contract itself can use the salary handle for payroll computation
        FHE.allowThis(salary);
        // - Employer can decrypt (for aggregate analytics, HR review)
        FHE.allow(salary, employer);
        // - Employee can decrypt their own salary client-side
        FHE.allow(salary, wallet);
        // - PayrollManager can use this handle when executing confidential transfers
        if (payrollManager != address(0)) {
            FHE.allow(salary, payrollManager);
        }

        _employees[wallet] = Employee({
            name: name,
            role: role,
            department: department,
            encryptedSalary: salary,
            paymentToken: paymentToken,
            frequency: frequency,
            status: EmployeeStatus.Active,
            addedAt: block.timestamp,
            lastSalaryUpdate: block.timestamp
        });

        _employeeList.push(wallet);
        _isRegistered[wallet] = true;

        emit EmployeeAdded(wallet, name, role, block.timestamp);
    }

    /**
     * @notice  Update an employee's encrypted salary.
     * @dev     Old salary handle ACL is superseded by the new handle's ACL.
     */
    function updateSalary(
        address wallet,
        externalEuint64 newEncryptedSalary,
        bytes calldata inputProof
    ) external onlyAdmin employeeExists(wallet) {
        Employee storage emp = _employees[wallet];
        if (emp.status == EmployeeStatus.Removed)
            revert EmployeeNotActive(wallet);

        euint64 newSalary = FHE.fromExternal(newEncryptedSalary, inputProof);

        // Re-configure ACL for new salary handle
        FHE.allowThis(newSalary);
        FHE.allow(newSalary, employer);
        FHE.allow(newSalary, wallet);
        if (payrollManager != address(0)) {
            FHE.allow(newSalary, payrollManager);
        }

        emp.encryptedSalary = newSalary;
        emp.lastSalaryUpdate = block.timestamp;

        emit SalaryUpdated(wallet, block.timestamp);
    }

    /**
     * @notice  Deactivate an employee (soft remove).
     *          Their record is retained for audit purposes.
     */
    function removeEmployee(
        address wallet
    ) external onlyAdmin employeeExists(wallet) {
        _employees[wallet].status = EmployeeStatus.Removed;
        emit EmployeeRemoved(wallet, block.timestamp);
        emit EmployeeStatusChanged(wallet, EmployeeStatus.Removed);
    }

    /**
     * @notice  Toggle employee active/inactive status (e.g., leave of absence).
     */
    function setEmployeeStatus(
        address wallet,
        EmployeeStatus status
    ) external onlyAdmin employeeExists(wallet) {
        _employees[wallet].status = status;
        emit EmployeeStatusChanged(wallet, status);
    }

    // ─── Salary View (ACL-Gated) ──────────────────────────────────────────────

    /**
     * @notice  Returns the encrypted salary handle for a given employee.
     * @dev     The caller must have ACL permission to decrypt (employer or employee).
     *          The handle alone is just a bytes32 — decryption requires the Relayer SDK.
     */
    function getEncryptedSalary(
        address wallet
    ) external view employeeExists(wallet) returns (euint64) {
        return _employees[wallet].encryptedSalary;
    }

    // ─── Public Metadata View ─────────────────────────────────────────────────

    function getEmployeeInfo(
        address wallet
    )
        external
        view
        employeeExists(wallet)
        returns (
            string memory name,
            string memory role,
            string memory department,
            address paymentToken,
            PaymentFrequency frequency,
            EmployeeStatus status,
            uint256 addedAt,
            uint256 lastSalaryUpdate
        )
    {
        Employee storage emp = _employees[wallet];
        return (
            emp.name,
            emp.role,
            emp.department,
            emp.paymentToken,
            emp.frequency,
            emp.status,
            emp.addedAt,
            emp.lastSalaryUpdate
        );
    }

    function getEmployeeCount() external view returns (uint256) {
        return _employeeList.length;
    }

    function getActiveEmployeeCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < _employeeList.length; i++) {
            if (_employees[_employeeList[i]].status == EmployeeStatus.Active) {
                count++;
            }
        }
        return count;
    }

    function getAllEmployees() external view returns (address[] memory) {
        return _employeeList;
    }

    function getActiveEmployees() external view returns (address[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < _employeeList.length; i++) {
            if (_employees[_employeeList[i]].status == EmployeeStatus.Active) {
                activeCount++;
            }
        }

        address[] memory active = new address[](activeCount);
        uint256 idx = 0;
        for (uint256 i = 0; i < _employeeList.length; i++) {
            if (_employees[_employeeList[i]].status == EmployeeStatus.Active) {
                active[idx++] = _employeeList[i];
            }
        }
        return active;
    }

    function isEmployee(address wallet) external view returns (bool) {
        return _isRegistered[wallet];
    }

    function isActiveEmployee(address wallet) external view returns (bool) {
        return
            _isRegistered[wallet] &&
            _employees[wallet].status == EmployeeStatus.Active;
    }
}
