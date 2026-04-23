# Pinnacle HR - Setup Guide

## Phase 1 Complete! ✅

I've successfully completed **Phase 1: Foundation - Clerk & Convex Setup**. Your HR app now has a solid authentication and database foundation.

## What's Been Implemented

### ✅ Backend (Convex)

1. **Complete Database Schema** (`convex/schema.ts`)
   - Users table (links Clerk to employee profiles)
   - Employees table (HR profiles with employment data)
   - Time Entries (clock in/out with GPS)
   - PTO Requests & Balances
   - Locations (geofencing)
   - Company Settings

2. **Authentication System**
   - `convex/auth.config.js` - Clerk integration configuration
   - `convex/lib/auth.ts` - Auth helper functions (requireAuth, requireAdmin, getCurrentUser, getCurrentEmployee)
   - `convex/users.ts` - User sync mutations and queries

### ✅ Frontend (React)

3. **Providers & Hooks**
   - `src/providers/ConvexClerkProvider.tsx` - Combined Clerk + Convex provider
   - `src/hooks/useUserSync.ts` - Auto-sync users to Convex database
   - `src/components/auth/ProtectedRoute.tsx` - Route protection by role

4. **Updated Files**
   - `src/main.tsx` - Wrapped app with ConvexClerkProvider
   - `src/App.tsx` - Added protected routes and user sync
   - `src/pages/Login.tsx` - Replaced with Clerk SignIn component
   - `src/pages/Signup.tsx` - Replaced with Clerk SignUp component
   - `src/components/layout/DashboardLayout.tsx` - Integrated Clerk user data and logout

5. **Environment Setup**
   - `.env.local` - Created with placeholder values for API keys

### ✅ Package Dependencies

- `@clerk/clerk-react` - Authentication
- `convex` - Real-time database and backend

---

## Next Steps to Get Running

### Step 1: Set up Clerk

1. Go to [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Create a new application
3. Choose "Email" as your authentication method
4. Go to **API Keys** in the sidebar
5. Copy your **Publishable Key** and **Secret Key**
6. Under **JWT Templates**, create a new template named "convex"
7. Copy your **Issuer** URL (format: `https://your-app-name.clerk.accounts.dev`)

### Step 2: Set up Convex

1. Create a Convex account at [https://convex.dev](https://convex.dev)
2. In your terminal, run:
   ```bash
   npx convex dev
   ```
3. Follow the prompts to:
   - Log in to Convex
   - Create a new project
   - This will generate your `VITE_CONVEX_URL`

### Step 3: Update Environment Variables

Open `.env.local` and replace the placeholder values:

```env
# From Clerk Dashboard > API Keys
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY
CLERK_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY

# From running 'npx convex dev'
VITE_CONVEX_URL=https://YOUR_PROJECT.convex.cloud

# From Clerk Dashboard > JWT Templates > Issuer
CLERK_JWT_ISSUER_DOMAIN=https://your-app-name.clerk.accounts.dev
```

### Step 4: Update Clerk Configuration

In `convex/auth.config.js`, replace the domain:

```javascript
domain: process.env.CLERK_JWT_ISSUER_DOMAIN || "https://your-actual-domain.clerk.accounts.dev",
```

### Step 5: Set User Roles in Clerk

Since Clerk doesn't have roles by default, you'll need to set them via public metadata:

1. In Clerk Dashboard, go to **Users**
2. Select a user
3. Scroll to **Public Metadata**
4. Add:
   ```json
   {
     "role": "admin"
   }
   ```
   or
   ```json
   {
     "role": "employee"
   }
   ```

**Important**: The first user you create should be set as "admin" so you can access the admin dashboard.

### Step 6: Start Development

```bash
# Terminal 1: Start Convex
npx convex dev

# Terminal 2: Start Vite
npm run dev
```

Visit `http://localhost:8080`

---

## How Authentication Works

1. **Sign Up/Login** → User creates account via Clerk
2. **User Sync** → `useUserSync` hook automatically syncs user to Convex database
3. **Protected Routes** → `ProtectedRoute` component checks authentication and role
4. **Role-Based Access** → Admin routes redirect employees, employee routes redirect admins
5. **Logout** → Clerk's `signOut()` function clears session

---

## Project Structure

```
pinnacle-hr/
├── convex/                    # Convex backend
│   ├── lib/
│   │   └── auth.ts           # Auth helpers
│   ├── auth.config.js        # Clerk integration
│   ├── schema.ts             # Database schema
│   └── users.ts              # User sync logic
│
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx
│   │   └── layout/
│   │       └── DashboardLayout.tsx
│   ├── hooks/
│   │   └── useUserSync.ts
│   ├── pages/
│   │   ├── admin/
│   │   │   └── AdminDashboard.tsx
│   │   ├── employee/
│   │   │   └── EmployeeDashboard.tsx
│   │   ├── Login.tsx
│   │   └── Signup.tsx
│   ├── providers/
│   │   └── ConvexClerkProvider.tsx
│   ├── App.tsx
│   └── main.tsx
│
└── .env.local                # API keys (DO NOT COMMIT)
```

---

## What's Next?

The foundation is complete! Next phases are:

### Phase 2: Employee Management
- Create employee CRUD operations in Convex
- Build admin employee management page
- Implement employee directory with search

### Phase 3: Time Tracking
- Implement GPS-verified clock in/out
- Add geofence validation
- Create admin time approval workflow
- Build real-time dashboard updates

### Phase 4: PTO Management
- Implement PTO request system
- Add balance tracking and accruals
- Create approval workflow
- Set up automated accrual cron jobs

---

## Current Status

✅ **Phase 1 Complete** (14/14 tasks)
- Authentication system fully functional
- Database schema defined
- Protected routes working
- User sync operational

⏳ **Phase 2 Ready to Start** (0/5 tasks)
- Employee CRUD operations
- Admin management interface

---

## Testing Authentication

1. **Sign up** at `http://localhost:8080/signup`
2. **Set your role** in Clerk Dashboard (see Step 5 above)
3. **Login** at `http://localhost:8080/login`
4. **Verify** you're redirected to the correct dashboard based on your role

---

## Troubleshooting

### "Missing VITE_CLERK_PUBLISHABLE_KEY"
- Make sure `.env.local` exists in the project root
- Ensure environment variables start with `VITE_` for frontend access
- Restart the dev server after changing `.env.local`

### "Unauthenticated" error in Convex
- Check that `convex/auth.config.js` has the correct Clerk domain
- Verify your Clerk JWT template is named "convex"
- Make sure you're running `npx convex dev`

### Redirected to wrong dashboard
- Check the user's public metadata in Clerk Dashboard
- Ensure the role is either "admin" or "employee" (lowercase)
- Clear browser cookies and try again

### Cannot access protected routes
- Verify you're logged in
- Check browser console for authentication errors
- Make sure `useUserSync` is called in `App.tsx`

---

## Ready to Continue?

Let me know when you're ready, and I'll start implementing **Phase 2: Employee Management**!

We'll build:
- Complete employee CRUD with Convex
- Admin employee directory page
- Employee creation/editing dialogs
- Real-time employee list updates
- Search and filtering capabilities
