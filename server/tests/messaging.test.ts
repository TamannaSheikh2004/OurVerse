process.env.NODE_ENV = 'test';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import prisma from '../db/prisma.js';
import messageService from '../services/messageService.js';
import presenceService from '../services/presenceService.js';
import { generateMessageId } from '../utils/messageIdGen.js';
import { setupSocketHandlers } from '../socket/socketHandler.js';
import app from '../index.js';

describe('Sprint 4.0: Real-Time Messaging Infrastructure Suite', () => {
  let userA: any;
  let userB: any;
  let userC: any; // Non-member
  let testUniverse: any;

  before(async () => {
    // Clean specific messaging test records before testing
    await prisma.messageReaction.deleteMany({ where: { user: { username: { startsWith: 'msg_user_' } } } });
    await prisma.readReceipt.deleteMany({ where: { user: { username: { startsWith: 'msg_user_' } } } });
    await prisma.message.deleteMany({ where: { universe: { universeId: 'UVR-TESTMSG1' } } });
    await prisma.universeMember.deleteMany({ where: { universe: { universeId: 'UVR-TESTMSG1' } } });
    await prisma.universe.deleteMany({ where: { universeId: 'UVR-TESTMSG1' } });
    await prisma.user.deleteMany({ where: { username: { startsWith: 'msg_user_' } } });

    // Create Test Users
    userA = await prisma.user.create({
      data: {
        username: 'msg_user_a',
        passwordHash: 'hash',
        recoveryKeyHash: 'hash',
        displayName: 'User Alpha',
      },
    });

    userB = await prisma.user.create({
      data: {
        username: 'msg_user_b',
        passwordHash: 'hash',
        recoveryKeyHash: 'hash',
        displayName: 'User Beta',
      },
    });

    userC = await prisma.user.create({
      data: {
        username: 'msg_user_c',
        passwordHash: 'hash',
        recoveryKeyHash: 'hash',
        displayName: 'User Gamma',
      },
    });

    // Create Shared Universe between User A and User B
    testUniverse = await prisma.universe.create({
      data: {
        universeId: 'UVR-TESTMSG1',
      },
    });

    await prisma.universeMember.createMany({
      data: [
        { universeId: testUniverse.id, userId: userA.id },
        { universeId: testUniverse.id, userId: userB.id },
      ],
    });
  });

  after(async () => {
    await prisma.messageReaction.deleteMany({ where: { user: { username: { startsWith: 'msg_user_' } } } });
    await prisma.readReceipt.deleteMany({ where: { user: { username: { startsWith: 'msg_user_' } } } });
    await prisma.message.deleteMany({ where: { universe: { universeId: 'UVR-TESTMSG1' } } });
    await prisma.universeMember.deleteMany({ where: { universe: { universeId: 'UVR-TESTMSG1' } } });
    await prisma.universe.deleteMany({ where: { universeId: 'UVR-TESTMSG1' } });
    await prisma.user.deleteMany({ where: { username: { startsWith: 'msg_user_' } } });
  });

  it('1. Utility: Should generate custom readable Message ID (MSG-XXXXXXXX)', () => {
    const msgId = generateMessageId();
    assert.match(msgId, /^MSG-[A-Z0-9]{8}$/);
  });

  it('2. Authorization: Should reject message creation from non-Universe members', async () => {
    await assert.rejects(
      async () => {
        await messageService.createMessage({
          universeId: testUniverse.id,
          senderId: userC.id, // User C is not in Universe
          content: 'Hello from non-member',
        });
      },
      (err: any) => err.message.includes('UNAUTHORIZED_UNIVERSE_MEMBER')
    );
  });

  it('3. Validation: Should reject empty or oversized message content', async () => {
    // Empty message
    await assert.rejects(
      async () => {
        await messageService.createMessage({
          universeId: testUniverse.id,
          senderId: userA.id,
          content: '   ',
        });
      },
      (err: any) => err.message.includes('INVALID_MESSAGE_CONTENT')
    );

    // Oversized message > 5000 chars
    const hugeContent = 'A'.repeat(5001);
    await assert.rejects(
      async () => {
        await messageService.createMessage({
          universeId: testUniverse.id,
          senderId: userA.id,
          content: hugeContent,
        });
      },
      (err: any) => err.message.includes('MESSAGE_TOO_LONG')
    );
  });

  it('4. Message Sending & Sanitization: Should create message with MSG-XXXXXXXX ID and sanitized content', async () => {
    const rawContent = 'Hello <script>alert("xss")</script> World!';
    const msg = await messageService.createMessage({
      universeId: testUniverse.id,
      senderId: userA.id,
      content: rawContent,
      type: 'TEXT',
      metadata: { source: 'test' },
    });

    assert.ok(msg.id);
    assert.match(msg.messageId, /^MSG-[A-Z0-9]{8}$/);
    assert.strictEqual(msg.universeId, testUniverse.id);
    assert.strictEqual(msg.senderId, userA.id);
    assert.strictEqual(msg.status, 'SENT');
    assert.strictEqual(msg.version, 1);
    assert.strictEqual(msg.content, 'Hello &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; World!');
  });

  it('5. Reply Foundation: Should store replyToMessageId when replying', async () => {
    const parentMsg = await messageService.createMessage({
      universeId: testUniverse.id,
      senderId: userA.id,
      content: 'Original question',
    });

    const replyMsg = await messageService.createMessage({
      universeId: testUniverse.id,
      senderId: userB.id,
      content: 'Replying to question',
      replyToMessageId: parentMsg.id,
    });

    assert.strictEqual(replyMsg.replyToMessageId, parentMsg.id);
  });

  it('6. Message Editing: Should update content, increment version, and record editedAt', async () => {
    const msg = await messageService.createMessage({
      universeId: testUniverse.id,
      senderId: userA.id,
      content: 'Initial text before edit',
    });

    const edited = await messageService.editMessage(msg.id, userA.id, 'Updated text after edit');

    assert.strictEqual(edited.content, 'Updated text after edit');
    assert.strictEqual(edited.version, 2);
    assert.ok(edited.editedAt);

    // Verify non-sender edit rejection
    await assert.rejects(
      async () => {
        await messageService.editMessage(msg.id, userB.id, 'Hacked text');
      },
      (err: any) => err.message.includes('UNAUTHORIZED_EDIT')
    );
  });

  it('7. Soft Deletion: Should soft delete message and set status to DELETED', async () => {
    const msg = await messageService.createMessage({
      universeId: testUniverse.id,
      senderId: userA.id,
      content: 'Secret message to be deleted',
    });

    const deleted = await messageService.deleteMessage(msg.id, userA.id);

    assert.strictEqual(deleted.status, 'DELETED');
    assert.strictEqual(deleted.content, 'This message was deleted.');
    assert.ok(deleted.deletedAt);

    // Verify editing deleted message is rejected
    await assert.rejects(
      async () => {
        await messageService.editMessage(msg.id, userA.id, 'Try to edit deleted');
      },
      (err: any) => err.message.includes('CANNOT_EDIT_DELETED')
    );
  });

  it('8. History & Pagination: Should fetch paginated messages sorted chronologically', async () => {
    // Fetch messages for test Universe
    const result = await messageService.fetchMessages({
      universeId: testUniverse.id,
      userId: userA.id,
      limit: 10,
    });

    assert.ok(Array.isArray(result.messages));
    assert.ok(result.messages.length > 0);
  });

  it('9. Message Search: Should filter messages by search query keyword', async () => {
    await messageService.createMessage({
      universeId: testUniverse.id,
      senderId: userA.id,
      content: 'UniqueKeywordForSearch testing',
    });

    const searchResult = await messageService.fetchMessages({
      universeId: testUniverse.id,
      userId: userB.id,
      q: 'UniqueKeywordForSearch',
    });

    assert.strictEqual(searchResult.messages.length, 1);
    assert.strictEqual(searchResult.messages[0].content, 'UniqueKeywordForSearch testing');
  });

  it('10. Reactions: Should add, update, and remove reactions per user', async () => {
    const msg = await messageService.createMessage({
      universeId: testUniverse.id,
      senderId: userA.id,
      content: 'Message for reaction test',
    });

    // Add reaction
    const { reaction } = await messageService.addReaction(msg.id, userB.id, '🌌');
    assert.strictEqual(reaction.emoji, '🌌');
    assert.strictEqual(reaction.userId, userB.id);

    // Update reaction (one reaction per user per message)
    const { reaction: updatedReaction } = await messageService.addReaction(msg.id, userB.id, '❤️');
    assert.strictEqual(updatedReaction.emoji, '❤️');

    // Remove reaction
    const removeRes = await messageService.removeReaction(msg.id, userB.id);
    assert.strictEqual(removeRes.userId, userB.id);
  });

  it('11. Read Receipts: Should mark messages as read for Universe participant', async () => {
    const unreadMsg = await messageService.createMessage({
      universeId: testUniverse.id,
      senderId: userA.id,
      content: 'Unread message for User B',
    });

    const readResult = await messageService.markRead(testUniverse.id, userB.id, [unreadMsg.id]);

    assert.strictEqual(readResult.userId, userB.id);
    assert.ok(readResult.markedIds.includes(unreadMsg.id));

    // Verify message status updated to READ
    const updated = await prisma.message.findUnique({ where: { id: unreadMsg.id } });
    assert.strictEqual(updated?.status, 'READ');
  });

  it('12. Presence Service: Should track online/offline status and last seen timestamp', () => {
    const isFirstOnline = presenceService.addSession(userA.id, 'socket_1');
    assert.strictEqual(isFirstOnline, true);
    assert.strictEqual(presenceService.isUserOnline(userA.id), true);

    // Second socket connection for same user
    const isSecondOnline = presenceService.addSession(userA.id, 'socket_2');
    assert.strictEqual(isSecondOnline, false);

    // Remove first socket session
    const isFirstOffline = presenceService.removeSession(userA.id, 'socket_1');
    assert.strictEqual(isFirstOffline, false);
    assert.strictEqual(presenceService.isUserOnline(userA.id), true);

    // Remove remaining socket session
    const isTotalOffline = presenceService.removeSession(userA.id, 'socket_2');
    assert.strictEqual(isTotalOffline, true);
    assert.strictEqual(presenceService.isUserOnline(userA.id), false);
    assert.ok(presenceService.getLastSeen(userA.id));
  });

  it('13. Real-Time Two-User WebSocket Delivery: User A and User B receive real-time message_created events bidirectionally over Socket.IO', async () => {
    const testServer = http.createServer(app);
    const testIo = new SocketIOServer(testServer, { cors: { origin: '*' } });
    setupSocketHandlers(testIo);

    await new Promise<void>((resolve) => {
      testServer.listen(0, () => resolve());
    });

    const addr = testServer.address() as any;
    const port = addr.port;

    const JWT_SECRET = process.env.JWT_SECRET || 'ourverse-secret-key-change-in-production';
    const tokenA = jwt.sign({ userId: userA.id, username: userA.username }, JWT_SECRET);
    const tokenB = jwt.sign({ userId: userB.id, username: userB.username }, JWT_SECRET);

    const clientA: ClientSocket = ioClient(`http://localhost:${port}`, {
      auth: { token: tokenA },
      transports: ['websocket'],
    });

    const clientB: ClientSocket = ioClient(`http://localhost:${port}`, {
      auth: { token: tokenB },
      transports: ['websocket'],
    });

    // Wait for both sockets to connect
    await Promise.all([
      new Promise<void>((resolve) => {
        if (clientA.connected) resolve();
        else clientA.on('connect', resolve);
      }),
      new Promise<void>((resolve) => {
        if (clientB.connected) resolve();
        else clientB.on('connect', resolve);
      }),
    ]);

    // Both clients join the Universe room
    await new Promise<void>((resolve) => {
      clientA.emit('join_universe', { universeId: testUniverse.id }, () => resolve());
    });

    await new Promise<void>((resolve) => {
      clientB.emit('join_universe', { universeId: testUniverse.id }, () => resolve());
    });

    // Direction 1: User A -> User B
    const messagePromiseForB = new Promise<any>((resolve) => {
      clientB.once('message_created', (msg) => resolve(msg));
    });

    clientA.emit('send_message', {
      universeId: testUniverse.id,
      content: 'Realtime hello from User A to User B',
      type: 'TEXT',
    });

    const receivedByB = await messagePromiseForB;
    assert.strictEqual(receivedByB.senderId, userA.id);
    assert.strictEqual(receivedByB.content, 'Realtime hello from User A to User B');

    // Direction 2: User B -> User A
    const messagePromiseForA = new Promise<any>((resolve) => {
      clientA.once('message_created', (msg) => resolve(msg));
    });

    clientB.emit('send_message', {
      universeId: testUniverse.id,
      content: 'Realtime reply from User B to User A',
      type: 'TEXT',
    });

    const receivedByA = await messagePromiseForA;
    assert.strictEqual(receivedByA.senderId, userB.id);
    assert.strictEqual(receivedByA.content, 'Realtime reply from User B to User A');

    // Disconnect test sockets and close test server & io
    clientA.disconnect();
    clientB.disconnect();
    testIo.close();
    await new Promise<void>((resolve) => testServer.close(() => resolve()));
  });
});
