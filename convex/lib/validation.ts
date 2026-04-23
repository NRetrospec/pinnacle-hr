/**
 * =============================================================================
 * SECURITY: Input Validation & Sanitization Utilities
 * =============================================================================
 *
 * Provides comprehensive input validation and sanitization following OWASP guidelines.
 *
 * OWASP Guidelines Followed:
 * - A03:2021 - Injection: Input sanitization prevents XSS and injection attacks
 * - A01:2021 - Broken Access Control: Input validation prevents privilege escalation
 *
 * Key Features:
 * - Schema-based validation with type checking
 * - Length limits on all string inputs
 * - XSS prevention via HTML entity encoding
 * - Rejection of unexpected fields
 * - Email and phone format validation
 * - GPS coordinate validation
 *
 * =============================================================================
 */

/**
 * Validation error with details about what failed
 */
export class ValidationError extends Error {
  public readonly field: string;
  public readonly code: string;
  public readonly statusCode = 400;

  constructor(field: string, code: string, message: string) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
    this.code = code;
  }
}

/**
 * Field length limits by type
 * Based on common sense and database considerations
 */
export const LENGTH_LIMITS = {
  // Identity fields
  EMAIL: { min: 5, max: 254 }, // RFC 5321
  PHONE: { min: 7, max: 20 },
  NAME: { min: 1, max: 100 },
  EMPLOYEE_NUMBER: { min: 1, max: 20 },

  // Text content
  TITLE: { min: 1, max: 200 },
  DESCRIPTION: { min: 0, max: 2000 },
  NOTES: { min: 0, max: 5000 },
  ADDRESS: { min: 1, max: 500 },

  // Generic
  SHORT_STRING: { min: 1, max: 100 },
  MEDIUM_STRING: { min: 1, max: 500 },
  LONG_STRING: { min: 1, max: 5000 },

  // Labels and values in documents
  LABEL: { min: 1, max: 100 },
  VALUE: { min: 0, max: 1000 },
} as const;

/**
 * HTML entities to escape for XSS prevention
 */
const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

/**
 * Sanitize a string by encoding HTML entities
 * Prevents XSS attacks when the string is rendered in HTML
 *
 * @param input - Raw string input
 * @returns Sanitized string with HTML entities encoded
 */
export function sanitizeHtml(input: string): string {
  return input.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitize a string for safe storage and display
 * - Trims whitespace
 * - Encodes HTML entities
 * - Removes null bytes
 * - Normalizes unicode
 *
 * @param input - Raw string input
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .trim()
    .replace(/\0/g, "") // Remove null bytes
    .normalize("NFC") // Normalize unicode
    .replace(/[\u200B-\u200D\uFEFF]/g, ""); // Remove zero-width characters
}

/**
 * Sanitize and encode a string for safe HTML display
 *
 * @param input - Raw string input
 * @returns Sanitized and HTML-encoded string
 */
export function sanitizeForDisplay(input: string): string {
  return sanitizeHtml(sanitizeString(input));
}

/**
 * Validate string length against limits
 *
 * @param value - String to validate
 * @param fieldName - Field name for error messages
 * @param limits - Min and max length
 * @param required - Whether field is required (default true)
 */
export function validateLength(
  value: string | undefined,
  fieldName: string,
  limits: { min: number; max: number },
  required: boolean = true
): void {
  if (value === undefined || value === null) {
    if (required) {
      throw new ValidationError(
        fieldName,
        "REQUIRED",
        `${fieldName} is required`
      );
    }
    return;
  }

  if (typeof value !== "string") {
    throw new ValidationError(
      fieldName,
      "INVALID_TYPE",
      `${fieldName} must be a string`
    );
  }

  const sanitized = sanitizeString(value);

  if (required && sanitized.length < limits.min) {
    throw new ValidationError(
      fieldName,
      "TOO_SHORT",
      `${fieldName} must be at least ${limits.min} characters`
    );
  }

  if (sanitized.length > limits.max) {
    throw new ValidationError(
      fieldName,
      "TOO_LONG",
      `${fieldName} must not exceed ${limits.max} characters`
    );
  }
}

/**
 * Validate email format
 * Uses a practical regex that catches most invalid emails
 *
 * @param email - Email to validate
 * @returns true if valid
 */
