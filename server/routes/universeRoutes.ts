import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../db/prisma.js';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware.js';
import { invitationLimiter } from '../middleware/rateLimiter.js';
import { generateUniverseId } from '../utils/universeIdGen.js';

const router = Router();

// Validation Schemas
const requestSchema = z.object({
  receiverUsername: z.string().min(1, 'Receiver username is required'),
});

const acceptSchema = z.object({
  invitationId: z.string().min(1, 'Invitation ID is required'),
});

const rejectSchema = z.object({
  invitationId: z.string().min(1, 'Invitation ID is required'),
});

const blockSchema = z.object({
  targetUsername: z.string().optional(),
  invitationId: z.string().optional(),
});

/**
 * Helper to check if a Universe already exists between two users
 */
async function findExistingUniverseBetween(userIdA: string, userIdB: string) {
  const membershipsA = await prisma.universeMember.findMany({
    where: { userId: userIdA },
    select: { universeId: true },
  });

  const universeIdsA = membershipsA.map((m) => m.universeId);
  if (universeIdsA.length === 0) return null;

  const sharedMember = await prisma.universeMember.findFirst({
    where: {
      universeId: { in: universeIdsA },
      userId: userIdB,
    },
    include: {
      universe: true,
    },
  });

  return sharedMember ? sharedMember.universe : null;
}

/**
 * Helper to check if two users have blocked each other
 */
async function isBlockedBetween(userIdA: string, userIdB: string): Promise<boolean> {
  const block = await prisma.blockedUser.findFirst({
    where: {
      OR: [
        { blockerId: userIdA, blockedId: userIdB },
        { blockerId: userIdB, blockedId: userIdA },
      ],
    },
  });
  return !!block;
}

/**
 * Helper to automatically expire pending invitations older than 30 days
 */
async function autoExpirePendingInvitations() {
  await prisma.universeInvitation.updateMany({
    where: {
      status: 'PENDING',
      expiresAt: { lt: new Date() },
    },
    data: {
      status: 'EXPIRED',
    },
  });
}

/**
 * POST /api/universe/request
 * Send a Universe Invitation to a peer by username
 * Rate Limit: 10 requests/hour
 */
router.post('/request', authenticateToken, invitationLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const senderId = req.user?.userId;
    if (!senderId) return res.status(401).json({ error: 'Unauthorized' });

    const parseResult = requestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Receiver username is required' });
    }

    const receiverUsername = parseResult.data.receiverUsername.toLowerCase().trim();

    // 1. Resolve receiver user
    const receiver = await prisma.user.findUnique({
      where: { username: receiverUsername },
    });

    if (!receiver) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. Prevent self-invitation (Rule 2)
    if (receiver.id === senderId) {
      return res.status(400).json({ error: 'You cannot invite yourself to a Universe' });
    }

    // 3. Check for Block (Rule 5)
    const blocked = await isBlockedBetween(senderId, receiver.id);
    if (blocked) {
      return res.status(400).json({ error: 'Universe Invitations are forbidden between blocked users' });
    }

    // 4. Check receiver settings (Rule 6)
    if (receiver.allowUniverseRequests === 'NOBODY') {
      return res.status(400).json({ error: 'This user does not accept Universe Invitations' });
    }

    // 5. Check if Universe already exists (Rule 4)
    const existingUniverse = await findExistingUniverseBetween(senderId, receiver.id);
    if (existingUniverse) {
      return res.status(400).json({
        error: 'A Shared Universe already exists between you and this user',
        universeId: existingUniverse.universeId,
      });
    }

    // 6. Expire old pending invitations
    await autoExpirePendingInvitations();

    // 7. Check duplicate pending invitation (Rule 3)
    const existingPending = await prisma.universeInvitation.findFirst({
      where: {
        status: 'PENDING',
        expiresAt: { gt: new Date() },
        OR: [
          { senderId, receiverId: receiver.id },
          { senderId: receiver.id, receiverId: senderId },
        ],
      },
    });

    if (existingPending) {
      return res.status(400).json({ error: 'A Universe Invitation is already pending between you and this user' });
    }

    // 8. Create Universe Invitation with 30-day expiry inside a transaction (Rule 8 & Rule 10)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const invitation = await prisma.universeInvitation.create({
      data: {
        senderId,
        receiverId: receiver.id,
        status: 'PENDING',
        expiresAt,
      },
    });

    return res.status(201).json({
      message: `Universe Invitation sent to @${receiver.username}`,
      invitationId: invitation.id,
      expiresAt: invitation.expiresAt,
    });
  } catch (error: any) {
    console.error('Create Universe Invitation Error:', error);
    return res.status(500).json({ error: 'Internal server error while creating Universe Invitation' });
  }
});

