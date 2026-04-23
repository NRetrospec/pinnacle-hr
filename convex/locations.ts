/**
 * =============================================================================
 * Locations Module - Geofence Location Management
 * =============================================================================
 *
 * Handles company locations for geofence-based time tracking verification.
 *
 * SECURITY MEASURES:
 * - Admin-only access for management operations
 * - Rate limiting on all mutations
 * - GPS coordinate validation
 * - Radius validation (positive, reasonable limits)
 * - String sanitization
 *
 * =============================================================================
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";
import {
  checkRateLimit,
  RATE_LIMIT_PRESETS,
  RateLimitError,
} from "./lib/rateLimit";
import {
  validateCoordinates,
  validateLength,
  validatePositiveNumber,
  validateNoUnexpectedFields,
  sanitizeString,
  LENGTH_LIMITS,
} from "./lib/validation";

// =============================================================================
// CONSTANTS
// =============================================================================

// Maximum geofence radius: 50km (reasonable for any workplace)
const MAX_RADIUS_METERS = 50000;

// Minimum geofence radius: 10 meters (practical minimum)
const MIN_RADIUS_METERS = 10;

// =============================================================================
// ALLOWED FIELDS - Prevents mass assignment attacks
// =============================================================================

const CREATE_LOCATION_FIELDS = [
  "name",
  "address",
  "latitude",
  "longitude",
  "radiusMeters",
  "allowRemote",
];

const UPDATE_LOCATION_FIELDS = [
  "id",
  "name",
  "address",
  "latitude",
  "longitude",
  "radiusMeters",
  "isActive",
  "allowRemote",
];

// =============================================================================
// QUERIES
// =============================================================================

/**
 * List all locations
 * Admin only
 *
 * SECURITY:
 * - Requires admin role
 */
export const list = query({
  args: {
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let locations = await ctx.db.query("locations").collect();

    if (args.activeOnly) {
      locations = locations.filter((loc) => loc.isActive);
    }

    return locations.sort((a, b) => a.name.localeCompare(b.name));
  },
});

/**
 * Get a single location by ID
 * Admin only
 *
 * SECURITY:
 * - Requires admin role
 */
export const get = query({
  args: { id: v.id("locations") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.get(args.id);
  },
});

/**
 * Get all active locations (for geofence checking)
 * Can be called by any authenticated user
 *
 * SECURITY:
 * - Requires authentication
 * - Returns only active locations
 * - No sensitive admin data exposed
 */
export const getActiveLocations = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("locations")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Create a new location
 * Admin only
 *
 * SECURITY:
 * - Requires admin role
 * - Rate limited: 100 requests per minute
 * - GPS coordinates validated
 * - Radius validated (10m - 50km)
 * - String fields sanitized
 */
export const create = mutation({
  args: {
    name: v.string(),
    address: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    radiusMeters: v.number(),
    allowRemote: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // SECURITY: Rate limiting
    try {
      await checkRateLimit(ctx, "locations:create", RATE_LIMIT_PRESETS.ADMIN);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw new Error(error.message);
      }
      throw error;
    }

    // SECURITY: Validate no unexpected fields
    validateNoUnexpectedFields(
      args as Record<string, unknown>,
      CREATE_LOCATION_FIELDS,
      "Location"
    );

    // SECURITY: Validate name
    validateLength(args.name, "Name", LENGTH_LIMITS.SHORT_STRING);

    // SECURITY: Validate address
    validateLength(args.address, "Address", LENGTH_LIMITS.ADDRESS);

    // SECURITY: Validate GPS coordinates
    validateCoordinates(args.latitude, args.longitude);

    // SECURITY: Validate radius (reasonable bounds)
    validatePositiveNumber(
      args.radiusMeters,
      "Radius",
      MIN_RADIUS_METERS,
      MAX_RADIUS_METERS
    );

    const now = Date.now();

    // Sanitize string inputs
    const sanitizedName = sanitizeString(args.name);
    const sanitizedAddress = sanitizeString(args.address);

    const locationId = await ctx.db.insert("locations", {
      name: sanitizedName,
      address: sanitizedAddress,
      latitude: args.latitude,
      longitude: args.longitude,
      radiusMeters: args.radiusMeters,
      isActive: true,
      allowRemote: args.allowRemote || false,
      createdAt: now,
      updatedAt: now,
    });

    return locationId;
  },
});

