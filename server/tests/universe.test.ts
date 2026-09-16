process.env.NODE_ENV = 'test';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import app from '../index.js';
import prisma from '../db/prisma.js';

describe('OurVerse Sprint 2 - Universe Connection Engine E2E Suite', () => {
  let server: http.Server;
  let baseUrl: string;

  // Test User Accounts
  const user1 = {
    username: `cosmic_alpha_${Date.now()}`,
    password: 'PasswordAlpha2026!',
    token: '',
    id: '',
  };

  const user2 = {
    username: `cosmic_beta_${Date.now()}`,
    password: 'PasswordBeta2026!',
    token: '',
    id: '',
  };

  const user3 = {
    username: `cosmic_gamma_${Date.now()}`,
    password: 'PasswordGamma2026!',
    token: '',
    id: '',
  };

  test('Start test server instance', (t, done) => {
    server = app.listen(0, () => {
      const addr = server.address();
      if (typeof addr === 'object' && addr !== null) {
        baseUrl = `http://localhost:${addr.port}`;
      }
      done();
    });
  });

  test('Register User 1 (Alpha) and User 2 (Beta)', async () => {
    // Register Alpha
    const reg1 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: user1.username,
        password: user1.password,
        displayName: 'Alpha Explorer',
      }),
    });
    const data1 = await reg1.json();
    assert.strictEqual(reg1.status, 201);
    user1.token = data1.token;
    user1.id = data1.user.id;

    // Register Beta
    const reg2 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: user2.username,
        password: user2.password,
        displayName: 'Beta Explorer',
      }),
    });
    const data2 = await reg2.json();
    assert.strictEqual(reg2.status, 201);
    user2.token = data2.token;
    user2.id = data2.user.id;

    // Register Gamma
    const reg3 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: user3.username,
        password: user3.password,
        displayName: 'Gamma Explorer',
      }),
    });
    const data3 = await reg3.json();
    assert.strictEqual(reg3.status, 201);
    user3.token = data3.token;
    user3.id = data3.user.id;
  });

  test('Rule 1: User Search by username prefix excludes self & internal IDs', async () => {
    const searchRes = await fetch(`${baseUrl}/api/users/search?q=${user2.username}`, {
      headers: { Authorization: `Bearer ${user1.token}` },
    });
    const searchData = await searchRes.json();
    assert.strictEqual(searchRes.status, 200);
    assert.ok(Array.isArray(searchData));

    const result = searchData.find((u: any) => u.username === user2.username);
    assert.ok(result, 'Result matching user2 must be returned');
    assert.strictEqual(result.displayName, 'Beta Explorer');
    assert.strictEqual(result.relationshipStatus, 'NONE');

    // Ensure zero leak of internal database IDs or credentials
    assert.strictEqual(result.id, undefined);
    assert.strictEqual(result.passwordHash, undefined);
    assert.strictEqual(result.recoveryKeyHash, undefined);
  });

  test('Rule 2: Cannot invite self', async () => {
    const res = await fetch(`${baseUrl}/api/universe/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1.token}`,
      },
      body: JSON.stringify({ receiverUsername: user1.username }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.ok(data.error.includes('cannot invite yourself'));
  });

  test('Create Universe Invitation from Alpha to Beta', async () => {
    const res = await fetch(`${baseUrl}/api/universe/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1.token}`,
      },
      body: JSON.stringify({ receiverUsername: user2.username }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.ok(data.invitationId);
  });

  test('Rule 3: Duplicate pending invitations forbidden', async () => {
    const res = await fetch(`${baseUrl}/api/universe/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1.token}`,
      },
      body: JSON.stringify({ receiverUsername: user2.username }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.ok(data.error.includes('already pending'));
  });

  test('Check Invitations List for Alpha (Sent) and Beta (Received)', async () => {
    const alphaInvRes = await fetch(`${baseUrl}/api/universe/invitations`, {
      headers: { Authorization: `Bearer ${user1.token}` },
    });
    const alphaInvData = await alphaInvRes.json();
    assert.strictEqual(alphaInvRes.status, 200);
    assert.strictEqual(alphaInvData.sent.length, 1);
    assert.strictEqual(alphaInvData.sent[0].receiver.username, user2.username);
    assert.strictEqual(alphaInvData.sent[0].status, 'PENDING');

    const betaInvRes = await fetch(`${baseUrl}/api/universe/invitations`, {
      headers: { Authorization: `Bearer ${user2.token}` },
    });
    const betaInvData = await betaInvRes.json();
    assert.strictEqual(betaInvRes.status, 200);
    assert.strictEqual(betaInvData.received.length, 1);
    assert.strictEqual(betaInvData.received[0].sender.username, user1.username);
    assert.strictEqual(betaInvData.received[0].status, 'PENDING');
  });

  let createdUniverseId = '';

  test('Accept Universe Invitation (Prisma Transaction, 1 Universe with UVR-XXXXXXXX, 2 Members)', async () => {
    const betaInvRes = await fetch(`${baseUrl}/api/universe/invitations`, {
      headers: { Authorization: `Bearer ${user2.token}` },
    });
    const betaInvData = await betaInvRes.json();
    const invitationId = betaInvData.received[0].id;

    const acceptRes = await fetch(`${baseUrl}/api/universe/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user2.token}`,
      },
      body: JSON.stringify({ invitationId }),
    });
    const acceptData = await acceptRes.json();
    assert.strictEqual(acceptRes.status, 200);
    assert.ok(acceptData.universeId);
    assert.match(acceptData.universeId, /^UVR-[A-F0-9]{8}$/);

    createdUniverseId = acceptData.universeId;
  });

  test('Rule 4: Only ONE Universe can ever exist between two users (Duplicate Prevention)', async () => {
    // Send another request
    const reqRes = await fetch(`${baseUrl}/api/universe/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1.token}`,
      },
      body: JSON.stringify({ receiverUsername: user2.username }),
    });
    const reqData = await reqRes.json();
    assert.strictEqual(reqRes.status, 400);
    assert.ok(reqData.error.includes('already exists'));
  });

  test('Verify Universes Dashboard list for both users', async () => {
    const alphaListRes = await fetch(`${baseUrl}/api/universe/list`, {
      headers: { Authorization: `Bearer ${user1.token}` },
    });
    const alphaList = await alphaListRes.json();
    assert.strictEqual(alphaListRes.status, 200);
    assert.strictEqual(alphaList.length, 1);
    assert.strictEqual(alphaList[0].universeId, createdUniverseId);
    assert.strictEqual(alphaList[0].peerUser.username, user2.username);
    assert.strictEqual(alphaList[0].peerUser.id, user2.id);

    const betaListRes = await fetch(`${baseUrl}/api/universe/list`, {
      headers: { Authorization: `Bearer ${user2.token}` },
    });
    const betaList = await betaListRes.json();
    assert.strictEqual(betaListRes.status, 200);
    assert.strictEqual(betaList.length, 1);
    assert.strictEqual(betaList[0].universeId, createdUniverseId);
    assert.strictEqual(betaList[0].peerUser.username, user1.username);
    assert.strictEqual(betaList[0].peerUser.id, user1.id);
  });

  test('Fetch Single Universe Details', async () => {
    const detailsRes = await fetch(`${baseUrl}/api/universe/${createdUniverseId}`, {
      headers: { Authorization: `Bearer ${user1.token}` },
    });
    const details = await detailsRes.json();
    assert.strictEqual(detailsRes.status, 200);
    assert.strictEqual(details.universeId, createdUniverseId);
    assert.strictEqual(details.members.length, 2);
    assert.ok(details.members[0].id);
    assert.ok(details.members[1].id);
  });

  test('Reject Invitation Flow with Gamma', async () => {
    // Alpha invites Gamma
    const reqRes = await fetch(`${baseUrl}/api/universe/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1.token}`,
      },
      body: JSON.stringify({ receiverUsername: user3.username }),
    });
    const reqData = await reqRes.json();
    assert.strictEqual(reqRes.status, 201);

    // Gamma rejects
    const gammaInvRes = await fetch(`${baseUrl}/api/universe/invitations`, {
      headers: { Authorization: `Bearer ${user3.token}` },
    });
    const gammaInvData = await gammaInvRes.json();
    const invitationId = gammaInvData.received[0].id;

    const rejectRes = await fetch(`${baseUrl}/api/universe/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user3.token}`,
      },
      body: JSON.stringify({ invitationId }),
    });
    assert.strictEqual(rejectRes.status, 200);
  });

  test('Rule 5 & Block Flow: Blocked users cannot send or receive Universe Invitations', async () => {
    // Gamma blocks Alpha
    const blockRes = await fetch(`${baseUrl}/api/universe/block`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user3.token}`,
      },
      body: JSON.stringify({ targetUsername: user1.username }),
    });
    assert.strictEqual(blockRes.status, 200);

    // Alpha attempts to invite Gamma again
    const inviteRes = await fetch(`${baseUrl}/api/universe/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1.token}`,
      },
      body: JSON.stringify({ receiverUsername: user3.username }),
    });
    const inviteData = await inviteRes.json();
    assert.strictEqual(inviteRes.status, 400);
    assert.ok(inviteData.error.includes('forbidden between blocked users'));
  });

  test('Rule 6: User with allowUniverseRequests = NOBODY cannot receive invitations', async () => {
    // Set Gamma allowUniverseRequests = NOBODY in DB
    await prisma.user.update({
      where: { username: user3.username },
      data: { allowUniverseRequests: 'NOBODY' },
    });

    // Beta attempts to invite Gamma
    const inviteRes = await fetch(`${baseUrl}/api/universe/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user2.token}`,
      },
      body: JSON.stringify({ receiverUsername: user3.username }),
    });
    const inviteData = await inviteRes.json();
    assert.strictEqual(inviteRes.status, 400);
    assert.ok(inviteData.error.includes('does not accept Universe Invitations'));
  });

  test('Close test server instance', (t, done) => {
    if (server) server.close(done);
    else done();
  });
});
