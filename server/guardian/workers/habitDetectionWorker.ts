import prisma from '../../db/prisma.js';
import { JobPayload } from '../types.js';

export async function processHabitDetectionWorker(payload: JobPayload): Promise<void> {
  const { universeId } = payload;
  const description = `[Habit Detector Placeholder] System scanning communication habits for Universe ${universeId}`;

  await prisma.guardianTimeline.create({
    data: {
      universeId,
      type: 'HABIT_DETECTED',
      description,
      metadata: JSON.stringify({ placeholder: true, detectedAt: new Date().toISOString() })
    }
  });
}
