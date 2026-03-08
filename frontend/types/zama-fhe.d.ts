// Type stub for @zama-fhe/relayer-sdk
// The SDK ships without bundled .d.ts files; these types cover the API surface used by CipherPay.
declare module '@zama-fhe/relayer-sdk' {
  export interface FhevmConfig {
    aclContractAddress?: string;
    kmsContractAddress?: string;
    inputVerifierContractAddress?: string;
    verifyingContractAddressDecryption?: string;
    verifyingContractAddressInputVerification?: string;
    chainId?: number;
    gatewayChainId?: number;
    network?: string;
    relayerUrl?: string;
  }

  export interface EncryptedInput {
    add64(value: bigint): this;
    encrypt(): Promise<{ handles: Uint8Array[]; inputProof: Uint8Array }>;
  }

  export interface Keypair {
    publicKey: Uint8Array;
    privateKey: Uint8Array;
  }

  export interface EIP712Result {
    domain: Record<string, unknown>;
    types: Record<string, unknown>;
    message: Record<string, unknown>;
  }

  export interface FhevmInstance {
    createEncryptedInput(contractAddress: string, userAddress: string): EncryptedInput;
    generateKeypair(): Keypair;
    createEIP712(
      publicKey: Uint8Array,
      contractAddresses: string[],
      startTimestamp: string,
      durationDays: string
    ): EIP712Result;
    userDecrypt(
      handles: Array<{ handle: string; contractAddress: string }>,
      privateKey: Uint8Array,
      publicKey: Uint8Array,
      signature: string,
      contractAddresses: string[],
      userAddress: string,
      startTimestamp: string,
      durationDays: string
    ): Promise<Record<string, bigint>>;
  }

  export interface SepoliaConfigType extends FhevmConfig {}
  export const SepoliaConfig: SepoliaConfigType;

  export function createInstance(config: FhevmConfig): Promise<FhevmInstance>;
}
