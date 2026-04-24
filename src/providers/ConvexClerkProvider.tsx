import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

interface ConvexClerkProviderProps {
  children: ReactNode;
}

/**
 * Combined provider that wraps the app with both Clerk and Convex
 * This allows Convex to use Clerk's authentication tokens
 */
export function ConvexClerkProvider({ children }: ConvexClerkProviderProps) {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;
  const convexUrl = import.meta.env.VITE_CONVEX_URL as string;

  if (!publishableKey) {
    throw new Error(
      "Missing VITE_CLERK_PUBLISHABLE_KEY environment variable. " +
      "Ensure it is set in your .env.local file and restart the dev server."
    );
  }

  if (!convexUrl) {
    throw new Error(
      "Missing VITE_CONVEX_URL environment variable. " +
      "Run 'npx convex dev' to get your deployment URL, add it to .env.local, and restart the dev server."
    );
  }

  // Lazy-initialize the client so validation runs first and gives a clear error
  const convex = useMemo(() => new ConvexReactClient(convexUrl), [convexUrl]);

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
