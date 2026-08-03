import prisma from '../../db/prisma.js';
import { JobPayload } from '../types.js';

export async function processNicknameDetectionWorker(payload: JobPayload): Promise<void> {
  const { universeId } = payload;
  const profile = await prisma.guardianRelationshipProfile.findUnique({
    where: { universeId }
  });

  let meta: any = {};
  try {
    meta = JSON.parse(profile?.metadata || '{}');
  } catch (err) {
    meta = {};
  }

  meta.nicknames = meta.nicknames || [];
  meta.nicknamesUpdated = new Date().toISOString();

  await prisma.guardianRelationshipProfile.upsert({
    where: { universeId },
    update: { metadata: JSON.stringify(meta) },
    create: { universeId, metadata: JSON.stringify(meta) }
  });
}
