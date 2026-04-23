import { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * Hook to automatically sync Clerk user to Convex database on login.
 * Syncs user profile data (name, email) while preserving any existing role
 * stored in Convex. Roles are managed in Convex — NOT in Clerk metadata.
 * Call this hook once in your App component.
 */
export function useUserSync() {
  const { user, isLoaded } = useUser();
  const syncUser = useMutation(api.users.syncUser);

  useEffect(() => {
    if (isLoaded && user) {
      // Sync user profile data to Convex on every login.
      // The syncUser mutation in Convex preserves the existing role
      // if one is already set, so passing role=undefined is safe.
      syncUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
      }).catch((error) => {
        console.error("[useUserSync] Failed to sync user:", error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id]); // Only re-run when user ID changes
}
