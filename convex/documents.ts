/**
 * =============================================================================
 * Documents Module - Employee Document Management
 * =============================================================================
 *
 * Handles secure storage of employee documents including bank info, tax info,
 * contracts, and certifications.
 *
 * SECURITY MEASURES:
 * - All operations admin-only
 * - Rate limiting on all mutations
 * - Strict input validation and sanitization
 * - Field-level sensitive data marking
 * - Length limits on all string fields
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
  validateLength,
  validateNoUnexpectedFields,
  sanitizeString,
  sanitizeObject,
  LENGTH_LIMITS,
} from "./lib/validation";

// =============================================================================
// ALLOWED FIELDS - Prevents mass assignment attacks
// =============================================================================

const CREATE_DOCUMENT_FIELDS = [
  "employeeId",
  "category",
  "title",
  "description",
  "data",
];

const UPDATE_DOCUMENT_FIELDS = [
  "id",
  "category",
  "title",
  "description",
  "data",
];

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate document data fields array
 * Ensures all fields have valid labels and values within length limits
 */
function validateDocumentData(
  data: { fields: Array<{ label: string; value: string; sensitive?: boolean }> }
): void {
  if (!data || !Array.isArray(data.fields)) {
    throw new Error("Document data must contain a fields array");
  }

  // SECURITY: Limit number of fields to prevent abuse
  if (data.fields.length > 100) {
    throw new Error("Document cannot have more than 100 fields");
  }

  for (let i = 0; i < data.fields.length; i++) {
    const field = data.fields[i];

    // Validate label
    if (!field.label || typeof field.label !== "string") {
      throw new Error(`Field ${i + 1}: Label is required`);
    }
    validateLength(field.label, `Field ${i + 1} label`, LENGTH_LIMITS.LABEL);

    // Validate value (can be empty string)
    if (typeof field.value !== "string") {
      throw new Error(`Field ${i + 1}: Value must be a string`);
    }
    validateLength(field.value, `Field ${i + 1} value`, LENGTH_LIMITS.VALUE, false);

    // Validate sensitive flag if present
    if (field.sensitive !== undefined && typeof field.sensitive !== "boolean") {
      throw new Error(`Field ${i + 1}: Sensitive must be a boolean`);
    }
  }
}

/**
 * Sanitize document data fields
 */
function sanitizeDocumentData(
  data: { fields: Array<{ label: string; value: string; sensitive?: boolean }> }
): { fields: Array<{ label: string; value: string; sensitive?: boolean }> } {
  return {
    fields: data.fields.map((field) => ({
      label: sanitizeString(field.label),
      value: sanitizeString(field.value),
      sensitive: field.sensitive,
    })),
  };
}

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get all documents (admin only)
 *
 * SECURITY:
 * - Requires admin role
 * - Filter parameters validated
 */
export const list = query({
  args: {
    employeeId: v.optional(v.id("employees")),
    category: v.optional(
      v.union(
        v.literal("bank_info"),
        v.literal("personal_info"),
        v.literal("tax_info"),
        v.literal("contracts"),
        v.literal("certifications"),
        v.literal("other")
      )
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let documents;

    if (args.employeeId) {
      documents = await ctx.db
        .query("documents")
        .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId!))
        .collect();
    } else if (args.category) {
      documents = await ctx.db
        .query("documents")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
    } else {
      documents = await ctx.db.query("documents").collect();
    }

    // Enrich with employee data
    const enrichedDocs = await Promise.all(
      documents.map(async (doc) => {
        const employee = await ctx.db.get(doc.employeeId);
        return {
          ...doc,
          employee: employee
            ? {
                firstName: employee.firstName,
                lastName: employee.lastName,
                employeeNumber: employee.employeeNumber,
                department: employee.department,
              }
            : null,
        };
      })
    );

    return enrichedDocs.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

/**
 * Get document by ID
 *
 * SECURITY:
 * - Requires admin role
 */
export const get = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.get(args.id);
  },
});

/**
 * Get document categories with counts
 *
 * SECURITY:
 * - Requires admin role
 */
