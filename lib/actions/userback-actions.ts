"use server"

// Server action to get Userback configuration
export async function getUserbackConfig(userId?: string) {
  try {
    // Get the Userback token from environment (server-side only)
    const userbackToken = process.env.NEXT_PUBLIC_USERBACK_TOKEN

    if (!userbackToken) {
      console.warn("Userback token not found, using fallback")
      return {
        success: false,
        hasToken: false,
        error: "Token not configured",
      }
    }

    // Return success status without exposing the token
    return {
      success: true,
      hasToken: true,
      userId: userId,
      timestamp: Date.now(),
      // Add any server-side context you want to include
      serverContext: {
        environment: process.env.NODE_ENV,
        version: "1.0.0",
      },
    }
  } catch (error) {
    console.error("Error getting Userback config:", error)
    return {
      success: false,
      hasToken: false,
      error: "Failed to get configuration",
    }
  }
}

// Server action to log feedback events (optional analytics)
export async function logFeedbackEvent(eventType: string, userId?: string, metadata?: any) {
  try {
    // You could log to your database or analytics service here
    console.log("Feedback event:", {
      eventType,
      userId,
      metadata,
      timestamp: new Date().toISOString(),
    })

    return { success: true }
  } catch (error) {
    console.error("Error logging feedback event:", error)
    return { success: false }
  }
}
