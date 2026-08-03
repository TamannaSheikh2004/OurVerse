import prisma from '../../db/prisma.js';
import { JobPayload } from '../types.js';

export async function processWeeklySummaryWorker(payload: JobPayload): Promise<void> {
  const { universeId } = payload;
  const now = new Date();
  const day = now.getUTCDay();
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  const weekStartDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diffToMonday));

  const content = `[Weekly Summary Placeholder] Universe ${universeId} weekly summary starting ${weekStartDate.toISOString().split('T')[0]}.`;

  await prisma.guardianWeeklySummary.upsert({
    where: {
      universeId_weekStartDate: {
        universeId,
        weekStartDate
      }
    },
    update: {
      content,
      metadata: JSON.stringify({ version: 1, generatedAt: new Date().toISOString() })
    },
    create: {
      universeId,
      weekStartDate,
      content,
      metadata: JSON.stringify({ version: 1, generatedAt: new Date().toISOString() })
    }
  });
}