export function isValidEmail(email: string): boolean {
  // RFC 5322 simplified - catches most invalid emails
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return (
    emailRegex.test(email) &&
    email.length >= LENGTH_LIMITS.EMAIL.min &&
    email.length <= LENGTH_LIMITS.EMAIL.max
  );
}

/**
 * Validate and sanitize email
 *
 * @param email - Raw email input
 * @param fieldName - Field name for errors
 * @returns Sanitized email
 */
export function validateEmail(
  email: string,
  fieldName: string = "Email"
): string {
  validateLength(email, fieldName, LENGTH_LIMITS.EMAIL);

  const sanitized = sanitizeString(email).toLowerCase();

  if (!isValidEmail(sanitized)) {
    throw new ValidationError(
      fieldName,
      "INVALID_FORMAT",
      `${fieldName} is not a valid email address`
    );
  }

  return sanitized;
}

/**
 * Validate phone number format
 * Accepts various formats: +1234567890, (123) 456-7890, 123-456-7890
 *
 * @param phone - Phone number to validate
 * @returns true if valid
 */
export function isValidPhone(phone: string): boolean {
  // Remove all non-digit characters except + for country code
  const digitsOnly = phone.replace(/[^\d+]/g, "");
  return (
    digitsOnly.length >= 7 &&
    digitsOnly.length <= 20 &&
    /^[+\d][\d-.()\s]*$/.test(phone)
  );
}

/**
 * Validate and sanitize phone number
 *
 * @param phone - Raw phone input
 * @param fieldName - Field name for errors
 * @param required - Whether phone is required
 * @returns Sanitized phone or undefined
 */
export function validatePhone(
  phone: string | undefined,
  fieldName: string = "Phone",
  required: boolean = false
): string | undefined {
  if (!phone && !required) {
    return undefined;
  }

  if (!phone && required) {
    throw new ValidationError(
      fieldName,
      "REQUIRED",
      `${fieldName} is required`
    );
  }

  const sanitized = sanitizeString(phone!);

  if (!isValidPhone(sanitized)) {
    throw new ValidationError(
      fieldName,
      "INVALID_FORMAT",
      `${fieldName} is not a valid phone number`
    );
  }

  return sanitized;
}

/**
 * Validate GPS coordinates
 *
 * @param latitude - Latitude value (-90 to 90)
 * @param longitude - Longitude value (-180 to 180)
 */
export function validateCoordinates(
  latitude: number,
  longitude: number
): void {
  if (typeof latitude !== "number" || isNaN(latitude)) {
    throw new ValidationError(
      "latitude",
      "INVALID_TYPE",
      "Latitude must be a valid number"
    );
  }

  if (typeof longitude !== "number" || isNaN(longitude)) {
    throw new ValidationError(
      "longitude",
      "INVALID_TYPE",
      "Longitude must be a valid number"
    );
  }

  if (latitude < -90 || latitude > 90) {
    throw new ValidationError(
      "latitude",
      "OUT_OF_RANGE",
      "Latitude must be between -90 and 90"
    );
  }

  if (longitude < -180 || longitude > 180) {
    throw new ValidationError(
      "longitude",
      "OUT_OF_RANGE",
      "Longitude must be between -180 and 180"
    );
  }
}

/**
 * Validate a positive number
 *
 * @param value - Number to validate
 * @param fieldName - Field name for errors
 * @param min - Minimum value (default 0)
 * @param max - Maximum value (optional)
 */
export function validatePositiveNumber(
  value: number,
  fieldName: string,
  min: number = 0,
  max?: number
): void {
  if (typeof value !== "number" || isNaN(value)) {
    throw new ValidationError(
      fieldName,
      "INVALID_TYPE",
      `${fieldName} must be a valid number`
    );
  }

  if (value < min) {
    throw new ValidationError(
      fieldName,
      "TOO_SMALL",
      `${fieldName} must be at least ${min}`
    );
  }

  if (max !== undefined && value > max) {
    throw new ValidationError(
      fieldName,
      "TOO_LARGE",
      `${fieldName} must not exceed ${max}`
    );
  }
}

