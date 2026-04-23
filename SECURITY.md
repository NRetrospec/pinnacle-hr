# Security Documentation

## Overview

This document outlines the security measures implemented in the Pinnacle HR application following OWASP best practices.

## 1. Rate Limiting

### Implementation
Rate limiting is implemented via `convex/lib/rateLimit.ts` using a database-backed token bucket algorithm with sliding windows.

### Rate Limit Presets

| Preset | Max Requests | Window | Use Case |
|--------|-------------|--------|----------|
| `PUBLIC_AUTH` | 5 | 1 min | Login, signup attempts |
| `AUTHENTICATED` | 60 | 1 min | Standard API calls |
| `SENSITIVE` | 10 | 1 min | Role changes, deletions |
| `ADMIN` | 100 | 1 min | Admin bulk operations |
| `TIME_CLOCK` | 10 | 5 min | Clock in/out |
| `QUERY` | 120 | 1 min | Read operations |

### Error Response
When rate limited, users receive a 429-style error with retry information:
```
Too many requests. Please wait X seconds before trying again.
```

### Endpoints Protected
All mutation endpoints have rate limiting:
- `users:*` - User management
- `employees:*` - Employee CRUD
- `timeEntries:*` - Clock in/out, status updates
- `documents:*` - Document management
- `locations:*` - Location management

## 2. Input Validation & Sanitization

### Implementation
Input validation is implemented via `convex/lib/validation.ts`.

### Validation Rules

#### String Fields
- All strings are trimmed and sanitized
- HTML entities are encoded to prevent XSS
- Null bytes and zero-width characters are removed
- Unicode is normalized (NFC)

#### Length Limits
| Field Type | Min | Max |
|------------|-----|-----|
| Email | 5 | 254 |
| Phone | 7 | 20 |
| Name | 1 | 100 |
| Employee Number | 1 | 20 |
| Title | 1 | 200 |
| Description | 0 | 2000 |
| Notes | 0 | 5000 |
| Address | 1 | 500 |

#### Numeric Fields
- GPS coordinates: latitude [-90, 90], longitude [-180, 180]
- Geofence radius: 10m - 50km
- Pay rate: 0 - 10000
- PTO rates: 0 - 100/1000

#### Format Validation
- Email: RFC 5322 simplified pattern
- Phone: International formats supported
- Employee Number: `EMP####` format
- Timestamps: Year 2000-2100 range

### Mass Assignment Protection
Each endpoint declares allowed fields explicitly. Unexpected fields are rejected:
```typescript
const ALLOWED_FIELDS = ["firstName", "lastName", "email"];
validateNoUnexpectedFields(args, ALLOWED_FIELDS, "Employee");
```

## 3. API Key Management

### Environment Variables

| Variable | Type | Client Exposed | Purpose |
|----------|------|----------------|---------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Public | Yes | Clerk frontend auth |
| `CLERK_SECRET_KEY` | Secret | **NO** | Server-side auth |
| `VITE_CONVEX_URL` | Semi-public | Yes | Convex endpoint |
| `CLERK_JWT_ISSUER_DOMAIN` | Config | No | JWT validation |

### Security Measures
1. `.env.local` is in `.gitignore` (never committed)
2. `.env.example` contains only placeholder values
3. Secret keys (sk_*) are only used server-side
4. Publishable keys (pk_*) are safe for client-side use

### Key Rotation
To rotate keys:
1. Generate new keys in Clerk Dashboard
2. Update `.env.local` with new values
3. Redeploy Convex functions
4. Invalidate old keys in Clerk Dashboard

## 4. Authentication & Authorization

### Authentication Flow
1. User authenticates via Clerk (OIDC/JWT)
2. Clerk issues JWT token
3. Convex validates JWT on every request
4. User identity extracted from validated token

### Role-Based Access Control (RBAC)

| Role | Capabilities |
|------|--------------|
| `admin` | Full access to all data and operations |
| `employee` | Own time entries, clock in/out |

### Authorization Checks
- `requireAuth()` - Validates authentication
- `requireAdmin()` - Validates admin role
- `isAdmin()` - Safe check returning boolean
- `getCurrentEmployee()` - Returns only user's own data

### Role Assignment Security
- Initial role set during onboarding only
- Role changes only by admin after onboarding
- Self-demotion prevented (admin lockout protection)
- All role changes are audit logged

## 5. Audit Logging

### Events Logged

| Event Type | Severity | Trigger |
|------------|----------|---------|
| `rate_limit_exceeded` | Medium/High | Rate limit hit |
| `auth_failure` | Medium | Auth failures |
| `permission_denied` | Medium/High | Unauthorized access |
| `suspicious_activity` | Medium | Anomalies detected |
| `role_change` | High | Any role modification |
| `admin_action` | Low/Medium | Admin operations |

### Log Retention
- Audit logs retained for 90 days
- Automatic cleanup via scheduled function
- No PII stored in log metadata

## 6. Data Protection

### Sensitive Data Handling
- Document fields can be marked as `sensitive: true`
- Bank info, tax info, personal info stored in documents table
- All string data sanitized before storage

### Data Isolation
- Employees can only access own time entries
- Admin-only access to employee data, documents, locations
- User data isolated by Clerk ID

## 7. API Security

### Request Validation
1. JWT token validated by Convex
2. User identity extracted
3. Rate limit checked
4. Input validated and sanitized
5. Authorization verified
6. Operation executed

### Error Handling
- Specific error messages for validation failures
- Generic errors for security-sensitive operations
- No stack traces exposed to clients

## 8. Scheduled Maintenance

### Cron Jobs
| Job | Schedule | Purpose |
|-----|----------|---------|
| `cleanup-expired-rate-limits` | Every 15 min | Remove expired rate limit records |
| `cleanup-old-audit-logs` | Daily 3 AM UTC | Remove logs >90 days old |

## 9. OWASP Compliance

### Addressed Vulnerabilities

| OWASP ID | Name | Mitigation |
|----------|------|------------|
| A01:2021 | Broken Access Control | RBAC, server-side auth checks |
| A02:2021 | Cryptographic Failures | Clerk handles password hashing |
| A03:2021 | Injection | Input sanitization, Convex ORM |
| A04:2021 | Insecure Design | Rate limiting, validation |
| A05:2021 | Security Misconfiguration | Env vars, .gitignore |
| A07:2021 | Auth Failures | Clerk auth, role validation |

## 10. Security Checklist for Deployment

Before deploying to production:

- [ ] Replace test keys with production keys
- [ ] Verify `.env.local` is not in git history
- [ ] Enable Clerk production mode
- [ ] Review rate limit thresholds
- [ ] Test all authorization flows
- [ ] Verify audit logging is working
- [ ] Configure CORS if needed
- [ ] Set up monitoring/alerting
- [ ] Document incident response procedures

## 11. Reporting Security Issues

If you discover a security vulnerability:

1. **Do not** open a public GitHub issue
2. Email security concerns to the development team
3. Include steps to reproduce
4. Allow reasonable time for a fix before disclosure
