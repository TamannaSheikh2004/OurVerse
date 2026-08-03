import { Request, Response } from 'express';
import messageService from '../services/messageService.js';
import presenceService from '../services/presenceService.js';

export async function getMessages(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const { universeId } = req.params;
    const { cursor, limit, q, direction } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!universeId) {
      return res.status(400).json({ error: 'Universe ID is required' });
    }

    const result = await messageService.fetchMessages({
      universeId,
      userId,
      cursor: cursor as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : 30,
      q: q as string | undefined,
      direction: (direction as 'before' | 'after') || 'before'
    });

    return res.json(result);
  } catch (error: any) {
    if (error.message?.startsWith('UNAUTHORIZED_UNIVERSE_MEMBER')) {
      return res.status(403).json({ error: 'You are not a member of this Universe' });
    }
    return res.status(500).json({ error: error.message || 'Failed to fetch messages' });
  }
}

export async function markMessagesRead(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const { universeId } = req.params;
    const { messageIds } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!universeId) {
      return res.status(400).json({ error: 'Universe ID is required' });
    }

    const result = await messageService.markRead(universeId, userId, messageIds);

    return res.json(result);
  } catch (error: any) {
    if (error.message?.startsWith('UNAUTHORIZED_UNIVERSE_MEMBER')) {
      return res.status(403).json({ error: 'You are not a member of this Universe' });
    }
    return res.status(500).json({ error: error.message || 'Failed to mark messages as read' });
  }
}

export async function getUserPresence(req: Request, res: Response) {
  try {
    const currentUserId = (req as any).user?.userId;
    const { universeId, targetUserId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const isMember = await messageService.isUniverseMember(universeId, currentUserId);
    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this Universe' });
    }

    const presence = presenceService.getUserPresence(targetUserId);
    return res.json(presence);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch presence' });
  }
}
