// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {AccessController} from "./AccessController.sol";
import {EmployeeRegistry} from "./EmployeeRegistry.sol";
import {ConfidentialPayrollToken} from "./ConfidentialPayrollToken.sol";

/**
 * @title   PayrollManager
 * @notice  The payroll execution engine for CipherPay.
 *          Reads encrypted salaries from EmployeeRegistry and executes
 *          confidential transfers from the company treasury to each employee.
 *
 *          Key features:
 *          - Full payroll (all active employees) or selective batch
 *          - Multi-sig approval required before execution
 *          - FHE aggregate of total payroll (never decrypted onchain)
 *          - Payroll history with event logs
 *          - ACL allows employer to decrypt aggregate stats client-side
 */
contract PayrollManager is ZamaEthereumConfig {
    // ─── Types ───────────────────────────────────────────────────────────────
    enum PayrollStatus {
        Pending,
        Approved,
        Executed,
        Cancelled
    }

    struct PayrollCycle {
        uint256 id;
        uint256 timestamp;
        uint256 scheduledFor; // Unix timestamp when payroll should execute
        uint256 employeeCount;
        uint256 executedAt;
        PayrollStatus status;
        address initiator;
        address[] processedEmployees;
    }

    // ─── Storage ─────────────────────────────────────────────────────────────
    AccessController public immutable accessController;
    EmployeeRegistry public immutable employeeRegistry;
    ConfidentialPayrollToken public immutable payrollToken;

    address public employer;

    uint256 public currentCycleId;
    mapping(uint256 => PayrollCycle) public payrollCycles;

    // The running encrypted total payroll (FHE aggregate)
    euint64 private _totalPayroll;
    bool private _totalPayrollInitialized;

    // Payroll schedule
    uint256 public nextPayrollDate;
    uint256 public payrollIntervalDays; // e.g. 30 for monthly

    // ─── Events ──────────────────────────────────────────────────────────────
    event PayrollInitiated(
        uint256 indexed cycleId,
        address initiator,
        uint256 employeeCount
    );
    event PayrollExecuted(
        uint256 indexed cycleId,
        uint256 timestamp,
        uint256 employeeCount
    );
    event PayrollCancelled(uint256 indexed cycleId, address cancelledBy);
    event PayrollScheduled(uint256 nextDate, uint256 intervalDays);
    event EmployeePaid(uint256 indexed cycleId, address indexed employee);

    // ─── Errors ──────────────────────────────────────────────────────────────
    error NotFinance();
    error NotAdmin();
    error PayrollNotApproved(uint256 cycleId);
    error PayrollAlreadyExecuted(uint256 cycleId);
    error PayrollNotFound(uint256 cycleId);
    error NoCycleActive();
    error NoActiveEmployees();
    error InvalidInterval();
    error TransferFailed(address employee);

    // ─── Modifiers ────────────────────────────────────────────────────────────
    modifier onlyFinance() {
        if (!accessController.isFinance(msg.sender)) revert NotFinance();
        _;
    }

    modifier onlyAdmin() {
        if (!accessController.isAdmin(msg.sender)) revert NotAdmin();
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor(
        address _employer,
        address _accessController,
        address _employeeRegistry,
        address _payrollToken,
        uint256 _firstPayrollDate,
        uint256 _intervalDays
    ) {
        if (_intervalDays == 0) revert InvalidInterval();

        employer = _employer;
        accessController = AccessController(_accessController);
        employeeRegistry = EmployeeRegistry(_employeeRegistry);
        payrollToken = ConfidentialPayrollToken(_payrollToken);
        nextPayrollDate = _firstPayrollDate;
        payrollIntervalDays = _intervalDays;
    }

    // ─── Payroll Execution ────────────────────────────────────────────────────

    /**
     * @notice  Initiate a payroll cycle for ALL active employees.
     * @dev     Creates the cycle record and initiates approval workflow.
     *          Actual transfer happens in executePayroll() after required approvals.
     */
    function initiatePayroll() external onlyFinance returns (uint256 cycleId) {
        address[] memory active = employeeRegistry.getActiveEmployees();
        if (active.length == 0) revert NoActiveEmployees();

        cycleId = ++currentCycleId;

        PayrollCycle storage cycle = payrollCycles[cycleId];
        cycle.id = cycleId;
        cycle.timestamp = block.timestamp;
        cycle.scheduledFor = nextPayrollDate;
        cycle.employeeCount = active.length;
        cycle.status = PayrollStatus.Pending;
        cycle.initiator = msg.sender;

        emit PayrollInitiated(cycleId, msg.sender, active.length);
    }

    /**
     * @notice  Initiate a payroll cycle for a specific subset of employees.
     */
    function initiatePayrollBatch(
        address[] calldata selectedEmployees
    ) external onlyFinance returns (uint256 cycleId) {
        if (selectedEmployees.length == 0) revert NoActiveEmployees();

        cycleId = ++currentCycleId;

        PayrollCycle storage cycle = payrollCycles[cycleId];
        cycle.id = cycleId;
        cycle.timestamp = block.timestamp;
        cycle.scheduledFor = block.timestamp;
        cycle.employeeCount = selectedEmployees.length;
        cycle.status = PayrollStatus.Pending;
        cycle.initiator = msg.sender;

        emit PayrollInitiated(cycleId, msg.sender, selectedEmployees.length);
    }

    /**
     * @notice  Execute approved payroll cycle — transfers encrypted salaries.
     * @dev     Requires multi-sig approval threshold to be met.
     *          For each employee, does a confidential transfer of their
     *          encrypted salary from this contract's balance.
     *
     *          IMPORTANT: The PayrollManager must hold sufficient token balance
     *          before calling this. Fund it with payrollToken.mint(address(this), ...).
     */
    function executePayroll(uint256 cycleId) external onlyFinance {
        PayrollCycle storage cycle = payrollCycles[cycleId];
        if (cycle.id == 0) revert PayrollNotFound(cycleId);
        if (cycle.status == PayrollStatus.Executed)
            revert PayrollAlreadyExecuted(cycleId);
        if (!accessController.isPayrollApproved(cycleId))
            revert PayrollNotApproved(cycleId);

        address[] memory active = employeeRegistry.getActiveEmployees();
        if (active.length == 0) revert NoActiveEmployees();

        // Reset total payroll aggregate for this cycle
        _totalPayroll = FHE.asEuint64(0);
        _totalPayrollInitialized = true;

        for (uint256 i = 0; i < active.length; i++) {
            address emp = active[i];
            euint64 salary = employeeRegistry.getEncryptedSalary(emp);

            // Confidential transfer: salary moves from this contract to employee
            // ERC7984's confidentialTransfer handles encrypted subtraction/addition
            payrollToken.confidentialTransfer(emp, salary);

            // Accumulate total payroll using FHE addition (still encrypted)
            _totalPayroll = FHE.add(_totalPayroll, salary);

            cycle.processedEmployees.push(emp);
            emit EmployeePaid(cycleId, emp);
        }

        // Grant employer ACL on total payroll so they can decrypt it client-side
        FHE.allowThis(_totalPayroll);
        FHE.allow(_totalPayroll, employer);

        cycle.status = PayrollStatus.Executed;
        cycle.executedAt = block.timestamp;
        cycle.employeeCount = active.length;

        // Advance schedule
        nextPayrollDate = block.timestamp + (payrollIntervalDays * 1 days);

        emit PayrollExecuted(cycleId, block.timestamp, active.length);
    }

    /**
     * @notice  Execute payroll for a manually specified list of employees.
     */
    function executePayrollBatch(
        uint256 cycleId,
        address[] calldata selectedEmployees
    ) external onlyFinance {
        PayrollCycle storage cycle = payrollCycles[cycleId];
        if (cycle.id == 0) revert PayrollNotFound(cycleId);
        if (cycle.status == PayrollStatus.Executed)
            revert PayrollAlreadyExecuted(cycleId);
        if (!accessController.isPayrollApproved(cycleId))
            revert PayrollNotApproved(cycleId);

        euint64 batchTotal = FHE.asEuint64(0);

        for (uint256 i = 0; i < selectedEmployees.length; i++) {
            address emp = selectedEmployees[i];
            if (!employeeRegistry.isActiveEmployee(emp)) continue;

            euint64 salary = employeeRegistry.getEncryptedSalary(emp);
            payrollToken.confidentialTransfer(emp, salary);

            batchTotal = FHE.add(batchTotal, salary);

            cycle.processedEmployees.push(emp);
            emit EmployeePaid(cycleId, emp);
        }

        FHE.allowThis(batchTotal);
        FHE.allow(batchTotal, employer);

        if (!_totalPayrollInitialized) {
            _totalPayroll = batchTotal;
            _totalPayrollInitialized = true;
        } else {
            _totalPayroll = FHE.add(_totalPayroll, batchTotal);
        }

        cycle.status = PayrollStatus.Executed;
        cycle.executedAt = block.timestamp;

        nextPayrollDate = block.timestamp + (payrollIntervalDays * 1 days);

        emit PayrollExecuted(
            cycleId,
            block.timestamp,
            selectedEmployees.length
        );
    }

    function cancelPayroll(uint256 cycleId) external onlyAdmin {
        PayrollCycle storage cycle = payrollCycles[cycleId];
        if (cycle.id == 0) revert PayrollNotFound(cycleId);
        if (cycle.status == PayrollStatus.Executed)
            revert PayrollAlreadyExecuted(cycleId);

        cycle.status = PayrollStatus.Cancelled;
        emit PayrollCancelled(cycleId, msg.sender);
    }

    // ─── Analytics (FHE) ─────────────────────────────────────────────────────

    /**
     * @notice  Returns the encrypted total payroll handle.
     * @dev     The employer can decrypt this client-side via userDecrypt().
     *          No individual salary is ever revealed — only the aggregate.
     */
    function getTotalPayroll() external view returns (euint64) {
        return _totalPayroll;
    }

    /**
     * @notice  Computes the aggregate salary of all currently active employees.
     * @dev     Result is an encrypted euint64 handle. Call off-chain for gas efficiency.
     *          The employer must have ACL permission (granted in executePayroll).
     */
    function computeCurrentPayrollAggregate() external returns (euint64) {
        address[] memory active = employeeRegistry.getActiveEmployees();

        euint64 aggregate = FHE.asEuint64(0);
        for (uint256 i = 0; i < active.length; i++) {
            euint64 salary = employeeRegistry.getEncryptedSalary(active[i]);
            aggregate = FHE.add(aggregate, salary);
        }

        FHE.allowThis(aggregate);
        FHE.allow(aggregate, employer);

        return aggregate;
    }

    // ─── Scheduling ──────────────────────────────────────────────────────────

    function setPayrollSchedule(
        uint256 _nextPayrollDate,
        uint256 _intervalDays
    ) external onlyAdmin {
        if (_intervalDays == 0) revert InvalidInterval();
        nextPayrollDate = _nextPayrollDate;
        payrollIntervalDays = _intervalDays;
        emit PayrollScheduled(_nextPayrollDate, _intervalDays);
    }

    // ─── View ─────────────────────────────────────────────────────────────────

    function getPayrollCycle(
        uint256 cycleId
    ) external view returns (PayrollCycle memory) {
        return payrollCycles[cycleId];
    }

    function getPayrollHistory(
        uint256 fromCycle,
        uint256 toCycle
    ) external view returns (PayrollCycle[] memory) {
        if (toCycle > currentCycleId) toCycle = currentCycleId;
        uint256 count = toCycle >= fromCycle ? toCycle - fromCycle + 1 : 0;
        PayrollCycle[] memory history = new PayrollCycle[](count);
        for (uint256 i = 0; i < count; i++) {
            history[i] = payrollCycles[fromCycle + i];
        }
        return history;
    }

    function getDaysUntilNextPayroll() external view returns (uint256) {
        if (block.timestamp >= nextPayrollDate) return 0;
        return (nextPayrollDate - block.timestamp) / 1 days;
    }
}
