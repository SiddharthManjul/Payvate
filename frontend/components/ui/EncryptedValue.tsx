'use client';
import { useState } from 'react';
import { useDecrypt } from '@/hooks/useDecrypt';
import { formatRawAmount } from '@/lib/utils';

interface EncryptedValueProps {
  handle?: string;
  contractAddress?: string;
  /** If already decrypted externally, pass the value directly */
  plainValue?: bigint;
  /** How long to show plaintext (ms). Default 30000 */
  revealMs?: number;
}

export function EncryptedValue({
  handle,
  contractAddress,
  plainValue,
  revealMs = 30_000,
}: EncryptedValueProps) {
  const { decrypt, decryptedValues, loading } = useDecrypt();
  const [localValue, setLocalValue] = useState<bigint | null>(null);

  const resolved = plainValue ?? localValue ?? (handle ? decryptedValues[handle] : undefined);
  const isLoading = handle ? loading[handle] : false;

  const handleDecrypt = async () => {
    if (!handle || !contractAddress) return;
    const val = await decrypt(handle, contractAddress);
    if (val !== null) {
      setLocalValue(val);
      setTimeout(() => setLocalValue(null), revealMs);
    }
  };

  if (resolved !== undefined && resolved !== null) {
    return (
      <span className="encrypted-value decrypted-value">
        {formatRawAmount(resolved)}
      </span>
    );
  }

  if (isLoading) {
    return (
      <span className="encrypted-value">
        <span className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />
        <span>Decrypting…</span>
      </span>
    );
  }

  if (!handle || !contractAddress) {
    return <span className="encrypted-value">🔒 ••••••••</span>;
  }

  return (
    <button
      onClick={handleDecrypt}
      title="Click to decrypt (requires wallet signature)"
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 6px',
        borderRadius: 6,
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
    >
      <span className="encrypted-value">🔒 ••••••••</span>
      <span style={{ fontSize: 11, color: 'var(--accent-primary-hover)' }}>Decrypt</span>
    </button>
  );
}