/**
 * POST /api/universe/accept
 * Accept a Universe Invitation & create exactly ONE Universe with TWO members inside a transaction
 */
router.post('/accept', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const receiverId = req.user?.userId;
    if (!receiverId) return res.status(401).json({ error: 'Unauthorized' });

    const parseResult = acceptSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invitation ID is required' });
    }

    const { invitationId } = parseResult.data;

    await autoExpirePendingInvitations();

    const invitation = await prisma.universeInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.receiverId !== receiverId) {
      return res.status(404).json({ error: 'Universe Invitation not found' });
    }

    if (invitation.status !== 'PENDING') {
      return res.status(400).json({ error: `Universe Invitation is already ${invitation.status.toLowerCase()}` });
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.universeInvitation.update({
        where: { id: invitationId },
        data: { status: 'EXPIRED' },
      });
      return res.status(400).json({ error: 'This Universe Invitation has expired' });
    }

    // Perform Universe creation transactionally (Rule 10)
    const result = await prisma.$transaction(async (tx) => {
      // Re-verify if Universe already exists between the two users
      const membershipsA = await tx.universeMember.findMany({
        where: { userId: invitation.senderId },
        select: { universeId: true },
      });
      const universeIdsA = membershipsA.map((m) => m.universeId);

      let existingUniverse = null;
      if (universeIdsA.length > 0) {
        const sharedMember = await tx.universeMember.findFirst({
          where: {
            universeId: { in: universeIdsA },
            userId: invitation.receiverId,
          },
          include: { universe: true },
        });
        if (sharedMember) existingUniverse = sharedMember.universe;
      }

      // Mark invitation ACCEPTED
      await tx.universeInvitation.update({
        where: { id: invitationId },
        data: {
          status: 'ACCEPTED',
          respondedAt: new Date(),
        },
      });

      if (existingUniverse) {
        return existingUniverse;
      }

      // Generate custom readable UVR-XXXXXXXX ID
      let customId = generateUniverseId();
      let isUnique = false;

      while (!isUnique) {
        const check = await tx.universe.findUnique({ where: { universeId: customId } });
        if (!check) isUnique = true;
        else customId = generateUniverseId();
      }

      // Create 1 Universe
      const newUniverse = await tx.universe.create({
        data: {
          universeId: customId,
        },
      });

      // Create 2 UniverseMember records
      await tx.universeMember.createMany({
        data: [
          { universeId: newUniverse.id, userId: invitation.senderId },
          { universeId: newUniverse.id, userId: invitation.receiverId },
        ],
      });

      return newUniverse;
    });

    return res.status(200).json({
      message: 'Universe created successfully',
      universeId: result.universeId,
      createdAt: result.createdAt,
    });
  } catch (error: any) {
    console.error('Accept Universe Invitation Error:', error);
    return res.status(500).json({ error: 'Failed to accept Universe Invitation' });
  }
});

/**
 * POST /api/universe/reject
 * Reject a Universe Invitation
 */
router.post('/reject', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const receiverId = req.user?.userId;
    if (!receiverId) return res.status(401).json({ error: 'Unauthorized' });

    const parseResult = rejectSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invitation ID is required' });
    }

    const { invitationId } = parseResult.data;

    const invitation = await prisma.universeInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.receiverId !== receiverId) {
      return res.status(404).json({ error: 'Universe Invitation not found' });
    }

    await prisma.universeInvitation.update({
      where: { id: invitationId },
      data: {
        status: 'REJECTED',
        respondedAt: new Date(),
      },
    });

    return res.json({ message: 'Universe Invitation declined' });
  } catch (error: any) {
    console.error('Reject Invitation Error:', error);
    return res.status(500).json({ error: 'Failed to decline Universe Invitation' });
  }
});

/**
 * POST /api/universe/block
 * Block a user and update related invitations to BLOCKED
 */
