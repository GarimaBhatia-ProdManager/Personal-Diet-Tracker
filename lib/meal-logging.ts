import { supabase } from "./supabase"
import type { FoodSearchResult } from "./food-apis"

export interface MealEntry {
  id: string
  user_id: string
  food_name: string
  food_source: string
  serving_size: number
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
  meal_type: "breakfast" | "lunch" | "dinner" | "snack"
  logged_at: string
  created_at: string
}

export async function logMealEntry(
  userId: string,
  food: FoodSearchResult,
  mealType: "breakfast" | "lunch" | "dinner" | "snack",
  servingMultiplier = 1,
): Promise<MealEntry | null> {
  try {
    const mealEntry = {
      user_id: userId,
      food_name: food.name,
      food_source: food.source,
      serving_size: servingMultiplier,
      calories: Math.round(food.calories * servingMultiplier),
      protein: Number((food.protein * servingMultiplier).toFixed(1)),
      carbs: Number((food.carbs * servingMultiplier).toFixed(1)),
      fat: Number((food.fat * servingMultiplier).toFixed(1)),
      fiber: food.fiber ? Number((food.fiber * servingMultiplier).toFixed(1)) : 0,
      sugar: food.sugar ? Number((food.sugar * servingMultiplier).toFixed(1)) : 0,
      sodium: food.sodium ? Number((food.sodium * servingMultiplier).toFixed(1)) : 0,
      meal_type: mealType,
      logged_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("meal_entries").insert(mealEntry).select().single()

    if (error) {
      console.error("Error logging meal:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in logMealEntry:", error)
    return null
  }
}

export async function getMealEntriesForDate(userId: string, date: string): Promise<MealEntry[]> {
  try {
    const startOfDay = `${date}T00:00:00.000Z`
    const endOfDay = `${date}T23:59:59.999Z`

    const { data, error } = await supabase
      .from("meal_entries")
      .select("*")
      .eq("user_id", userId)
      .gte("logged_at", startOfDay)
      .lte("logged_at", endOfDay)
      .order("logged_at", { ascending: false })

    if (error) {
      console.error("Error fetching meal entries:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getMealEntriesForDate:", error)
    return []
  }
}

export async function deleteMealEntry(entryId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("meal_entries").delete().eq("id", entryId)

    if (error) {
      console.error("Error deleting meal entry:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteMealEntry:", error)
    return false
  }
}

export interface DailyNutritionSummary {
  date: string
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  total_fiber: number
  total_sugar: number
  total_sodium: number
  meal_count: number
  meals_by_type: {
    breakfast: number
    lunch: number
    dinner: number
    snack: number
  }
}

export async function getDailyNutritionSummary(userId: string, date: string): Promise<DailyNutritionSummary> {
  try {
    const meals = await getMealEntriesForDate(userId, date)

    const summary: DailyNutritionSummary = {
      date,
      total_calories: 0,
      total_protein: 0,
      total_carbs: 0,
      total_fat: 0,
      total_fiber: 0,
      total_sugar: 0,
      total_sodium: 0,
      meal_count: meals.length,
      meals_by_type: {
        breakfast: 0,
        lunch: 0,
        dinner: 0,
        snack: 0,
      },
    }

    meals.forEach((meal) => {
      summary.total_calories += meal.calories
      summary.total_protein += meal.protein
      summary.total_carbs += meal.carbs
      summary.total_fat += meal.fat
      summary.total_fiber += meal.fiber || 0
      summary.total_sugar += meal.sugar || 0
      summary.total_sodium += meal.sodium || 0
      summary.meals_by_type[meal.meal_type]++
    })

    // Round to reasonable decimal places
    summary.total_protein = Math.round(summary.total_protein * 10) / 10
    summary.total_carbs = Math.round(summary.total_carbs * 10) / 10
    summary.total_fat = Math.round(summary.total_fat * 10) / 10
    summary.total_fiber = Math.round(summary.total_fiber * 10) / 10
    summary.total_sugar = Math.round(summary.total_sugar * 10) / 10
    summary.total_sodium = Math.round(summary.total_sodium * 1000) / 1000

    return summary
  } catch (error) {
    console.error("Error in getDailyNutritionSummary:", error)
    return {
      date,
      total_calories: 0,
      total_protein: 0,
      total_carbs: 0,
      total_fat: 0,
      total_fiber: 0,
      total_sugar: 0,
      total_sodium: 0,
      meal_count: 0,
      meals_by_type: { breakfast: 0, lunch: 0, dinner: 0, snack: 0 },
    }
  }
}

export async function getWeeklyMealSummary(userId: string, endDate: string): Promise<DailyNutritionSummary[]> {
  try {
    const summaries: DailyNutritionSummary[] = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date(endDate)
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split("T")[0]

      const summary = await getDailyNutritionSummary(userId, dateString)
      summaries.push(summary)
    }

    return summaries
  } catch (error) {
    console.error("Error in getWeeklyMealSummary:", error)
    return []
  }
}
