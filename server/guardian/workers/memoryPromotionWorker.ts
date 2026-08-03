import prisma from '../../db/prisma.js';
import { JobPayload } from '../types.js';

export async function processMemoryPromotionWorker(payload: JobPayload): Promise<void> {
  const { universeId, messageId } = payload;
  await prisma.guardianTimeline.create({
    data: {
      universeId,
      type: 'MEMORY_PROMOTED',
      referenceId: messageId || null,
      description: `[Memory Promotion Placeholder] Memory promoted to permanent relationship narrative for Universe ${universeId}`,
      metadata: JSON.stringify({ placeholder: true, promotedAt: new Date().toISOString() })
    }
  });
}
