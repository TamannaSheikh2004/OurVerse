import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware.js';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * Express middleware generator for rate limiting
 * @param windowMs Time window in milliseconds
 * @param maxMax Maximum requests allowed in the time window
 * @param message Error message when limit exceeded
 */
export function createRateLimiter(windowMs: number, maxMax: number, message: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const key = req.user?.userId || req.ip || 'anonymous';
    const now = Date.now();

    const record = rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
      rateLimitMap.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (record.count >= maxMax) {
      return res.status(429).json({
        error: message,
        retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000),
      });
    }

    record.count += 1;
    next();
  };
}

// 30 requests per minute for search
export const searchLimiter = createRateLimiter(
  60 * 1000,
  30,
  'Search rate limit exceeded. Please wait a minute before searching again.'
);

// 10 requests per hour for universe invitations
export const invitationLimiter = createRateLimiter(
  60 * 60 * 1000,
  10,
  'Universe Invitation limit exceeded (max 10/hour). Please try again later.'
);
