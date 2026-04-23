/**
 * =============================================================================
 * Time Entries Module - Clock In/Out with GPS Verification
 * =============================================================================
 *
 * Handles employee time tracking with geofence verification.
 *
 * SECURITY MEASURES:
 * - Rate limiting prevents rapid clock in/out abuse
 * - GPS coordinate validation
 * - Employee ownership verification
 * - Admin-only access for management operations
 *
 * =============================================================================
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, getCurrentEmployee, getCurrentEmployeeSafe } from "./lib/auth";
import {
  calculateDistance,
  isWithinGeofence,
  findNearestGeofence,
  type Coordinates,
  type GeofenceLocation,
} from "./lib/geofence";
import {
  checkRateLimit,
  RATE_LIMIT_PRESETS,
  RateLimitError,
} from "./lib/rateLimit";
import {
  validateCoordinates,
  validateLength,
  validatePositiveNumber,
  validateTimestamp,
  sanitizeString,
  LENGTH_LIMITS,
} from "./lib/validation";

// =============================================================================
// ALLOWED FIELDS - Prevents mass assignment attacks
// =============================================================================

const CLOCK_IN_OUT_FIELDS = ["latitude", "longitude"];
const UPDATE_STATUS_FIELDS = ["id", "status", "notes"];
const GET_ALL_FILTER_FIELDS = ["employeeId", "status", "startDate", "endDate"];

// =============================================================================
// EMPLOYEE MUTATIONS - Clock In/Out
// =============================================================================

/**
 * Clock in with GPS verification
 *
 * SECURITY:
 * - Requires authenticated employee
 * - Rate limited: 10 requests per 5 minutes (prevents clock-in spam)
 * - GPS coordinates validated
 * - Entries flagged if outside geofence
 */
export const clockIn = mutation({
  args: {
    latitude: v.number(),
    longitude: v.number(),
  },
  handler: async (ctx, args) => {
    const employee = await getCurrentEmployee(ctx);

    // SECURITY: Rate limiting - prevent rapid clock in attempts
    try {
      await checkRateLimit(ctx, "timeEntries:clockIn", RATE_LIMIT_PRESETS.TIME_CLOCK);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw new Error(error.message);
      }
      throw error;
    }

    // SECURITY: Validate GPS coordinates
    validateCoordinates(args.latitude, args.longitude);

    // Check if employee is already clocked in
    const existingEntry = await ctx.db
      .query("timeEntries")
      .withIndex("by_employee", (q) => q.eq("employeeId", employee.employee._id))
      .filter((q) => q.eq(q.field("clockOutTime"), undefined))
      .first();

    if (existingEntry) {
      throw new Error("You are already clocked in");
    }

    // Get active locations for geofence checking
    const locations = await ctx.db
      .query("locations")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    if (locations.length === 0) {
      throw new Error(
        "No active locations configured. Please contact your administrator."
      );
    }

    const clockInPoint: Coordinates = {
      latitude: args.latitude,
      longitude: args.longitude,
    };

    const geofences: GeofenceLocation[] = locations.map((loc) => ({
      latitude: loc.latitude,
      longitude: loc.longitude,
      radiusMeters: loc.radiusMeters,
    }));

    // Find nearest location
    const nearest = findNearestGeofence(clockInPoint, geofences);
    const isVerified = nearest ? nearest.distance <= nearest.geofence.radiusMeters : false;

    const now = Date.now();

    // Create time entry
    const entryId = await ctx.db.insert("timeEntries", {
      employeeId: employee.employee._id,
      clockInTime: now,
      clockInLocation: {
        lat: args.latitude,
        lng: args.longitude,
        verified: isVerified,
      },
      status: isVerified ? "pending" : "flagged",
      createdAt: now,
      updatedAt: now,
    });

    return {
      entryId,
      verified: isVerified,
      message: isVerified
        ? "Clocked in successfully"
        : "Clocked in, but location is outside geofence. Entry flagged for review.",
    };
  },
});

/**
 * Clock out with GPS verification
 *
 * SECURITY:
 * - Requires authenticated employee
 * - Rate limited: 10 requests per 5 minutes
 * - GPS coordinates validated
 * - Verifies employee owns the active entry
 */
