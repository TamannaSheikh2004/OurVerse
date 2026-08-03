import crypto from 'crypto';

/**
 * Generates a unique, custom readable Universe ID in the format UVR-XXXXXXXX
 * Example: UVR-8F9A2B3C
 */
export function generateUniverseId(): string {
  const bytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `UVR-${bytes}`;
}
