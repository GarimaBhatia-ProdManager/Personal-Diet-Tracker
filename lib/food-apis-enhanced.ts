import {
  searchFoodsInDatabase,
  getFoodByExternalId,
  cacheFoodFromAPI,
  isFoodCacheStale,
  normalizeFromDatabase,
} from "./food-database"
import type { NormalizedFood } from "./food-database"
import { supabase } from "./supabase"

// Open Food Facts API integration
const OFF_BASE_URL = "https://world.openfoodfacts.org"

export interface OpenFoodFactsProduct {
  code: string
  product_name: string
  brands?: string
  ingredients_text?: string
  nutriments: {
    "energy-kcal_100g"?: number
    proteins_100g?: number
    carbohydrates_100g?: number
    fat_100g?: number
    fiber_100g?: number
    sugars_100g?: number
    sodium_100g?: number
  }
  serving_size?: string
  image_url?: string
  categories?: string
}

// Enhanced local food database with more variety
const enhancedLocalFoods: NormalizedFood[] = [
  // Fruits
  {
    id: "local-banana",
    name: "Banana",
    calories: 105,
    protein: 1.3,
    carbs: 27,
    fat: 0.4,
    fiber: 3.1,
    sugar: 14.4,
    serving: "1 medium (118g)",
    source: "local",
  },
  {
    id: "local-apple",
    name: "Apple",
    calories: 95,
    protein: 0.5,
    carbs: 25,
    fat: 0.3,
    fiber: 4.4,
    sugar: 19,
    serving: "1 medium (182g)",
    source: "local",
  },
  {
    id: "local-orange",
    name: "Orange",
    calories: 62,
    protein: 1.2,
    carbs: 15.4,
    fat: 0.2,
    fiber: 3.1,
    sugar: 12.2,
    serving: "1 medium (154g)",
    source: "local",
  },
  {
    id: "local-grapes",
    name: "Grapes",
    calories: 104,
    protein: 1.1,
    carbs: 27.3,
    fat: 0.2,
    fiber: 1.4,
    sugar: 23.4,
    serving: "1 cup (151g)",
    source: "local",
  },
  {
    id: "local-strawberries",
    name: "Strawberries",
    calories: 49,
    protein: 1,
    carbs: 11.7,
    fat: 0.5,
    fiber: 3,
    sugar: 7.4,
    serving: "1 cup (152g)",
    source: "local",
  },
  {
    id: "local-mango",
    name: "Mango",
    calories: 107,
    protein: 0.8,
    carbs: 28,
    fat: 0.4,
    fiber: 3,
    sugar: 24,
    serving: "1 cup (165g)",
    source: "local",
  },
  {
    id: "local-pineapple",
    name: "Pineapple",
    calories: 82,
    protein: 0.9,
    carbs: 22,
    fat: 0.2,
    fiber: 2.3,
    sugar: 16,
    serving: "1 cup (165g)",
    source: "local",
  },

  // Proteins
  {
    id: "local-chicken-breast",
    name: "Chicken Breast",
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    serving: "100g",
    source: "local",
  },
  {
    id: "local-salmon",
    name: "Salmon",
    calories: 206,
    protein: 22,
    carbs: 0,
    fat: 12,
    serving: "100g",
    source: "local",
  },
  { id: "local-tuna", name: "Tuna", calories: 144, protein: 30, carbs: 0, fat: 1, serving: "100g", source: "local" },
  {
    id: "local-eggs",
    name: "Eggs",
    calories: 155,
    protein: 13,
    carbs: 1.1,
    fat: 11,
    serving: "2 large eggs (100g)",
    source: "local",
  },
  { id: "local-tofu", name: "Tofu", calories: 76, protein: 8, carbs: 1.9, fat: 4.8, serving: "100g", source: "local" },
  {
    id: "local-lean-beef",
    name: "Lean Beef",
    calories: 250,
    protein: 26,
    carbs: 0,
    fat: 15,
    serving: "100g",
    source: "local",
  },
  {
    id: "local-turkey",
    name: "Turkey Breast",
    calories: 135,
    protein: 30,
    carbs: 0,
    fat: 1,
    serving: "100g",
    source: "local",
  },

  // Carbs & Grains
  {
    id: "local-brown-rice",
    name: "Brown Rice",
    calories: 216,
    protein: 5,
    carbs: 45,
    fat: 2,
    fiber: 3.5,
    serving: "1 cup cooked (195g)",
    source: "local",
  },
  {
    id: "local-quinoa",
    name: "Quinoa",
    calories: 222,
    protein: 8,
    carbs: 39,
    fat: 3.6,
    fiber: 5.2,
    serving: "1 cup cooked (185g)",
    source: "local",
  },
  {
    id: "local-oats",
    name: "Oats",
    calories: 389,
    protein: 16.9,
    carbs: 66.3,
    fat: 6.9,
    fiber: 10.6,
    serving: "100g dry",
    source: "local",
  },
  {
    id: "local-sweet-potato",
    name: "Sweet Potato",
    calories: 112,
    protein: 2,
    carbs: 26,
    fat: 0.1,
    fiber: 3.9,
    serving: "1 medium (128g)",
    source: "local",
  },
  {
    id: "local-pasta",
    name: "Whole Wheat Pasta",
    calories: 220,
    protein: 8,
    carbs: 44,
    fat: 1.1,
    fiber: 2.5,
    serving: "1 cup cooked (140g)",
    source: "local",
  },
  {
    id: "local-bread",
    name: "Whole Grain Bread",
    calories: 80,
    protein: 4,
    carbs: 14,
    fat: 1,
    fiber: 2,
    serving: "1 slice (28g)",
    source: "local",
  },

  // Vegetables
  {
    id: "local-spinach",
    name: "Spinach",
    calories: 7,
    protein: 0.9,
    carbs: 1.1,
    fat: 0.1,
    fiber: 0.7,
    serving: "1 cup (30g)",
    source: "local",
  },
  {
    id: "local-broccoli",
    name: "Broccoli",
    calories: 25,
    protein: 3,
    carbs: 5,
    fat: 0.3,
    fiber: 2.6,
    serving: "1 cup (91g)",
    source: "local",
  },
  {
    id: "local-carrots",
    name: "Carrots",
    calories: 25,
    protein: 0.5,
    carbs: 6,
    fat: 0.1,
    fiber: 1.7,
    serving: "1 medium (61g)",
    source: "local",
  },
  {
    id: "local-tomato",
    name: "Tomato",
    calories: 22,
    protein: 1.1,
    carbs: 4.8,
    fat: 0.2,
    fiber: 1.5,
    serving: "1 medium (123g)",
    source: "local",
  },
  {
    id: "local-cucumber",
    name: "Cucumber",
    calories: 8,
    protein: 0.3,
    carbs: 1.9,
    fat: 0.1,
    fiber: 0.3,
    serving: "1/2 cup sliced (60g)",
    source: "local",
  },
  {
    id: "local-bell-pepper",
    name: "Bell Pepper",
    calories: 20,
    protein: 1,
    carbs: 5,
    fat: 0.2,
    fiber: 2,
    serving: "1 medium (119g)",
    source: "local",
  },

  // Healthy Fats & Nuts
  {
    id: "local-avocado",
    name: "Avocado",
    calories: 234,
    protein: 3,
    carbs: 12,
    fat: 21,
    fiber: 10,
    serving: "1 medium (150g)",
    source: "local",
  },
  {
    id: "local-almonds",
    name: "Almonds",
    calories: 164,
    protein: 6,
    carbs: 6,
    fat: 14,
    fiber: 3.5,
    serving: "1 oz (28g)",
    source: "local",
  },
  {
    id: "local-walnuts",
    name: "Walnuts",
    calories: 185,
    protein: 4.3,
    carbs: 3.9,
    fat: 18.5,
    fiber: 1.9,
    serving: "1 oz (28g)",
    source: "local",
  },
  {
    id: "local-olive-oil",
    name: "Olive Oil",
    calories: 119,
    protein: 0,
    carbs: 0,
    fat: 13.5,
    serving: "1 tbsp (13.5g)",
    source: "local",
  },
  {
    id: "local-peanut-butter",
    name: "Peanut Butter",
    calories: 188,
    protein: 8,
    carbs: 8,
    fat: 16,
    fiber: 2,
    serving: "2 tbsp (32g)",
    source: "local",
  },

  // Dairy & Alternatives
  {
    id: "local-greek-yogurt",
    name: "Greek Yogurt",
    calories: 100,
    protein: 17,
    carbs: 6,
    fat: 0,
    serving: "1 cup (245g)",
    source: "local",
  },
  {
    id: "local-milk",
    name: "Milk",
    calories: 150,
    protein: 8,
    carbs: 12,
    fat: 8,
    serving: "1 cup (244g)",
    source: "local",
  },
  {
    id: "local-cheese",
    name: "Cheddar Cheese",
    calories: 113,
    protein: 7,
    carbs: 1,
    fat: 9,
    serving: "1 oz (28g)",
    source: "local",
  },
  {
    id: "local-cottage-cheese",
    name: "Cottage Cheese",
    calories: 98,
    protein: 11,
    carbs: 9,
    fat: 4,
    serving: "1/2 cup (113g)",
    source: "local",
  },

  // Indian Foods
  {
    id: "local-dal",
    name: "Dal (Lentils)",
    calories: 116,
    protein: 9,
    carbs: 20,
    fat: 0.4,
    fiber: 8,
    serving: "1 cup cooked (198g)",
    source: "local",
  },
  {
    id: "local-roti",
    name: "Roti",
    calories: 71,
    protein: 3,
    carbs: 15,
    fat: 0.4,
    fiber: 2,
    serving: "1 medium (28g)",
    source: "local",
  },
  {
    id: "local-basmati-rice",
    name: "Basmati Rice",
    calories: 205,
    protein: 4.3,
    carbs: 45,
    fat: 0.4,
    serving: "1 cup cooked (163g)",
    source: "local",
  },
  {
    id: "local-paneer",
    name: "Paneer",
    calories: 321,
    protein: 25,
    carbs: 3.6,
    fat: 25,
    serving: "100g",
    source: "local",
  },
]