export const clockOut = mutation({
  args: {
    latitude: v.number(),
    longitude: v.number(),
  },
  handler: async (ctx, args) => {
    const employee = await getCurrentEmployee(ctx);

    // SECURITY: Rate limiting
    try {
      await checkRateLimit(ctx, "timeEntries:clockOut", RATE_LIMIT_PRESETS.TIME_CLOCK);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw new Error(error.message);
      }
      throw error;
    }

    // SECURITY: Validate GPS coordinates
    validateCoordinates(args.latitude, args.longitude);

    // Find active clock-in entry for THIS employee only
    const activeEntry = await ctx.db
      .query("timeEntries")
      .withIndex("by_employee", (q) => q.eq("employeeId", employee.employee._id))
      .filter((q) => q.eq(q.field("clockOutTime"), undefined))
      .first();

    if (!activeEntry) {
      throw new Error("You are not currently clocked in");
    }

    // SECURITY: Verify this entry belongs to the current employee
    if (activeEntry.employeeId !== employee.employee._id) {
      throw new Error("You can only clock out of your own entries");
    }

    // Get active locations for geofence checking
    const locations = await ctx.db
      .query("locations")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const clockOutPoint: Coordinates = {
      latitude: args.latitude,
      longitude: args.longitude,
    };

    const geofences: GeofenceLocation[] = locations.map((loc) => ({
      latitude: loc.latitude,
      longitude: loc.longitude,
      radiusMeters: loc.radiusMeters,
    }));

    // Find nearest location and verify
    const nearest = findNearestGeofence(clockOutPoint, geofences);
    const isVerified = nearest ? nearest.distance <= nearest.geofence.radiusMeters : false;

    const now = Date.now();
    const hoursWorked = (now - activeEntry.clockInTime) / (1000 * 60 * 60);

    // SECURITY: Validate hours worked is reasonable (max 24 hours)
    if (hoursWorked > 24) {
      // Log suspicious activity but allow the clock out
      await ctx.db.insert("securityAuditLog", {
        eventType: "suspicious_activity",
        identifier: employee.user.clerkId,
        action: "timeEntries:clockOut:long_shift",
        metadata: JSON.stringify({
          hoursWorked,
          employeeId: employee.employee._id,
          entryId: activeEntry._id,
        }),
        severity: "medium",
        timestamp: now,
      });
    }

    // Determine final status
    let finalStatus: "pending" | "flagged" = "pending";
    if (!activeEntry.clockInLocation.verified || !isVerified) {
      finalStatus = "flagged";
    }

    // Update time entry
    await ctx.db.patch(activeEntry._id, {
      clockOutTime: now,
      clockOutLocation: {
        lat: args.latitude,
        lng: args.longitude,
        verified: isVerified,
      },
      hoursWorked,
      status: finalStatus,
      updatedAt: now,
    });

    return {
      entryId: activeEntry._id,
      verified: isVerified,
      hoursWorked,
      message: isVerified
        ? "Clocked out successfully"
        : "Clocked out, but location is outside geofence. Entry flagged for review.",
    };
  },
});

// =============================================================================
// EMPLOYEE QUERIES
// =============================================================================

/**
 * Get current clock status for employee
 *
 * SECURITY:
 * - Returns only data for the authenticated user
 * - Graceful handling if no employee profile
 */
export const getCurrentStatus = query({
  handler: async (ctx) => {
    const employee = await getCurrentEmployeeSafe(ctx);

    // If no employee profile, return not clocked in
    if (!employee) {
      return {
        isClockedIn: false,
        activeEntry: null,
        hasEmployeeProfile: false,
      };
    }

    const activeEntry = await ctx.db
      .query("timeEntries")
      .withIndex("by_employee", (q) => q.eq("employeeId", employee.employee._id))
      .filter((q) => q.eq(q.field("clockOutTime"), undefined))
      .first();

    if (!activeEntry) {
      return {
        isClockedIn: false,
        activeEntry: null,
        hasEmployeeProfile: true,
      };
    }

    return {
      isClockedIn: true,
      hasEmployeeProfile: true,
      activeEntry: {
        _id: activeEntry._id,
        clockInTime: activeEntry.clockInTime,
        clockInVerified: activeEntry.clockInLocation.verified,
        elapsedHours: (Date.now() - activeEntry.clockInTime) / (1000 * 60 * 60),
      },
    };
  },
});

/**
 * Get employee's own time entries
 *
 * SECURITY:
 * - Returns only entries for the authenticated user
 * - Limit parameter validated
 */
export const getMyEntries = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const employee = await getCurrentEmployeeSafe(ctx);

    // If no employee profile, return empty array
    if (!employee) {
      return [];
    }

    // SECURITY: Validate limit if provided (max 1000 entries)
    if (args.limit !== undefined) {
      validatePositiveNumber(args.limit, "Limit", 1, 1000);
    }

    let entries = await ctx.db
      .query("timeEntries")
      .withIndex("by_employee", (q) => q.eq("employeeId", employee.employee._id))
      .order("desc")
      .collect();

    if (args.limit) {
      entries = entries.slice(0, args.limit);
    }

    return entries;
  },
});

// =============================================================================
// ADMIN QUERIES
// =============================================================================

/**
 * Get all time entries (admin only)
 *
 * SECURITY:
 * - Requires admin role
 * - Filter parameters validated
 */
