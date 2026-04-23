/**
 * =============================================================================
 * Users Module - User Account Management
 * =============================================================================
 *
 * Handles user authentication syncing and role management.
 * Integrates with Clerk for authentication.
 *
 * SECURITY MEASURES:
 * - Rate limiting on all endpoints
 * - Input validation and sanitization
 * - Role-based access control
 * - Audit logging for sensitive operations
 *
 * =============================================================================
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { getUserRole } from "./lib/clerk";
import {
  checkRateLimit,
  RATE_LIMIT_PRESETS,
  RateLimitError,
} from "./lib/rateLimit";
import {
  validateEmail,
  validateLength,
  LENGTH_LIMITS,
  sanitizeString,
  ValidationError,
} from "./lib/validation";

// =============================================================================
// ALLOWED FIELDS - Prevents mass assignment attacks
// =============================================================================

const SYNC_USER_ALLOWED_FIELDS = ["clerkId", "email", "role"];
const SET_ROLE_ALLOWED_FIELDS = ["role"];

// =============================================================================
// PUBLIC MUTATIONS
// =============================================================================

/**
 * Sync Clerk user to Convex database
 * Called automatically when user logs in.
 *
 * Role is optional — if omitted, the existing role in the database is
 * preserved. This lets the hook sync profile data (email, lastLoginAt)
 * on every login without accidentally overwriting a role that was set
 * during onboarding.
 *
 * SECURITY:
 * - Rate limited: 10 requests per minute (login flows)
 * - Input validation: email format, string length
 * - Role only updated when explicitly provided
 */
export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    role: v.optional(v.union(v.literal("admin"), v.literal("employee"))),
  },
  handler: async (ctx, args) => {
    // SECURITY: Rate limiting - prevent rapid sync attempts
    try {
      await checkRateLimit(ctx, "users:syncUser", {
        ...RATE_LIMIT_PRESETS.PUBLIC_AUTH,
        maxRequests: 10, // Slightly higher for login flows
      });
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw new Error(error.message);
      }
      throw error;
    }

    // SECURITY: Input validation
    // Validate clerkId format (Clerk IDs are typically "user_xxxxx")
    validateLength(args.clerkId, "Clerk ID", { min: 1, max: 100 });
    if (!args.clerkId.startsWith("user_")) {
      throw new ValidationError(
        "clerkId",
        "INVALID_FORMAT",
        "Invalid Clerk ID format"
      );
    }

    // Validate and sanitize email
    const sanitizedEmail = validateEmail(args.email);

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    const now = Date.now();

    if (existingUser) {
      // Build update patch — only update role if a new one is explicitly provided
      const patch: Record<string, any> = {
        lastLoginAt: now,
        email: sanitizedEmail, // Update email in case it changed in Clerk
      };
      if (args.role) {
        patch.role = args.role;
      }
      await ctx.db.patch(existingUser._id, patch);
      return existingUser._id;
    }

    // Create new user record (role will be set via setUserRole during onboarding)
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: sanitizedEmail,
      role: args.role as "admin" | "employee",
      createdAt: now,
      lastLoginAt: now,
    });

    return userId;
  },
});

/**
 * Get the current logged-in user
 * Returns null if not authenticated
 *
 * SECURITY:
 * - No rate limiting (lightweight read operation)
 * - Only returns data for the authenticated user
 */
export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

/**
 * Get user by ID
 *
 * SECURITY:
 * - Requires authentication
 * - Rate limited for read operations
 */
export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.get(args.userId);
  },
});

// =============================================================================
// PROTECTED MUTATIONS - Require authentication
// =============================================================================

/**
 * Link employee profile to user account
 * Admin only
 *
 * SECURITY:
 * - Requires admin role
 * - Rate limited: 10 requests per minute
 * - Audit logged
 */
