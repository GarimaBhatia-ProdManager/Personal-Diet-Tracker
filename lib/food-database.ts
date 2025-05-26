import { supabase } from "./supabase"

export interface DatabaseFood {
  id: string
  name: string
  brand?: string
  barcode?: string
  source: "usda" | "openfoodfacts" | "local" | "custom"
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
  fiber_per_100g?: number
  sugar_per_100g?: number
  sodium_per_100g?: number
  serving_size: string
  serving_weight_g: number
  ingredients?: string
  image_url?: string
  category?: string
  external_id?: string
  api_data?: any
  created_at: string
  updated_at: string
  last_fetched: string
}

export interface NormalizedFood {
  id: string
  name: string
  brand?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
  serving: string
  source: "usda" | "openfoodfacts" | "local" | "custom"
  image?: string
  barcode?: string
}

// Convert database food to normalized format
export function normalizeFromDatabase(dbFood: DatabaseFood): NormalizedFood {
  const servingWeight = dbFood.serving_weight_g || 100
  const factor = servingWeight / 100 // Convert from per-100g to per-serving

  return {
    id: dbFood.id,
    name: dbFood.name,
    brand: dbFood.brand,
    calories: Math.round(dbFood.calories_per_100g * factor),
    protein: Math.round(dbFood.protein_per_100g * factor * 10) / 10,
    carbs: Math.round(dbFood.carbs_per_100g * factor * 10) / 10,
    fat: Math.round(dbFood.fat_per_100g * factor * 10) / 10,
    fiber: dbFood.fiber_per_100g ? Math.round(dbFood.fiber_per_100g * factor * 10) / 10 : undefined,
    sugar: dbFood.sugar_per_100g ? Math.round(dbFood.sugar_per_100g * factor * 10) / 10 : undefined,
    sodium: dbFood.sodium_per_100g ? Math.round(dbFood.sodium_per_100g * factor * 1000) / 1000 : undefined,
    serving: dbFood.serving_size,
    source: dbFood.source,
    image: dbFood.image_url,
    barcode: dbFood.barcode,
  }
}

// Search foods in database with fuzzy matching
export async function searchFoodsInDatabase(query: string, limit = 10): Promise<NormalizedFood[]> {
  try {
    const { data, error } = await supabase
      .from("foods")
      .select("*")
      .or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
      .order("name")
      .limit(limit)

    if (error) {
      console.error("Database search error:", error)
      return []
    }

    return (data || []).map(normalizeFromDatabase)
  } catch (error) {
    console.error("Error searching foods in database:", error)
    return []
  }
}

// Get food by external ID and source
export async function getFoodByExternalId(externalId: string, source: string): Promise<DatabaseFood | null> {
  try {
    const { data, error } = await supabase
      .from("foods")
      .select("*")
      .eq("external_id", externalId)
      .eq("source", source)
      .maybeSingle()

    if (error) {
      console.error("Error getting food by external ID:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getFoodByExternalId:", error)
    return null
  }
}

// Cache food from API response
export async function cacheFoodFromAPI(
  apiFood: any,
  source: "usda" | "openfoodfacts",
  externalId: string,
): Promise<DatabaseFood | null> {
  try {
    let foodData: Partial<DatabaseFood>

    if (source === "openfoodfacts") {
      const nutriments = apiFood.nutriments || {}

      foodData = {
        external_id: externalId,
        name: apiFood.product_name || "Unknown Product",
        brand: apiFood.brands,
        barcode: apiFood.code,
        source: "openfoodfacts",
        calories_per_100g: Math.round(nutriments["energy-kcal_100g"] || 0),
        protein_per_100g: Number(nutriments["proteins_100g"] || 0),
        carbs_per_100g: Number(nutriments["carbohydrates_100g"] || 0),
        fat_per_100g: Number(nutriments["fat_100g"] || 0),
        fiber_per_100g: nutriments["fiber_100g"] ? Number(nutriments["fiber_100g"]) : null,
        sugar_per_100g: nutriments["sugars_100g"] ? Number(nutriments["sugars_100g"]) : null,
        sodium_per_100g: nutriments["sodium_100g"] ? Number(nutriments["sodium_100g"]) : null,
        serving_size: apiFood.serving_size || "100g",
        serving_weight_g: 100,
        ingredients: apiFood.ingredients_text,
        image_url: apiFood.image_url,
        category: apiFood.categories,
        api_data: apiFood,
        last_fetched: new Date().toISOString(),
      }
    } else {
      // USDA format (if implemented later)
      foodData = {
        external_id: externalId,
        name: "USDA Food",
        source: "usda",
        calories_per_100g: 0,
        protein_per_100g: 0,
        carbs_per_100g: 0,
        fat_per_100g: 0,
        serving_size: "100g",
        serving_weight_g: 100,
        api_data: apiFood,
        last_fetched: new Date().toISOString(),
      }
    }

    const { data, error } = await supabase.from("foods").insert([foodData]).select().single()

    if (error) {
      console.error("Error caching food:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in cacheFoodFromAPI:", error)
    return null
  }
}

// Update existing food cache
export async function updateFoodCache(id: string, updates: Partial<DatabaseFood>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("foods")
      .update({
        ...updates,
        last_fetched: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      console.error("Error updating food cache:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updateFoodCache:", error)
    return false
  }
}

// Check if cached food is stale (older than 7 days)
export function isFoodCacheStale(food: DatabaseFood): boolean {
  const lastFetched = new Date(food.last_fetched)
  const now = new Date()
  const daysDiff = (now.getTime() - lastFetched.getTime()) / (1000 * 60 * 60 * 24)
  return daysDiff > 7
}

// Add custom food to database
export async function addCustomFood(foodData: {
  name: string
  brand?: string
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
  fiber_per_100g?: number
  sugar_per_100g?: number
  sodium_per_100g?: number
  serving_size?: string
  serving_weight_g?: number
}): Promise<DatabaseFood | null> {
  try {
    const { data, error } = await supabase
      .from("foods")
      .insert([
        {
          ...foodData,
          source: "custom",
          serving_size: foodData.serving_size || "1 serving",
          serving_weight_g: foodData.serving_weight_g || 100,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error adding custom food:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in addCustomFood:", error)
    return null
  }
}

// Get popular/recent foods
export async function getPopularFoods(limit = 20): Promise<NormalizedFood[]> {
  try {
    const { data, error } = await supabase
      .from("foods")
      .select("*")
      .in("source", ["openfoodfacts", "local", "custom"])
      .order("updated_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error getting popular foods:", error)
      return []
    }

    return (data || []).map(normalizeFromDatabase)
  } catch (error) {
    console.error("Error in getPopularFoods:", error)
    return []
  }
}
