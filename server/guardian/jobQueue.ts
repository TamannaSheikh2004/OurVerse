import prisma from '../db/prisma.js';
import { generateJobId } from './utils/guardianIdGen.js';
import { calculateExponentialBackoff } from './utils/retryHelper.js';
import { GuardianJobType, JobPayload } from './types.js';

export type JobHandler = (payload: JobPayload) => Promise<void>;

export class GuardianJobQueue {
  private handlers: Map<GuardianJobType, JobHandler> = new Map();
  private isProcessing: boolean = false;
  private timer: NodeJS.Timeout | null = null;
  private activeJobsCount: number = 0;

  // In-memory metrics counters
  private metrics = {
    totalEnqueued: 0,
    totalCompleted: 0,
    totalFailed: 0,
    totalRetries: 0,
  };

  /**
   * Registers a worker handler function for a specific job type.
   */
  public registerHandler(jobType: GuardianJobType, handler: JobHandler) {
    this.handlers.set(jobType, handler);
  }

  /**
   * Enqueues a job into the queue database.
   */
  public async enqueueJob(
    jobType: GuardianJobType,
    universeId: string,
    data: Record<string, any> = {},
    priority: number = 0,
    maxRetries: number = 3
  ): Promise<string> {
    const jobId = generateJobId();
    const payloadStr = JSON.stringify(data);

    await prisma.guardianProcessingQueue.create({
      data: {
        jobId,
        jobType,
        universeId,
        payload: payloadStr,
        status: 'PENDING',
        priority,
        maxRetries
      }
    });

    this.metrics.totalEnqueued++;

    // Trigger processing if queue loop is idle
    this.triggerProcessing();

    return jobId;
  }

  /**
   * Starts the polling loop for processing jobs.
   */
  public start(pollIntervalMs: number = 200) {
    if (this.timer) return;
    this.isProcessing = true;
    this.timer = setInterval(() => {
      this.processNextBatch().catch((err) => {
        console.error('[JobQueue] Error in batch processor loop:', err);
      });
    }, pollIntervalMs);
  }

  /**
   * Stops the polling loop for graceful shutdown.
   */
  public shutdown() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isProcessing = false;
  }

  /**
   * Triggers single batch processing loop asynchronously.
   */
  private triggerProcessing() {
    setImmediate(() => {
      this.processNextBatch().catch(() => {});
    });
  }

  /**
   * Fetches and processes the next highest-priority pending or retrying job.
   */
  public async processNextBatch(batchSize: number = 5) {
    const nowMargin = new Date(Date.now() + 1000);

    // Fetch pending or retrying jobs scheduled for now or earlier
    const jobs = await prisma.guardianProcessingQueue.findMany({
      where: {
        status: { in: ['PENDING', 'RETRYING'] },
        scheduledAt: { lte: nowMargin }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ],
      take: batchSize
    });

    for (const job of jobs) {
      await this.executeJob(job);
    }
  }

  /**
   * Executes a single job idempotently with retries and failure logging.
   */
  private async executeJob(job: any) {
    const handler = this.handlers.get(job.jobType as GuardianJobType);
    if (!handler) {
      // No handler registered: mark as completed or log
      await prisma.guardianProcessingQueue.update({
        where: { id: job.id },
        data: { status: 'COMPLETED', processedAt: new Date() }
      });
      return;
    }

    // Atomic status update to PROCESSING to prevent concurrent execution
    const updated = await prisma.guardianProcessingQueue.updateMany({
      where: { id: job.id, status: { in: ['PENDING', 'RETRYING'] } },
      data: { status: 'PROCESSING' }
    });

    if (updated.count === 0) return; // Job already claimed by another worker

    this.activeJobsCount++;
    const startTime = Date.now();

    try {
      const payloadData = job.payload ? JSON.parse(job.payload) : {};
      
      // Execute background worker handler
      await handler({
        jobId: job.jobId,
        jobType: job.jobType as GuardianJobType,
        universeId: job.universeId,
        messageId: payloadData.messageId || undefined,
        data: payloadData
      });

      const durationMs = Date.now() - startTime;

      // Mark job COMPLETED
      await prisma.guardianProcessingQueue.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          processedAt: new Date()
        }
      });

      // Log successful worker execution
      await prisma.guardianWorkerLog.create({
        data: {
          workerName: job.jobType,
          universeId: job.universeId,
          status: 'COMPLETED',
          durationMs
        }
      });

      this.metrics.totalCompleted++;
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const newRetryCount = job.retryCount + 1;

      // Log worker error
      await prisma.guardianWorkerLog.create({
        data: {
          workerName: job.jobType,
          universeId: job.universeId,
          status: 'FAILED',
          durationMs,
          errorMessage: err.message || 'Worker execution failed'
        }
      });

      if (newRetryCount < job.maxRetries) {
        // Schedule retry with exponential backoff
        const delayMs = calculateExponentialBackoff(newRetryCount);
        const scheduledAt = new Date(Date.now() + delayMs);

        await prisma.guardianProcessingQueue.update({
          where: { id: job.id },
          data: {
            status: 'RETRYING',
            retryCount: newRetryCount,
            scheduledAt
          }
        });

        this.metrics.totalRetries++;
      } else {
        // Dead-Letter Handling: Max retries exceeded, mark job FAILED
        await prisma.guardianProcessingQueue.update({
          where: { id: job.id },
          data: {
            status: 'FAILED',
            processedAt: new Date()
          }
        });

        this.metrics.totalFailed++;
      }
    } finally {
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
    }
  }

  /**
   * Recovers pending/retrying jobs from DB on server startup.
   */
  public async recoverPendingJobs() {
    const stuckProcessing = await prisma.guardianProcessingQueue.updateMany({
      where: { status: 'PROCESSING' },
      data: { status: 'RETRYING', scheduledAt: new Date() }
    });

    if (stuckProcessing.count > 0) {
      console.log(`[JobQueue] Recovered ${stuckProcessing.count} interrupted processing jobs.`);
    }
  }

  /**
   * Returns current operational queue metrics.
   */
  public async getMetrics() {
    const counts = await prisma.guardianProcessingQueue.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    const statusMap: Record<string, number> = {
      PENDING: 0,
      PROCESSING: 0,
      COMPLETED: 0,
      FAILED: 0,
      RETRYING: 0,
    };

    for (const c of counts) {
      statusMap[c.status] = c._count.status;
    }

    return {
      activeJobsCount: this.activeJobsCount,
      pendingCount: statusMap.PENDING + statusMap.RETRYING,
      processingCount: statusMap.PROCESSING,
      completedCount: statusMap.COMPLETED,
      failedCount: statusMap.FAILED,
      totalEnqueued: this.metrics.totalEnqueued,
      totalCompleted: this.metrics.totalCompleted,
      totalFailed: this.metrics.totalFailed,
      totalRetries: this.metrics.totalRetries,
      workerCount: this.handlers.size,
    };
  }
}

export const guardianJobQueue = new GuardianJobQueue();
export default guardianJobQueue;
