import prisma from '../../db/prisma.js';
import { JobPayload } from '../types.js';

export async function processMilestoneDetectionWorker(payload: JobPayload): Promise<void> {
  const { universeId, messageId } = payload;
  const description = `[Milestone Detector Placeholder] Relationship milestone marker evaluated for Universe ${universeId}`;

  await prisma.guardianTimeline.create({
    data: {
      universeId,
      type: 'MILESTONE_DETECTED',
      referenceId: messageId || null,
      description,
      metadata: JSON.stringify({ placeholder: true, detectedAt: new Date().toISOString() })
    }
  });
}