// Search Open Food Facts API
export async function searchOpenFoodFacts(query: string, limit = 5): Promise<NormalizedFood[]> {
  try {
    const searchUrl = `${OFF_BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&page_size=${limit}&json=1&fields=code,product_name,brands,nutriments,serving_size,image_url,ingredients_text,categories`

    const response = await fetch(searchUrl, {
      method: "GET",
      headers: {
        "User-Agent": "PersonalDietTracker/1.0",
      },
    })

    if (!response.ok) {
      console.warn(`Open Food Facts API error: ${response.status}`)
      return []
    }

    const data = await response.json()
    const products = data.products || []

    const results: NormalizedFood[] = []

    for (const product of products) {
      // Check if we already have this product cached
      const cached = await getFoodByExternalId(product.code, "openfoodfacts")

      if (cached && !isFoodCacheStale(cached)) {
        // Use cached version
        results.push(normalizeFromDatabase(cached))
      } else {
        // Cache new product or update stale cache
        const cachedFood = await cacheFoodFromAPI(product, "openfoodfacts", product.code)
        if (cachedFood) {
          results.push(normalizeFromDatabase(cachedFood))
        }
      }
    }

    return results
  } catch (error) {
    console.warn("Open Food Facts API unavailable:", error)
    return []
  }
}

