import prisma from '../../db/prisma.js';
import { JobPayload } from '../types.js';

export async function processDailySummaryWorker(payload: JobPayload): Promise<void> {
  const { universeId } = payload;
  const now = new Date();
  const summaryDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const messageCount = await prisma.message.count({
    where: {
      universeId,
      createdAt: {
        gte: summaryDate,
        lt: new Date(summaryDate.getTime() + 24 * 60 * 60 * 1000)
      }
    }
  });

  const content = `[Daily Summary Placeholder] Universe ${universeId} recorded ${messageCount} message(s) on ${summaryDate.toISOString().split('T')[0]}.`;

  await prisma.guardianDailySummary.upsert({
    where: {
      universeId_summaryDate: {
        universeId,
        summaryDate
      }
    },
    update: {
      messageCount,
      content,
      metadata: JSON.stringify({ version: 1, generatedAt: new Date().toISOString() })
    },
    create: {
      universeId,
      summaryDate,
      messageCount,
      content,
      metadata: JSON.stringify({ version: 1, generatedAt: new Date().toISOString() })
    }
  });
}
