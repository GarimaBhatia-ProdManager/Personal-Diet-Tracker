// Optimized food search - prioritizing local database for speed
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

// Enhanced local food database (prioritized for speed)
export const localFoodDatabase: NormalizedFood[] = [
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

  // Carbs
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
    name: "Pasta",
    calories: 220,
    protein: 8,
    carbs: 44,
    fat: 1.1,
    fiber: 2.5,
    serving: "1 cup cooked (140g)",
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

  // Healthy fats
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

  // Dairy
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

  // Snacks
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
  {
    id: "local-dark-chocolate",
    name: "Dark Chocolate",
    calories: 155,
    protein: 2,
    carbs: 13,
    fat: 12,
    fiber: 3,
    serving: "1 oz (28g)",
    source: "local",
  },
]

// Search USDA FoodData Central (disabled for performance)
export async function searchUSDAFoods(query: string, limit = 5): Promise<NormalizedFood[]> {
  // Disabled for performance - return empty array
  return []
}

// Search Open Food Facts (limited for performance)
export async function searchOpenFoodFacts(query: string, limit = 3): Promise<NormalizedFood[]> {
  try {
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

// Combined search function - prioritizing local database
export async function searchAllFoodAPIs(query: string): Promise<NormalizedFood[]> {
  const results: NormalizedFood[] = []

  // Only search Open Food Facts with limited results for performance
  try {
    const offResults = await searchOpenFoodFacts(query, 3)
    results.push(...offResults)
  } catch (error) {
    console.warn("Open Food Facts search failed:", error)
  }

  return results
}

// Get detailed food information by ID
export async function getFoodDetails(id: string, source: "usda" | "openfoodfacts"): Promise<NormalizedFood | null> {
  try {
    if (source === "openfoodfacts") {
      const response = await fetch(`${OFF_BASE_URL}/api/v0/product/${id}.json`)
      if (!response.ok) return null
      const data = await response.json()
      return normalizeOpenFoodFactsProduct(data.product)
    }
  } catch (error) {
    console.error("Error getting food details:", error)
    return null
  }
  return null
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

// Search local database with fuzzy matching
export function searchLocalFoods(query: string): NormalizedFood[] {
  const searchTerm = query.toLowerCase().trim()

  return localFoodDatabase
    .filter((food) => {
      const name = food.name.toLowerCase()
      // Exact match gets priority
      if (name.includes(searchTerm)) return true

      // Fuzzy matching for common variations
      const words = searchTerm.split(" ")
      return words.some((word) => name.includes(word) && word.length > 2)
    })
    .sort((a, b) => {
      // Sort by relevance - exact matches first
      const aExact = a.name.toLowerCase().startsWith(searchTerm.toLowerCase())
      const bExact = b.name.toLowerCase().startsWith(searchTerm.toLowerCase())
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      return a.name.localeCompare(b.name)
    })
}

// Optimized search with local priority
export async function searchFoodsWithFallback(query: string): Promise<NormalizedFood[]> {
  if (!query.trim()) return []

  try {
    // Always search local database first for instant results
    const localResults = searchLocalFoods(query)

    // If we have good local results (3+), return them immediately
    if (localResults.length >= 3) {
      return localResults.slice(0, 10)
    }

    // Only search APIs if we need more results
    let apiResults: NormalizedFood[] = []
    try {
      apiResults = await Promise.race([
        searchAllFoodAPIs(query),
        new Promise<NormalizedFood[]>(
          (resolve) => setTimeout(() => resolve([]), 2000), // Reduced timeout to 2 seconds
        ),
      ])
    } catch (error) {
      console.warn("API search timed out or failed, using local results only")
    }

    // Combine results, prioritizing local results
    const combinedResults = [...localResults, ...apiResults]

    // Remove duplicates based on name similarity
    const uniqueResults = combinedResults.filter((food, index, array) => {
      return !array.slice(0, index).some((existingFood) => existingFood.name.toLowerCase() === food.name.toLowerCase())
    })

    return uniqueResults.slice(0, 10) // Limit to 10 results
  } catch (error) {
    console.error("Error in combined food search:", error)
    // Always fallback to local database
    return searchLocalFoods(query)
  }
}

// Fast search function that prioritizes local database
export async function searchFoodsSimple(query: string): Promise<NormalizedFood[]> {
  if (!query.trim()) return []

  // Prioritize local database for speed
  const localResults = searchLocalFoods(query)

  // If we have good local results, return them immediately
  if (localResults.length >= 2) {
    return localResults.slice(0, 8)
  }

  // Only try APIs if no good local results and query is specific enough
  if (query.length >= 4) {
    try {
      const apiResults = await Promise.race([
        searchAllFoodAPIs(query),
        new Promise<NormalizedFood[]>((resolve) => setTimeout(() => resolve([]), 1500)),
      ])
      return [...localResults, ...apiResults].slice(0, 8)
    } catch (error) {
      console.warn("API search failed, returning local results only")
    }
  }

  return localResults.slice(0, 8)
}
