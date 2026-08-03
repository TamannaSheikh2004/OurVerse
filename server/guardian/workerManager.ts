import guardianJobQueue from './jobQueue.js';
import guardianEventBus from './eventBus.js';
import prisma from '../db/prisma.js';
import { generateGuardianId } from './utils/guardianIdGen.js';
import { processMessageMetadataWorker } from './workers/metadataProcessingWorker.js';
import { processDailySummaryWorker } from './workers/dailySummaryWorker.js';
import { processWeeklySummaryWorker } from './workers/weeklySummaryWorker.js';
import { processMonthlySummaryWorker } from './workers/monthlySummaryWorker.js';
import { processTimelineUpdateWorker } from './workers/timelineUpdateWorker.js';
import { processProfileUpdateWorker } from './workers/profileUpdateWorker.js';
import { processHabitDetectionWorker } from './workers/habitDetectionWorker.js';
import { processMilestoneDetectionWorker } from './workers/milestoneDetectionWorker.js';
import { processInterestDetectionWorker } from './workers/interestDetectionWorker.js';
import { processNicknameDetectionWorker } from './workers/nicknameDetectionWorker.js';
import { processMemoryPromotionWorker } from './workers/memoryPromotionWorker.js';
import { processMemoryArchiveWorker } from './workers/memoryArchiveWorker.js';
import { processStatisticsWorker } from './workers/statisticsWorker.js';

export function initializeGuardianInfrastructure() {
  // 1. Register Worker Handlers with Job Queue
  guardianJobQueue.registerHandler('PROCESS_MESSAGE_METADATA', processMessageMetadataWorker);
  guardianJobQueue.registerHandler('GENERATE_DAILY_SUMMARY', processDailySummaryWorker);
  guardianJobQueue.registerHandler('GENERATE_WEEKLY_SUMMARY', processWeeklySummaryWorker);
  guardianJobQueue.registerHandler('GENERATE_MONTHLY_SUMMARY', processMonthlySummaryWorker);
  guardianJobQueue.registerHandler('UPDATE_TIMELINE', processTimelineUpdateWorker);
  guardianJobQueue.registerHandler('UPDATE_RELATIONSHIP_PROFILE', processProfileUpdateWorker);
  guardianJobQueue.registerHandler('DETECT_HABIT', processHabitDetectionWorker);
  guardianJobQueue.registerHandler('DETECT_MILESTONE', processMilestoneDetectionWorker);
  guardianJobQueue.registerHandler('EXTRACT_INTERESTS', processInterestDetectionWorker);
  guardianJobQueue.registerHandler('DETECT_NICKNAME', processNicknameDetectionWorker);
  guardianJobQueue.registerHandler('PROMOTE_MEMORY', processMemoryPromotionWorker);
  guardianJobQueue.registerHandler('ARCHIVE_MEMORY', processMemoryArchiveWorker);
  guardianJobQueue.registerHandler('RECALCULATE_STATISTICS', processStatisticsWorker);

  // 2. Register Event Bus Subscribers
  
  // Event: MessageCreated
  guardianEventBus.subscribe('MessageCreated', async (payload) => {
    const { universeId, messageId } = payload;
    if (!universeId || !messageId) return;

    // Enqueue background processing jobs asynchronously
    await guardianJobQueue.enqueueJob('PROCESS_MESSAGE_METADATA', universeId, { messageId }, 10);
    await guardianJobQueue.enqueueJob('GENERATE_DAILY_SUMMARY', universeId, { messageId }, 5);
    await guardianJobQueue.enqueueJob('UPDATE_TIMELINE', universeId, { eventType: 'MESSAGE_CREATED', messageId, description: 'Message sent in Universe' }, 5);
    await guardianJobQueue.enqueueJob('UPDATE_RELATIONSHIP_PROFILE', universeId, {}, 3);
    await guardianJobQueue.enqueueJob('DETECT_HABIT', universeId, { messageId }, 2);
    await guardianJobQueue.enqueueJob('DETECT_MILESTONE', universeId, { messageId }, 2);
  });

  // Event: UniverseCreated / UniverseInvitationAccepted
  guardianEventBus.subscribe('UniverseCreated', async (payload) => {
    const { universeId } = payload;
    if (!universeId) return;

    // Ensure Guardian central anchor entry exists
    try {
      const existing = await prisma.guardian.findUnique({ where: { universeId } });
      if (!existing) {
        let guardianId = generateGuardianId();
        let isUnique = false;
        while (!isUnique) {
          const check = await prisma.guardian.findUnique({ where: { guardianId } });
          if (!check) isUnique = true;
          else guardianId = generateGuardianId();
        }

        await prisma.guardian.create({
          data: {
            guardianId,
            universeId,
            status: 'ACTIVE'
          }
        });
      }

      // Provision Relationship Profile
      await prisma.guardianRelationshipProfile.upsert({
        where: { universeId },
        update: {},
        create: {
          universeId,
          learningStage: 'BASELINE_OBSERVATION',
          processingStatus: 'COMPLETED',
          workerHealth: 'HEALTHY'
        }
      });

      // Enqueue timeline creation
      await guardianJobQueue.enqueueJob('UPDATE_TIMELINE', universeId, {
        eventType: 'UNIVERSE_CREATED',
        description: 'Shared Universe created via mutual consent'
      }, 10);
    } catch (err) {
      console.error(`[WorkerManager] Error provisioning Guardian for Universe ${universeId}:`, err);
    }
  });

  // Event: MemoryPromotionRequested
  guardianEventBus.subscribe('MemoryPromotionRequested', async (payload) => {
    const { universeId, messageId } = payload;
    await guardianJobQueue.enqueueJob('PROMOTE_MEMORY', universeId, { messageId }, 8);
  });

  // Event: MemoryArchiveRequested
  guardianEventBus.subscribe('MemoryArchiveRequested', async (payload) => {
    const { universeId } = payload;
    await guardianJobQueue.enqueueJob('ARCHIVE_MEMORY', universeId, {}, 4);
  });

  // Start background job polling queue and recover pending jobs
  guardianJobQueue.recoverPendingJobs().then(() => {
    guardianJobQueue.start(200);
  });
}
