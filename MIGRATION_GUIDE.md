# Authentication Refactor Migration Guide

## Overview

The application has been refactored to use Convex as the single source of truth for user roles instead of Clerk's publicMetadata. This improves reliability, simplifies role management, and provides immediate consistency.

## What Changed

### Before
- User roles stored in Clerk's `publicMetadata.role`
- Role updates required Clerk API calls
- Session polling needed after role changes
- Role checks read from Clerk session

### After
- User roles stored in Convex `users` table
- Role updates are immediate Convex mutations
- No session polling needed
- Role checks query Convex database

## Migration Steps

### Step 1: Identify Existing Users

If you have existing users in your system who were assigned roles using the old Clerk metadata system, you need to migrate their roles to Convex.

First, check if you have any users without roles in Convex:

```typescript
// In your admin dashboard or using Convex CLI
const usersWithoutRoles = await convex.query(api.users.getUsersWithoutRoles);
console.log('Users needing migration:', usersWithoutRoles);
```

### Step 2: Option A - Let Users Go Through Onboarding

The simplest approach is to let users without roles go through the onboarding flow again. They will:
1. Log in
2. Be automatically redirected to `/onboarding`
3. Select their role (admin or employee)
4. Be redirected to their dashboard

### Step 3: Option B - Manual Role Assignment

If you need to preserve specific role assignments without requiring users to go through onboarding, an admin can manually assign roles:

```typescript
// In your admin dashboard
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

function AdminMigrationTool() {
  const setRoleForUser = useMutation(api.users.setRoleForUser);

  const migrateUser = async (userId: Id<"users">, role: "admin" | "employee") => {
    await setRoleForUser({ userId, role });
  };

  // ... UI implementation
}
```

## New Admin Functions

The refactor introduces new mutations for role management:

### Promote User to Admin
```typescript
const promoteToAdmin = useMutation(api.users.promoteToAdmin);
await promoteToAdmin({ userId: "user_id_here" });
```

### Demote User to Employee
```typescript
const demoteToEmployee = useMutation(api.users.demoteToEmployee);
await demoteToEmployee({ userId: "user_id_here" });
```

### Set Role During Migration
```typescript
const setRoleForUser = useMutation(api.users.setRoleForUser);
await setRoleForUser({ userId: "user_id_here", role: "admin" });
```

## Security Improvements

1. **Backend-Controlled**: All role changes now happen through Convex mutations with proper authorization checks
2. **No Client-Side Manipulation**: Roles cannot be modified from the frontend
3. **Immediate Consistency**: Role changes are immediately reflected without session delays
4. **Audit Trail**: All role changes are logged on the backend

## Breaking Changes

### Frontend
- `user.publicMetadata.role` no longer used
- Components now query Convex for user roles
- No more session polling after role changes

### Backend
- `getUserRole()` is now async and requires Convex context
- `setUserRole` changed from action to mutation
- Removed Clerk API dependencies for role management

## Rollback Plan

If you need to rollback:

1. Revert to previous git commit
2. Existing roles in Convex will remain but won't be used
3. Clerk metadata will be the source of truth again

Note: The old Clerk metadata is not automatically deleted by this refactor, so rollback is safe.

## Testing Checklist

- [ ] New user signup flow
- [ ] User onboarding (role selection)
- [ ] Admin dashboard access with admin role
- [ ] Employee dashboard access with employee role
- [ ] Access denial for wrong roles
- [ ] Admin promoting user to admin
- [ ] Admin demoting admin to employee
- [ ] Self-demotion prevention
- [ ] Role persistence across sessions

## Support

If you encounter issues during migration:

1. Check Convex dashboard for user data
2. Verify roles are set in the `users` table
3. Check browser console for errors
4. Review server logs for mutation errors

## Next Steps

After migration is complete:

1. Monitor for any authentication issues
2. Consider removing Clerk metadata cleanup (optional)
3. Update any documentation referencing old auth system
4. Train admins on new role management functions
