/**
 * =============================================================================
 * Maintenance Module - Internal Scheduled Functions
 * =============================================================================
 *
 * Internal functions for scheduled maintenance tasks.
 * These are called by cron jobs and should not be exposed publicly.
 *
 * =============================================================================
 */

import { internalMutation } from "./_generated/server";

/**
 * Retention period for audit logs (90 days in milliseconds)
 */
const AUDIT_LOG_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Batch size for cleanup operations to avoid timeouts
 */
const CLEANUP_BATCH_SIZE = 100;

/**
 * Clean up expired rate limit records
 * Called by the cleanup-expired-rate-limits cron job
 *
 * SECURITY: Internal function - not exposed to clients
 */
export const cleanupRateLimits = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    let totalDeleted = 0;

    // Process in batches to avoid timeouts
    let hasMore = true;
    while (hasMore) {
      const expired = await ctx.db
        .query("rateLimits")
        .withIndex("by_expires", (q) => q.lt("expiresAt", now))
        .take(CLEANUP_BATCH_SIZE);

      if (expired.length === 0) {
        hasMore = false;
        break;
      }

      for (const record of expired) {
        await ctx.db.delete(record._id);
        totalDeleted++;
      }

      // If we got a full batch, there might be more
      hasMore = expired.length === CLEANUP_BATCH_SIZE;
    }

    if (totalDeleted > 0) {
      console.log(`[maintenance] Cleaned up ${totalDeleted} expired rate limit records`);
    }

    return { deleted: totalDeleted };
  },
});

/**
 * Clean up old security audit logs (older than 90 days)
 * Called by the cleanup-old-audit-logs cron job
 *
 * SECURITY: Internal function - maintains audit log hygiene
 * while preserving recent logs for compliance
 */
export const cleanupOldAuditLogs = internalMutation({
  handler: async (ctx) => {
    const cutoffTime = Date.now() - AUDIT_LOG_RETENTION_MS;
    let totalDeleted = 0;

    // Process in batches to avoid timeouts
    let hasMore = true;
    while (hasMore) {
      const oldLogs = await ctx.db
        .query("securityAuditLog")
        .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoffTime))
        .take(CLEANUP_BATCH_SIZE);

      if (oldLogs.length === 0) {
        hasMore = false;
        break;
      }

      for (const log of oldLogs) {
        await ctx.db.delete(log._id);
        totalDeleted++;
      }

      // If we got a full batch, there might be more
      hasMore = oldLogs.length === CLEANUP_BATCH_SIZE;
    }

    if (totalDeleted > 0) {
      console.log(`[maintenance] Cleaned up ${totalDeleted} old audit log records (>90 days)`);
    }

    return { deleted: totalDeleted };
  },
});
