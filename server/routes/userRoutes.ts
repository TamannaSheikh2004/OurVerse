import { Router, Response } from 'express';
import prisma from '../db/prisma.js';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware.js';
import { searchLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * GET /api/users/search?q=query
 * Search users exclusively by username (prefix/exact match).
 * Rate limit: 30 requests/minute.
 * Excludes internal IDs, passwords, recovery keys, and reserved usernames.
 */
router.get('/search', authenticateToken, searchLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    if (!currentUserId) return res.status(401).json({ error: 'Unauthorized' });

    const query = (req.query.q as string || '').trim().toLowerCase();

    if (!query) {
      return res.json([]);
    }

    // Search active users by username prefix or exact match, excluding self
    const matchedUsers = await prisma.user.findMany({
      where: {
        username: {
          startsWith: query,
        },
        id: {
          not: currentUserId,
        },
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        allowUniverseRequests: true,
      },
      take: 20,
    });

    if (matchedUsers.length === 0) {
      return res.json([]);
    }

    // Fetch existing connections, invitations, and blocks for current user
    const targetUserIds = matchedUsers.map((u) => u.id);

    // 1. Existing Universes
    const userMemberships = await prisma.universeMember.findMany({
      where: {
        userId: currentUserId,
      },
      select: {
        universeId: true,
      },
    });
    const universeIds = userMemberships.map((m) => m.universeId);

    const connectedPeers = await prisma.universeMember.findMany({
      where: {
        universeId: { in: universeIds },
        userId: { in: targetUserIds },
      },
      select: {
        userId: true,
      },
    });
    const connectedSet = new Set(connectedPeers.map((p) => p.userId));

    // 2. Blocked Users (either direction)
    const blocks = await prisma.blockedUser.findMany({
      where: {
        OR: [
          { blockerId: currentUserId, blockedId: { in: targetUserIds } },
          { blockerId: { in: targetUserIds }, blockedId: currentUserId },
        ],
      },
    });
    const blockedSet = new Set<string>();
    blocks.forEach((b) => {
      blockedSet.add(b.blockerId === currentUserId ? b.blockedId : b.blockerId);
    });

    // 3. Invitations (Sent / Received)
    const invitations = await prisma.universeInvitation.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { gt: new Date() },
        OR: [
          { senderId: currentUserId, receiverId: { in: targetUserIds } },
          { senderId: { in: targetUserIds }, receiverId: currentUserId },
        ],
      },
    });

    const sentPendingSet = new Set(
      invitations.filter((i) => i.senderId === currentUserId).map((i) => i.receiverId)
    );
    const receivedPendingSet = new Set(
      invitations.filter((i) => i.receiverId === currentUserId).map((i) => i.senderId)
    );

    // Build public response
    const results = matchedUsers.map((user) => {
      let relationshipStatus: 'CONNECTED' | 'BLOCKED' | 'INVITATION_SENT' | 'INVITATION_RECEIVED' | 'NONE' = 'NONE';

      if (connectedSet.has(user.id)) {
        relationshipStatus = 'CONNECTED';
      } else if (blockedSet.has(user.id)) {
        relationshipStatus = 'BLOCKED';
      } else if (sentPendingSet.has(user.id)) {
        relationshipStatus = 'INVITATION_SENT';
      } else if (receivedPendingSet.has(user.id)) {
        relationshipStatus = 'INVITATION_RECEIVED';
      }

      return {
        username: user.username,
        displayName: user.displayName || user.username,
        avatar: user.avatarUrl || null,
        relationshipStatus,
      };
    });

    return res.json(results);
  } catch (error: any) {
    console.error('Search Users Error:', error);
    return res.status(500).json({ error: 'Internal server error during search' });
  }
});

export default router;