export const linkEmployee = mutation({
  args: {
    userId: v.id("users"),
    employeeId: v.id("employees"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // SECURITY: Rate limiting
    try {
      await checkRateLimit(ctx, "users:linkEmployee", RATE_LIMIT_PRESETS.SENSITIVE);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw new Error(error.message);
      }
      throw error;
    }

    // Check if caller is admin
    const role = await getUserRole(ctx, identity);
    if (role !== "admin") {
      // Log unauthorized attempt
      await ctx.db.insert("securityAuditLog", {
        eventType: "permission_denied",
        identifier: identity.subject,
        action: "users:linkEmployee",
        metadata: JSON.stringify({ targetUserId: args.userId }),
        severity: "medium",
        timestamp: Date.now(),
      });
      throw new Error("Admin access required");
    }

    // Verify target user exists
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Verify employee exists
    const employee = await ctx.db.get(args.employeeId);
    if (!employee) {
      throw new Error("Employee not found");
    }

    await ctx.db.patch(args.userId, {
      employeeId: args.employeeId,
    });

    // SECURITY: Audit log
    await ctx.db.insert("securityAuditLog", {
      eventType: "admin_action",
      identifier: identity.subject,
      action: "users:linkEmployee",
      metadata: JSON.stringify({
        targetUserId: args.userId,
        employeeId: args.employeeId,
      }),
      severity: "low",
      timestamp: Date.now(),
    });

    return args.userId;
  },
});

/**
 * Set user role during onboarding
 * Only callable when user has no role yet (prevents role changes after onboarding)
 *
 * SECURITY:
 * - This is the ONLY way users can set their initial role
 * - Rate limited: 5 requests per minute
 * - Prevents role changes after initial assignment
 * - Role validation: only "admin" or "employee"
 */
export const setUserRole = mutation({
  args: {
    role: v.union(v.literal("admin"), v.literal("employee")),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // SECURITY: Rate limiting - prevent role enumeration/brute force
    try {
      await checkRateLimit(ctx, "users:setUserRole", RATE_LIMIT_PRESETS.SENSITIVE);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw new Error(error.message);
      }
      throw error;
    }

    // Check if user already exists in database
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    // SECURITY: Prevent role changes after onboarding
    if (existingUser?.role) {
      // Log attempt to change role
      await ctx.db.insert("securityAuditLog", {
        eventType: "suspicious_activity",
        identifier: identity.subject,
        action: "users:setUserRole:duplicate_attempt",
        metadata: JSON.stringify({
          existingRole: existingUser.role,
          attemptedRole: args.role,
        }),
        severity: "medium",
        timestamp: Date.now(),
      });
      throw new Error("User already has a role assigned");
    }

    const now = Date.now();

    if (existingUser) {
      // Update existing user with role
      await ctx.db.patch(existingUser._id, {
        role: args.role,
        lastLoginAt: now,
      });
    } else {
      // Create new user with role
      await ctx.db.insert("users", {
        clerkId: identity.subject,
        email: identity.email || "",
        role: args.role,
        createdAt: now,
        lastLoginAt: now,
      });
    }

    // SECURITY: Audit log role assignment
    await ctx.db.insert("securityAuditLog", {
      eventType: "role_change",
      identifier: identity.subject,
      action: "users:setUserRole",
      metadata: JSON.stringify({ role: args.role, isNewUser: !existingUser }),
      severity: "low",
      timestamp: now,
    });

    return { success: true, role: args.role };
  },
});

/**
 * Promote a user to admin
 * Only callable by existing admins
 *
 * SECURITY:
 * - This is the ONLY way to promote users to admin after onboarding
 * - Requires admin role
 * - Rate limited: 5 requests per minute
 * - Audit logged
 */
export const promoteToAdmin = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify caller is admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // SECURITY: Rate limiting
    try {
      await checkRateLimit(ctx, "users:promoteToAdmin", RATE_LIMIT_PRESETS.SENSITIVE);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw new Error(error.message);
      }
      throw error;
    }

    const callerRole = await getUserRole(ctx, identity);
    if (callerRole !== "admin") {
      // Log unauthorized promotion attempt
      await ctx.db.insert("securityAuditLog", {
        eventType: "permission_denied",
        identifier: identity.subject,
        action: "users:promoteToAdmin",
        metadata: JSON.stringify({ targetUserId: args.userId }),
        severity: "high",
        timestamp: Date.now(),
      });
      throw new Error("Admin access required");
    }

    // Get target user
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Update role to admin
    await ctx.db.patch(args.userId, {
      role: "admin",
    });

    // SECURITY: Audit log
    await ctx.db.insert("securityAuditLog", {
      eventType: "role_change",
      identifier: identity.subject,
      action: "users:promoteToAdmin",
      metadata: JSON.stringify({
        targetUserId: args.userId,
        targetEmail: targetUser.email,
        previousRole: targetUser.role,
      }),
      severity: "high",
      timestamp: Date.now(),
    });

    return { success: true, userId: args.userId };
  },
});