router.post('/block', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    if (!currentUserId) return res.status(401).json({ error: 'Unauthorized' });

    const parseResult = blockSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Target username or invitation ID is required' });
    }

    const { targetUsername, invitationId } = parseResult.data;

    let targetUserId: string | null = null;

    if (targetUsername) {
      const targetUser = await prisma.user.findUnique({
        where: { username: targetUsername.toLowerCase().trim() },
      });
      if (targetUser) targetUserId = targetUser.id;
    } else if (invitationId) {
      const inv = await prisma.universeInvitation.findUnique({
        where: { id: invitationId },
      });
      if (inv) {
        targetUserId = inv.senderId === currentUserId ? inv.receiverId : inv.senderId;
      }
    }

    if (!targetUserId) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: 'You cannot block yourself' });
    }

    await prisma.$transaction(async (tx) => {
      // Create BlockedUser entry
      await tx.blockedUser.upsert({
        where: {
          blockerId_blockedId: {
            blockerId: currentUserId,
            blockedId: targetUserId!,
          },
        },
        create: {
          blockerId: currentUserId,
          blockedId: targetUserId!,
        },
        update: {},
      });

      // Update related invitations to BLOCKED
      await tx.universeInvitation.updateMany({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: targetUserId! },
            { senderId: targetUserId!, receiverId: currentUserId },
          ],
        },
        data: {
          status: 'BLOCKED',
          respondedAt: new Date(),
        },
      });
    });

    return res.json({ message: 'User blocked and Universe Invitations updated' });
  } catch (error: any) {
    console.error('Block User Error:', error);
    return res.status(500).json({ error: 'Failed to block user' });
  }
});

/**
 * GET /api/universe/invitations
 * Get received and sent Universe Invitations
 */
router.get('/invitations', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await autoExpirePendingInvitations();

    const received = await prisma.universeInvitation.findMany({
      where: { receiverId: userId },
      include: {
        sender: {
          select: {
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const sent = await prisma.universeInvitation.findMany({
      where: { senderId: userId },
      include: {
        receiver: {
          select: {
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedReceived = received.map((inv) => ({
      id: inv.id,
      status: inv.status,
      createdAt: inv.createdAt,
      expiresAt: inv.expiresAt,
      sender: {
        username: inv.sender.username,
        displayName: inv.sender.displayName || inv.sender.username,
        avatar: inv.sender.avatarUrl || null,
      },
    }));

    const formattedSent = sent.map((inv) => ({
      id: inv.id,
      status: inv.status,
      createdAt: inv.createdAt,
      expiresAt: inv.expiresAt,
      receiver: {
        username: inv.receiver.username,
        displayName: inv.receiver.displayName || inv.receiver.username,
        avatar: inv.receiver.avatarUrl || null,
      },
    }));

    return res.json({
      received: formattedReceived,
      sent: formattedSent,
    });
  } catch (error: any) {
    console.error('Get Invitations Error:', error);
    return res.status(500).json({ error: 'Failed to fetch Universe Invitations' });
  }
});

/**
 * GET /api/universe/list
 * Get all Universes of the authenticated user sorted by newest first
 */
router.get('/list', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const memberships = await prisma.universeMember.findMany({
      where: { userId },
      select: { universeId: true },
    });

    const universeIds = memberships.map((m) => m.universeId);

    const universes = await prisma.universe.findMany({
      where: { id: { in: universeIds } },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedList = universes.map((u) => {
      const peerMember = u.members.find((m) => m.user.id !== userId);
      const peerUser = peerMember
        ? {
            id: peerMember.user.id,
            username: peerMember.user.username,
            displayName: peerMember.user.displayName || peerMember.user.username,
            avatar: peerMember.user.avatarUrl || null,
          }
        : { id: undefined, username: 'Unknown', displayName: 'Unknown Explorer', avatar: null };

      return {
        universeId: u.universeId,
        createdAt: u.createdAt,
        peerUser,
      };
    });

    return res.json(formattedList);
  } catch (error: any) {
    console.error('Get Universes Error:', error);
    return res.status(500).json({ error: 'Failed to fetch Universes' });
  }
});

/**
 * GET /api/universe/:universeId
 * Get single Universe details and member list
 */
router.get('/:universeId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const customUniverseId = req.params.universeId;

    const universe = await prisma.universe.findFirst({
      where: {
        OR: [
          { universeId: customUniverseId },
          { id: customUniverseId },
        ],
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!universe) {
      return res.status(404).json({ error: 'Universe not found' });
    }

    const isMember = universe.members.some((m) => m.user.id === userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Forbidden: You are not a member of this Universe' });
    }

    const members = universe.members.map((m) => ({
      id: m.user.id,
      username: m.user.username,
      displayName: m.user.displayName || m.user.username,
      avatar: m.user.avatarUrl || null,
      joinedAt: m.joinedAt,
    }));

    return res.json({
      id: universe.id,
      universeId: universe.universeId,
      createdAt: universe.createdAt,
      members,
    });
  } catch (error: any) {
    console.error('Get Universe Details Error:', error);
    return res.status(500).json({ error: 'Failed to fetch Universe details' });
  }
});

export default router;
