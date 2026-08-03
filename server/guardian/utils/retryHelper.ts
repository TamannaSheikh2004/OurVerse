/**
 * Calculates exponential backoff delay with random jitter.
 * Formula: baseDelay * 2^retryCount + jitter
 */
export function calculateExponentialBackoff(
  retryCount: number,
  baseDelayMs: number = 200,
  maxDelayMs: number = 5000
): number {
  const exp = Math.min(retryCount, 6);
  const backoff = baseDelayMs * Math.pow(2, exp);
  const jitter = Math.random() * 100;
  return Math.min(backoff + jitter, maxDelayMs);
}
