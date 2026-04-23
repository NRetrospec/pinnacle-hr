import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User account linking Clerk to employee profile
  users: defineTable({
    clerkId: v.string(),        // Clerk user ID
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("employee")),
    employeeId: v.optional(v.id("employees")), // Link to employee record
    createdAt: v.number(),
    lastLoginAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_employee_id", ["employeeId"]),

  // Employee HR profiles
  employees: defineTable({
    // Personal Info
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),

    // Employment Info
    employeeNumber: v.string(),      // Auto-generated unique ID
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("terminated")
    ),
    hireDate: v.number(),            // Timestamp
    terminationDate: v.optional(v.number()),

    // Job Info
    department: v.string(),
    position: v.string(),
    payRate: v.number(),             // Hourly rate
    payType: v.union(v.literal("hourly"), v.literal("salary")),

    // PTO Settings
    ptoAccrualRate: v.number(),      // Hours per pay period
    ptoCap: v.number(),               // Maximum accrual hours

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("users"),        // Admin who created
  })
    .index("by_email", ["email"])
    .index("by_employee_number", ["employeeNumber"])
    .index("by_status", ["status"])
    .index("by_department", ["department"]),

  // Time clock entries
  timeEntries: defineTable({
    employeeId: v.id("employees"),

    // Clock times
    clockInTime: v.number(),         // Timestamp
    clockOutTime: v.optional(v.number()),

    // GPS verification
    clockInLocation: v.object({
      lat: v.number(),
      lng: v.number(),
      verified: v.boolean(),         // Within geofence?
    }),
    clockOutLocation: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      verified: v.boolean(),
    })),

    // Calculated fields
    hoursWorked: v.optional(v.number()),

    // Approval workflow
    status: v.union(
      v.literal("pending"),          // Awaiting approval
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("flagged")           // GPS failed, needs review
    ),
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    notes: v.optional(v.string()),   // Admin notes

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_employee", ["employeeId"])
    .index("by_employee_and_date", ["employeeId", "clockInTime"])
    .index("by_status", ["status"])
    .index("by_date", ["clockInTime"]),

  // PTO requests
  ptoRequests: defineTable({
    employeeId: v.id("employees"),

    // Request details
    startDate: v.number(),           // Start timestamp (beginning of day)
    endDate: v.number(),             // End timestamp (end of day)
    hoursRequested: v.number(),
    type: v.union(
      v.literal("vacation"),
      v.literal("sick"),
      v.literal("personal"),
      v.literal("unpaid")
    ),
    reason: v.optional(v.string()),

    // Approval workflow
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("cancelled")
    ),
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    reviewNotes: v.optional(v.string()),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_employee", ["employeeId"])
    .index("by_status", ["status"])
    .index("by_date_range", ["startDate", "endDate"]),

  // PTO balances (cached for performance)
  ptoBalances: defineTable({
    employeeId: v.id("employees"),

    // Balance tracking
    totalAccrued: v.number(),        // Total hours accrued
    totalUsed: v.number(),           // Total hours used (approved requests)
    totalPending: v.number(),        // Hours in pending requests
    available: v.number(),           // totalAccrued - totalUsed - totalPending

    // Last calculation
    lastCalculated: v.number(),
    lastAccrualDate: v.number(),     // Last time accrual was added

    // Metadata
    updatedAt: v.number(),
  })
    .index("by_employee", ["employeeId"]),

  // Company locations for geofencing
  locations: defineTable({
    name: v.string(),
    address: v.string(),

    // Geofence center point
    latitude: v.number(),
    longitude: v.number(),
    radiusMeters: v.number(),        // Geofence radius

    // Settings
    isActive: v.boolean(),
    allowRemote: v.boolean(),        // Allow "remote" clock-ins

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_active", ["isActive"]),

  // Employee documents
  documents: defineTable({
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
      fields: v.array(
        v.object({
          label: v.string(),
          value: v.string(),
          sensitive: v.optional(v.boolean()),
        })
      ),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_employee", ["employeeId"])
    .index("by_category", ["category"]),

  // Company settings (single record)
  companySettings: defineTable({
    // Time tracking
    defaultGeofenceRadius: v.number(),
    requireGpsForClockIn: v.boolean(),
    autoApproveTimeEntries: v.boolean(),

    // PTO policies
    defaultPtoAccrualRate: v.number(),
    defaultPtoCap: v.number(),

    // Payroll
    payPeriodType: v.union(
      v.literal("weekly"),
      v.literal("biweekly"),
      v.literal("semimonthly"),
      v.literal("monthly")
    ),

    // Metadata
    updatedAt: v.number(),
    updatedBy: v.id("users"),
  }),

  // ==========================================================================
  // SECURITY: Rate limiting table
  // ==========================================================================
  // Tracks request counts per identifier (IP hash, user ID, or combined)
  // Used to enforce rate limits and prevent abuse
  // Records auto-expire based on windowMs - cleanup via scheduled function
  rateLimits: defineTable({
    // Identifier: can be IP hash, user ID, or combined key
    identifier: v.string(),
    // Endpoint being rate limited (e.g., "users:syncUser", "timeEntries:clockIn")
    endpoint: v.string(),
    // Number of requests in current window
    count: v.number(),
    // Window start timestamp
    windowStart: v.number(),
    // Window expiration timestamp (for cleanup)
    expiresAt: v.number(),
  })
    .index("by_identifier_endpoint", ["identifier", "endpoint"])
    .index("by_expires", ["expiresAt"]),

  // ==========================================================================
  // SECURITY: Audit log for security events
  // ==========================================================================
  // Tracks important security events for compliance and forensics
  securityAuditLog: defineTable({
    // Event type
    eventType: v.union(
      v.literal("rate_limit_exceeded"),
      v.literal("auth_failure"),
      v.literal("permission_denied"),
      v.literal("suspicious_activity"),
      v.literal("role_change"),
      v.literal("admin_action")
    ),
    // User identifier (Clerk ID or IP hash if unauthenticated)
    identifier: v.string(),
    // Endpoint or action
    action: v.string(),
    // Additional context (sanitized, no PII)
    metadata: v.optional(v.string()),
    // Severity level
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    // Timestamp
    timestamp: v.number(),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_identifier", ["identifier"])
    .index("by_event_type", ["eventType"]),
});