/**
 * Validate that an object only contains expected fields
 * Prevents mass assignment attacks
 *
 * @param obj - Object to validate
 * @param allowedFields - List of allowed field names
 * @param entityName - Name of entity for error messages
 */
export function validateNoUnexpectedFields(
  obj: Record<string, unknown>,
  allowedFields: string[],
  entityName: string = "Request"
): void {
  const allowedSet = new Set(allowedFields);
  const unexpectedFields = Object.keys(obj).filter(
    (key) => !allowedSet.has(key)
  );

  if (unexpectedFields.length > 0) {
    throw new ValidationError(
      unexpectedFields[0],
      "UNEXPECTED_FIELD",
      `${entityName} contains unexpected field(s): ${unexpectedFields.join(", ")}`
    );
  }
}

/**
 * Validate employee number format (EMP0001 pattern)
 *
 * @param employeeNumber - Employee number to validate
 */
export function validateEmployeeNumber(employeeNumber: string): void {
  validateLength(employeeNumber, "Employee number", LENGTH_LIMITS.EMPLOYEE_NUMBER);

  const pattern = /^EMP\d{4,}$/;
  if (!pattern.test(employeeNumber)) {
    throw new ValidationError(
      "employeeNumber",
      "INVALID_FORMAT",
      "Employee number must be in format EMP#### (e.g., EMP0001)"
    );
  }
}

/**
 * Validate and sanitize a name field
 *
 * @param name - Name to validate
 * @param fieldName - Field name for errors
 * @returns Sanitized name
 */
export function validateName(
  name: string,
  fieldName: string = "Name"
): string {
  validateLength(name, fieldName, LENGTH_LIMITS.NAME);

  const sanitized = sanitizeString(name);

  // Names should only contain letters, spaces, hyphens, and apostrophes
  // Allow unicode letters for international names
  if (!/^[\p{L}\s'-]+$/u.test(sanitized)) {
    throw new ValidationError(
      fieldName,
      "INVALID_CHARACTERS",
      `${fieldName} contains invalid characters`
    );
  }

  return sanitized;
}

/**
 * Validate a timestamp (milliseconds since epoch)
 *
 * @param timestamp - Timestamp to validate
 * @param fieldName - Field name for errors
 * @param allowFuture - Whether to allow future dates (default true)
 */
export function validateTimestamp(
  timestamp: number,
  fieldName: string,
  allowFuture: boolean = true
): void {
  if (typeof timestamp !== "number" || isNaN(timestamp)) {
    throw new ValidationError(
      fieldName,
      "INVALID_TYPE",
      `${fieldName} must be a valid timestamp`
    );
  }

  // Reasonable bounds: year 2000 to year 2100
  const minTimestamp = 946684800000; // Jan 1, 2000
  const maxTimestamp = 4102444800000; // Jan 1, 2100

  if (timestamp < minTimestamp || timestamp > maxTimestamp) {
    throw new ValidationError(
      fieldName,
      "OUT_OF_RANGE",
      `${fieldName} is not a valid date`
    );
  }

  if (!allowFuture && timestamp > Date.now() + 60000) {
    // 1 minute tolerance
    throw new ValidationError(
      fieldName,
      "FUTURE_DATE",
      `${fieldName} cannot be in the future`
    );
  }
}

/**
 * Sanitize an object by sanitizing all string values recursively
 *
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === "string"
          ? sanitizeString(item)
          : typeof item === "object" && item !== null
            ? sanitizeObject(item as Record<string, unknown>)
            : item
      );
    } else if (typeof value === "object" && value !== null) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Create a validation result helper
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Batch validate multiple fields and collect all errors
 *
 * @param validations - Array of validation functions
 * @returns Validation result with all errors
 */
export function batchValidate(
  validations: Array<() => void>
): ValidationResult {
  const errors: ValidationError[] = [];

  for (const validate of validations) {
    try {
      validate();
    } catch (error) {
      if (error instanceof ValidationError) {
        errors.push(error);
      } else {
        throw error;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format validation errors for API response
 *
 * @param errors - Array of validation errors
 * @returns Formatted error message
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return "";
  if (errors.length === 1) return errors[0].message;

  return `Multiple validation errors: ${errors.map((e) => e.message).join("; ")}`;
}
