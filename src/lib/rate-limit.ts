import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory fallback for local dev when Upstash keys are not configured
const memoryStore = new Map<string, { count: number; reset: number }>();

function createMemoryLimiter(windowSize: number, maxRequests: number) {
  return {
    async limit(key: string) {
      const now = Date.now();
      const entry = memoryStore.get(key);

      if (!entry || now > entry.reset) {
        memoryStore.set(key, { count: 1, reset: now + windowSize * 1000 });
        return { success: true, limit: maxRequests, remaining: maxRequests - 1, reset: now + windowSize * 1000 };
      }

      entry.count++;
      if (entry.count > maxRequests) {
        return { success: false, limit: maxRequests, remaining: 0, reset: entry.reset };
      }

      return { success: true, limit: maxRequests, remaining: maxRequests - entry.count, reset: entry.reset };
    },
  };
}

// Create a rate limiter — uses Upstash if configured, otherwise in-memory
function createLimiter(windowSize: number, maxRequests: number) {
  const upstashUrl = process.env.UPSTASH_REDIS_URL;
  const upstashToken = process.env.UPSTASH_REDIS_TOKEN;

  if (upstashUrl && upstashToken) {
    const redis = new Redis({ url: upstashUrl, token: upstashToken });
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowSize} s`),
      analytics: true,
    });
  }

  // Fallback to in-memory limiter
  console.warn("⚠ UPSTASH_REDIS_URL not set — using in-memory rate limiter (not suitable for production)");
  return createMemoryLimiter(windowSize, maxRequests);
}

// Auth rate limiter: 10 requests per minute per IP
export const authLimiter = createLimiter(60, 10);

// Humanize rate limiter: 5 requests per 10 seconds per user
export const humanizeLimiter = createLimiter(10, 5);

// General API rate limiter: 100 requests per minute per IP
export const generalLimiter = createLimiter(60, 100);

/**
 * Extract client IP from request headers.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "127.0.0.1";
}
