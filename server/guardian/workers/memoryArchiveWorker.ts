import prisma from '../../db/prisma.js';
import { JobPayload } from '../types.js';

export async function processMemoryArchiveWorker(payload: JobPayload): Promise<void> {
  const { universeId } = payload;
  await prisma.guardianTimeline.create({
    data: {
      universeId,
      type: 'MEMORY_ARCHIVED',
      description: `[Memory Archive Placeholder] Older memory elements archived for Universe ${universeId}`,
      metadata: JSON.stringify({ placeholder: true, archivedAt: new Date().toISOString() })
    }
  });
}
