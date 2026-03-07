// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {AccessController} from "../src/AccessController.sol";
import {ConfidentialPayrollToken} from "../src/ConfidentialPayrollToken.sol";
import {EmployeeRegistry} from "../src/EmployeeRegistry.sol";
import {PayrollManager} from "../src/PayrollManager.sol";

/**
 * @title   DeployCipherPay
 * @notice  Deploys the full CipherPay protocol in dependency order:
 *          1. AccessController   — roles & multi-sig
 *          2. ConfidentialPayrollToken — ERC7984 payroll token
 *          3. EmployeeRegistry   — encrypted employee records
 *          4. PayrollManager     — payroll execution engine
 *
 * @dev     Usage:
 *          forge script script/Deploy.s.sol:DeployCipherPay \
 *            --rpc-url $SEPOLIA_RPC_URL \
 *            --broadcast \
 *            --verify \
 *            -vvvv
 */
contract DeployCipherPay is Script {
    // Deployment config
    string constant COMPANY_NAME = "Nebula Labs";
    string constant TOKEN_NAME = "Confidential USDC";
    string constant TOKEN_SYMBOL = "cUSDC";
    string constant TOKEN_URI = "https://cipherpay.app/token/metadata.json";
    uint64 constant INITIAL_SUPPLY = 10_000_000; // 10M tokens (6 decimals assumed)
    uint256 constant APPROVAL_THRESHOLD = 1; // 1-of-1 for demo (set to 2-of-3 for prod)
    uint256 constant PAYROLL_INTERVAL_DAYS = 30; // Monthly
    uint64 constant TREASURY_FUND = 1_000_000; // Fund PayrollManager with 1M tokens

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Next payroll date: 30 days from now
        uint256 firstPayrollDate = block.timestamp +
            (PAYROLL_INTERVAL_DAYS * 1 days);

        vm.startBroadcast(deployerPrivateKey);

        // ── 1. AccessController ──────────────────────────────────────────────
        AccessController accessController = new AccessController(
            deployer,
            APPROVAL_THRESHOLD
        );
        console.log("AccessController:", address(accessController));

        // ── 2. ConfidentialPayrollToken ──────────────────────────────────────
        ConfidentialPayrollToken payrollToken = new ConfidentialPayrollToken(
            deployer,
            INITIAL_SUPPLY,
            TOKEN_NAME,
            TOKEN_SYMBOL,
            TOKEN_URI
        );
        console.log("ConfidentialPayrollToken:", address(payrollToken));

        // ── 3. EmployeeRegistry ──────────────────────────────────────────────
        EmployeeRegistry registry = new EmployeeRegistry(
            deployer,
            COMPANY_NAME,
            address(accessController)
        );
        console.log("EmployeeRegistry:", address(registry));

        // ── 4. PayrollManager ────────────────────────────────────────────────
        PayrollManager payrollManager = new PayrollManager(
            deployer,
            address(accessController),
            address(registry),
            address(payrollToken),
            firstPayrollDate,
            PAYROLL_INTERVAL_DAYS
        );
        console.log("PayrollManager:", address(payrollManager));

        // ── 5. Fund PayrollManager with initial token supply ─────────────────
        payrollToken.mint(address(payrollManager), TREASURY_FUND);
        console.log("PayrollManager funded with", TREASURY_FUND, "tokens");

        vm.stopBroadcast();

        // ── Print deployment summary ─────────────────────────────────────────
        console.log("\n=== CipherPay Deployment Summary ===");
        console.log("Network:               Sepolia");
        console.log("Deployer:             ", deployer);
        console.log("AccessController:     ", address(accessController));
        console.log("ConfidentialToken:    ", address(payrollToken));
        console.log("EmployeeRegistry:     ", address(registry));
        console.log("PayrollManager:       ", address(payrollManager));
        console.log("First Payroll Date:   ", firstPayrollDate);
        console.log("===================================\n");
        console.log("Add these to frontend/.env.local:");
        console.log(
            "NEXT_PUBLIC_ACCESS_CONTROLLER_ADDRESS=",
            address(accessController)
        );
        console.log(
            "NEXT_PUBLIC_PAYROLL_TOKEN_ADDRESS=",
            address(payrollToken)
        );
        console.log(
            "NEXT_PUBLIC_EMPLOYEE_REGISTRY_ADDRESS=",
            address(registry)
        );
        console.log(
            "NEXT_PUBLIC_PAYROLL_MANAGER_ADDRESS=",
            address(payrollManager)
        );
    }
}
