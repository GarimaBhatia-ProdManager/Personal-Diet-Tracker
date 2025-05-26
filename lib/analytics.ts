"use client"

import React from "react"
import { supabase } from "./supabase"
import { getISTDateTime, getISTDate } from "./timezone-utils"

// Types for analytics events
export interface AnalyticsEvent {
  event_type: string
  event_data?: Record<string, any>
  user_id?: string
  ist_date?: string // Add IST date for easier querying
}

export interface SessionData {
  session_id: string
  user_id: string
  start_time: string // UTC
  end_time?: string // UTC
  duration_seconds?: number
  pages_visited: string[]
  device_info: Record<string, any>
  ist_date: string // IST date when session started
}

export interface FeatureUsage {
  feature_name: string
  action: string
  metadata?: Record<string, any>
  ist_date?: string
}

// Analytics event types
export const ANALYTICS_EVENTS = {
  // Page/Tab Navigation
  PAGE_VIEW: "page_view",
  TAB_SWITCH: "tab_switch",

  // Dashboard Events
  DASHBOARD_VIEW: "dashboard_view",
  CALORIE_CIRCLE_VIEW: "calorie_circle_view",
  MACRO_RING_VIEW: "macro_ring_view",
  QUICK_ADD_CLICK: "quick_add_click",

  // Meal Logging Events
  MEAL_SEARCH_START: "meal_search_start",
  MEAL_SEARCH_RESULT: "meal_search_result",
  MEAL_ADDED: "meal_added",
  MEAL_DELETED: "meal_deleted",
  CUSTOM_FOOD_ADDED: "custom_food_added",

  // Water Tracking
  WATER_GLASS_ADDED: "water_glass_added",
  WATER_GLASS_REMOVED: "water_glass_removed",
  WATER_GOAL_ACHIEVED: "water_goal_achieved",

  // Profile & Goals
  PROFILE_VIEW: "profile_view",
  PROFILE_EDIT_START: "profile_edit_start",
  PROFILE_UPDATED: "profile_updated",
  GOAL_ADJUSTED: "goal_adjusted",

  // Trends & Analytics
  TRENDS_VIEW: "trends_view",
  WEEKLY_TRENDS_VIEW: "weekly_trends_view",
  MONTHLY_TRENDS_VIEW: "monthly_trends_view",
  INSIGHTS_VIEW: "insights_view",

  // Session Events
  SESSION_START: "session_start",
  SESSION_END: "session_end",

  // Feature Usage
  CAMERA_OPENED: "camera_opened",
  VOICE_INPUT_STARTED: "voice_input_started",
  VOICE_INPUT_STOPPED: "voice_input_stopped",

  // Authentication
  LOGIN_SUCCESS: "login_success",
  LOGOUT: "logout",
  SIGNUP_SUCCESS: "signup_success",

  // Engagement
  STREAK_VIEWED: "streak_viewed",
  ACHIEVEMENT_UNLOCKED: "achievement_unlocked",
} as const

// Session management with IST support
class SessionManager {
  private sessionId: string
  private startTime: Date
  private pagesVisited: Set<string>
  private userId: string | null = null

  constructor() {
    this.sessionId = this.generateSessionId()
    this.startTime = new Date()
    this.pagesVisited = new Set()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  setUserId(userId: string) {
    this.userId = userId
    this.startSession()
  }

  addPageVisit(page: string) {
    this.pagesVisited.add(page)
  }

  private async startSession() {
    if (!this.userId) return

    try {
      const istDate = getISTDate()

      await supabase.from("user_sessions").insert([
        {
          user_id: this.userId,
          session_id: this.sessionId,
          start_time: this.startTime.toISOString(),
          pages_visited: Array.from(this.pagesVisited),
          device_info: this.getDeviceInfo(),
          ist_date: istDate,
        },
      ])
    } catch (error) {
      console.error("Error starting session:", error)
    }
  }

  async endSession() {
    if (!this.userId) return

    try {
      const endTime = new Date()
      const duration = Math.floor((endTime.getTime() - this.startTime.getTime()) / 1000)

      await supabase
        .from("user_sessions")
        .update({
          end_time: endTime.toISOString(),
          duration_seconds: duration,
          pages_visited: Array.from(this.pagesVisited),
        })
        .eq("session_id", this.sessionId)
        .eq("user_id", this.userId)
    } catch (error) {
      console.error("Error ending session:", error)
    }
  }

  private getDeviceInfo() {
    return {
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      screen_width: typeof window !== "undefined" ? window.screen.width : null,
      screen_height: typeof window !== "undefined" ? window.screen.height : null,
      viewport_width: typeof window !== "undefined" ? window.innerWidth : null,
      viewport_height: typeof window !== "undefined" ? window.innerHeight : null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: typeof navigator !== "undefined" ? navigator.language : "",
    }
  }

  getSessionId() {
    return this.sessionId
  }
}

// Global session manager instance
export const sessionManager = new SessionManager()

// Core analytics functions with IST support
export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user && !event.user_id) {
      console.warn("No user found for analytics event:", event.event_type)
      return
    }

    const userId = event.user_id || user?.id
    const istDate = getISTDate()

    await supabase.from("user_analytics").insert([
      {
        user_id: userId,
        event_type: event.event_type,
        event_data: {
          ...event.event_data,
          session_id: sessionManager.getSessionId(),
          timestamp: getISTDateTime(),
          url: typeof window !== "undefined" ? window.location.pathname : "",
        },
        ist_date: istDate,
      },
    ])
  } catch (error) {
    console.error("Error tracking event:", error)
  }
}

