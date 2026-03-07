// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {
    Ownable2Step,
    Ownable
} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {FHE, externalEuint64, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {
    ERC7984
} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";

/**
 * @title   ConfidentialPayrollToken
 * @notice  An ERC7984 confidential token used for payroll payments.
 *          All balances and transfer amounts are encrypted using FHEVM.
 *          The PayrollManager contract receives minted tokens and distributes
 *          them to employees via confidential transfers.
 *
 * @dev     Inherits SepoliaFHEVMConfig for automatic FHE coprocessor setup.
 *          Uses Ownable2Step for secure two-step ownership transfer.
 */
contract ConfidentialPayrollToken is ZamaEthereumConfig, ERC7984, Ownable2Step {
    // ─── Events ──────────────────────────────────────────────────────────────
    event TokensMinted(address indexed to, uint64 amount);
    event ConfidentialTokensMinted(address indexed to);

    // ─── Errors ──────────────────────────────────────────────────────────────
    error ZeroAmount();
    error ZeroAddress();

    // ─── Constructor ─────────────────────────────────────────────────────────
    /**
     * @param owner         Initial owner (employer / company deployer)
     * @param initialSupply Clear-text initial supply minted to owner
     * @param name_         Token name (e.g., "Confidential USDC")
     * @param symbol_       Token symbol (e.g., "cUSDC")
     * @param tokenURI_     Metadata URI
     */
    constructor(
        address owner,
        uint64 initialSupply,
        string memory name_,
        string memory symbol_,
        string memory tokenURI_
    ) ERC7984(name_, symbol_, tokenURI_) Ownable(owner) {
        if (owner == address(0)) revert ZeroAddress();
        if (initialSupply == 0) revert ZeroAmount();

        // Mint initial supply as encrypted amount to the owner
        euint64 encryptedAmount = FHE.asEuint64(initialSupply);
        FHE.allowThis(encryptedAmount);
        FHE.allow(encryptedAmount, owner);
        _mint(owner, encryptedAmount);

        emit TokensMinted(owner, initialSupply);
    }

    // ─── Minting ─────────────────────────────────────────────────────────────

    /**
     * @notice  Mint tokens with a clear (plaintext) amount. Owner only.
     * @dev     Amount is visible in calldata. Use confidentialMint for privacy.
     * @param   to      Recipient address
     * @param   amount  Clear-text amount to mint
     */
    function mint(address to, uint64 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        euint64 encryptedAmount = FHE.asEuint64(amount);
        FHE.allowThis(encryptedAmount);
        FHE.allow(encryptedAmount, to);
        FHE.allow(encryptedAmount, owner());
        _mint(to, encryptedAmount);

        emit TokensMinted(to, amount);
    }

    /**
     * @notice  Mint tokens with an encrypted amount. Owner only.
     * @dev     Amount is fully hidden. Produces no visible amount in events.
     * @param   to               Recipient address
     * @param   encryptedAmount  Encrypted token amount (externalEuint64 handle)
     * @param   inputProof       FHEVM proof of knowledge for the encrypted input
     */
    function confidentialMint(
        address to,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();

        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        FHE.allowThis(amount);
        FHE.allow(amount, to);
        FHE.allow(amount, owner());
        _mint(to, amount);

        emit ConfidentialTokensMinted(to);
    }

    // ─── View ─────────────────────────────────────────────────────────────────

    /**
     * @notice  Returns the encrypted balance handle for an account.
     * @dev     Frontend uses this handle with userDecrypt() to read actual balance.
     *          Only accounts with ACL permission can decrypt.
     */
    function encryptedBalanceOf(
        address account
    ) external view returns (euint64) {
        return confidentialBalanceOf(account);
    }
}
