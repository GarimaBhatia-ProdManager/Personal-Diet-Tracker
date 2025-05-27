import { supabase } from "./supabase"

// Enhanced food search result interface
export interface FoodSearchResult {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
  serving: string
  source: "local" | "openfoodfacts" | "database" | "custom"
  brand?: string
  barcode?: string
  image_url?: string
}

// Database food interface matching our schema
interface DatabaseFood {
  id: string
  name: string
  brand?: string
  barcode?: string
  source: string
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
  fiber_per_100g?: number
  sugar_per_100g?: number
  sodium_per_100g?: number
  serving_size: string
  serving_weight_g: number
  image_url?: string
  external_id?: string
  last_fetched?: string
}

// Cache food in database
async function cacheFoodInDatabase(food: FoodSearchResult, externalId?: string): Promise<void> {
  try {
    const { error } = await supabase.from("foods").upsert({
      id: food.id,
      name: food.name,
      brand: food.brand,
      barcode: food.barcode,
      source: food.source,
      external_id: externalId,
      calories_per_100g: food.calories,
      protein_per_100g: food.protein,
      carbs_per_100g: food.carbs,
      fat_per_100g: food.fat,
      fiber_per_100g: food.fiber || 0,
      sugar_per_100g: food.sugar || 0,
      sodium_per_100g: food.sodium || 0,
      serving_size: food.serving,
      serving_weight_g: 100,
      image_url: food.image_url,
      last_fetched: new Date().toISOString(),
    })

    if (error) {
      console.error("Error caching food:", error)
    }
  } catch (error) {
    console.error("Error caching food in database:", error)
  }
}

// Search database for cached foods
async function searchDatabaseFoods(query: string): Promise<FoodSearchResult[]> {
  try {
    const { data, error } = await supabase
      .from("foods")
      .select("*")
      .or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
      .limit(10)

    if (error) {
      console.error("Database search error:", error)
      return []
    }

    return (data || []).map((food: DatabaseFood) => ({
      id: food.id,
      name: food.name,
      calories: food.calories_per_100g,
      protein: food.protein_per_100g,
      carbs: food.carbs_per_100g,
      fat: food.fat_per_100g,
      fiber: food.fiber_per_100g,
      sugar: food.sugar_per_100g,
      sodium: food.sodium_per_100g,
      serving: food.serving_size || "100g",
      source: "database" as const,
      brand: food.brand,
      barcode: food.barcode,
      image_url: food.image_url,
    }))
  } catch (error) {
    console.error("Database search error:", error)
    return []
  }
}

