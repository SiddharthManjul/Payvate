import type { Signer } from 'ethers';

// Lazy-loaded fhevm instance to avoid SSR issues
let fhevmInstance: any = null;

export async function getFhevmInstance() {
  if (fhevmInstance) return fhevmInstance;

  // Only run client-side
  if (typeof window === 'undefined') return null;

  try {
    const { createInstance } = await import('@zama-fhe/relayer-sdk');

    fhevmInstance = await createInstance({
      aclContractAddress: process.env.NEXT_PUBLIC_ACL_CONTRACT!,
      kmsContractAddress: process.env.NEXT_PUBLIC_KMS_CONTRACT!,
      inputVerifierContractAddress: process.env.NEXT_PUBLIC_INPUT_VERIFIER!,
      verifyingContractAddressDecryption: '0x5D8BD78e2ea6bbE41f26dFe9fdaEAa349e077478',
      verifyingContractAddressInputVerification: '0x483b9dE06E4E4C7D35CCf5837A1668487406D955',
      chainId: 11155111,
      gatewayChainId: 10901,
      network: process.env.NEXT_PUBLIC_RPC_URL ?? 'https://eth-sepolia.public.blastapi.io',
      relayerUrl: process.env.NEXT_PUBLIC_RELAYER_URL ?? 'https://relayer.testnet.zama.org',
    });

    return fhevmInstance;
  } catch (err) {
    console.error('[fhevm] Failed to initialize instance:', err);
    return null;
  }
}

/**
 * Encrypt a uint64 salary value for submission to EmployeeRegistry.addEmployee / updateSalary
 */
export async function encryptSalary(
  contractAddress: string,
  userAddress: string,
  salaryAmount: number
): Promise<{ handle: Uint8Array; inputProof: Uint8Array }> {
  const instance = await getFhevmInstance();
  if (!instance) throw new Error('FHEVM instance not available');

  const buffer = instance.createEncryptedInput(contractAddress, userAddress);
  buffer.add64(BigInt(salaryAmount));
  const encrypted = await buffer.encrypt();

  return {
    handle: encrypted.handles[0],
    inputProof: encrypted.inputProof,
  };
}

/**
 * Decrypt a ciphertext handle via the Zama Relayer's userDecrypt flow.
 * Triggers a MetaMask EIP712 signature request.
 */
export async function decryptValue(
  ciphertextHandle: string,
  contractAddress: string,
  signer: Signer
): Promise<bigint> {
  const instance = await getFhevmInstance();
  if (!instance) throw new Error('FHEVM instance not available');

  // 1. Generate ephemeral NaCl keypair
  const keypair = instance.generateKeypair();

  // 2. EIP712 typed data
  const startTimeStamp = Math.floor(Date.now() / 1000).toString();
  const durationDays = '10';
  const contractAddresses = [contractAddress];

  const eip712 = instance.createEIP712(
    keypair.publicKey,
    contractAddresses,
    startTimeStamp,
    durationDays
  );

  // 3. Sign with wallet
  const signature = await signer.signTypedData(
    eip712.domain,
    { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
    eip712.message
  );

  // 4. Send to relayer for re-encryption under user NaCl key
  const result = await instance.userDecrypt(
    [{ handle: ciphertextHandle, contractAddress }],
    keypair.privateKey,
    keypair.publicKey,
    signature.replace('0x', ''),
    contractAddresses,
    await signer.getAddress(),
    startTimeStamp,
    durationDays
  );

  // 5. Return plaintext bigint
  return result[ciphertextHandle] as bigint;
}