/**
 * Update an existing location
 * Admin only
 *
 * SECURITY:
 * - Requires admin role
 * - Rate limited: 100 requests per minute
 * - GPS coordinates validated if provided
 * - Radius validated if provided
 * - String fields sanitized
 */
export const update = mutation({
  args: {
    id: v.id("locations"),
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    radiusMeters: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    allowRemote: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // SECURITY: Rate limiting
    try {
      await checkRateLimit(ctx, "locations:update", RATE_LIMIT_PRESETS.ADMIN);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw new Error(error.message);
      }
      throw error;
    }

    // SECURITY: Validate no unexpected fields
    validateNoUnexpectedFields(
      args as Record<string, unknown>,
      UPDATE_LOCATION_FIELDS,
      "Location update"
    );

    const { id, ...updates } = args;

    // Verify location exists
    const location = await ctx.db.get(id);
    if (!location) {
      throw new Error("Location not found");
    }

    // Build sanitized updates
    const sanitizedUpdates: Record<string, unknown> = {};

    // SECURITY: Validate name if provided
    if (updates.name !== undefined) {
      validateLength(updates.name, "Name", LENGTH_LIMITS.SHORT_STRING);
      sanitizedUpdates.name = sanitizeString(updates.name);
    }

    // SECURITY: Validate address if provided
    if (updates.address !== undefined) {
      validateLength(updates.address, "Address", LENGTH_LIMITS.ADDRESS);
      sanitizedUpdates.address = sanitizeString(updates.address);
    }

    // SECURITY: Validate coordinates if provided
    if (updates.latitude !== undefined || updates.longitude !== undefined) {
      const lat = updates.latitude ?? location.latitude;
      const lon = updates.longitude ?? location.longitude;
      validateCoordinates(lat, lon);

      if (updates.latitude !== undefined) {
        sanitizedUpdates.latitude = updates.latitude;
      }
      if (updates.longitude !== undefined) {
        sanitizedUpdates.longitude = updates.longitude;
      }
    }

    // SECURITY: Validate radius if provided
    if (updates.radiusMeters !== undefined) {
      validatePositiveNumber(
        updates.radiusMeters,
        "Radius",
        MIN_RADIUS_METERS,
        MAX_RADIUS_METERS
      );
      sanitizedUpdates.radiusMeters = updates.radiusMeters;
    }

    // Boolean fields don't need sanitization
    if (updates.isActive !== undefined) {
      sanitizedUpdates.isActive = updates.isActive;
    }
    if (updates.allowRemote !== undefined) {
      sanitizedUpdates.allowRemote = updates.allowRemote;
    }

    await ctx.db.patch(id, {
      ...sanitizedUpdates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

/**
 * Delete a location
 * Admin only
 *
 * SECURITY:
 * - Requires admin role
 * - Rate limited: 10 requests per minute (sensitive operation)
 * - Audit logged
 */
export const remove = mutation({
  args: { id: v.id("locations") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    // SECURITY: Rate limiting - more restrictive for deletions
    try {
      await checkRateLimit(ctx, "locations:remove", RATE_LIMIT_PRESETS.SENSITIVE);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw new Error(error.message);
      }
      throw error;
    }

    // Verify location exists and get details for audit
    const location = await ctx.db.get(args.id);
    if (!location) {
      throw new Error("Location not found");
    }

    // SECURITY: Audit log before deletion
    await ctx.db.insert("securityAuditLog", {
      eventType: "admin_action",
      identifier: admin.subject,
      action: "locations:remove",
      metadata: JSON.stringify({
        locationId: args.id,
        name: location.name,
        address: location.address,
      }),
      severity: "medium",
      timestamp: Date.now(),
    });

    await ctx.db.delete(args.id);

    return args.id;
  },
});

/**
 * Toggle location active status
 * Admin only
 *
 * SECURITY:
 * - Requires admin role
 * - Rate limited: 100 requests per minute
 */
export const toggleActive = mutation({
  args: { id: v.id("locations") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // SECURITY: Rate limiting
    try {
      await checkRateLimit(ctx, "locations:toggleActive", RATE_LIMIT_PRESETS.ADMIN);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw new Error(error.message);
      }
      throw error;
    }

    const location = await ctx.db.get(args.id);
    if (!location) {
      throw new Error("Location not found");
    }

    await ctx.db.patch(args.id, {
      isActive: !location.isActive,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});
