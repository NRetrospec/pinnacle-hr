import { useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface ProtectedRouteProps {
  children: ReactNode;
  requireRole?: "admin" | "employee";
}

/**
 * Wrapper component that protects routes requiring authentication
 * Optionally can require a specific role (admin or employee)
 * IMPORTANT: Roles are stored in Convex database, not Clerk metadata
 */
export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { user, isLoaded } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);

  // Show loading spinner while checking authentication
  if (!isLoaded || currentUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role if specified
  if (requireRole) {
    const userRole = currentUser?.role;

    // If user doesn't have a role yet, redirect to onboarding
    if (!userRole) {
      return <Navigate to="/onboarding" replace />;
    }

    // If user has wrong role, redirect to their proper dashboard
    if (userRole !== requireRole) {
      return <Navigate to={`/${userRole}`} replace />;
    }
  }

  return <>{children}</>;
}
