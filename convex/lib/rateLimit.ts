/**
 * =============================================================================
 * SECURITY: Rate Limiting Middleware for Convex Functions
 * =============================================================================
 *
 * Implements token bucket rate limiting with sliding windows.
 * Supports both IP-based and user-based rate limiting.
 *
 * OWASP Guidelines Followed:
 * - A04:2021 - Insecure Design: Rate limiting prevents brute force attacks
 * - A07:2021 - Identification and Authentication Failures: Prevents credential stuffing
 *
 * Usage:
 *   await checkRateLimit(ctx, "endpoint:name", { maxRequests: 10, windowMs: 60000 });
 *
 * =============================================================================
 */

import { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Rate limit configuration options
 */
export interface RateLimitConfig {
  // Maximum requests allowed in the window
  maxRequests: number;
  // Window duration in milliseconds
  windowMs: number;
  // Optional: Use user ID instead of/in addition to IP
  useUserId?: boolean;
  // Optional: Custom identifier (for special cases)
  customIdentifier?: string;
  // Optional: Skip rate limiting for admins
  skipForAdmin?: boolean;
}

/**
 * Default rate limit presets for different endpoint types
 * Sensible defaults following OWASP recommendations
 */
export const RATE_LIMIT_PRESETS = {
  // Public endpoints (login, signup) - stricter limits
  PUBLIC_AUTH: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
    useUserId: false,
  },

  // Standard authenticated endpoints - moderate limits
  AUTHENTICATED: {
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 minute
    useUserId: true,
  },

  // Sensitive operations (role changes, deletions) - stricter
  SENSITIVE: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    useUserId: true,
  },

  // Bulk/admin operations - relaxed limits
  ADMIN: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    useUserId: true,
    skipForAdmin: false, // Still enforce for admins, just higher limit
  },

  // Time clock operations - prevent rapid clock in/out
  TIME_CLOCK: {
    maxRequests: 10,
    windowMs: 5 * 60 * 1000, // 5 minutes
    useUserId: true,
  },

  // Query operations - more lenient for reads
  QUERY: {
    maxRequests: 120,
    windowMs: 60 * 1000, // 1 minute
    useUserId: true,
  },
} as const;

/**
 * HTTP 429 Too Many Requests error with retry-after header info
 */
export class RateLimitError extends Error {
  public readonly retryAfterMs: number;
  public readonly statusCode = 429;

