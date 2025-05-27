import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  email: string
  full_name: string
  age?: number
  height?: number
  weight?: number
  activity_level?: string
  goal_type?: string
  daily_calories?: number
  daily_protein?: number
  daily_carbs?: number
  daily_fat?: number
  created_at: string
  updated_at: string
}

export interface Food {
  id: string
  name: string
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
  created_at: string
}

export interface MealEntry {
  id: string
  user_id: string
  food_id: string
  meal_type: "breakfast" | "lunch" | "dinner" | "snack"
  serving_size: number
  serving_unit: string
  logged_at: string
  created_at: string
  food?: Food
}

export interface UserProfile {
  id: string
  user_id: string
  full_name: string
  age?: number
  height?: number
  weight?: number
  activity_level?: string
  goal_type?: string
  daily_calories?: number
  daily_protein?: number
  daily_carbs?: number
  daily_fat?: number
  dietary_restrictions?: string
  created_at: string
  updated_at: string
}

export type UserProfileType = UserProfile
