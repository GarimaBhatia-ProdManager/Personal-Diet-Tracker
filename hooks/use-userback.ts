"use client"

import { useCallback, useEffect } from "react"
import { useUserbackContext } from "@/components/userback-provider"
import { secureUserback } from "@/lib/secure-userback"
import { fallbackFeedback } from "@/lib/fallback-feedback"
import { trackEvent } from "@/lib/analytics"
import { logFeedbackEvent } from "@/lib/actions/userback-actions"

interface UseUserbackOptions {
  user?: {
    id: string
    name?: string
    email?: string
  }
  metadata?: Record<string, any>
}

export function useUserback(options: UseUserbackOptions) {
  const { isInitialized, hasToken, useFallback, isLoading, error } = useUserbackContext()

  // Set user information when Userback is ready (with error handling)
  useEffect(() => {
    if (isInitialized && hasToken && options.user && secureUserback.isReady()) {
      try {
        secureUserback.setUser(options.user)
      } catch (error) {
        console.warn("Failed to set Userback user:", error)
      }
    }
  }, [isInitialized, hasToken, options.user])

  // Set metadata when Userback is ready (with error handling)
  useEffect(() => {
    if (isInitialized && hasToken && options.metadata && secureUserback.isReady()) {
      try {
        secureUserback.setMetadata(options.metadata)
      } catch (error) {
        console.warn("Failed to set Userback metadata:", error)
      }
    }
  }, [isInitialized, hasToken, options.metadata])

  const showFeedback = useCallback(async () => {
    const method = useFallback ? "email_fallback" : "userback_widget"

    // Track the event
    trackEvent({
      event_type: "feedback_widget_opened",
      event_data: { trigger: "manual", method },
    })

    // Log server-side
    await logFeedbackEvent("feedback_opened", options.user?.id, { method })

    if (useFallback) {
      fallbackFeedback.showFeedback()
    } else {
      try {
        secureUserback.show()
      } catch (error) {
        console.warn("Userback show failed, using fallback:", error)
        fallbackFeedback.showFeedback()
      }
    }
  }, [useFallback, options.user?.id])

  const triggerBugReport = useCallback(async () => {
    const method = useFallback ? "email_fallback" : "userback_widget"

    trackEvent({
      event_type: "feedback_bug_report_triggered",
      event_data: { trigger: "manual", method },
    })

    await logFeedbackEvent("bug_report", options.user?.id, { method })

    if (useFallback) {
      fallbackFeedback.triggerBugReport()
    } else {
      try {
        secureUserback.triggerBugReport()
      } catch (error) {
        console.warn("Userback bug report failed, using fallback:", error)
        fallbackFeedback.triggerBugReport()
      }
    }
  }, [useFallback, options.user?.id])

  const triggerFeatureRequest = useCallback(async () => {
    const method = useFallback ? "email_fallback" : "userback_widget"

    trackEvent({
      event_type: "feedback_feature_request_triggered",
      event_data: { trigger: "manual", method },
    })

    await logFeedbackEvent("feature_request", options.user?.id, { method })

    if (useFallback) {
      fallbackFeedback.triggerFeatureRequest()
    } else {
      try {
        secureUserback.triggerFeatureRequest()
      } catch (error) {
        console.warn("Userback feature request failed, using fallback:", error)
        fallbackFeedback.triggerFeatureRequest()
      }
    }
  }, [useFallback, options.user?.id])

  const triggerGeneralFeedback = useCallback(async () => {
    const method = useFallback ? "email_fallback" : "userback_widget"

    trackEvent({
      event_type: "feedback_general_triggered",
      event_data: { trigger: "manual", method },
    })

    await logFeedbackEvent("general_feedback", options.user?.id, { method })

    if (useFallback) {
      fallbackFeedback.triggerGeneralFeedback()
    } else {
      try {
        secureUserback.triggerGeneralFeedback()
      } catch (error) {
        console.warn("Userback general feedback failed, using fallback:", error)
        fallbackFeedback.triggerGeneralFeedback()
      }
    }
  }, [useFallback, options.user?.id])

  const updateUserContext = useCallback(
    (context: Record<string, any>) => {
      if (!useFallback && secureUserback.isReady()) {
        try {
          secureUserback.updateContext(context)
        } catch (error) {
          console.warn("Failed to update Userback context:", error)
        }
      }
    },
    [useFallback],
  )

  return {
    isEnabled: true, // Always enabled
    isInitialized,
    isLoading,
    error,
    useFallback,
    hasVisualFeedback: !useFallback,
    showFeedback,
    hideFeedback: useCallback(() => {
      if (!useFallback && secureUserback.isReady()) {
        try {
          secureUserback.hide()
        } catch (error) {
          console.warn("Failed to hide Userback:", error)
        }
      }
    }, [useFallback]),
    triggerBugReport,
    triggerFeatureRequest,
    triggerGeneralFeedback,
    updateUserContext,
  }
}
