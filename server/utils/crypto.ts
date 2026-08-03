import argon2 from 'argon2';

/**
 * Hash a plain password using Argon2id algorithm
 */
export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,       // 3 iterations
    parallelism: 1,
  });
}

/**
 * Verify a plain password against an Argon2id hash
 */
export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch (error) {
    return false;
  }
}

/**
 * Hash a recovery key using Argon2id algorithm
 */
export async function hashRecoveryKey(recoveryKey: string): Promise<string> {
  const normalizedKey = recoveryKey.trim().toUpperCase();
  return await argon2.hash(normalizedKey, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });
}

/**
 * Verify a recovery key against an Argon2id hash
 */
export async function verifyRecoveryKey(hash: string, plainKey: string): Promise<boolean> {
  try {
    const normalizedKey = plainKey.trim().toUpperCase();
    return await argon2.verify(hash, normalizedKey);
  } catch (error) {
    return false;
  }
}