export async function trackFeatureUsage(usage: FeatureUsage): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const istDate = usage.ist_date || getISTDate()

    // Use upsert to increment usage count
    await supabase.from("feature_usage").upsert(
      {
        user_id: user.id,
        feature_name: usage.feature_name,
        action: usage.action,
        metadata: usage.metadata,
        usage_count: 1,
        last_used: getISTDateTime(),
        ist_date: istDate,
      },
      {
        onConflict: "user_id,feature_name,action",
        ignoreDuplicates: false,
      },
    )

    // Also track as regular analytics event
    await trackEvent({
      event_type: "feature_usage",
      event_data: {
        feature_name: usage.feature_name,
        action: usage.action,
        ...usage.metadata,
      },
    })
  } catch (error) {
    console.error("Error tracking feature usage:", error)
  }
}

export async function trackAuthEvent(
  eventType: string,
  email?: string,
  success = true,
  errorMessage?: string,
): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const istDate = getISTDate()

    await supabase.from("auth_events").insert([
      {
        user_id: user?.id || null,
        event_type: eventType,
        email,
        success,
        error_message: errorMessage,
        ip_address: null, // Would need server-side implementation for real IP
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        ist_date: istDate,
      },
    ])
  } catch (error) {
    console.error("Error tracking auth event:", error)
  }
}

// Page tracking hook
export function usePageTracking(pageName: string) {
  React.useEffect(() => {
    sessionManager.addPageVisit(pageName)

    trackEvent({
      event_type: ANALYTICS_EVENTS.PAGE_VIEW,
      event_data: {
        page: pageName,
        referrer: typeof document !== "undefined" ? document.referrer : "",
      },
    })
  }, [pageName])
}

// Time tracking hook
export function useTimeTracking(feature: string) {
  const startTimeRef = React.useRef<Date>()

  React.useEffect(() => {
    startTimeRef.current = new Date()

    return () => {
      if (startTimeRef.current) {
        const duration = Date.now() - startTimeRef.current.getTime()
        trackEvent({
          event_type: "time_spent",
          event_data: {
            feature,
            duration_ms: duration,
            duration_seconds: Math.floor(duration / 1000),
          },
        })
      }
    }
  }, [feature])
}

// Analytics helper functions
export const analytics = {
  // Dashboard tracking
  trackDashboardView: () => trackEvent({ event_type: ANALYTICS_EVENTS.DASHBOARD_VIEW }),

  trackTabSwitch: (fromTab: string, toTab: string) =>
    trackEvent({
      event_type: ANALYTICS_EVENTS.TAB_SWITCH,
      event_data: { from_tab: fromTab, to_tab: toTab },
    }),

  // Meal logging tracking
  trackMealSearch: (query: string, resultCount: number) =>
    trackEvent({
      event_type: ANALYTICS_EVENTS.MEAL_SEARCH_RESULT,
      event_data: { query, result_count: resultCount },
    }),

  trackMealAdded: (foodName: string, mealType: string, calories: number, source: string) =>
    trackEvent({
      event_type: ANALYTICS_EVENTS.MEAL_ADDED,
      event_data: { food_name: foodName, meal_type: mealType, calories, source },
    }),

  trackCustomFoodAdded: (foodName: string, calories: number) =>
    trackEvent({
      event_type: ANALYTICS_EVENTS.CUSTOM_FOOD_ADDED,
      event_data: { food_name: foodName, calories },
    }),

  // Water tracking
  trackWaterGlassAdded: (newTotal: number) =>
    trackEvent({
      event_type: ANALYTICS_EVENTS.WATER_GLASS_ADDED,
      event_data: { new_total: newTotal },
    }),

  trackWaterGoalAchieved: (glassesConsumed: number) =>
    trackEvent({
      event_type: ANALYTICS_EVENTS.WATER_GOAL_ACHIEVED,
      event_data: { glasses_consumed: glassesConsumed },
    }),

  // Profile tracking
  trackProfileUpdated: (changedFields: string[]) =>
    trackEvent({
      event_type: ANALYTICS_EVENTS.PROFILE_UPDATED,
      event_data: { changed_fields: changedFields },
    }),

  trackGoalAdjusted: (goalType: string, oldValue: number, newValue: number) =>
    trackEvent({
      event_type: ANALYTICS_EVENTS.GOAL_ADJUSTED,
      event_data: { goal_type: goalType, old_value: oldValue, new_value: newValue },
    }),

  // Feature usage tracking
  trackQuickAddClick: (foodName: string) =>
    trackFeatureUsage({
      feature_name: "quick_add",
      action: "click",
      metadata: { food_name: foodName },
    }),

  trackCameraUsage: () =>
    trackFeatureUsage({
      feature_name: "camera",
      action: "open",
    }),

  trackVoiceInput: (action: "start" | "stop") =>
    trackFeatureUsage({
      feature_name: "voice_input",
      action,
    }),

  // Engagement tracking
  trackStreakViewed: (streakDays: number) =>
    trackEvent({
      event_type: ANALYTICS_EVENTS.STREAK_VIEWED,
      event_data: { streak_days: streakDays },
    }),
}

// Initialize session tracking
if (typeof window !== "undefined") {
  // Track session end on page unload
  window.addEventListener("beforeunload", () => {
    sessionManager.endSession()
  })

  // Track session end on visibility change (mobile app backgrounding)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      sessionManager.endSession()
    }
  })
}
