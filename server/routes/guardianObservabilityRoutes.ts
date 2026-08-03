import { Router, Request, Response } from 'express';
import guardianJobQueue from '../guardian/jobQueue.js';
import prisma from '../db/prisma.js';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware.js';

const router = Router();

// Apply authentication middleware
router.use(authenticateToken);

/**
 * GET /api/guardian/observability/status
 * Returns system-wide queue metrics, worker health, event throughput, and Guardian counts
 */
router.get('/status', async (req: AuthRequest, res: Response) => {
  try {
    const queueMetrics = await guardianJobQueue.getMetrics();

    const guardianCount = await prisma.guardian.count();
    const eventCount = await prisma.guardianEvent.count();
    const dailySummaryCount = await prisma.guardianDailySummary.count();
    const weeklySummaryCount = await prisma.guardianWeeklySummary.count();
    const monthlySummaryCount = await prisma.guardianMonthlySummary.count();
    const timelineCount = await prisma.guardianTimeline.count();

    const recentLogs = await prisma.guardianWorkerLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      status: 'online',
      system: 'OurVerse AI Guardian Infrastructure Engine',
      timestamp: new Date().toISOString(),
      queue: queueMetrics,
      counts: {
        guardians: guardianCount,
        events: eventCount,
        dailySummaries: dailySummaryCount,
        weeklySummaries: weeklySummaryCount,
        monthlySummaries: monthlySummaryCount,
        timelineEntries: timelineCount
      },
      recentWorkerLogs: recentLogs
    });
  } catch (error: any) {
    console.error('Guardian Observability Status Error:', error);
    return res.status(500).json({ error: 'Failed to fetch Guardian observability metrics' });
  }
});

/**
 * GET /api/guardian/observability/universe/:universeId
 * Returns Guardian profile, summaries, and timeline for a specific Universe
 */
router.get('/universe/:universeId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { universeId } = req.params;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Verify universe membership
    const membership = await prisma.universeMember.findFirst({
      where: {
        userId,
        OR: [
          { universeId },
          { universe: { universeId } }
        ]
      },
      include: { universe: true }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Forbidden: You are not a member of this Universe' });
    }

    const actualDbId = membership.universe.id;

    const guardian = await prisma.guardian.findUnique({
      where: { universeId: actualDbId }
    });

    const profile = await prisma.guardianRelationshipProfile.findUnique({
      where: { universeId: actualDbId }
    });

    const dailySummaries = await prisma.guardianDailySummary.findMany({
      where: { universeId: actualDbId },
      orderBy: { summaryDate: 'desc' },
      take: 10
    });

    const weeklySummaries = await prisma.guardianWeeklySummary.findMany({
      where: { universeId: actualDbId },
      orderBy: { weekStartDate: 'desc' },
      take: 5
    });

    const monthlySummaries = await prisma.guardianMonthlySummary.findMany({
      where: { universeId: actualDbId },
      orderBy: { monthStartDate: 'desc' },
      take: 5
    });

    const timeline = await prisma.guardianTimeline.findMany({
      where: { universeId: actualDbId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return res.json({
      guardian: guardian || { status: 'PROVISIONING' },
      profile: profile || { learningStage: 'BASELINE_OBSERVATION' },
      dailySummaries,
      weeklySummaries,
      monthlySummaries,
      timeline
    });
  } catch (error: any) {
    console.error('Guardian Universe Observability Error:', error);
    return res.status(500).json({ error: 'Failed to fetch Universe Guardian observability data' });
  }
});

export default router;
