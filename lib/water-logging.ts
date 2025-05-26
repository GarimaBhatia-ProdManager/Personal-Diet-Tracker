import { supabase } from "./supabase"

export interface WaterEntry {
  id: string
  user_id: string
  glasses_consumed: number
  date: string
  created_at: string
  updated_at: string
}

// Log or update water intake for a specific date
export async function logWaterIntake(userId: string, glasses: number, date?: string): Promise<WaterEntry | null> {
  try {
    const targetDate = date || new Date().toISOString().split("T")[0]

    // Check if entry exists for today
    const { data: existingEntry } = await supabase
      .from("water_entries")
      .select("*")
      .eq("user_id", userId)
      .eq("date", targetDate)
      .maybeSingle()

    if (existingEntry) {
      // Update existing entry
      const { data, error } = await supabase
        .from("water_entries")
        .update({
          glasses_consumed: glasses,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingEntry.id)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // Create new entry
      const { data, error } = await supabase
        .from("water_entries")
        .insert([
          {
            user_id: userId,
            glasses_consumed: glasses,
            date: targetDate,
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    }
  } catch (error) {
    console.error("Error logging water intake:", error)
    return null
  }
}

// Get water intake for a specific date
export async function getWaterIntake(userId: string, date?: string): Promise<number> {
  try {
    const targetDate = date || new Date().toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("water_entries")
      .select("glasses_consumed")
      .eq("user_id", userId)
      .eq("date", targetDate)
      .maybeSingle()

    if (error) throw error
    return data?.glasses_consumed || 0
  } catch (error) {
    console.error("Error getting water intake:", error)
    return 0
  }
}

// Get water intake history for multiple days
export async function getWaterHistory(userId: string, days = 7): Promise<WaterEntry[]> {
  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    const { data, error } = await supabase
      .from("water_entries")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate.toISOString().split("T")[0])
      .lte("date", endDate.toISOString().split("T")[0])
      .order("date", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error getting water history:", error)
    return []
  }
}
