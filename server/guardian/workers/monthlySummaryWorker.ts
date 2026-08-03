import prisma from '../../db/prisma.js';
import { JobPayload } from '../types.js';

export async function processMonthlySummaryWorker(payload: JobPayload): Promise<void> {
  const { universeId } = payload;
  const now = new Date();
  const monthStartDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const content = `[Monthly Summary Placeholder] Universe ${universeId} monthly summary for ${monthStartDate.toISOString().slice(0, 7)}.`;

  await prisma.guardianMonthlySummary.upsert({
    where: {
      universeId_monthStartDate: {
        universeId,
        monthStartDate
      }
    },
    update: {
      content,
      metadata: JSON.stringify({ version: 1, generatedAt: new Date().toISOString() })
    },
    create: {
      universeId,
      monthStartDate,
      content,
      metadata: JSON.stringify({ version: 1, generatedAt: new Date().toISOString() })
    }
  });
}
