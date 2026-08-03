import prisma from '../../db/prisma.js';
import { JobPayload, StandardizedMessageMetadata } from '../types.js';

export async function processMessageMetadataWorker(payload: JobPayload): Promise<void> {
  const { universeId, messageId } = payload;
  if (!messageId) return;

  const msg = await prisma.message.findUnique({
    where: { id: messageId }
  });

  if (!msg) return;

  let existingMeta: any = {};
  try {
    existingMeta = JSON.parse(msg.metadata || '{}');
  } catch (err) {
    existingMeta = {};
  }

  const updatedMetadata: StandardizedMessageMetadata = {
    language: existingMeta.language || null,
    guardian: {
      processingStatus: 'COMPLETED',
      summaryVersion: (existingMeta.guardian?.summaryVersion || 0) + 1,
      importance: existingMeta.guardian?.importance || 'NORMAL',
      processedAt: new Date().toISOString()
    },
    reply: existingMeta.reply || {},
    future: existingMeta.future || {}
  };

  await prisma.message.update({
    where: { id: messageId },
    data: {
      metadata: JSON.stringify(updatedMetadata)
    }
  });

  // Mark matching GuardianEvent COMPLETED
  await prisma.guardianEvent.updateMany({
    where: {
      universeId,
      messageId,
      status: { in: ['PENDING', 'PROCESSING'] }
    },
    data: {
      status: 'COMPLETED',
      processedAt: new Date()
    }
  });
}
