/**
 * Clerk utilities for user authentication
 * IMPORTANT: Roles are now stored in Convex database, NOT in Clerk metadata
 */

import { QueryCtx, MutationCtx } from "../_generated/server";

/**
 * Type representing a user identity from Clerk authentication
 * This matches the shape returned by ctx.auth.getUserIdentity()
 */
export type UserIdentity = {
  subject: string;
  email?: string;
  name?: string;
  publicMetadata?: Record<string, unknown>;
  [key: string]: unknown;
};

/**
 * Get the user's role from Convex database
 * This is the single source of truth for user roles
 *
 * @param ctx - Convex query or mutation context
 * @param identity - The user identity from Clerk
 * @returns The user's role ("admin" | "employee") or undefined if not set
 */
export async function getUserRole(
  ctx: QueryCtx | MutationCtx,
  identity: UserIdentity
): Promise<"admin" | "employee" | undefined> {
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();

  return user?.role;
}
