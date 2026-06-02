// In-memory rate limiter — resets on cold start (serverless).
// For high-traffic production replace with Upstash Redis.

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }
  if (entry.count >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }
  entry.count++;
  return { allowed: true, remaining: maxAttempts - entry.count };
}

export function resetRateLimit(key: string) {
  store.delete(key);
}
