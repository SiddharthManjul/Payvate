// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title   AccessController
 * @notice  Role-based access control for CipherPay payroll system.
 *          Manages ADMIN, FINANCE, and HR roles, plus multi-sig thresholds
 *          for payroll approval before execution.
 */
contract AccessController is AccessControl, Ownable {
    // ─── Roles ───────────────────────────────────────────────────────────────
    bytes32 public constant ADMIN_ROLE   = keccak256("ADMIN_ROLE");
    bytes32 public constant FINANCE_ROLE = keccak256("FINANCE_ROLE");
    bytes32 public constant HR_ROLE      = keccak256("HR_ROLE");

    // ─── Multi-sig Config ────────────────────────────────────────────────────
    uint256 public approvalThreshold;
    address[] public approvers;

    // payroll cycle ID => approver => approved
    mapping(uint256 => mapping(address => bool)) private _approvals;
    // payroll cycle ID => count
    mapping(uint256 => uint256) private _approvalCounts;

    // ─── Events ──────────────────────────────────────────────────────────────
    event RoleGrantedTo(bytes32 indexed role, address indexed account);
    event RoleRevokedFrom(bytes32 indexed role, address indexed account);
    event PayrollApproved(uint256 indexed cycleId, address indexed approver, uint256 totalApprovals);
    event ThresholdUpdated(uint256 newThreshold);
    event ApproverAdded(address indexed approver);
    event ApproverRemoved(address indexed approver);

    // ─── Errors ──────────────────────────────────────────────────────────────
    error NotAnApprover(address caller);
    error AlreadyApproved(uint256 cycleId, address approver);
    error InvalidThreshold();
    error ApproverAlreadyExists(address approver);
    error ApproverNotFound(address approver);

    // ─── Constructor ─────────────────────────────────────────────────────────
    constructor(address initialAdmin, uint256 _approvalThreshold) Ownable(initialAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(ADMIN_ROLE, initialAdmin);
        _grantRole(FINANCE_ROLE, initialAdmin);

        approvers.push(initialAdmin);
        approvalThreshold = _approvalThreshold;
    }

    // ─── Role Management ─────────────────────────────────────────────────────

    function grantAdminRole(address account) external onlyOwner {
        _grantRole(ADMIN_ROLE, account);
        emit RoleGrantedTo(ADMIN_ROLE, account);
    }

    function grantFinanceRole(address account) external onlyRole(ADMIN_ROLE) {
        _grantRole(FINANCE_ROLE, account);
        emit RoleGrantedTo(FINANCE_ROLE, account);
    }

    function grantHRRole(address account) external onlyRole(ADMIN_ROLE) {
        _grantRole(HR_ROLE, account);
        emit RoleGrantedTo(HR_ROLE, account);
    }

    function revokeAdminRole(address account) external onlyOwner {
        _revokeRole(ADMIN_ROLE, account);
        emit RoleRevokedFrom(ADMIN_ROLE, account);
    }

    function revokeFinanceRole(address account) external onlyRole(ADMIN_ROLE) {
        _revokeRole(FINANCE_ROLE, account);
        emit RoleRevokedFrom(FINANCE_ROLE, account);
    }

    function revokeHRRole(address account) external onlyRole(ADMIN_ROLE) {
        _revokeRole(HR_ROLE, account);
        emit RoleRevokedFrom(HR_ROLE, account);
    }

    // ─── Approver Management ─────────────────────────────────────────────────

    function addApprover(address approver) external onlyRole(ADMIN_ROLE) {
        for (uint256 i = 0; i < approvers.length; i++) {
            if (approvers[i] == approver) revert ApproverAlreadyExists(approver);
        }
        approvers.push(approver);
        emit ApproverAdded(approver);
    }

    function removeApprover(address approver) external onlyRole(ADMIN_ROLE) {
        uint256 len = approvers.length;
        for (uint256 i = 0; i < len; i++) {
            if (approvers[i] == approver) {
                approvers[i] = approvers[len - 1];
                approvers.pop();
                emit ApproverRemoved(approver);
                return;
            }
        }
        revert ApproverNotFound(approver);
    }

    function setApprovalThreshold(uint256 newThreshold) external onlyRole(ADMIN_ROLE) {
        if (newThreshold == 0 || newThreshold > approvers.length) revert InvalidThreshold();
        approvalThreshold = newThreshold;
        emit ThresholdUpdated(newThreshold);
    }

    // ─── Multi-sig Approval ──────────────────────────────────────────────────

    function approvePayrollCycle(uint256 cycleId) external {
        if (!_isApprover(msg.sender)) revert NotAnApprover(msg.sender);
        if (_approvals[cycleId][msg.sender]) revert AlreadyApproved(cycleId, msg.sender);

        _approvals[cycleId][msg.sender] = true;
        _approvalCounts[cycleId]++;

        emit PayrollApproved(cycleId, msg.sender, _approvalCounts[cycleId]);
    }

    function isPayrollApproved(uint256 cycleId) external view returns (bool) {
        return _approvalCounts[cycleId] >= approvalThreshold;
    }

    function getApprovalCount(uint256 cycleId) external view returns (uint256) {
        return _approvalCounts[cycleId];
    }

    function hasApproved(uint256 cycleId, address approver) external view returns (bool) {
        return _approvals[cycleId][approver];
    }

    function getApprovers() external view returns (address[] memory) {
        return approvers;
    }

    // ─── View Helpers ─────────────────────────────────────────────────────────

    function isAdmin(address account) external view returns (bool) {
        return hasRole(ADMIN_ROLE, account);
    }

    function isFinance(address account) external view returns (bool) {
        return hasRole(FINANCE_ROLE, account);
    }

    function isHR(address account) external view returns (bool) {
        return hasRole(HR_ROLE, account);
    }

    // ─── Internal ────────────────────────────────────────────────────────────

    function _isApprover(address account) internal view returns (bool) {
        for (uint256 i = 0; i < approvers.length; i++) {
            if (approvers[i] == account) return true;
        }
        return false;
    }
}