export const getAll = query({
  args: {
    employeeId: v.optional(v.id("employees")),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("flagged")
      )
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // SECURITY: Validate date filters if provided
    if (args.startDate !== undefined) {
      validateTimestamp(args.startDate, "Start date", true);
    }
    if (args.endDate !== undefined) {
      validateTimestamp(args.endDate, "End date", true);
    }

    // Validate date range logic
    if (args.startDate && args.endDate && args.startDate > args.endDate) {
      throw new Error("Start date must be before end date");
    }

    let entries;

    if (args.employeeId) {
      entries = await ctx.db
        .query("timeEntries")
        .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId!))
        .collect();
    } else if (args.status) {
      entries = await ctx.db
        .query("timeEntries")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      entries = await ctx.db.query("timeEntries").collect();
    }

    // Filter by date range if provided
    if (args.startDate || args.endDate) {
      entries = entries.filter((entry) => {
        if (args.startDate && entry.clockInTime < args.startDate) {
          return false;
        }
        if (args.endDate && entry.clockInTime > args.endDate) {
          return false;
        }
        return true;
      });
    }

    // Get employee details for each entry
    const entriesWithEmployees = await Promise.all(
      entries.map(async (entry) => {
        const employee = await ctx.db.get(entry.employeeId);
        return {
          ...entry,
          employee: employee
            ? {
                firstName: employee.firstName,
                lastName: employee.lastName,
                employeeNumber: employee.employeeNumber,
              }
            : null,
        };
      })
    );

    return entriesWithEmployees.sort((a, b) => b.clockInTime - a.clockInTime);
  },
});

/**
 * Get today's activity stats (for dashboard)
 *
 * SECURITY:
 * - Requires admin role
 */
export const getTodayActivity = query({
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartTime = todayStart.getTime();

    const allEntries = await ctx.db.query("timeEntries").collect();

    const todayEntries = allEntries.filter(
      (entry) => entry.clockInTime >= todayStartTime
    );

    const clockedIn = todayEntries.filter(
      (entry) => entry.clockOutTime === undefined
    ).length;

    const flagged = todayEntries.filter((entry) => entry.status === "flagged")
      .length;

    return {
      totalToday: todayEntries.length,
      currentlyClockedIn: clockedIn,
      flaggedToday: flagged,
    };
  },
});

// =============================================================================
// ADMIN MUTATIONS
// =============================================================================

/**
 * Update time entry status (admin only)
 *
 * SECURITY:
 * - Requires admin role
 * - Rate limited: 100 requests per minute
 * - Notes sanitized
 */
export const updateStatus = mutation({
  args: {
    id: v.id("timeEntries"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("flagged")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    // SECURITY: Rate limiting
    try {
      await checkRateLimit(ctx, "timeEntries:updateStatus", RATE_LIMIT_PRESETS.ADMIN);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw new Error(error.message);
      }
      throw error;
    }

    // SECURITY: Validate notes length if provided
    if (args.notes !== undefined) {
      validateLength(args.notes, "Notes", LENGTH_LIMITS.NOTES, false);
    }

    // Verify entry exists
    const entry = await ctx.db.get(args.id);
    if (!entry) {
      throw new Error("Time entry not found");
    }

    const adminUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", admin.subject))
      .unique();

    if (!adminUser) {
      throw new Error("Admin user not found");
    }

    const now = Date.now();

    // Sanitize notes if provided
    const sanitizedNotes = args.notes ? sanitizeString(args.notes) : undefined;

    await ctx.db.patch(args.id, {
      status: args.status,
      approvedBy: adminUser._id,
      approvedAt: now,
      notes: sanitizedNotes,
      updatedAt: now,
    });

    return args.id;
  },
});

/**
 * Delete a time entry (admin only)
 *
 * SECURITY:
 * - Requires admin role
 * - Rate limited: 10 requests per minute (sensitive operation)
 * - Audit logged
 */
export const remove = mutation({
  args: { id: v.id("timeEntries") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    // SECURITY: Rate limiting - more restrictive for deletions
    try {
      await checkRateLimit(ctx, "timeEntries:remove", RATE_LIMIT_PRESETS.SENSITIVE);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw new Error(error.message);
      }
      throw error;
    }

    // Verify entry exists and get details for audit log
    const entry = await ctx.db.get(args.id);
    if (!entry) {
      throw new Error("Time entry not found");
    }

    // SECURITY: Audit log before deletion
    await ctx.db.insert("securityAuditLog", {
      eventType: "admin_action",
      identifier: admin.subject,
      action: "timeEntries:remove",
      metadata: JSON.stringify({
        entryId: args.id,
        employeeId: entry.employeeId,
        clockInTime: entry.clockInTime,
        clockOutTime: entry.clockOutTime,
      }),
      severity: "medium",
      timestamp: Date.now(),
    });

    await ctx.db.delete(args.id);

    return args.id;
  },
});
