import { supabase } from "./supabase"
import { getISTDateTime, getISTDate } from "./timezone-utils"

export interface WaterEntry {
  id: string
  user_id: string
  glasses_consumed: number
  ist_date: string // YYYY-MM-DD in IST
  logged_at: string // UTC timestamp when last updated
  created_at: string // UTC timestamp
  updated_at: string // UTC timestamp
}

// Log or update water intake for a specific IST date
export async function logWaterIntake(userId: string, glasses: number, istDate?: string): Promise<WaterEntry | null> {
  if (!userId) {
    console.error("User ID is required for logging water intake")
    return null
  }

  if (glasses < 0) {
    console.error("Glasses consumed cannot be negative")
    return null
  }

  try {
    const targetDate = istDate || getISTDate()
    console.log(`Logging water intake for user ${userId} on ${targetDate}: ${glasses} glasses`)

    // First try to update existing entry
    const { data: existingEntry, error: checkError } = await supabase
      .from("water_entries")
      .select("*")
      .match({ user_id: userId, ist_date: targetDate })
      .maybeSingle()

    if (checkError) {
      console.error("Error checking existing water entry:", checkError)
      return null
    }

    if (existingEntry) {
      // Update existing entry
      const { data: updateData, error: updateError } = await supabase
        .from("water_entries")
        .update({
          glasses_consumed: glasses,
          updated_at: new Date().toISOString(),
        })
        .match({ id: existingEntry.id })
        .select()
        .single()

      if (updateError) {
        console.error("Error updating water entry:", updateError)
        return null
      }

      console.log("Successfully updated existing water entry:", updateData)
      return updateData
    }

    // If no existing entry found, create a new one
    const { data: insertData, error: insertError } = await supabase
      .from("water_entries")
      .insert([
        {
          user_id: userId,
          glasses_consumed: glasses,
          ist_date: targetDate,
          logged_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (insertError) {
      console.error("Error inserting water entry:", insertError)
      return null
    }

    console.log("Successfully created new water entry:", insertData)
    return insertData
  } catch (error) {
    console.error("Error in logWaterIntake:", error)
    return null
  }
}

// Get water intake for a specific IST date
export async function getWaterIntake(userId: string, istDate?: string): Promise<number> {
  if (!userId) {
    console.error("User ID is required for getting water intake")
    return 0
  }

  try {
    const targetDate = istDate || getISTDate()
    console.log(`Getting water intake for user ${userId} on ${targetDate}`)

    const { data, error } = await supabase
      .from("water_entries")
      .select("glasses_consumed")
      .match({ user_id: userId, ist_date: targetDate })
      .maybeSingle()

    if (error) {
      console.error("Error fetching water intake:", error)
      return 0
    }

    const glassesConsumed = data?.glasses_consumed || 0
    console.log("Retrieved water intake:", glassesConsumed)
    return glassesConsumed
  } catch (error) {
    console.error("Error in getWaterIntake:", error)
    return 0
  }
}

// Get water intake history for multiple IST dates
export async function getWaterHistory(userId: string, days = 7): Promise<WaterEntry[]> {
  if (!userId) {
    console.error("User ID is required for getting water history")
    return []
  }

  try {
    const endDate = getISTDate()
    const startDate = getISTDate(-days + 1)

    const { data, error } = await supabase
      .from("water_entries")
      .select("*")
      .eq("user_id", userId)
      .gte("ist_date", startDate)
      .lte("ist_date", endDate)
      .order("ist_date", { ascending: false })

    if (error) {
      console.error("Error getting water history:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getWaterHistory:", error)
    return []
  }
}

// Get water intake for a date range
export async function getWaterIntakeRange(userId: string, startDate: string, endDate: string): Promise<WaterEntry[]> {
  if (!userId) {
    console.error("User ID is required for getting water intake range")
    return []
  }

  try {
    const { data, error } = await supabase
      .from("water_entries")
      .select("*")
      .eq("user_id", userId)
      .gte("ist_date", startDate)
      .lte("ist_date", endDate)
      .order("ist_date", { ascending: true })

    if (error) {
      console.error("Error getting water intake range:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getWaterIntakeRange:", error)
    return []
  }
}