export const getCategoryCounts = query({
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const documents = await ctx.db.query("documents").collect();

    const counts: Record<string, number> = {};
    documents.forEach((doc) => {
      counts[doc.category] = (counts[doc.category] || 0) + 1;
    });

    return counts;
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Create a new document
 *
 * SECURITY:
 * - Requires admin role
 * - Rate limited: 100 requests per minute
 * - Strict input validation
 * - All string fields sanitized
 */
export const create = mutation({
  args: {
    employeeId: v.id("employees"),
    category: v.union(
      v.literal("bank_info"),
      v.literal("personal_info"),
      v.literal("tax_info"),
      v.literal("contracts"),
      v.literal("certifications"),
      v.literal("other")
    ),
    title: v.string(),
    description: v.optional(v.string()),
    data: v.object({
      // Flexible data structure for different document types
      fields: v.array(
        v.object({
          label: v.string(),
          value: v.string(),
          sensitive: v.optional(v.boolean()),
        })
      ),
    }),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // SECURITY: Rate limiting
    try {
      await checkRateLimit(ctx, "documents:create", RATE_LIMIT_PRESETS.ADMIN);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw new Error(error.message);
      }
      throw error;
    }

    // SECURITY: Validate no unexpected fields
    validateNoUnexpectedFields(
      args as Record<string, unknown>,
      CREATE_DOCUMENT_FIELDS,
      "Document"
    );

    // SECURITY: Validate title
    validateLength(args.title, "Title", LENGTH_LIMITS.TITLE);

    // SECURITY: Validate description if provided
    if (args.description !== undefined) {
      validateLength(args.description, "Description", LENGTH_LIMITS.DESCRIPTION, false);
    }

    // SECURITY: Validate document data fields
    validateDocumentData(args.data);

    // Verify employee exists
    const employee = await ctx.db.get(args.employeeId);
    if (!employee) {
      throw new Error("Employee not found");
    }

    const now = Date.now();

    // Sanitize all string inputs
    const sanitizedTitle = sanitizeString(args.title);
    const sanitizedDescription = args.description
      ? sanitizeString(args.description)
      : undefined;
    const sanitizedData = sanitizeDocumentData(args.data);

    const docId = await ctx.db.insert("documents", {
      employeeId: args.employeeId,
      category: args.category,
      title: sanitizedTitle,
      description: sanitizedDescription,
      data: sanitizedData,
      createdAt: now,
      updatedAt: now,
    });

    return docId;
  },
});

/**
 * Update a document
 *
 * SECURITY:
 * - Requires admin role
 * - Rate limited: 100 requests per minute
 * - Strict input validation
 * - All string fields sanitized
 */
export const update = mutation({
  args: {
    id: v.id("documents"),
    category: v.optional(
      v.union(
        v.literal("bank_info"),
        v.literal("personal_info"),
        v.literal("tax_info"),
        v.literal("contracts"),
        v.literal("certifications"),
        v.literal("other")
      )
    ),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    data: v.optional(
      v.object({
        fields: v.array(
          v.object({
            label: v.string(),
            value: v.string(),
            sensitive: v.optional(v.boolean()),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // SECURITY: Rate limiting
    try {
      await checkRateLimit(ctx, "documents:update", RATE_LIMIT_PRESETS.ADMIN);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw new Error(error.message);
      }
      throw error;
    }

    // SECURITY: Validate no unexpected fields
    validateNoUnexpectedFields(
      args as Record<string, unknown>,
      UPDATE_DOCUMENT_FIELDS,
      "Document update"
    );

    const { id, ...updates } = args;

    // Verify document exists
    const existingDoc = await ctx.db.get(id);
    if (!existingDoc) {
      throw new Error("Document not found");
    }

    // Build sanitized updates
    const sanitizedUpdates: Record<string, unknown> = {};

    if (updates.category !== undefined) {
      sanitizedUpdates.category = updates.category;
    }

    if (updates.title !== undefined) {
      validateLength(updates.title, "Title", LENGTH_LIMITS.TITLE);
      sanitizedUpdates.title = sanitizeString(updates.title);
    }

    if (updates.description !== undefined) {
      validateLength(updates.description, "Description", LENGTH_LIMITS.DESCRIPTION, false);
      sanitizedUpdates.description = sanitizeString(updates.description);
    }

    if (updates.data !== undefined) {
      validateDocumentData(updates.data);
      sanitizedUpdates.data = sanitizeDocumentData(updates.data);
    }

    const now = Date.now();

    await ctx.db.patch(id, {
      ...sanitizedUpdates,
      updatedAt: now,
    });

    return id;
  },
});

/**
 * Delete a document
 *
 * SECURITY:
 * - Requires admin role
 * - Rate limited: 10 requests per minute (sensitive operation)
 * - Audit logged
 */
export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    // SECURITY: Rate limiting - more restrictive for deletions
    try {
      await checkRateLimit(ctx, "documents:remove", RATE_LIMIT_PRESETS.SENSITIVE);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw new Error(error.message);
      }
      throw error;
    }

    // Verify document exists and get details for audit
    const doc = await ctx.db.get(args.id);
    if (!doc) {
      throw new Error("Document not found");
    }

    // SECURITY: Audit log before deletion (don't include sensitive data)
    await ctx.db.insert("securityAuditLog", {
      eventType: "admin_action",
      identifier: admin.subject,
      action: "documents:remove",
      metadata: JSON.stringify({
        documentId: args.id,
        employeeId: doc.employeeId,
        category: doc.category,
        title: doc.title,
      }),
      severity: "medium",
      timestamp: Date.now(),
    });

    await ctx.db.delete(args.id);

    return args.id;
  },
});
