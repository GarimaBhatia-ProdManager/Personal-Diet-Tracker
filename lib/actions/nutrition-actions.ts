import { getDailyNutritionSummary as getDailyNutritionSummaryFromLib } from "@/lib/meal-logging"

export const getDailyNutritionSummary = async (userId: string, date: string) => {
  try {
    // Directly use the function from lib/meal-logging.ts
    const summary = await getDailyNutritionSummaryFromLib(userId, date)
    return summary
  } catch (error) {
    console.error("Error in nutrition-actions:", error)
    throw error
  }
}
