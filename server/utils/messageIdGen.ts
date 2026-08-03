import crypto from 'crypto';

/**
 * Generates a unique, custom readable Message ID in the format MSG-XXXXXXXX
 * Example: MSG-8F9A2B3C
 */
export function generateMessageId(): string {
  const bytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `MSG-${bytes}`;
}
