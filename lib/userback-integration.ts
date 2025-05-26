"use client"

// Userback integration for feedback capture
export interface UserbackFeedback {
  rating?: number
  category?: string
  message: string
  email?: string
  screenshot?: string
  url?: string
  userAgent?: string
}

export function initializeUserback() {
  if (typeof window === "undefined") return

  const userbackToken = process.env.NEXT_PUBLIC_USERBACK_TOKEN

  if (!userbackToken) {
    console.warn("Userback token not found")
    return
  }

  // Initialize Userback widget
  window.Userback = window.Userback || {}
  window.Userback.access_token = userbackToken

  // Configure Userback
  window.Userback.widget_settings = {
    trigger_color: "#3b82f6",
    trigger_position: "bottom-right",
    trigger_background_color: "#ffffff",
    main_button_background_color: "#3b82f6",
    rating_trigger: true,
    screenshot_trigger: true,
    feedback_trigger: true,
  }

  // Load Userback script
  const script = document.createElement("script")
  script.src = `https://static.userback.io/widget/v1.js`
  script.async = true
  document.head.appendChild(script)

  // Listen for Userback events
  window.Userback.on_close = (data: any) => {
    console.log("Userback feedback submitted:", data)

    // Also save to our Supabase database
    if (data && data.feedback) {
      saveFeedbackToSupabase({
        message: data.feedback.message || "",
        rating: data.feedback.rating,
        category: data.feedback.category || "userback",
        email: data.feedback.email,
        screenshot: data.feedback.screenshot,
        url: window.location.href,
        userAgent: navigator.userAgent,
      })
    }
  }
}

async function saveFeedbackToSupabase(feedback: UserbackFeedback) {
  try {
    const { submitFeedbackToSupabase } = await import("@/lib/actions/feedback-actions")
    const { supabase } = await import("@/lib/supabase")

    const {
      data: { user },
    } = await supabase.auth.getUser()

    await submitFeedbackToSupabase(user?.id || null, {
      rating: feedback.rating || 0,
      category: feedback.category || "userback",
      message: feedback.message,
      email: feedback.email,
      feedbackType: "userback_widget",
      metadata: {
        screenshot: feedback.screenshot,
        url: feedback.url,
        userAgent: feedback.userAgent,
        source: "userback_widget",
      },
    })
  } catch (error) {
    console.error("Error saving Userback feedback to Supabase:", error)
  }
}

// Declare global Userback interface
declare global {
  interface Window {
    Userback: any
  }
}
