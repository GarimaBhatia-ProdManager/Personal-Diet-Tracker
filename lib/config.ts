// Environment configuration for external services

export const config = {
  // App configuration
  app: {
    name: "Personal Diet Tracker",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
  },

  // Client-side feature flags (no sensitive data)
  features: {
    feedbackEnabled: true, // Always enable feedback (will use email fallback)
    analyticsEnabled: true,
  },
}

// Note: All sensitive tokens and API keys have been removed from client-side code
// The app uses secure email-based feedback collection instead
