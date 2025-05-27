import { supabase } from "./supabase"
import type { NormalizedFood } from "./food-database"
import { addCustomFood } from "./food-database"
import { getISTDateTime } from "./timezone-utils"

export interface MealEntry {
  id: string
  user_id: string
  food_id: string
  food_name: string
  food_brand?: string
  meal_type: "breakfast" | "lunch" | "dinner" | "snack"
  serving_size: number
  serving_unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
  logged_at: string
  created_at: string
  food_source: "usda" | "openfoodfacts" | "local" | "custom"
  food_image?: string
  ist_date: string
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

// Enhanced meal logging with database integration
export async function logMealEntryEnhanced(
  userId: string,
  food: NormalizedFood,
  mealType: "breakfast" | "lunch" | "dinner" | "snack",
  servingSize = 1,
  servingUnit = "serving",
  customLoggedAt?: string,
): Promise<MealEntry | null> {
  try {
    const now = getISTDateTime()
    const loggedAt = customLoggedAt || now

    const istDate = new Date(loggedAt).toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    })

    // If it's a custom food that doesn't exist in database, add it
    let foodId = food.id
    if (food.source === "custom" && food.id.startsWith("custom-")) {
      const customFoodData = {
        name: food.name,
        brand: food.brand,
        calories_per_100g: Math.round(food.calories),
        protein_per_100g: food.protein,
        carbs_per_100g: food.carbs,
        fat_per_100g: food.fat,
        fiber_per_100g: food.fiber,
        sugar_per_100g: food.sugar,
        sodium_per_100g: food.sodium,
        serving_size: food.serving,
        serving_weight_g: 100,
      }

      const dbFood = await addCustomFood(customFoodData)
      if (dbFood) {
        foodId = dbFood.id
      }
    }

    const mealEntry: Omit<MealEntry, "id" | "created_at"> = {
      user_id: userId,
      food_id: foodId,
      food_name: food.name,
      food_brand: food.brand,
      meal_type: mealType,
      serving_size: servingSize,
      serving_unit: servingUnit,
      calories: Math.round(food.calories * servingSize),
      protein: Math.round(food.protein * servingSize * 10) / 10,
      carbs: Math.round(food.carbs * servingSize * 10) / 10,
      fat: Math.round(food.fat * servingSize * 10) / 10,
      fiber: food.fiber ? Math.round(food.fiber * servingSize * 10) / 10 : undefined,
      sugar: food.sugar ? Math.round(food.sugar * servingSize * 10) / 10 : undefined,
      sodium: food.sodium ? Math.round(food.sodium * servingSize * 1000) / 1000 : undefined,
      logged_at: loggedAt,
      food_source: food.source,
      food_image: food.image,
      ist_date: istDate,
    }

    const { data, error } = await supabase.from("meal_entries").insert([mealEntry]).select().single()

    if (error) {
      console.error("Error logging meal entry:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error in logMealEntryEnhanced:", error)
    return null
  }
}

// Get meal entries for a specific IST date
export async function getMealEntriesForDate(userId: string, istDate: string): Promise<MealEntry[]> {
  try {
    const { data, error } = await supabase
      .from("meal_entries")
      .select("*")
      .eq("user_id", userId)
      .eq("ist_date", istDate)
      .order("logged_at", { ascending: true })

    if (error) {
      console.error("Error fetching meal entries:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error in getMealEntriesForDate:", error)
    return []
  }
}

// Get daily nutrition summary
export async function getDailyNutritionSummary(userId: string, istDate: string): Promise<DailyNutritionSummary> {
  try {
    const meals = await getMealEntriesForDate(userId, istDate)

    const summary: DailyNutritionSummary = {
      date: istDate,
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
      date: istDate,
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

// Delete a meal entry
export async function deleteMealEntry(entryId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("meal_entries").delete().eq("id", entryId)

    if (error) {
      console.error("Error deleting meal entry:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Error in deleteMealEntry:", error)
    return false
  }
}

// Get weekly meal summary
export async function getWeeklyMealSummary(userId: string, endDate: string): Promise<DailyNutritionSummary[]> {
  try {
    const summaries: DailyNutritionSummary[] = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date(endDate)
      date.setDate(date.getDate() - i)
      const istDate = date.toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      })

      const summary = await getDailyNutritionSummary(userId, istDate)
      summaries.push(summary)
    }

    return summaries
  } catch (error) {
    console.error("Error in getWeeklyMealSummary:", error)
    return []
  }
}
