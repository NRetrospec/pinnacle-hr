/**
 * =============================================================================
 * Employees Module - Employee Profile Management
 * =============================================================================
 *
 * Handles employee HR profiles, including personal info, employment details,
 * and PTO settings.
 *
 * SECURITY MEASURES:
 * - Rate limiting on all endpoints
 * - Strict input validation and sanitization
 * - Role-based access control (admin only for most operations)
 * - Length limits on all string fields
 * - No unexpected fields allowed
 *
 * =============================================================================
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, getCurrentUser, isAdmin } from "./lib/auth";
import {
  checkRateLimit,
  RATE_LIMIT_PRESETS,
  RateLimitError,
} from "./lib/rateLimit";
import {
  validateEmail,
  validatePhone,
  validateName,
  validateLength,
  validatePositiveNumber,
  validateTimestamp,
  validateEmployeeNumber,
  validateNoUnexpectedFields,
  sanitizeString,
  sanitizeObject,
  LENGTH_LIMITS,
  ValidationError,
} from "./lib/validation";

// =============================================================================
// ALLOWED FIELDS - Prevents mass assignment attacks
// =============================================================================

const CREATE_EMPLOYEE_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "employeeNumber",
  "hireDate",
  "department",
  "position",
  "payRate",
  "payType",
  "ptoAccrualRate",
  "ptoCap",
];

const UPDATE_EMPLOYEE_FIELDS = [
  "id",
  "firstName",
  "lastName",
  "email",
  "phone",
  "department",
  "position",
  "payRate",
  "payType",
  "ptoAccrualRate",
  "ptoCap",
  "status",
];

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate and sanitize employee create/update input
 */
function validateEmployeeInput(
  args: Record<string, unknown>,
  isUpdate: boolean = false
) {
  // Validate names if provided
  if (args.firstName !== undefined) {
    validateName(args.firstName as string, "First name");
  }
  if (args.lastName !== undefined) {
    validateName(args.lastName as string, "Last name");
  }

  // Validate email if provided
  if (args.email !== undefined) {
    validateEmail(args.email as string);
  }

  // Validate phone if provided (optional field)
  if (args.phone !== undefined && args.phone !== null) {
    validatePhone(args.phone as string, "Phone", false);
  }

  // Validate employee number (only on create)
  if (!isUpdate && args.employeeNumber !== undefined) {
    validateEmployeeNumber(args.employeeNumber as string);
  }

  // Validate department and position
  if (args.department !== undefined) {
    validateLength(
      args.department as string,
      "Department",
      LENGTH_LIMITS.SHORT_STRING
    );
  }
  if (args.position !== undefined) {
    validateLength(
      args.position as string,
      "Position",
      LENGTH_LIMITS.SHORT_STRING
    );
  }

  // Validate numeric fields
  if (args.payRate !== undefined) {
    validatePositiveNumber(args.payRate as number, "Pay rate", 0, 10000);
  }
  if (args.ptoAccrualRate !== undefined) {
    validatePositiveNumber(
      args.ptoAccrualRate as number,
      "PTO accrual rate",
      0,
      100
    );
  }
  if (args.ptoCap !== undefined) {
    validatePositiveNumber(args.ptoCap as number, "PTO cap", 0, 1000);
  }

  // Validate hire date (only on create)
  if (!isUpdate && args.hireDate !== undefined) {
    validateTimestamp(args.hireDate as number, "Hire date", true);
  }
}

// =============================================================================
// QUERIES
// =============================================================================

/**
 * List all employees with optional filtering
 * Admin only
 *
 * SECURITY:
 * - Returns empty array if not admin (graceful degradation)
 * - No rate limiting on queries (read-only)
 */
export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("inactive"),
        v.literal("terminated")
      )
    ),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Safe check - return empty array if not admin
    const userIsAdmin = await isAdmin(ctx);
    if (!userIsAdmin) {
      return [];
    }

    // SECURITY: Validate department filter if provided
    if (args.department) {
      validateLength(
        args.department,
        "Department filter",
        LENGTH_LIMITS.SHORT_STRING
      );
    }

    let employees;

    // Filter by status if provided
    if (args.status) {
      employees = await ctx.db
        .query("employees")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      employees = await ctx.db.query("employees").collect();
    }

    // Further filter by department if provided
    if (args.department) {
      const sanitizedDept = sanitizeString(args.department);
      employees = employees.filter((e) => e.department === sanitizedDept);
    }

    // Sort by employee number (newest first)
    return employees.sort((a, b) =>
      b.employeeNumber.localeCompare(a.employeeNumber)
    );
  },
});

/**
 * Get a single employee by ID
 * Admin only
 *
 * SECURITY:
 * - Requires admin role
 */
