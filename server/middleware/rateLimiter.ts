import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware.js';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

export function resetRateLimiterMap() {
  rateLimitMap.clear();
}

/**
 * Express middleware generator for rate limiting
 * @param windowMs Time window in milliseconds
 * @param maxMax Maximum requests allowed in the time window
 * @param message Error message when limit exceeded
 * @param keyPrefix Optional key prefix to isolate limits across routes
 */
export function createRateLimiter(windowMs: number, maxMax: number, message: string, keyPrefix: string = 'general') {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Allow explicit bypass in integration tests when header is set
    if (process.env.NODE_ENV === 'test' && req.headers['x-test-bypass-rate-limit'] === 'true') {
      return next();
    }

    const ipKey = req.ip || req.socket.remoteAddress || 'anonymous';
    const key = `${keyPrefix}:${req.user?.userId || ipKey}`;
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
  'Search rate limit exceeded. Please wait a minute before searching again.',
  'search'
);

// 10 requests per hour for universe invitations
export const invitationLimiter = createRateLimiter(
  60 * 60 * 1000,
  10,
  'Universe Invitation limit exceeded (max 10/hour). Please try again later.',
  'invitation'
);

// 5 attempts per 15 minutes for authentication & password recovery
export const authLimiter = createRateLimiter(
  15 * 60 * 1000,
  5,
  'Too many authentication attempts. Please try again after 15 minutes.',
  'auth'
);

// 5 registrations per hour per IP
export const registerLimiter = createRateLimiter(
  60 * 60 * 1000,
  5,
  'Account creation limit reached for this IP. Please try again later.',
  'register'
);
