import { ethers } from 'ethers';

// ─── Contract Addresses ────────────────────────────────────────────────────────
export const CONTRACT_ADDRESSES = {
  payrollToken: process.env.NEXT_PUBLIC_PAYROLL_TOKEN_ADDRESS as string,
  employeeRegistry: process.env.NEXT_PUBLIC_EMPLOYEE_REGISTRY_ADDRESS as string,
  payrollManager: process.env.NEXT_PUBLIC_PAYROLL_MANAGER_ADDRESS as string,
  accessController: process.env.NEXT_PUBLIC_ACCESS_CONTROLLER_ADDRESS as string,
} as const;

// ─── ABIs ─────────────────────────────────────────────────────────────────────

export const EMPLOYEE_REGISTRY_ABI = [
  // Read
  'function getEmployeeCount() external view returns (uint256)',
  'function getAllEmployees() external view returns (address[])',
  'function getEmployeeInfo(address wallet) external view returns (string memory name, string memory role, bool isActive, uint256 addedAt)',
  'function getEncryptedSalary(address wallet) external view returns (bytes32)',
  'function hasRole(bytes32 role, address account) external view returns (bool)',
  // Write
  'function addEmployee(address wallet, string calldata name, string calldata role, bytes32 encryptedSalary, bytes calldata proof, address paymentToken, uint8 frequency) external',
  'function updateSalary(address wallet, bytes32 newEncryptedSalary, bytes calldata proof) external',
  'function removeEmployee(address wallet) external',
  // Events
  'event EmployeeAdded(address indexed wallet, string name, string role)',
  'event EmployeeRemoved(address indexed wallet)',
  'event SalaryUpdated(address indexed wallet)',
] as const;

export const PAYROLL_MANAGER_ABI = [
  // Read
  'function getApprovalCount(uint256 cycleId) external view returns (uint256)',
  'function approvalThreshold() external view returns (uint256)',
  'function getTotalPayroll() external view returns (bytes32)',
  'function payrollCycleCount() external view returns (uint256)',
  // Write
  'function runPayroll() external',
  'function runPayrollBatch(address[] calldata selectedEmployees) external',
  'function approvePayroll(uint256 cycleId) external',
  // Events
  'event PayrollExecuted(uint256 indexed cycleId, uint256 timestamp, uint256 employeeCount)',
  'event PayrollApproved(uint256 indexed cycleId, address approver)',
] as const;

export const PAYROLL_TOKEN_ABI = [
  'function mint(address to, uint64 amount) external',
  'function confidentialMint(address to, bytes32 encryptedAmount, bytes calldata proof) external',
  'function confidentialBalanceOf(address account) external view returns (bytes32)',
  'function confidentialTransfer(address to, bytes32 encAmount, bytes calldata proof) external',
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
] as const;

export const ACCESS_CONTROLLER_ABI = [
  'function ADMIN_ROLE() external view returns (bytes32)',
  'function FINANCE_ROLE() external view returns (bytes32)',
  'function HR_ROLE() external view returns (bytes32)',
  'function hasRole(bytes32 role, address account) external view returns (bool)',
  'function grantRole(bytes32 role, address account) external',
  'function revokeRole(bytes32 role, address account) external',
] as const;

// ─── Role Constants ────────────────────────────────────────────────────────────
export const ROLES = {
  ADMIN: ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE')),
  FINANCE: ethers.keccak256(ethers.toUtf8Bytes('FINANCE_ROLE')),
  HR: ethers.keccak256(ethers.toUtf8Bytes('HR_ROLE')),
} as const;

// ─── PaymentFrequency ──────────────────────────────────────────────────────────
export enum PaymentFrequency {
  Monthly = 0,
  Biweekly = 1,
  Weekly = 2,
}

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface EmployeeRecord {
  wallet: string;
  name: string;
  role: string;
  isActive: boolean;
  addedAt: number;
  encryptedSalaryHandle?: string;
  paymentToken?: string;
  frequency?: PaymentFrequency;
}

export interface PayrollCycleRecord {
  id: number;
  timestamp: number;
  employeeCount: number;
  status: 'Pending' | 'Approved' | 'Executed';
  approvals: number;
}
