// Clerk authentication configuration for Convex
// You'll need to update the domain with your actual Clerk domain from your Clerk dashboard

export default {
  providers: [
    {
      // Replace with your Clerk domain (found in Clerk dashboard under API Keys)
      // Example: "https://your-app-name.clerk.accounts.dev"
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN || "https://REPLACE_WITH_YOUR_CLERK_DOMAIN.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