// Search local foods with fuzzy matching
export function searchLocalFoods(query: string): NormalizedFood[] {
  const searchTerm = query.toLowerCase().trim()

  return enhancedLocalFoods
    .filter((food) => {
      const name = food.name.toLowerCase()
      if (name.includes(searchTerm)) return true

      const words = searchTerm.split(" ")
      return words.some((word) => name.includes(word) && word.length > 2)
    })
    .sort((a, b) => {
      const aExact = a.name.toLowerCase().startsWith(searchTerm.toLowerCase())
      const bExact = b.name.toLowerCase().startsWith(searchTerm.toLowerCase())
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      return a.name.localeCompare(b.name)
    })
}

// Main search function with database backup
export async function searchFoodsWithBackup(query: string): Promise<NormalizedFood[]> {
  if (!query.trim()) return []

  try {
    // 1. Search local hardcoded foods first (instant)
    const localResults = searchLocalFoods(query)

    // 2. Search database cache (fast)
    const dbResults = await searchFoodsInDatabase(query, 8)

    // 3. Search Open Food Facts API (slower, with caching)
    let apiResults: NormalizedFood[] = []
    if (query.length >= 3) {
      try {
        apiResults = await Promise.race([
          searchOpenFoodFacts(query, 5),
          new Promise<NormalizedFood[]>((resolve) => setTimeout(() => resolve([]), 3000)),
        ])
      } catch (error) {
        console.warn("API search failed:", error)
      }
    }

    // Combine and deduplicate results
    const allResults = [...localResults, ...dbResults, ...apiResults]
    const uniqueResults = allResults.filter((food, index, array) => {
      return !array
        .slice(0, index)
        .some(
          (existing) =>
            existing.name.toLowerCase() === food.name.toLowerCase() &&
            existing.brand?.toLowerCase() === food.brand?.toLowerCase(),
        )
    })

    return uniqueResults.slice(0, 12)
  } catch (error) {
    console.error("Error in searchFoodsWithBackup:", error)
    return searchLocalFoods(query)
  }
}

// Get food by barcode (useful for future barcode scanning)
export async function getFoodByBarcode(barcode: string): Promise<NormalizedFood | null> {
  try {
    // Check database first
    const { data: dbFood } = await supabase.from("foods").select("*").eq("barcode", barcode).maybeSingle()

    if (dbFood && !isFoodCacheStale(dbFood)) {
      return normalizeFromDatabase(dbFood)
    }

    // Fetch from Open Food Facts
    const response = await fetch(`${OFF_BASE_URL}/api/v0/product/${barcode}.json`)
    if (!response.ok) return null

    const data = await response.json()
    if (!data.product) return null

    // Cache the result
    const cachedFood = await cacheFoodFromAPI(data.product, "openfoodfacts", barcode)
    if (cachedFood) {
      return normalizeFromDatabase(cachedFood)
    }

    return null
  } catch (error) {
    console.error("Error getting food by barcode:", error)
    return null
  }
}

// Export the main search function for backward compatibility
export const searchFoodsSimple = searchFoodsWithBackup
