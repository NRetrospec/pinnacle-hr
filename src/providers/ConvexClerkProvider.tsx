import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

// Initialize Convex client
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

interface ConvexClerkProviderProps {
  children: ReactNode;
}

/**
 * Combined provider that wraps the app with both Clerk and Convex
 * This allows Convex to use Clerk's authentication tokens
 */
export function ConvexClerkProvider({ children }: ConvexClerkProviderProps) {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

  if (!publishableKey) {
    throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY environment variable");
  }

  if (!import.meta.env.VITE_CONVEX_URL) {
    throw new Error("Missing VITE_CONVEX_URL environment variable");
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
