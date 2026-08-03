import prisma from '../../db/prisma.js';
import { JobPayload } from '../types.js';

export async function processProfileUpdateWorker(payload: JobPayload): Promise<void> {
  const { universeId } = payload;

  const msgCount = await prisma.message.count({ where: { universeId } });
  const summaryCount = (await prisma.guardianDailySummary.count({ where: { universeId } })) +
                       (await prisma.guardianWeeklySummary.count({ where: { universeId } })) +
                       (await prisma.guardianMonthlySummary.count({ where: { universeId } }));
  const timelineCount = await prisma.guardianTimeline.count({ where: { universeId } });

  await prisma.guardianRelationshipProfile.upsert({
    where: { universeId },
    update: {
      messagesProcessed: msgCount,
      summariesGenerated: summaryCount,
      timelineEntries: timelineCount,
      processingStatus: 'COMPLETED',
      workerHealth: 'HEALTHY'
    },
    create: {
      universeId,
      learningStage: 'BASELINE_OBSERVATION',
      messagesProcessed: msgCount,
      summariesGenerated: summaryCount,
      timelineEntries: timelineCount,
      processingStatus: 'COMPLETED',
      workerHealth: 'HEALTHY'
    }
  });
}
