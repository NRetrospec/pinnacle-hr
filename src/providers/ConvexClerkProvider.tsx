import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

interface ConvexClerkProviderProps {
  children: ReactNode;
}

function EnvSetupScreen({ missing }: { missing: string[] }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, -apple-system, sans-serif",
      background: "#0f172a",
      color: "#e2e8f0",
      padding: "2rem"
    }}>
      <div style={{
        maxWidth: "640px",
        width: "100%",
        background: "#1e293b",
        borderRadius: "12px",
        padding: "2rem",
        border: "1px solid #334155"
      }}>
        <h1 style={{ margin: "0 0 1rem", color: "#f8fafc", fontSize: "1.5rem" }}>
          ⚙️ Environment Setup Required
        </h1>
        <p style={{ margin: "0 0 1.5rem", lineHeight: 1.6, color: "#94a3b8" }}>
          The following environment variables are missing from your <code>.env.local</code> file:
        </p>
        <ul style={{ paddingLeft: "1.25rem", margin: "0 0 1.5rem", lineHeight: 1.8, color: "#f87171" }}>
          {missing.map((v) => (
            <li key={v}><code>{v}</code></li>
          ))}
        </ul>

        <h2 style={{ margin: "0 0 0.75rem", color: "#f8fafc", fontSize: "1.1rem" }}>Quick Start</h2>
        <ol style={{ paddingLeft: "1.25rem", margin: "0 0 1.5rem", lineHeight: 1.8, color: "#cbd5e1" }}>
          <li>
            <strong>Get Clerk keys:</strong> Go to{" "}
            <a href="https://dashboard.clerk.com" target="_blank" rel="noreferrer" style={{ color: "#60a5fa" }}>
              dashboard.clerk.com
            </a>{" "}
            → API Keys → copy <strong>Publishable key</strong>.
          </li>
          <li>
            <strong>Get Convex URL:</strong> Run <code style={{ background: "#0f172a", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>npx convex dev</code> in your terminal and copy the deployment URL.
          </li>
          <li>
            Paste them into your <code>.env.local</code> file:
          </li>
        </ol>

        <pre style={{
          background: "#0f172a",
          padding: "1rem",
          borderRadius: "8px",
          overflow: "auto",
          fontSize: "0.85rem",
          border: "1px solid #334155",
          color: "#e2e8f0"
        }}>
{`VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY
VITE_CONVEX_URL=https://your-project.convex.cloud`}
        </pre>

        <p style={{ margin: "1.5rem 0 0", color: "#94a3b8", fontSize: "0.9rem" }}>
          <strong>Remember:</strong> Restart the Vite dev server after saving <code>.env.local</code> for changes to take effect.
        </p>
      </div>
    </div>
  );
}

/**
 * Combined provider that wraps the app with both Clerk and Convex
 * This allows Convex to use Clerk's authentication tokens
 */
export function ConvexClerkProvider({ children }: ConvexClerkProviderProps) {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;
  const convexUrl = import.meta.env.VITE_CONVEX_URL as string;

  const missing: string[] = [];
  if (!publishableKey) missing.push("VITE_CLERK_PUBLISHABLE_KEY");
  if (!convexUrl) missing.push("VITE_CONVEX_URL");

  if (missing.length > 0) {
    return <EnvSetupScreen missing={missing} />;
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
