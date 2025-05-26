// USDA FoodData Central API integration
const USDA_API_KEY = "DEMO_KEY" // You can get a free API key from https://fdc.nal.usda.gov/api-guide.html
const USDA_BASE_URL = "https://api.nal.usda.gov/fdc/v1"

// Open Food Facts API integration (no API key required)
const OFF_BASE_URL = "https://world.openfoodfacts.org"

export interface USDAFood {
  fdcId: number
  description: string
  brandName?: string
  ingredients?: string
  foodNutrients: Array<{
    nutrientId: number
    nutrientName: string
    nutrientNumber: string
    unitName: string
    value: number
  }>
  servingSize?: number
  servingSizeUnit?: string
}

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
  source: "usda" | "openfoodfacts" | "local"
  image?: string
}

// Search USDA FoodData Central
export async function searchUSDAFoods(query: string, limit = 10): Promise<NormalizedFood[]> {
  try {
    const response = await fetch(
      `${USDA_BASE_URL}/foods/search?query=${encodeURIComponent(query)}&pageSize=${limit}&api_key=${USDA_API_KEY}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      console.warn(`USDA API error: ${response.status} - ${response.statusText}`)
      return []
    }

    const data = await response.json()
    return data.foods?.map((food: USDAFood) => normalizeUSDAFood(food)) || []
  } catch (error) {
    console.warn("USDA API unavailable:", error)
    return []
  }
}

// Search Open Food Facts with corrected endpoint
export async function searchOpenFoodFacts(query: string, limit = 10): Promise<NormalizedFood[]> {
  try {
    // Use the correct Open Food Facts search endpoint
    const searchUrl = `${OFF_BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&page_size=${limit}&json=1&fields=code,product_name,brands,nutriments,serving_size,image_url,ingredients_text`

    const response = await fetch(searchUrl, {
      method: "GET",
      headers: {
        "User-Agent": "PersonalDietTracker/1.0",
      },
    })

    if (!response.ok) {
      console.warn(`Open Food Facts API error: ${response.status} - ${response.statusText}`)
      return []
    }

    const data = await response.json()
    return data.products?.map((product: OpenFoodFactsProduct) => normalizeOpenFoodFactsProduct(product)) || []
  } catch (error) {
    console.warn("Open Food Facts API unavailable:", error)
    return []
  }
}

// Combined search function with better error handling
export async function searchAllFoodAPIs(query: string): Promise<NormalizedFood[]> {
  const results: NormalizedFood[] = []

  // Search APIs with individual error handling
  try {
    const usdaResults = await searchUSDAFoods(query, 5)
    results.push(...usdaResults)
  } catch (error) {
    console.warn("USDA search failed:", error)
  }

  try {
    const offResults = await searchOpenFoodFacts(query, 5)
    results.push(...offResults)
  } catch (error) {
    console.warn("Open Food Facts search failed:", error)
  }

  return results
}

// Get detailed food information by ID
export async function getFoodDetails(id: string, source: "usda" | "openfoodfacts"): Promise<NormalizedFood | null> {
  try {
    if (source === "usda") {
      const response = await fetch(`${USDA_BASE_URL}/food/${id}?api_key=${USDA_API_KEY}`)
      if (!response.ok) return null
      const food = await response.json()
      return normalizeUSDAFood(food)
    } else {
      const response = await fetch(`${OFF_BASE_URL}/api/v0/product/${id}.json`)
      if (!response.ok) return null
      const data = await response.json()
      return normalizeOpenFoodFactsProduct(data.product)
    }
  } catch (error) {
    console.error("Error getting food details:", error)
    return null
  }
}

// Normalize USDA food data
function normalizeUSDAFood(food: USDAFood): NormalizedFood {
  const nutrients = food.foodNutrients || []

  // Find specific nutrients by their IDs
  const getNutrient = (nutrientId: number) => {
    const nutrient = nutrients.find((n) => n.nutrientId === nutrientId)
    return nutrient?.value || 0
  }

  return {
    id: `usda-${food.fdcId}`,
    name: food.description || "Unknown Food",
    brand: food.brandName,
    calories: getNutrient(1008), // Energy (kcal)
    protein: getNutrient(1003), // Protein
    carbs: getNutrient(1005), // Carbohydrates
    fat: getNutrient(1004), // Total lipid (fat)
    fiber: getNutrient(1079), // Fiber
    sugar: getNutrient(2000), // Sugars
    sodium: getNutrient(1093) / 1000, // Sodium (convert mg to g)
    serving: food.servingSize && food.servingSizeUnit ? `${food.servingSize} ${food.servingSizeUnit}` : "100g",
    source: "usda",
  }
}

// Normalize Open Food Facts data
function normalizeOpenFoodFactsProduct(product: OpenFoodFactsProduct): NormalizedFood {
  if (!product) {
    return {
      id: "unknown",
      name: "Unknown Product",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      serving: "100g",
      source: "openfoodfacts",
    }
  }

  const nutriments = product.nutriments || {}

  return {
    id: `off-${product.code}`,
    name: product.product_name || "Unknown Product",
    brand: product.brands,
    calories: nutriments["energy-kcal_100g"] || 0,
    protein: nutriments["proteins_100g"] || 0,
    carbs: nutriments["carbohydrates_100g"] || 0,
    fat: nutriments["fat_100g"] || 0,
    fiber: nutriments["fiber_100g"],
    sugar: nutriments["sugars_100g"],
    sodium: nutriments["sodium_100g"],
    serving: product.serving_size || "100g",
    source: "openfoodfacts",
    image: product.image_url,
  }
}

// Enhanced local food database (fallback)
export const localFoodDatabase: NormalizedFood[] = [
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
    id: "local-salmon",
    name: "Salmon",
    calories: 206,
    protein: 22,
    carbs: 0,
    fat: 12,
    serving: "100g",
    source: "local",
  },
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
    id: "local-eggs",
    name: "Eggs",
    calories: 155,
    protein: 13,
    carbs: 1.1,
    fat: 11,
    serving: "2 large eggs (100g)",
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
    id: "local-tuna",
    name: "Tuna",
    calories: 144,
    protein: 30,
    carbs: 0,
    fat: 1,
    serving: "100g",
    source: "local",
  },
]

// Search local database
export function searchLocalFoods(query: string): NormalizedFood[] {
  return localFoodDatabase.filter((food) => food.name.toLowerCase().includes(query.toLowerCase()))
}

// Combined search with local fallback and better error handling
export async function searchFoodsWithFallback(query: string): Promise<NormalizedFood[]> {
  if (!query.trim()) return []

  try {
    // Always search local database first for instant results
    const localResults = searchLocalFoods(query)

    // Try API search but don't let it block the response
    let apiResults: NormalizedFood[] = []

    try {
      apiResults = await Promise.race([
        searchAllFoodAPIs(query),
        new Promise<NormalizedFood[]>(
          (resolve) => setTimeout(() => resolve([]), 5000), // 5 second timeout
        ),
      ])
    } catch (error) {
      console.warn("API search timed out or failed, using local results only")
    }

    // Combine results, prioritizing local results for better UX
    const combinedResults = [...localResults, ...apiResults]

    // Remove duplicates based on name similarity
    const uniqueResults = combinedResults.filter((food, index, array) => {
      return !array.slice(0, index).some((existingFood) => existingFood.name.toLowerCase() === food.name.toLowerCase())
    })

    return uniqueResults.slice(0, 15) // Limit to 15 results
  } catch (error) {
    console.error("Error in combined food search:", error)
    // Always fallback to local database
    return searchLocalFoods(query)
  }
}

// Simple search function that prioritizes local database
export async function searchFoodsSimple(query: string): Promise<NormalizedFood[]> {
  if (!query.trim()) return []

  // For now, just use local database to ensure reliability
  const localResults = searchLocalFoods(query)

  // If we have good local results, return them immediately
  if (localResults.length > 0) {
    return localResults
  }

  // Only try APIs if no local results found
  try {
    const apiResults = await searchAllFoodAPIs(query)
    return apiResults.slice(0, 10)
  } catch (error) {
    console.warn("API search failed, returning empty results")
    return []
  }
}
