import prisma from '../../db/prisma.js';
import { JobPayload } from '../types.js';

export async function processTimelineUpdateWorker(payload: JobPayload): Promise<void> {
  const { universeId, messageId, data } = payload;
  const eventType = data?.eventType || 'UNIVERSE_EVENT';
  const description = data?.description || `Timeline entry for ${eventType} in Universe ${universeId}`;

  await prisma.guardianTimeline.create({
    data: {
      universeId,
      type: eventType,
      referenceId: messageId || data?.referenceId || null,
      description,
      metadata: JSON.stringify(data || {})
    }
  });

  // Increment timeline entries in relationship profile
  await prisma.guardianRelationshipProfile.upsert({
    where: { universeId },
    update: {
      timelineEntries: { increment: 1 }
    },
    create: {
      universeId,
      timelineEntries: 1
    }
  });
}
