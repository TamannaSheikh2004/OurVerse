import crypto from 'crypto';

/**
 * Generates a high-entropy unique recovery key for OurVerse users.
 * Format: OUR-XXXX-XXXX-XXXX-XXXX (e.g. OUR-7F9A-B23C-8D1E-4F02)
 */
export function generateRecoveryKey(): string {
  const bytes = crypto.randomBytes(8);
  const hex = bytes.toString('hex').toUpperCase();
  const chunk1 = hex.slice(0, 4);
  const chunk2 = hex.slice(4, 8);
  const chunk3 = hex.slice(8, 12);
  const chunk4 = hex.slice(12, 16);
  return `OUR-${chunk1}-${chunk2}-${chunk3}-${chunk4}`;
}
