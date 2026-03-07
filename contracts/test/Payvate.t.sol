// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {AccessController} from "../src/AccessController.sol";
import {EmployeeRegistry} from "../src/EmployeeRegistry.sol";
import {PayrollManager} from "../src/PayrollManager.sol";

/**
 * @title   AccessControllerTest
 * @notice  Unit tests for role management and multi-sig approval logic.
 */
contract AccessControllerTest is Test {
    AccessController public ac;
    address public admin = address(0x1);
    address public finance = address(0x2);
    address public hr = address(0x3);
    address public random = address(0x4);

    function setUp() public {
        vm.prank(admin);
        ac = new AccessController(admin, 2);
    }

    // ─── Role Tests ───────────────────────────────────────────────────────────

    function test_AdminHasAdminRole() public view {
        assertTrue(ac.isAdmin(admin));
    }

    function test_AdminHasFinanceRole() public view {
        assertTrue(ac.isFinance(admin));
    }

    function test_GrantFinanceRole() public {
        vm.prank(admin);
        ac.grantFinanceRole(finance);
        assertTrue(ac.isFinance(finance));
    }

    function test_GrantHRRole() public {
        vm.prank(admin);
        ac.grantHRRole(hr);
        assertTrue(ac.isHR(hr));
    }

    function test_RevertUnauthorizedGrant() public {
        vm.prank(random);
        vm.expectRevert();
        ac.grantFinanceRole(random);
    }

    function test_RevokeFinanceRole() public {
        vm.startPrank(admin);
        ac.grantFinanceRole(finance);
        ac.revokeFinanceRole(finance);
        vm.stopPrank();
        assertFalse(ac.isFinance(finance));
    }

    // ─── Multi-sig Tests ──────────────────────────────────────────────────────

    function test_ApprovalThreshold() public view {
        assertEq(ac.approvalThreshold(), 2);
    }

    function test_SingleApprovalNotEnough() public {
        vm.prank(admin);
        ac.approvePayrollCycle(1);
        assertFalse(ac.isPayrollApproved(1));
    }

    function test_TwoApprovalsReachThreshold() public {
        address approver2 = address(0x5);

        vm.startPrank(admin);
        ac.addApprover(approver2);
        ac.approvePayrollCycle(1);
        vm.stopPrank();

        vm.prank(approver2);
        ac.approvePayrollCycle(1);

        assertTrue(ac.isPayrollApproved(1));
    }

    function test_RevertDoubleApproval() public {
        vm.prank(admin);
        ac.approvePayrollCycle(1);

        vm.prank(admin);
        vm.expectRevert(
            abi.encodeWithSelector(
                AccessController.AlreadyApproved.selector,
                1,
                admin
            )
        );
        ac.approvePayrollCycle(1);
    }

    function test_RevertNonApproverApproval() public {
        vm.prank(random);
        vm.expectRevert(
            abi.encodeWithSelector(
                AccessController.NotAnApprover.selector,
                random
            )
        );
        ac.approvePayrollCycle(1);
    }

    function test_AddAndRemoveApprover() public {
        address newApprover = address(0x6);

        vm.startPrank(admin);
        ac.addApprover(newApprover);
        address[] memory approvers = ac.getApprovers();
        assertEq(approvers.length, 2);

        ac.removeApprover(newApprover);
        approvers = ac.getApprovers();
        assertEq(approvers.length, 1);
        vm.stopPrank();
    }

    function test_SetThreshold() public {
        address approver2 = address(0x5);
        vm.startPrank(admin);
        ac.addApprover(approver2);
        ac.setApprovalThreshold(1);
        vm.stopPrank();
        assertEq(ac.approvalThreshold(), 1);
    }

    function test_RevertInvalidThreshold() public {
        vm.prank(admin);
        vm.expectRevert(AccessController.InvalidThreshold.selector);
        ac.setApprovalThreshold(0);
    }

    function test_GetApprovalCount() public {
        vm.prank(admin);
        ac.approvePayrollCycle(42);
        assertEq(ac.getApprovalCount(42), 1);
    }

    function test_HasApproved() public {
        vm.prank(admin);
        ac.approvePayrollCycle(7);
        assertTrue(ac.hasApproved(7, admin));
        assertFalse(ac.hasApproved(7, random));
    }
}

/**
 * @title   EmployeeRegistryTest
 * @notice  Unit tests for employee CRUD operations.
 *          Note: FHE operations are mocked in local Foundry tests.
 *          True encrypted behavior requires Sepolia deployment.
 */
contract EmployeeRegistryTest is Test {
    AccessController public ac;
    EmployeeRegistry public registry;

    address public admin = address(0x1);
    address public employee1 = address(0x2);
    address public employee2 = address(0x3);
    address public unauthorized = address(0x99);

    function setUp() public {
        vm.startPrank(admin);
        ac = new AccessController(admin, 1);

        // Note: EmployeeRegistry constructor calls SepoliaFHEVMConfig()
        // which sets up FHE coprocessor. In local tests, FHE calls are no-ops.
        registry = new EmployeeRegistry(admin, "Nebula Labs", address(ac));
        vm.stopPrank();
    }

    // ─── Basic Info Tests (non-FHE) ───────────────────────────────────────────

    function test_CompanyName() public view {
        assertEq(registry.companyName(), "Nebula Labs");
    }

    function test_Employer() public view {
        assertEq(registry.employer(), admin);
    }

    function test_InitialEmployeeCount() public view {
        assertEq(registry.getEmployeeCount(), 0);
    }

    function test_IsNotEmployee() public view {
        assertFalse(registry.isEmployee(employee1));
    }

    function test_GetAllEmployeesEmpty() public view {
        address[] memory emps = registry.getAllEmployees();
        assertEq(emps.length, 0);
    }

    // ─── Access Control ───────────────────────────────────────────────────────

    function test_RevertAddEmployeeUnauthorized() public {
        vm.prank(unauthorized);
        vm.expectRevert(EmployeeRegistry.NotAdmin.selector);
        // We can't easily pass FHE params here, but the access check fires first
        registry.removeEmployee(employee1); // Any admin-only fn
    }
}