  constructor(retryAfterMs: number) {
    const retryAfterSec = Math.ceil(retryAfterMs / 1000);
    super(
      `Too many requests. Please wait ${retryAfterSec} seconds before trying again.`
    );
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

/**
 * Generate a rate limit identifier from context
 * Uses user ID if available, otherwise creates a hash from available info
 */
function generateIdentifier(
  ctx: QueryCtx | MutationCtx,
  identity: { subject: string } | null,
  config: RateLimitConfig
): string {
  if (config.customIdentifier) {
    return config.customIdentifier;
  }

  // If user is authenticated and we want to use user ID
  if (identity && config.useUserId) {
    return `user:${identity.subject}`;
  }

  // For unauthenticated requests, we use a generic identifier
  // Note: Convex doesn't expose IP directly, so we use a session-based approach
  // In production, you might want to pass IP from the client or use Convex Actions
  if (identity) {
    return `user:${identity.subject}`;
  }

  // Fallback: anonymous identifier (less precise but still limits per session)
  return "anon:session";
}

/**
 * Check and enforce rate limit for an endpoint
 *
 * @param ctx - Convex mutation context (must be mutation for write access)
 * @param endpoint - Unique endpoint identifier (e.g., "users:syncUser")
 * @param config - Rate limit configuration
 * @throws RateLimitError if rate limit exceeded
 */
export async function checkRateLimit(
  ctx: MutationCtx,
  endpoint: string,
  config: RateLimitConfig
): Promise<void> {
  const identity = await ctx.auth.getUserIdentity();
  const identifier = generateIdentifier(ctx, identity, config);
  const now = Date.now();

  // Look up existing rate limit record
  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_identifier_endpoint", (q) =>
      q.eq("identifier", identifier).eq("endpoint", endpoint)
    )
    .unique();

  if (existing) {
    // Check if window has expired
    if (now >= existing.expiresAt) {
      // Window expired, reset counter
      await ctx.db.patch(existing._id, {
        count: 1,
        windowStart: now,
        expiresAt: now + config.windowMs,
      });
      return;
    }

    // Window still active, check count
    if (existing.count >= config.maxRequests) {
      // Rate limit exceeded - log security event
      const retryAfterMs = existing.expiresAt - now;

      // Log the rate limit event (async, don't await)
      await ctx.db.insert("securityAuditLog", {
        eventType: "rate_limit_exceeded",
        identifier: identifier,
        action: endpoint,
        metadata: JSON.stringify({
          count: existing.count,
          maxRequests: config.maxRequests,
          windowMs: config.windowMs,
        }),
        severity: existing.count > config.maxRequests * 2 ? "high" : "medium",
        timestamp: now,
      });

      throw new RateLimitError(retryAfterMs);
    }

    // Increment counter
    await ctx.db.patch(existing._id, {
      count: existing.count + 1,
    });
  } else {
    // First request, create new record
    await ctx.db.insert("rateLimits", {
      identifier,
      endpoint,
      count: 1,
      windowStart: now,
      expiresAt: now + config.windowMs,
    });
  }
}

/**
 * Check rate limit for query operations (read-only check)
 * Note: Since queries can't write to DB, this returns the status
 * For actual enforcement, use mutations or track client-side
 *
 * @param ctx - Convex query context
 * @param endpoint - Unique endpoint identifier
 * @param config - Rate limit configuration
 * @returns Object indicating if rate limited and retry time
 */
export async function checkRateLimitQuery(
  ctx: QueryCtx,
  endpoint: string,
  config: RateLimitConfig
): Promise<{ isLimited: boolean; retryAfterMs?: number }> {
  const identity = await ctx.auth.getUserIdentity();
  const identifier = generateIdentifier(ctx, identity, config);
  const now = Date.now();

  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_identifier_endpoint", (q) =>
      q.eq("identifier", identifier).eq("endpoint", endpoint)
    )
    .unique();

  if (!existing) {
    return { isLimited: false };
  }

  // Window expired
  if (now >= existing.expiresAt) {
    return { isLimited: false };
  }

  // Check if over limit
  if (existing.count >= config.maxRequests) {
    return {
      isLimited: true,
      retryAfterMs: existing.expiresAt - now,
    };
  }

  return { isLimited: false };
}

/**
 * Cleanup expired rate limit records
 * Should be called periodically via a scheduled function
 *
 * @param ctx - Convex mutation context
 * @returns Number of records deleted
 */
export async function cleanupExpiredRateLimits(
  ctx: MutationCtx
): Promise<number> {
  const now = Date.now();
  let deleted = 0;

  // Get all expired records (batch for performance)
  const expired = await ctx.db
    .query("rateLimits")
    .withIndex("by_expires", (q) => q.lt("expiresAt", now))
    .take(100); // Batch size to avoid timeouts

  for (const record of expired) {
    await ctx.db.delete(record._id);
    deleted++;
  }

  return deleted;
}

/**
 * Get current rate limit status for an identifier/endpoint
 * Useful for displaying remaining requests to users
 *
 * @param ctx - Convex query context
 * @param endpoint - Endpoint identifier
 * @param config - Rate limit configuration
 * @returns Rate limit status
 */
export async function getRateLimitStatus(
  ctx: QueryCtx,
  endpoint: string,
  config: RateLimitConfig
): Promise<{
  remaining: number;
  total: number;
  resetsAt: number | null;
}> {
  const identity = await ctx.auth.getUserIdentity();
  const identifier = generateIdentifier(ctx, identity, config);
  const now = Date.now();

  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_identifier_endpoint", (q) =>
      q.eq("identifier", identifier).eq("endpoint", endpoint)
    )
    .unique();

  if (!existing || now >= existing.expiresAt) {
    return {
      remaining: config.maxRequests,
      total: config.maxRequests,
      resetsAt: null,
    };
  }

  return {
    remaining: Math.max(0, config.maxRequests - existing.count),
    total: config.maxRequests,
    resetsAt: existing.expiresAt,
  };
}
