import test from 'node:test';
import assert from 'node:assert';
import http from 'http';
import app from '../index.js';
import prisma from '../db/prisma.js';
import guardianEventBus from '../guardian/eventBus.js';
import guardianJobQueue from '../guardian/jobQueue.js';
import { generateGuardianId, generateEventId, generateJobId } from '../guardian/utils/guardianIdGen.js';
import { calculateExponentialBackoff } from '../guardian/utils/retryHelper.js';

test('Sprint 5.0: Event-Driven Guardian Infrastructure Test Suite', async (t) => {
  let server: http.Server;
  let baseUrl: string;
  let testUser1: any;
  let testUser2: any;
  let testUniverse: any;
  let testToken: string;

  t.before(async () => {
    // Start HTTP server instance
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (typeof addr === 'object' && addr !== null) {
          baseUrl = `http://localhost:${addr.port}`;
        }
        resolve();
      });
    });

    // Setup test users & universe
    testUser1 = await prisma.user.create({
      data: {
        username: `gtest_user1_${Date.now()}`,
        passwordHash: 'hash',
        recoveryKeyHash: 'hash',
        displayName: 'Guardian Test User 1'
      }
    });

    testUser2 = await prisma.user.create({
      data: {
        username: `gtest_user2_${Date.now()}`,
        passwordHash: 'hash',
        recoveryKeyHash: 'hash',
        displayName: 'Guardian Test User 2'
      }
    });

    testUniverse = await prisma.universe.create({
      data: {
        universeId: `UVR-TEST-${Date.now().toString(36).toUpperCase()}`,
        members: {
          create: [
            { userId: testUser1.id },
            { userId: testUser2.id }
          ]
        }
      }
    });

    // Create auth token for testUser1
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `gtest_auth_${Date.now()}`,
        password: 'Password123!',
        displayName: 'Auth Test User'
      })
    });
    const body = await res.json();
    testToken = body.token;
  });

  t.after(async () => {
    guardianJobQueue.shutdown();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  await t.test('1. Utility: Custom ID Generators (GRD-XXXXXXXX, EVT-XXXXXXXX, JOB-XXXXXXXX)', () => {
    const gId = generateGuardianId();
    const eId = generateEventId();
    const jId = generateJobId();

    assert.match(gId, /^GRD-[A-Z0-9]{8}$/);
    assert.match(eId, /^EVT-[A-Z0-9]{8}$/);
    assert.match(jId, /^JOB-[A-Z0-9]{8}$/);
  });

  await t.test('2. Utility: Exponential Backoff Calculation', () => {
    const delay0 = calculateExponentialBackoff(0, 200);
    const delay1 = calculateExponentialBackoff(1, 200);
    const delay2 = calculateExponentialBackoff(2, 200);

    assert.strictEqual(delay0 >= 200 && delay0 <= 300, true);
    assert.strictEqual(delay1 >= 400 && delay1 <= 500, true);
    assert.strictEqual(delay2 >= 800 && delay2 <= 900, true);
  });

  await t.test('3. Central Guardian Anchor & Relationship Profile Provisioning', async () => {
    const guardianId = generateGuardianId();

    const guardian = await prisma.guardian.create({
      data: {
        guardianId,
        universeId: testUniverse.id,
        status: 'ACTIVE'
      }
    });

    assert.strictEqual(guardian.guardianId, guardianId);
    assert.strictEqual(guardian.universeId, testUniverse.id);

    const profile = await prisma.guardianRelationshipProfile.create({
      data: {
        universeId: testUniverse.id,
        learningStage: 'BASELINE_OBSERVATION'
      }
    });

    assert.strictEqual(profile.universeId, testUniverse.id);
    assert.strictEqual(profile.learningStage, 'BASELINE_OBSERVATION');
  });

  await t.test('4. Event Bus Publishing & Asynchronous Database Persistence', async () => {
    const eventId = guardianEventBus.publish('MessageCreated', {
      universeId: testUniverse.id,
      content: 'Hello Guardian Infrastructure!',
      senderId: testUser1.id
    });

    assert.match(eventId, /^EVT-[A-Z0-9]{8}$/);

    // Wait briefly for asynchronous persistence
    await new Promise((resolve) => setTimeout(resolve, 300));

    const dbEvent = await prisma.guardianEvent.findUnique({
      where: { eventId }
    });

    assert.notStrictEqual(dbEvent, null);
    assert.strictEqual(dbEvent?.eventType, 'MessageCreated');
    assert.strictEqual(dbEvent?.universeId, testUniverse.id);
  });

  await t.test('5. Job Queue Engine & Worker Execution', async () => {
    // Shutdown background polling to test queue deterministically
    guardianJobQueue.shutdown();

    // Create test message
    const msg = await prisma.message.create({
      data: {
        messageId: `MSG-TEST-${Date.now().toString(36).toUpperCase()}`,
        universeId: testUniverse.id,
        senderId: testUser1.id,
        content: 'Test message for queue worker processing'
      }
    });

    const jobId = await guardianJobQueue.enqueueJob(
      'PROCESS_MESSAGE_METADATA',
      testUniverse.id,
      { messageId: msg.id },
      10
    );

    // Process job batch synchronously
    await guardianJobQueue.processNextBatch();

    const updatedMsg = await prisma.message.findUnique({
      where: { id: msg.id }
    });

    const metadata = JSON.parse(updatedMsg?.metadata || '{}');
    assert.strictEqual(metadata.guardian?.processingStatus, 'COMPLETED');
  });

  await t.test('6. Summary Lifecycle: Daily, Weekly, and Monthly Summary Placeholders', async () => {
    await guardianJobQueue.enqueueJob('GENERATE_DAILY_SUMMARY', testUniverse.id, {}, 5);
    await guardianJobQueue.enqueueJob('GENERATE_WEEKLY_SUMMARY', testUniverse.id, {}, 5);
    await guardianJobQueue.enqueueJob('GENERATE_MONTHLY_SUMMARY', testUniverse.id, {}, 5);

    await guardianJobQueue.processNextBatch();

    const daily = await prisma.guardianDailySummary.findFirst({
      where: { universeId: testUniverse.id }
    });
    const weekly = await prisma.guardianWeeklySummary.findFirst({
      where: { universeId: testUniverse.id }
    });
    const monthly = await prisma.guardianMonthlySummary.findFirst({
      where: { universeId: testUniverse.id }
    });

    assert.notStrictEqual(daily, null);
    assert.strictEqual(daily?.content.includes('Daily Summary Placeholder'), true);

    assert.notStrictEqual(weekly, null);
    assert.strictEqual(weekly?.content.includes('Weekly Summary Placeholder'), true);

    assert.notStrictEqual(monthly, null);
    assert.strictEqual(monthly?.content.includes('Monthly Summary Placeholder'), true);
  });

  await t.test('7. Timeline Infrastructure: Event & Placeholder Entries', async () => {
    await guardianJobQueue.enqueueJob('UPDATE_TIMELINE', testUniverse.id, {
      eventType: 'MILESTONE_DETECTED',
      description: 'First 10 messages exchanged in Universe'
    }, 5);

    await guardianJobQueue.processNextBatch();

    const timeline = await prisma.guardianTimeline.findFirst({
      where: { universeId: testUniverse.id, type: 'MILESTONE_DETECTED' }
    });

    assert.notStrictEqual(timeline, null);
    assert.strictEqual(timeline?.description, 'First 10 messages exchanged in Universe');
  });

  await t.test('8. Dead-Letter Failure Handling & Max Retries Exceeded', async () => {
    // Register temporary failing worker handler
    guardianJobQueue.registerHandler('RECALCULATE_STATISTICS', async () => {
      throw new Error('SIMULATED_WORKER_FAILURE');
    });

    const jobId = await guardianJobQueue.enqueueJob(
      'RECALCULATE_STATISTICS',
      testUniverse.id,
      {},
      0,
      2 // maxRetries = 2
    );

    // Initial run fails -> status RETRYING
    await guardianJobQueue.processNextBatch();

    let jobRecord = await prisma.guardianProcessingQueue.findUnique({
      where: { jobId }
    });
    assert.strictEqual(jobRecord?.status, 'RETRYING');

    // Force retry time for instant processing
    await prisma.guardianProcessingQueue.update({
      where: { jobId },
      data: { scheduledAt: new Date(Date.now() - 1000) }
    });

    // Second run fails -> exceeds max retries -> status FAILED
    await guardianJobQueue.processNextBatch();

    jobRecord = await prisma.guardianProcessingQueue.findUnique({
      where: { jobId }
    });
    assert.strictEqual(jobRecord?.status, 'FAILED');

    // Restart queue polling for normal server operation
    guardianJobQueue.start(200);
  });

  await t.test('9. Observability Monitoring Endpoint (/api/guardian/observability/status)', async () => {
    const res = await fetch(`${baseUrl}/api/guardian/observability/status`, {
      headers: { Authorization: `Bearer ${testToken}` }
    });
    const body = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'online');
    assert.strictEqual(body.system.includes('Guardian Infrastructure'), true);
    assert.notStrictEqual(body.queue, undefined);
    assert.notStrictEqual(body.counts, undefined);
  });
});
