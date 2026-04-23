/**
 * =============================================================================
 * Scheduled Functions (Cron Jobs)
 * =============================================================================
 *
 * Periodic maintenance tasks for the application.
 *
 * =============================================================================
 */

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Clean up expired rate limit records
 * Runs every 15 minutes to prevent table bloat
 *
 * SECURITY: Removes expired rate limit records to maintain performance
 * and prevent the table from growing indefinitely
 */
crons.interval(
  "cleanup-expired-rate-limits",
  { minutes: 15 },
  internal.maintenance.cleanupRateLimits
);

/**
 * Clean up old security audit logs
 * Runs daily to remove logs older than 90 days
 *
 * SECURITY: Maintains reasonable audit log retention while
 * preventing indefinite storage growth
 */
crons.daily(
  "cleanup-old-audit-logs",
  { hourUTC: 3, minuteUTC: 0 }, // 3:00 AM UTC
  internal.maintenance.cleanupOldAuditLogs
);

export default crons;
