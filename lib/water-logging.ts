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
    const now = getISTDateTime()

    // Check if entry exists for the IST date
    const { data: existingEntry, error: fetchError } = await supabase
      .from("water_entries")
      .select("*")
      .eq("user_id", userId)
      .eq("ist_date", targetDate)
      .maybeSingle()

    if (fetchError) {
      console.error("Error checking existing water entry:", fetchError)
      return null
    }

    if (existingEntry) {
      // Update existing entry
      const { data, error: updateError } = await supabase
        .from("water_entries")
        .update({
          glasses_consumed: glasses,
          logged_at: now,
          updated_at: now,
        })
        .eq("id", existingEntry.id)
        .select()
        .single()

      if (updateError) {
        console.error("Error updating water entry:", updateError)
        return null
      }
      return data
    } else {
      // Create new entry
      const { data, error: insertError } = await supabase
        .from("water_entries")
        .insert([
          {
            user_id: userId,
            glasses_consumed: glasses,
            ist_date: targetDate,
            logged_at: now,
          },
        ])
        .select()
        .single()

      if (insertError) {
        console.error("Error creating water entry:", insertError)
        return null
      }
      return data
    }
  } catch (error) {
    console.error("Error logging water intake:", error)
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

    const { data, error } = await supabase
      .from("water_entries")
      .select("glasses_consumed")
      .eq("user_id", userId)
      .eq("ist_date", targetDate)
      .maybeSingle()

    if (error) {
      console.error("Error getting water intake:", error)
      return 0
    }
    return data?.glasses_consumed || 0
  } catch (error) {
    console.error("Error getting water intake:", error)
    return 0
  }
}

// Get water intake history for multiple IST dates
export async function getWaterHistory(userId: string, days = 7): Promise<WaterEntry[]> {
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

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error getting water history:", error)
    return []
  }
}

// Get water intake for a date range
export async function getWaterIntakeRange(userId: string, startDate: string, endDate: string): Promise<WaterEntry[]> {
  try {
    const { data, error } = await supabase
      .from("water_entries")
      .select("*")
      .eq("user_id", userId)
      .gte("ist_date", startDate)
      .lte("ist_date", endDate)
      .order("ist_date", { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error getting water intake range:", error)
    return []
  }
}