// Local food database (50+ common foods)
const localFoods: FoodSearchResult[] = [
  // Indian Foods
  {
    id: "basmati-rice",
    name: "Basmati Rice",
    calories: 205,
    protein: 4.3,
    carbs: 45,
    fat: 0.4,
    fiber: 0.6,
    serving: "1 cup cooked",
    source: "local",
  },
  {
    id: "dal-lentils",
    name: "Dal (Lentils)",
    calories: 116,
    protein: 9,
    carbs: 20,
    fat: 0.4,
    fiber: 8,
    serving: "1 cup cooked",
    source: "local",
  },
  {
    id: "roti",
    name: "Roti",
    calories: 71,
    protein: 3,
    carbs: 15,
    fat: 0.4,
    fiber: 2,
    serving: "1 medium",
    source: "local",
  },
  { id: "paneer", name: "Paneer", calories: 321, protein: 25, carbs: 3.6, fat: 25, serving: "100g", source: "local" },
  {
    id: "curd",
    name: "Curd (Yogurt)",
    calories: 98,
    protein: 11,
    carbs: 4.7,
    fat: 4.3,
    serving: "1 cup",
    source: "local",
  },

  // Proteins
  {
    id: "chicken-breast",
    name: "Chicken Breast",
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    serving: "100g",
    source: "local",
  },
  { id: "salmon", name: "Salmon", calories: 206, protein: 22, carbs: 0, fat: 12, serving: "100g", source: "local" },
  { id: "eggs", name: "Eggs", calories: 155, protein: 13, carbs: 1.1, fat: 11, serving: "2 large", source: "local" },
  { id: "tofu", name: "Tofu", calories: 76, protein: 8, carbs: 1.9, fat: 4.8, serving: "100g", source: "local" },

  // Fruits
  {
    id: "banana",
    name: "Banana",
    calories: 89,
    protein: 1.1,
    carbs: 23,
    fat: 0.3,
    fiber: 2.6,
    sugar: 12,
    serving: "1 medium",
    source: "local",
  },
  {
    id: "apple",
    name: "Apple",
    calories: 52,
    protein: 0.3,
    carbs: 14,
    fat: 0.2,
    fiber: 2.4,
    sugar: 10,
    serving: "1 medium",
    source: "local",
  },
  {
    id: "orange",
    name: "Orange",
    calories: 47,
    protein: 0.9,
    carbs: 12,
    fat: 0.1,
    fiber: 2.4,
    sugar: 9,
    serving: "1 medium",
    source: "local",
  },
  {
    id: "grapes",
    name: "Grapes",
    calories: 62,
    protein: 0.6,
    carbs: 16,
    fat: 0.2,
    fiber: 0.9,
    sugar: 15,
    serving: "1 cup",
    source: "local",
  },

  // Vegetables
  {
    id: "spinach",
    name: "Spinach",
    calories: 23,
    protein: 2.9,
    carbs: 3.6,
    fat: 0.4,
    fiber: 2.2,
    serving: "1 cup",
    source: "local",
  },
  {
    id: "broccoli",
    name: "Broccoli",
    calories: 34,
    protein: 2.8,
    carbs: 7,
    fat: 0.4,
    fiber: 2.6,
    serving: "1 cup",
    source: "local",
  },
  {
    id: "carrots",
    name: "Carrots",
    calories: 41,
    protein: 0.9,
    carbs: 10,
    fat: 0.2,
    fiber: 2.8,
    sugar: 4.7,
    serving: "1 medium",
    source: "local",
  },
  {
    id: "tomato",
    name: "Tomato",
    calories: 18,
    protein: 0.9,
    carbs: 3.9,
    fat: 0.2,
    fiber: 1.2,
    sugar: 2.6,
    serving: "1 medium",
    source: "local",
  },

  // Nuts & Seeds
  {
    id: "almonds",
    name: "Almonds",
    calories: 579,
    protein: 21,
    carbs: 22,
    fat: 50,
    fiber: 12,
    serving: "1 oz",
    source: "local",
  },
  {
    id: "walnuts",
    name: "Walnuts",
    calories: 654,
    protein: 15,
    carbs: 14,
    fat: 65,
    fiber: 6.7,
    serving: "1 oz",
    source: "local",
  },

  // Grains
  {
    id: "brown-rice",
    name: "Brown Rice",
    calories: 216,
    protein: 5,
    carbs: 45,
    fat: 1.8,
    fiber: 3.5,
    serving: "1 cup cooked",
    source: "local",
  },
  {
    id: "quinoa",
    name: "Quinoa",
    calories: 222,
    protein: 8,
    carbs: 39,
    fat: 3.6,
    fiber: 5,
    serving: "1 cup cooked",
    source: "local",
  },
  {
    id: "oats",
    name: "Oats",
    calories: 389,
    protein: 17,
    carbs: 66,
    fat: 7,
    fiber: 11,
    serving: "100g dry",
    source: "local",
  },

  // Dairy
  { id: "milk", name: "Milk", calories: 150, protein: 8, carbs: 12, fat: 8, serving: "1 cup", source: "local" },
  { id: "cheese", name: "Cheese", calories: 113, protein: 7, carbs: 1, fat: 9, serving: "1 oz", source: "local" },

  // Common snacks
  {
    id: "peanut-butter",
    name: "Peanut Butter",
    calories: 588,
    protein: 25,
    carbs: 20,
    fat: 50,
    fiber: 6,
    serving: "2 tbsp",
    source: "local",
  },
  {
    id: "bread",
    name: "Bread",
    calories: 265,
    protein: 9,
    carbs: 49,
    fat: 3.2,
    fiber: 2.7,
    serving: "2 slices",
    source: "local",
  },
]

// Search local foods
function searchLocalFoods(query: string): FoodSearchResult[] {
  const searchTerm = query.toLowerCase()
  return localFoods.filter((food) => food.name.toLowerCase().includes(searchTerm)).slice(0, 10)
}

