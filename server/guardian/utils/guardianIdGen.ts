import crypto from 'crypto';

/**
 * Generates custom readable Guardian ID in the format GRD-XXXXXXXX
 */
export function generateGuardianId(): string {
  const bytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `GRD-${bytes}`;
}

/**
 * Generates custom readable Event ID in the format EVT-XXXXXXXX
 */
export function generateEventId(): string {
  const bytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `EVT-${bytes}`;
}

/**
 * Generates custom readable Job ID in the format JOB-XXXXXXXX
 */
export function generateJobId(): string {
  const bytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `JOB-${bytes}`;
}
