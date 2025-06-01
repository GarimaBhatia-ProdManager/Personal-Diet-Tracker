"use server"

import { supabase } from "@/lib/supabase"

export interface FeedbackData {
  rating: number
  category: string
  message: string
  email?: string
  feedbackType?: string
  metadata?: any
}

export async function submitFeedbackToSupabase(userId: string | null, feedbackData: FeedbackData) {
  try {
    const istDate = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    })

    const { data, error } = await supabase
      .from("user_feedback")
      .insert({
        user_id: userId,
        rating: feedbackData.rating,
        category: feedbackData.category,
        message: feedbackData.message,
        user_email: feedbackData.email,
        feedback_type: feedbackData.feedbackType || "general",
        ist_date: istDate,
        metadata: feedbackData.metadata || {},
        created_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("Error submitting feedback:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    console.log("Feedback submitted successfully:", data)
    return {
      success: true,
      data: data[0],
    }
  } catch (error) {
    console.error("Error submitting feedback:", error)
    return {
      success: false,
      error: "Failed to submit feedback",
    }
  }
}

export async function getFeedbackStats(userId?: string) {
  try {
    let query = supabase.from("user_feedback").select("rating, category, created_at, ist_date")

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query.order("created_at", { ascending: false }).limit(100)

    if (error) {
      console.error("Error fetching feedback stats:", error)
      return { success: false, error: error.message }
    }

    // Calculate stats
    const totalFeedback = data.length
    const avgRating = data.length > 0 ? data.reduce((sum, item) => sum + item.rating, 0) / data.length : 0

    const categoryStats = data.reduce(
      (acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      success: true,
      stats: {
        totalFeedback,
        avgRating: Math.round(avgRating * 10) / 10,
        categoryStats,
        recentFeedback: data.slice(0, 5),
      },
    }
  } catch (error) {
    console.error("Error fetching feedback stats:", error)
    return { success: false, error: "Failed to fetch stats" }
  }
}
