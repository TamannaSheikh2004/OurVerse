process.env.NODE_ENV = 'test';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import app from '../index.js';
import prisma from '../db/prisma.js';

describe('OurVerse Fullstack Auth & Reservation E2E Test Suite', () => {
  let server: http.Server;
  let baseUrl: string;

  test('Start server instance', (t, done) => {
    server = app.listen(0, () => {
      const addr = server.address();
      if (typeof addr === 'object' && addr !== null) {
        baseUrl = `http://localhost:${addr.port}`;
      }
      done();
    });
  });

  test('E2E Flow: Register, Login, Recover Password, and Permanent Reservation Rule', async () => {
    const testUsername = `cosmic_voyager_${Date.now()}`;
    const testPassword = 'InitialPassword2026!';
    const newPassword = 'RecoveredPassword2026!';

    // 1. Register
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        password: testPassword,
        displayName: 'Cosmic Voyager',
        avatarUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86',
      }),
    });

    const regData = await regRes.json();
    assert.strictEqual(regRes.status, 201, `Registration failed: ${JSON.stringify(regData)}`);
    assert.ok(regData.token, 'Token must be returned');
    assert.ok(regData.recoveryKey, 'Recovery Key must be returned once');
    assert.match(regData.recoveryKey, /^OUR-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/);
    assert.strictEqual(regData.user.username, testUsername);

    const initialRecoveryKey = regData.recoveryKey;
    const initialToken = regData.token;

    // 2. Login
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        password: testPassword,
      }),
    });
    const loginData = await loginRes.json();
    assert.strictEqual(loginRes.status, 200);
    assert.ok(loginData.token);

    // 3. Get /me Profile
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${initialToken}` },
    });
    const meData = await meRes.json();
    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meData.user.displayName, 'Cosmic Voyager');

    // 4. Recover Password with Recovery Key
    const recoverRes = await fetch(`${baseUrl}/api/auth/recover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        recoveryKey: initialRecoveryKey,
        newPassword: newPassword,
      }),
    });
    const recoverData = await recoverRes.json();
    assert.strictEqual(recoverRes.status, 200, `Recovery failed: ${JSON.stringify(recoverData)}`);

    // 5. Login with old password should fail, new password should succeed
    const oldLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        password: testPassword,
      }),
    });
    assert.strictEqual(oldLoginRes.status, 401, 'Old password must be rejected after recovery');

    const newLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        password: newPassword,
      }),
    });
    assert.strictEqual(newLoginRes.status, 200, 'New password must succeed after recovery');

    // 6. Permanent Username Reservation Rule (Delete account & attempt re-registration)
    const deleteRes = await fetch(`${baseUrl}/api/auth/account`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${initialToken}` },
    });
    assert.strictEqual(deleteRes.status, 200);

    // Attempt to re-register with the EXACT SAME deleted username
    const reRegisterRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        password: 'AnyPassword123!',
      }),
    });
    const reRegisterData = await reRegisterRes.json();
    assert.strictEqual(reRegisterRes.status, 400, 'Re-registration of deleted username must fail');
    assert.ok(
      reRegisterData.error.includes('permanently reserved'),
      'Error message must state username is permanently reserved'
    );
  });

  test('Close server instance', (t, done) => {
    if (server) server.close(done);
    else done();
  });
});
