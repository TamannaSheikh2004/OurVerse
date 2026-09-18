import { Socket } from 'socket.io';

interface SocketRateRecord {
  count: number;
  resetTime: number;
}

// Map of socket.id -> Map of eventName -> SocketRateRecord
const socketRateMap = new Map<string, Map<string, SocketRateRecord>>();

/**
 * Checks and updates rate limit for a specific Socket.IO event per socket session.
 * Returns true if allowed, or false if rate limit is exceeded.
 */
export function checkSocketRateLimit(
  socketId: string,
  event: string,
  maxAllowed: number = 10,
  windowMs: number = 5000
): boolean {
  const now = Date.now();
  let socketEvents = socketRateMap.get(socketId);
  if (!socketEvents) {
    socketEvents = new Map();
    socketRateMap.set(socketId, socketEvents);
  }

  let record = socketEvents.get(event);
  if (!record || now > record.resetTime) {
    socketEvents.set(event, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxAllowed) {
    return false;
  }

  record.count += 1;
  return true;
}

/**
 * Cleans up rate-limiting state when a socket disconnects.
 */
export function cleanupSocketRateLimits(socketId: string) {
  socketRateMap.delete(socketId);
}
