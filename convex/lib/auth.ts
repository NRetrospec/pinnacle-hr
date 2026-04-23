import { QueryCtx, MutationCtx } from "../_generated/server";
import { getUserRole } from "./clerk";

/**
 * Require authentication and return the user identity
 * Throws error if user is not authenticated
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthenticated - Please log in");
  }
  return identity;
}

/**
 * Require admin role
 * Throws error if user is not an admin
 */
export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const identity = await requireAuth(ctx);
  const role = await getUserRole(ctx, identity);

  if (role !== "admin") {
    throw new Error("Admin access required");
  }

  return identity;
}

/**
 * Check if current user is an admin (safe version)
 * Returns null if not authenticated or not an admin
 */
export async function isAdmin(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return false;

  const role = await getUserRole(ctx, identity);
  return role === "admin";
}

/**
 * Get the current logged-in user from the database
 * Throws error if user not found
 */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await requireAuth(ctx);

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) {
    throw new Error("User not found in database. Please contact support.");
  }

  return user;
}

/**
 * Get the current logged-in user AND their employee profile
 * Throws error if employee profile is not linked
 */
export async function getCurrentEmployee(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentUser(ctx);

  if (!user.employeeId) {
    throw new Error("No employee profile linked to your account");
  }

  const employee = await ctx.db.get(user.employeeId);

  if (!employee) {
    throw new Error("Employee profile not found");
  }

  return { user, employee };
}

/**
 * Get the current logged-in user AND their employee profile (safe version)
 * Returns null if employee profile is not linked instead of throwing
 */
export async function getCurrentEmployeeSafe(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user || !user.employeeId) return null;

  const employee = await ctx.db.get(user.employeeId);
  if (!employee) return null;

  return { user, employee };
}
