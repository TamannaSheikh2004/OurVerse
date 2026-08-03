import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, hashRecoveryKey, verifyRecoveryKey } from '../utils/crypto.js';
import { generateRecoveryKey } from '../utils/keyGen.js';

describe('OurVerse Core Auth & Crypto Engine', () => {

  test('Argon2id password hashing and verification works accurately', async () => {
    const rawPassword = 'CosmicPassword2026!';
    const hashedPassword = await hashPassword(rawPassword);

    assert.ok(hashedPassword.includes('$argon2id$'), 'Hash must be generated using Argon2id algorithm');
    
    const isCorrect = await verifyPassword(hashedPassword, rawPassword);
    assert.strictEqual(isCorrect, true, 'Verification of correct password must return true');

    const isWrong = await verifyPassword(hashedPassword, 'WrongPassword123');
    assert.strictEqual(isWrong, false, 'Verification of wrong password must return false');
  });

  test('Recovery Key generator returns OUR-XXXX-XXXX-XXXX-XXXX format', () => {
    const recoveryKey = generateRecoveryKey();
    assert.match(
      recoveryKey,
      /^OUR-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/,
      'Recovery key format must be OUR-XXXX-XXXX-XXXX-XXXX with 4 hex blocks'
    );
  });

  test('Argon2id recovery key hashing and case-insensitive verification works', async () => {
    const recoveryKey = 'OUR-7F9A-B23C-8D1E-4F02';
    const keyHash = await hashRecoveryKey(recoveryKey);

    assert.ok(keyHash.includes('$argon2id$'), 'Recovery Key hash must use Argon2id algorithm');

    // Case-insensitive verification
    const isValidUpper = await verifyRecoveryKey(keyHash, 'OUR-7F9A-B23C-8D1E-4F02');
    const isValidLower = await verifyRecoveryKey(keyHash, 'our-7f9a-b23c-8d1e-4f02');

    assert.strictEqual(isValidUpper, true, 'Exact recovery key must verify');
    assert.strictEqual(isValidLower, true, 'Lowercase recovery key must verify after normalization');

    const isInvalid = await verifyRecoveryKey(keyHash, 'OUR-0000-0000-0000-0000');
    assert.strictEqual(isInvalid, false, 'Invalid recovery key must fail verification');
  });
});
