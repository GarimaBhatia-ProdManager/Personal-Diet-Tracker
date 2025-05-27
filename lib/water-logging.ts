import { supabase } from "./supabase"
import { getISTDate } from "./timezone-utils"

export interface WaterEntry {
  id: string
  user_id: string
  glasses_consumed: number
  ist_date: string // YYYY-MM-DD in IST
}

// Log or update water intake for a specific IST date
export async function logWaterIntake(userId: string, glasses: number, istDate?: string): Promise<WaterEntry | null> {
  if (!userId) {
    console.error("[Water] User ID is required for logging water intake")
    return null
  }

  if (glasses < 0) {
    console.error("[Water] Glasses consumed cannot be negative")
    return null
  }

  try {
    const targetDate = istDate || getISTDate()
    console.log(`[Water] Attempting to log water intake:`, {
      userId,
      glasses,
      targetDate,
    })

    // Check if entry exists first
    const { data: existingEntry, error: checkError } = await supabase
      .from("water_entries")
      .select("id")
      .eq("user_id", userId)
      .eq("ist_date", targetDate)
      .single()

    if (checkError && checkError.code !== "PGRST116") { // PGRST116 is the "no rows returned" error
      console.error("[Water] Error checking for existing entry:", checkError)
      return null
    }

    if (existingEntry) {
      // Update existing entry
      console.log("[Water] Updating existing entry:", existingEntry.id)
      const { data: updateData, error: updateError } = await supabase
        .from("water_entries")
        .update({ glasses_consumed: glasses })
        .eq("id", existingEntry.id)
        .select()
        .single()

      if (updateError) {
        console.error("[Water] Error updating entry:", updateError)
        return null
      }

      console.log("[Water] Successfully updated entry:", updateData)
      return updateData
    }

    // Create new entry
    console.log("[Water] Creating new entry")
    const { data: insertData, error: insertError } = await supabase
      .from("water_entries")
      .insert([{
        user_id: userId,
        glasses_consumed: glasses,
        ist_date: targetDate
      }])
      .select()
      .single()

    if (insertError) {
      console.error("[Water] Error creating entry:", insertError)
      return null
    }

    console.log("[Water] Successfully created entry:", insertData)
    return insertData
  } catch (error) {
    console.error("[Water] Unexpected error:", error)
    return null
  }
}

// Get water intake for a specific IST date
export async function getWaterIntake(userId: string, istDate?: string): Promise<number> {
  if (!userId) {
    console.error("[Water] User ID is required for getting water intake")
    return 0
  }

  try {
    const targetDate = istDate || getISTDate()
    console.log(`[Water] Getting water intake for:`, {
      userId,
      targetDate,
    })

    const { data, error } = await supabase
      .from("water_entries")
      .select("glasses_consumed")
      .eq("user_id", userId)
      .eq("ist_date", targetDate)
      .single()

    if (error) {
      if (error.code === "PGRST116") { // No rows found
        console.log("[Water] No water entry found for today")
        return 0
      }
      console.error("[Water] Error fetching water intake:", error)
      return 0
    }

    console.log("[Water] Retrieved water intake:", data?.glasses_consumed || 0)
    return data?.glasses_consumed || 0
  } catch (error) {
    console.error("[Water] Unexpected error:", error)
    return 0
  }
}

// Get water intake history for multiple IST dates
export async function getWaterHistory(userId: string, days = 7): Promise<WaterEntry[]> {
  if (!userId) {
    console.error("[Water] User ID is required")
    return []
  }

  try {
    const endDate = getISTDate()
    const startDate = getISTDate(-days + 1)
    console.log(`[Water] Getting history:`, {
      userId,
      startDate,
      endDate,
    })

    const { data, error } = await supabase
      .from("water_entries")
      .select("id, user_id, glasses_consumed, ist_date")
      .eq("user_id", userId)
      .gte("ist_date", startDate)
      .lte("ist_date", endDate)
      .order("ist_date", { ascending: false })

    if (error) {
      console.error("[Water] Error fetching history:", error)
      return []
    }

    console.log("[Water] Retrieved entries:", data?.length || 0)
    return data || []
  } catch (error) {
    console.error("[Water] Unexpected error:", error)
    return []
  }
}

// Get water intake for a date range
export async function getWaterIntakeRange(userId: string, startDate: string, endDate: string): Promise<WaterEntry[]> {
  if (!userId) {
    console.error("[Water] User ID is required")
    return []
  }

  try {
    console.log(`[Water] Getting range:`, {
      userId,
      startDate,
      endDate,
    })

    const { data, error } = await supabase
      .from("water_entries")
      .select("id, user_id, glasses_consumed, ist_date")
      .eq("user_id", userId)
      .gte("ist_date", startDate)
      .lte("ist_date", endDate)
      .order("ist_date", { ascending: true })

    if (error) {
      console.error("[Water] Error fetching range:", error)
      return []
    }

    console.log("[Water] Retrieved entries:", data?.length || 0)
    return data || []
  } catch (error) {
    console.error("[Water] Unexpected error:", error)
    return []
  }
}
