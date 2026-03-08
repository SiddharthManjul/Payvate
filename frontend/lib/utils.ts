/** Shortens an Ethereum address to 0x1234...5678 */
export function shortAddress(addr: string): string {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/** Format a USDC / token amount (uint64 bigint) for display */
export function formatAmount(amount: bigint | number, decimals = 6): string {
  const num = typeof amount === 'bigint' ? Number(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num / Math.pow(10, decimals));
}

/** Display amount with no decimal conversion (raw token units treated as dollars) */
export function formatRawAmount(amount: bigint | number): string {
  const num = typeof amount === 'bigint' ? Number(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(num);
}

/** Format a Date or timestamp */
export function formatDate(date: Date | number | string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

/** Format relative time (e.g. "2 mins ago") */
export function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

/** Payment frequency label */
export function frequencyLabel(frequency: number): string {
  return ['Monthly', 'Biweekly', 'Weekly'][frequency] ?? 'Monthly';
}

/** Next payroll date based on frequency */
export function nextPayrollDate(frequency: number): string {
  const now = new Date();
  const next = new Date(now);
  if (frequency === 0) {
    next.setMonth(now.getMonth() + 1, 1);
  } else if (frequency === 1) {
    next.setDate(now.getDate() + 14);
  } else {
    next.setDate(now.getDate() + 7);
  }
  return formatDate(next);
}

/** Truncate long strings */
export function truncate(str: string, length = 30): string {
  if (!str) return '';
  return str.length > length ? `${str.slice(0, length)}...` : str;
}

/** Copy text to clipboard */
export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

/** Class name combiner */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
