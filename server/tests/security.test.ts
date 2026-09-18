process.env.NODE_ENV = 'test';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { app, server } from '../index.js';
import prisma from '../db/prisma.js';
import { resetRateLimiterMap } from '../middleware/rateLimiter.js';
import { JWT_SECRET } from '../config/jwtConfig.js';
import jwt from 'jsonwebtoken';

describe('OurVerse Sprint 5: Security Hardening & Throttling Suite', () => {
  let baseUrl: string;
  let testUser: any;

  before(async () => {
    // Cleanup test user
    await prisma.user.deleteMany({ where: { username: 'sec_test_user_alpha' } });

    testUser = await prisma.user.create({
      data: {
        username: 'sec_test_user_alpha',
        passwordHash: 'hash',
        recoveryKeyHash: 'hash',
        displayName: 'Security Alpha',
      },
    });
  });

  after(async () => {
    await prisma.user.deleteMany({ where: { username: 'sec_test_user_alpha' } });
  });

  test('Start test server instance', (t, done) => {
    server.listen(0, () => {
      const addr = server.address();
      if (typeof addr === 'object' && addr !== null) {
        baseUrl = `http://localhost:${addr.port}`;
      }
      done();
    });
  });

  test('1. JWT Secret Consistency: Tokens signed with centralized JWT_SECRET authenticate REST & Socket.IO seamlessly', async () => {
    const token = jwt.sign(
      { userId: testUser.id, username: testUser.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Verify REST API accepts token
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(meRes.status, 200);

    // Verify Socket.IO handshake accepts token
    const socket: ClientSocket = ioClient(baseUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: false,
    });

    await new Promise<void>((resolve, reject) => {
      socket.on('connect', () => {
        assert.ok(socket.connected);
        socket.disconnect();
        resolve();
      });
      socket.on('connect_error', (err) => {
        socket.disconnect();
        reject(err);
      });
    });
  });

  test('2. Helmet Security Headers: HTTP responses include security headers and CSP', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(res.status, 200);

    const headers = res.headers;
    assert.strictEqual(headers.get('x-content-type-options'), 'nosniff');
    assert.ok(headers.get('content-security-policy'), 'CSP header must be present');
    assert.ok(headers.get('content-security-policy')?.includes("default-src 'self'"));
  });

  test('3. REST Auth Rate Limiting: 6th consecutive login/recovery attempt triggers 429 Too Many Requests', async () => {
    resetRateLimiterMap();

    // Make 5 login attempts
    for (let i = 0; i < 5; i++) {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'invalid_user', password: 'bad' }),
      });
      assert.strictEqual(res.status, 401);
    }

    // 6th attempt should return 429 Too Many Requests
    const blockedRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'invalid_user', password: 'bad' }),
    });
    assert.strictEqual(blockedRes.status, 429);
    const blockedData = await blockedRes.json();
    assert.ok(blockedData.error.includes('Too many authentication attempts'));

    resetRateLimiterMap();
  });

  test('4. Socket Event Rate Limiting: Rapid messaging exceeding limit triggers RATE_LIMIT_EXCEEDED error', async () => {
    const token = jwt.sign(
      { userId: testUser.id, username: testUser.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const socket: ClientSocket = ioClient(baseUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: false,
    });

    await new Promise<void>((resolve) => {
      socket.on('connect', resolve);
    });

    let limitTriggered = false;

    // Send 16 rapid send_message events (limit is 15 per 5s)
    for (let i = 0; i < 16; i++) {
      socket.emit('send_message', { universeId: 'invalid-uvr', content: `Test ${i}` }, (response: any) => {
        if (response && response.error && response.error.includes('RATE_LIMIT_EXCEEDED')) {
          limitTriggered = true;
        }
      });
    }

    await new Promise((r) => setTimeout(r, 500));
    assert.ok(limitTriggered, 'Socket rate limit should trigger RATE_LIMIT_EXCEEDED error');

    socket.disconnect();
  });

  test('Close test server instance', (t, done) => {
    if (server) server.close(done);
    else done();
  });
});