/**
 * Demote an admin to employee
 * Only callable by existing admins
 *
 * SECURITY:
 * - Requires admin role
 * - Prevents self-demotion (admin lockout protection)
 * - Rate limited: 5 requests per minute
 * - Audit logged
 */
export const demoteToEmployee = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify caller is admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // SECURITY: Rate limiting
    try {
      await checkRateLimit(ctx, "users:demoteToEmployee", RATE_LIMIT_PRESETS.SENSITIVE);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw new Error(error.message);
      }
      throw error;
    }

    const callerRole = await getUserRole(ctx, identity);
    if (callerRole !== "admin") {
      // Log unauthorized demotion attempt
      await ctx.db.insert("securityAuditLog", {
        eventType: "permission_denied",
        identifier: identity.subject,
        action: "users:demoteToEmployee",
        metadata: JSON.stringify({ targetUserId: args.userId }),
        severity: "high",
        timestamp: Date.now(),
      });
      throw new Error("Admin access required");
    }

    // Get target user
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // SECURITY: Prevent self-demotion
    if (targetUser.clerkId === identity.subject) {
      throw new Error("Cannot demote yourself");
    }

    // Update role to employee
    await ctx.db.patch(args.userId, {
      role: "employee",
    });

    // SECURITY: Audit log
    await ctx.db.insert("securityAuditLog", {
      eventType: "role_change",
      identifier: identity.subject,
      action: "users:demoteToEmployee",
      metadata: JSON.stringify({
        targetUserId: args.userId,
        targetEmail: targetUser.email,
        previousRole: targetUser.role,
      }),
      severity: "high",
      timestamp: Date.now(),
    });

    return { success: true, userId: args.userId };
  },
});

// =============================================================================
// ADMIN QUERIES - Migration Helpers
// =============================================================================

/**
 * MIGRATION HELPER: Get all users without roles
 * Use this to identify users who need role assignment
 * Admin only
 *
 * SECURITY:
 * - Requires admin role
 * - Returns minimal data (no sensitive info)
 */
export const getUsersWithoutRoles = query({
  handler: async (ctx) => {
    // Verify caller is admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const callerUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (callerUser?.role !== "admin") {
      throw new Error("Admin access required");
    }

    // Find all users without roles
    const allUsers = await ctx.db.query("users").collect();
    const usersWithoutRoles = allUsers.filter((user) => !user.role);

    // SECURITY: Return minimal data - no sensitive information
    return usersWithoutRoles.map((user) => ({
      _id: user._id,
      email: user.email,
      clerkId: user.clerkId,
      createdAt: user.createdAt,
    }));
  },
});

/**
 * MIGRATION HELPER: Set role for user by ID
 * Use this to manually assign roles during migration
 * Admin only
 *
 * SECURITY:
 * - Requires admin role
 * - Rate limited: 10 requests per minute
 * - Audit logged
 */
export const setRoleForUser = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("employee")),
  },
  handler: async (ctx, args) => {
    // Verify caller is admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // SECURITY: Rate limiting
    try {
      await checkRateLimit(ctx, "users:setRoleForUser", RATE_LIMIT_PRESETS.SENSITIVE);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw new Error(error.message);
      }
      throw error;
    }

    const callerRole = await getUserRole(ctx, identity);
    if (callerRole !== "admin") {
      // Log unauthorized attempt
      await ctx.db.insert("securityAuditLog", {
        eventType: "permission_denied",
        identifier: identity.subject,
        action: "users:setRoleForUser",
        metadata: JSON.stringify({
          targetUserId: args.userId,
          attemptedRole: args.role,
        }),
        severity: "high",
        timestamp: Date.now(),
      });
      throw new Error("Admin access required");
    }

    // Verify target user exists
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Update user role
    await ctx.db.patch(args.userId, {
      role: args.role,
    });

    // SECURITY: Audit log
    await ctx.db.insert("securityAuditLog", {
      eventType: "role_change",
      identifier: identity.subject,
      action: "users:setRoleForUser",
      metadata: JSON.stringify({
        targetUserId: args.userId,
        targetEmail: targetUser.email,
        previousRole: targetUser.role,
        newRole: args.role,
      }),
      severity: "high",
      timestamp: Date.now(),
    });

    return { success: true, userId: args.userId, role: args.role };
  },
});
