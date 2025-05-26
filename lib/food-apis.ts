// USDA FoodData Central API integration
const USDA_API_KEY = "DEMO_KEY" // You can get a free API key from https://fdc.nal.usda.gov/api-guide.html
const USDA_BASE_URL = "https://api.nal.usda.gov/fdc/v1"

// Open Food Facts API integration (no API key required)
const OFF_BASE_URL = "https://world.openfoodfacts.org/api/v2"

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
    )

    if (!response.ok) {
      throw new Error(`USDA API error: ${response.status}`)
    }

    const data = await response.json()

    return data.foods?.map((food: USDAFood) => normalizeUSDAFood(food)) || []
  } catch (error) {
    console.error("Error searching USDA foods:", error)
    return []
  }
}

// Search Open Food Facts
export async function searchOpenFoodFacts(query: string, limit = 10): Promise<NormalizedFood[]> {
  try {
    const response = await fetch(
      `${OFF_BASE_URL}/search?search_terms=${encodeURIComponent(query)}&page_size=${limit}&fields=code,product_name,brands,nutriments,serving_size,image_url,ingredients_text`,
    )

    if (!response.ok) {
      throw new Error(`Open Food Facts API error: ${response.status}`)
    }

    const data = await response.json()

    return data.products?.map((product: OpenFoodFactsProduct) => normalizeOpenFoodFactsProduct(product)) || []
  } catch (error) {
    console.error("Error searching Open Food Facts:", error)
    return []
  }
}

// Combined search function
export async function searchAllFoodAPIs(query: string): Promise<NormalizedFood[]> {
  try {
    // Search both APIs in parallel
    const [usdaResults, offResults] = await Promise.allSettled([
      searchUSDAFoods(query, 5),
      searchOpenFoodFacts(query, 5),
    ])

    const allResults: NormalizedFood[] = []

    if (usdaResults.status === "fulfilled") {
      allResults.push(...usdaResults.value)
    }

    if (offResults.status === "fulfilled") {
      allResults.push(...offResults.value)
    }

    // Sort by relevance (exact matches first, then partial matches)
    return allResults.sort((a, b) => {
      const aExact = a.name.toLowerCase().includes(query.toLowerCase())
      const bExact = b.name.toLowerCase().includes(query.toLowerCase())

      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      return 0
    })
  } catch (error) {
    console.error("Error searching food APIs:", error)
    return []
  }
}

// Get detailed food information by ID
export async function getFoodDetails(id: string, source: "usda" | "openfoodfacts"): Promise<NormalizedFood | null> {
  try {
    if (source === "usda") {
      const response = await fetch(`${USDA_BASE_URL}/food/${id}?api_key=${USDA_API_KEY}`)
      if (!response.ok) throw new Error(`USDA API error: ${response.status}`)
      const food = await response.json()
      return normalizeUSDAFood(food)
    } else {
      const response = await fetch(`${OFF_BASE_URL}/product/${id}`)
      if (!response.ok) throw new Error(`Open Food Facts API error: ${response.status}`)
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

// Local food database (fallback)
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
]

// Search local database
export function searchLocalFoods(query: string): NormalizedFood[] {
  return localFoodDatabase.filter((food) => food.name.toLowerCase().includes(query.toLowerCase()))
}

// Combined search with local fallback
export async function searchFoodsWithFallback(query: string): Promise<NormalizedFood[]> {
  if (!query.trim()) return []

  try {
    // First try API search
    const apiResults = await searchAllFoodAPIs(query)

    // Also search local database
    const localResults = searchLocalFoods(query)

    // Combine results, prioritizing API results
    const combinedResults = [...apiResults, ...localResults]

    // Remove duplicates based on name similarity
    const uniqueResults = combinedResults.filter((food, index, array) => {
      return !array.slice(0, index).some((existingFood) => existingFood.name.toLowerCase() === food.name.toLowerCase())
    })

    return uniqueResults.slice(0, 15) // Limit to 15 results
  } catch (error) {
    console.error("Error in combined food search:", error)
    // Fallback to local database only
    return searchLocalFoods(query)
  }
}