export const get = query({
  args: { id: v.id("employees") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.get(args.id);
  },
});

/**
 * Generate the next available employee number
 * Admin only
 *
 * SECURITY:
 * - Returns null if not admin
 */
export const generateEmployeeNumber = query({
  handler: async (ctx) => {
    // Safe check - return null if not admin
    const userIsAdmin = await isAdmin(ctx);
    if (!userIsAdmin) {
      return null;
    }

    // Get all employees and find the highest employee number
    const employees = await ctx.db.query("employees").collect();

    if (employees.length === 0) {
      return "EMP0001";
    }

    // Extract numbers from employee numbers (format: EMP0001, EMP0002, etc.)
    const numbers = employees
      .map((emp) => {
        const match = emp.employeeNumber.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((num) => num > 0);

    const maxNumber = Math.max(...numbers, 0);
    const nextNumber = maxNumber + 1;

    return `EMP${nextNumber.toString().padStart(4, "0")}`;
  },
});

/**
 * Get employee count by status
 * Admin only - useful for dashboard stats
 *
 * SECURITY:
 * - Returns null if not admin
 */
export const getStats = query({
  handler: async (ctx) => {
    // Safe check - return null if not admin instead of throwing
    const userIsAdmin = await isAdmin(ctx);
    if (!userIsAdmin) {
      return null;
    }

    const employees = await ctx.db.query("employees").collect();

    return {
      total: employees.length,
      active: employees.filter((e) => e.status === "active").length,
      inactive: employees.filter((e) => e.status === "inactive").length,
      terminated: employees.filter((e) => e.status === "terminated").length,
    };
  },
});

/**
 * Get unique departments
 * Admin only - useful for filters
 *
 * SECURITY:
 * - Returns empty array if not admin
 */
export const getDepartments = query({
  handler: async (ctx) => {
    // Safe check - return empty array if not admin
    const userIsAdmin = await isAdmin(ctx);
    if (!userIsAdmin) {
      return [];
    }

    const employees = await ctx.db.query("employees").collect();
    const departments = [...new Set(employees.map((e) => e.department))];

    return departments.sort();
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Create a new employee
 * Admin only - also initializes PTO balance
 *
 * SECURITY:
 * - Requires admin role
 * - Rate limited: 100 requests per minute
 * - Strict input validation
 * - Prevents duplicate email/employee number
 */
export const create = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    employeeNumber: v.string(),
    hireDate: v.number(),
    department: v.string(),
    position: v.string(),
    payRate: v.number(),
    payType: v.union(v.literal("hourly"), v.literal("salary")),
    ptoAccrualRate: v.number(),
    ptoCap: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const currentUser = await getCurrentUser(ctx);

    // SECURITY: Rate limiting
    try {
      await checkRateLimit(ctx, "employees:create", RATE_LIMIT_PRESETS.ADMIN);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw new Error(error.message);
      }
      throw error;
    }

    // SECURITY: Validate no unexpected fields
    validateNoUnexpectedFields(args as Record<string, unknown>, CREATE_EMPLOYEE_FIELDS, "Employee");

    // SECURITY: Validate and sanitize all input
    validateEmployeeInput(args as Record<string, unknown>, false);

    // Sanitize string fields
    const sanitizedFirstName = sanitizeString(args.firstName);
    const sanitizedLastName = sanitizeString(args.lastName);
    const sanitizedEmail = args.email.toLowerCase().trim();
    const sanitizedDepartment = sanitizeString(args.department);
    const sanitizedPosition = sanitizeString(args.position);
    const sanitizedPhone = args.phone ? sanitizeString(args.phone) : undefined;

    const now = Date.now();

    // SECURITY: Check if employee number already exists
    const existingEmployee = await ctx.db
      .query("employees")
      .withIndex("by_employee_number", (q) =>
        q.eq("employeeNumber", args.employeeNumber)
      )
      .unique();

    if (existingEmployee) {
      throw new Error(
        `Employee number ${args.employeeNumber} already exists`
      );
    }

    // SECURITY: Check if email already exists
    const existingEmail = await ctx.db
      .query("employees")
      .withIndex("by_email", (q) => q.eq("email", sanitizedEmail))
      .unique();

    if (existingEmail) {
      throw new Error(`Email ${sanitizedEmail} already exists`);
    }

    // Create employee with sanitized data
    const employeeId = await ctx.db.insert("employees", {
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName,
      email: sanitizedEmail,
      phone: sanitizedPhone,
      employeeNumber: args.employeeNumber,
      status: "active",
      hireDate: args.hireDate,
      department: sanitizedDepartment,
      position: sanitizedPosition,
      payRate: args.payRate,
      payType: args.payType,
      ptoAccrualRate: args.ptoAccrualRate,
      ptoCap: args.ptoCap,
      createdAt: now,
      updatedAt: now,
      createdBy: currentUser._id,
    });

    // Initialize PTO balance
    await ctx.db.insert("ptoBalances", {
      employeeId,
      totalAccrued: 0,
      totalUsed: 0,
      totalPending: 0,
      available: 0,
      lastCalculated: now,
      lastAccrualDate: now,
      updatedAt: now,
    });

    return employeeId;
  },
});

/**
 * Update an existing employee
 * Admin only
 *
 * SECURITY:
 * - Requires admin role
 * - Rate limited: 100 requests per minute
 * - Strict input validation
 * - Prevents duplicate email
 */
export const update = mutation({
  args: {
    id: v.id("employees"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    department: v.optional(v.string()),
    position: v.optional(v.string()),
    payRate: v.optional(v.number()),
    payType: v.optional(v.union(v.literal("hourly"), v.literal("salary"))),
    ptoAccrualRate: v.optional(v.number()),
    ptoCap: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("inactive"),
        v.literal("terminated")
      )
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // SECURITY: Rate limiting
    try {
      await checkRateLimit(ctx, "employees:update", RATE_LIMIT_PRESETS.ADMIN);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw new Error(error.message);
      }
      throw error;
    }

    // SECURITY: Validate no unexpected fields
    validateNoUnexpectedFields(args as Record<string, unknown>, UPDATE_EMPLOYEE_FIELDS, "Employee update");

    // SECURITY: Validate input
    validateEmployeeInput(args as Record<string, unknown>, true);

    const { id, ...updates } = args;

    // Verify employee exists
    const existingEmployee = await ctx.db.get(id);
    if (!existingEmployee) {
      throw new Error("Employee not found");
    }

    // Build sanitized updates object
    const sanitizedUpdates: Record<string, unknown> = {};

    if (updates.firstName !== undefined) {
      sanitizedUpdates.firstName = sanitizeString(updates.firstName);
    }
    if (updates.lastName !== undefined) {
      sanitizedUpdates.lastName = sanitizeString(updates.lastName);
    }
    if (updates.email !== undefined) {
      sanitizedUpdates.email = updates.email.toLowerCase().trim();
    }
    if (updates.phone !== undefined) {
      sanitizedUpdates.phone = updates.phone ? sanitizeString(updates.phone) : undefined;
    }
    if (updates.department !== undefined) {
      sanitizedUpdates.department = sanitizeString(updates.department);
    }
    if (updates.position !== undefined) {
      sanitizedUpdates.position = sanitizeString(updates.position);
    }
    if (updates.payRate !== undefined) {
      sanitizedUpdates.payRate = updates.payRate;
    }
    if (updates.payType !== undefined) {
      sanitizedUpdates.payType = updates.payType;
    }
    if (updates.ptoAccrualRate !== undefined) {
      sanitizedUpdates.ptoAccrualRate = updates.ptoAccrualRate;
    }
    if (updates.ptoCap !== undefined) {
      sanitizedUpdates.ptoCap = updates.ptoCap;
    }
    if (updates.status !== undefined) {
      sanitizedUpdates.status = updates.status;
    }

    // SECURITY: If updating email, check for duplicates
    if (sanitizedUpdates.email) {
      const existingEmail = await ctx.db
        .query("employees")
        .withIndex("by_email", (q) => q.eq("email", sanitizedUpdates.email as string))
        .unique();

      if (existingEmail && existingEmail._id !== id) {
        throw new Error(`Email ${sanitizedUpdates.email} already exists`);
      }
    }

    // Update employee
    await ctx.db.patch(id, {
      ...sanitizedUpdates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

/**
 * Soft delete an employee (set status to terminated)
 * Admin only
 *
 * SECURITY:
 * - Requires admin role
 * - Rate limited: 10 requests per minute (sensitive operation)
 */
export const remove = mutation({
  args: { id: v.id("employees") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // SECURITY: Rate limiting - more restrictive for deletions
    try {
      await checkRateLimit(ctx, "employees:remove", RATE_LIMIT_PRESETS.SENSITIVE);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw new Error(error.message);
      }
      throw error;
    }

    // Verify employee exists
    const employee = await ctx.db.get(args.id);
    if (!employee) {
      throw new Error("Employee not found");
    }

    const now = Date.now();

    // Soft delete - set status to terminated
    await ctx.db.patch(args.id, {
      status: "terminated",
      terminationDate: now,
      updatedAt: now,
    });

    return args.id;
  },
});