// Search Open Food Facts API
async function searchOpenFoodFacts(query: string): Promise<FoodSearchResult[]> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10`,
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (!data.products || !Array.isArray(data.products)) {
      return []
    }

    const results: FoodSearchResult[] = []

    for (const product of data.products) {
      if (!product.nutriments || !product.product_name) continue

      const food: FoodSearchResult = {
        id: `off-${product.code || Math.random().toString(36).substr(2, 9)}`,
        name: product.product_name,
        calories: Math.round(product.nutriments["energy-kcal_100g"] || product.nutriments.energy_100g / 4.184 || 0),
        protein: Number(product.nutriments.proteins_100g || 0),
        carbs: Number(product.nutriments.carbohydrates_100g || 0),
        fat: Number(product.nutriments.fat_100g || 0),
        fiber: Number(product.nutriments.fiber_100g || 0),
        sugar: Number(product.nutriments.sugars_100g || 0),
        sodium: Number(product.nutriments.sodium_100g || 0),
        serving: "100g",
        source: "openfoodfacts",
        brand: product.brands,
        barcode: product.code,
        image_url: product.image_url,
      }

      results.push(food)

      // Cache in database for future use
      cacheFoodInDatabase(food, product.code)
    }

    return results
  } catch (error) {
    console.error("Open Food Facts API error:", error)
    return []
  }
}

// Main search function that combines all sources
export async function searchFoods(query: string): Promise<FoodSearchResult[]> {
  if (!query || query.trim().length < 2) {
    return localFoods.slice(0, 10)
  }

  try {
    // 1. Search local foods (instant)
    const localResults = searchLocalFoods(query)

    // 2. Search database cache (fast)
    const databaseResults = await searchDatabaseFoods(query)

    // 3. Search Open Food Facts API (slower, but comprehensive)
    const apiResults = await searchOpenFoodFacts(query)

    // Combine and deduplicate results
    const allResults = [...localResults, ...databaseResults, ...apiResults]
    const uniqueResults = allResults.filter(
      (food, index, self) => index === self.findIndex((f) => f.name.toLowerCase() === food.name.toLowerCase()),
    )

    return uniqueResults.slice(0, 15)
  } catch (error) {
    console.error("Food search error:", error)
    // Fallback to local foods only
    return searchLocalFoods(query)
  }
}

// Get food by barcode
export async function getFoodByBarcode(barcode: string): Promise<FoodSearchResult | null> {
  try {
    // First check database
    const { data } = await supabase.from("foods").select("*").eq("barcode", barcode).single()

    if (data) {
      return {
        id: data.id,
        name: data.name,
        calories: data.calories_per_100g,
        protein: data.protein_per_100g,
        carbs: data.carbs_per_100g,
        fat: data.fat_per_100g,
        fiber: data.fiber_per_100g,
        sugar: data.sugar_per_100g,
        sodium: data.sodium_per_100g,
        serving: data.serving_size || "100g",
        source: "database",
        brand: data.brand,
        barcode: data.barcode,
        image_url: data.image_url,
      }
    }

    // Fallback to Open Food Facts API
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    const data_api = await response.json()

    if (data_api.status === 1 && data_api.product) {
      const product = data_api.product
      const food: FoodSearchResult = {
        id: `off-${barcode}`,
        name: product.product_name || "Unknown Product",
        calories: Math.round(product.nutriments["energy-kcal_100g"] || 0),
        protein: Number(product.nutriments.proteins_100g || 0),
        carbs: Number(product.nutriments.carbohydrates_100g || 0),
        fat: Number(product.nutriments.fat_100g || 0),
        fiber: Number(product.nutriments.fiber_100g || 0),
        sugar: Number(product.nutriments.sugars_100g || 0),
        sodium: Number(product.nutriments.sodium_100g || 0),
        serving: "100g",
        source: "openfoodfacts",
        brand: product.brands,
        barcode: barcode,
        image_url: product.image_url,
      }

      // Cache for future use
      cacheFoodInDatabase(food, barcode)

      return food
    }

    return null
  } catch (error) {
    console.error("Barcode lookup error:", error)
    return null
  }
}

// Add custom food to database
export async function addCustomFood(food: Omit<FoodSearchResult, "id" | "source">): Promise<FoodSearchResult | null> {
  try {
    const customFood = {
      ...food,
      id: `custom-${Date.now()}`,
      source: "custom" as const,
    }

    await cacheFoodInDatabase(customFood)

    return customFood
  } catch (error) {
    console.error("Error adding custom food:", error)
    return null
  }
}
