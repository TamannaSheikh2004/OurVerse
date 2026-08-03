import prisma from '../../db/prisma.js';
import { JobPayload } from '../types.js';

export async function processStatisticsWorker(payload: JobPayload): Promise<void> {
  const { universeId } = payload;
  const msgCount = await prisma.message.count({ where: { universeId } });
  const timelineCount = await prisma.guardianTimeline.count({ where: { universeId } });

  await prisma.guardianRelationshipProfile.upsert({
    where: { universeId },
    update: {
      messagesProcessed: msgCount,
      timelineEntries: timelineCount,
      processingStatus: 'COMPLETED'
    },
    create: {
      universeId,
      messagesProcessed: msgCount,
      timelineEntries: timelineCount,
      processingStatus: 'COMPLETED'
    }
  });
}
