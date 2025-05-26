"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Search, Clock, Utensils, Sparkles, Zap, Loader2, Trash2, Database, Globe } from "lucide-react"
import { searchFoodsSimple, type NormalizedFood } from "@/lib/food-apis"
import { logMealEntry, getMealEntriesForDate, deleteMealEntry, type MealEntry } from "@/lib/meal-logging"
import { analytics, trackEvent, ANALYTICS_EVENTS } from "@/lib/analytics"

interface MealLoggerProps {
  userId: string
}

export default function MealLogger({ userId }: MealLoggerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMealType, setSelectedMealType] = useState("breakfast")
  const [searchResults, setSearchResults] = useState<NormalizedFood[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [todayMeals, setTodayMeals] = useState<MealEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Custom food form state
  const [customFood, setCustomFood] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    serving: "",
  })

  // Load today's meals on component mount
  useEffect(() => {
    loadTodayMeals()
  }, [userId])

  // Debounced search function with better error handling
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      setError(null)

      // Track search start
      await trackEvent({
        event_type: ANALYTICS_EVENTS.MEAL_SEARCH_START,
        event_data: { query },
      })

      try {
        // Use the simple search function for better reliability
        const results = await searchFoodsSimple(query)
        setSearchResults(results)

        // Track search results
        await analytics.trackMealSearch(query, results.length)

        if (results.length === 0) {
          console.log("No results found for query:", query)
        }
      } catch (error) {
        console.error("Search error:", error)
        setError("Search temporarily unavailable. Try adding a custom food instead.")
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 500),
    [],
  )

  // Handle search input change
  useEffect(() => {
    debouncedSearch(searchQuery)
  }, [searchQuery, debouncedSearch])

  const loadTodayMeals = async () => {
    setIsLoading(true)
    try {
      const today = new Date().toISOString().split("T")[0]
      const meals = await getMealEntriesForDate(userId, today)
      setTodayMeals(meals)
    } catch (error) {
      console.error("Error loading meals:", error)
      setError("Failed to load today's meals")
    } finally {
      setIsLoading(false)
    }
  }

  const addFoodToMeal = async (food: NormalizedFood, servingSize = 1) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await logMealEntry(
        userId,
        food,
        selectedMealType as "breakfast" | "lunch" | "dinner" | "snack",
        servingSize,
      )

      if (result) {
        // Track meal addition analytics
        await analytics.trackMealAdded(
          food.name,
          selectedMealType,
          Math.round(food.calories * servingSize),
          food.source,
        )

        setSuccess(`Added ${food.name} to ${selectedMealType}!`)
        setSearchQuery("")
        setSearchResults([])
        await loadTodayMeals() // Refresh the meals list
      } else {
        setError("Failed to add food to meal")
      }
    } catch (error) {
      console.error("Error adding food:", error)
      setError("Failed to add food to meal")
    } finally {
      setIsLoading(false)
    }
  }

  const addCustomFood = async () => {
    if (!customFood.name || !customFood.calories) {
      setError("Please provide at least food name and calories")
      return
    }

    const normalizedCustomFood: NormalizedFood = {
      id: `custom-${Date.now()}`,
      name: customFood.name,
      calories: Number.parseFloat(customFood.calories),
      protein: Number.parseFloat(customFood.protein) || 0,
      carbs: Number.parseFloat(customFood.carbs) || 0,
      fat: Number.parseFloat(customFood.fat) || 0,
      serving: customFood.serving || "1 serving",
      source: "local",
    }

    // Track custom food addition
    await analytics.trackCustomFoodAdded(customFood.name, Number.parseFloat(customFood.calories))

    await addFoodToMeal(normalizedCustomFood)
    setCustomFood({ name: "", calories: "", protein: "", carbs: "", fat: "", serving: "" })
  }

  const removeMealEntry = async (entryId: string) => {
    setIsLoading(true)
    try {
      const success = await deleteMealEntry(entryId)
      if (success) {
        setSuccess("Meal entry removed!")
        await loadTodayMeals()
      } else {
        setError("Failed to remove meal entry")
      }
    } catch (error) {
      console.error("Error removing meal:", error)
      setError("Failed to remove meal entry")
    } finally {
      setIsLoading(false)
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "usda":
        return <Database className="h-3 w-3 text-blue-500" />
      case "openfoodfacts":
        return <Globe className="h-3 w-3 text-green-500" />
      default:
        return <Sparkles className="h-3 w-3 text-gray-500" />
    }
  }

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "usda":
        return "USDA"
      case "openfoodfacts":
        return "Open Food Facts"
      default:
        return "Local"
    }
  }

  const mealTypes = ["breakfast", "lunch", "dinner", "snack"]

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="rounded-custom">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-primary bg-green-50 text-green-800 rounded-custom">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Enhanced Food Search */}
      <Card className="bg-white border-gray-200 shadow-sm rounded-custom">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Search className="h-5 w-5" />
            Smart Food Search
          </CardTitle>
          <CardDescription className="text-gray-600">
            Search from our curated food database with nutrition information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meal-type" className="text-gray-700">
              Meal Type
            </Label>
            <Select value={selectedMealType} onValueChange={setSelectedMealType}>
              <SelectTrigger className="border-gray-300 rounded-custom focus:border-primary focus:ring-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-custom">
                {mealTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="food-search" className="text-gray-700">
              Search Food
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="food-search"
                placeholder="Try 'chicken breast', 'banana', or 'oats'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-300 rounded-custom focus:border-primary focus:ring-primary"
              />
              {isSearching && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />}
            </div>
          </div>

          {searchQuery && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map((food, index) => (
                  <div
                    key={`${food.source}-${food.id}-${index}`}
                    className="p-4 bg-gray-50 rounded-custom hover:bg-gray-100 cursor-pointer transition-all duration-200 border border-gray-200"
                    onClick={() => addFoodToMeal(food)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{food.name}</h4>
                            <div className="flex items-center gap-1">
                              {getSourceIcon(food.source)}
                              <span className="text-xs text-gray-500">{getSourceLabel(food.source)}</span>
                            </div>
                          </div>
                          {food.brand && <p className="text-sm text-gray-600 mb-1">{food.brand}</p>}
                          <p className="text-sm text-gray-600">{food.serving}</p>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold text-lg text-gray-900">{Math.round(food.calories)}</p>
                        <p className="text-xs text-gray-500">calories</p>
                        <div className="flex gap-1 text-xs text-gray-500 mt-1">
                          <span>P:{Math.round(food.protein * 10) / 10}g</span>
                          <span>C:{Math.round(food.carbs * 10) / 10}g</span>
                          <span>F:{Math.round(food.fat * 10) / 10}g</span>
                        </div>
                        {(food.fiber || food.sugar) && (
                          <div className="flex gap-1 text-xs text-gray-400 mt-1">
                            {food.fiber && <span>Fiber:{Math.round(food.fiber * 10) / 10}g</span>}
                            {food.sugar && <span>Sugar:{Math.round(food.sugar * 10) / 10}g</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : isSearching ? (
                <div className="text-center py-8 text-gray-500">
                  <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                  <p>Searching food database...</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Sparkles className="h-8 w-8 mx-auto mb-2" />
                  <p>No foods found. Try a different search term or add a custom food below!</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Food Entry */}
      <Card className="bg-white border-gray-200 shadow-sm rounded-custom">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Plus className="h-5 w-5" />
            Add Custom Food
          </CardTitle>
          <CardDescription className="text-gray-600">
            Can't find your food? Add it manually with nutrition info
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="custom-name" className="text-gray-700">
                Food Name *
              </Label>
              <Input
                id="custom-name"
                placeholder="e.g., Homemade Pasta Salad"
                value={customFood.name}
                onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })}
                className="border-gray-300 rounded-custom focus:border-primary focus:ring-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="custom-calories" className="text-gray-700">
                  Calories *
                </Label>
                <Input
                  id="custom-calories"
                  type="number"
                  placeholder="0"
                  value={customFood.calories}
                  onChange={(e) => setCustomFood({ ...customFood, calories: e.target.value })}
                  className="border-gray-300 rounded-custom focus:border-primary focus:ring-primary"
                />
              </div>
              <div>
                <Label htmlFor="custom-serving" className="text-gray-700">
                  Serving Size
                </Label>
                <Input
                  id="custom-serving"
                  placeholder="e.g., 1 cup"
                  value={customFood.serving}
                  onChange={(e) => setCustomFood({ ...customFood, serving: e.target.value })}
                  className="border-gray-300 rounded-custom focus:border-primary focus:ring-primary"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="custom-protein" className="text-gray-700">
                  Protein (g)
                </Label>
                <Input
                  id="custom-protein"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={customFood.protein}
                  onChange={(e) => setCustomFood({ ...customFood, protein: e.target.value })}
                  className="border-gray-300 rounded-custom focus:border-primary focus:ring-primary"
                />
              </div>
              <div>
                <Label htmlFor="custom-carbs" className="text-gray-700">
                  Carbs (g)
                </Label>
                <Input
                  id="custom-carbs"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={customFood.carbs}
                  onChange={(e) => setCustomFood({ ...customFood, carbs: e.target.value })}
                  className="border-gray-300 rounded-custom focus:border-primary focus:ring-primary"
                />
              </div>
              <div>
                <Label htmlFor="custom-fat" className="text-gray-700">
                  Fat (g)
                </Label>
                <Input
                  id="custom-fat"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={customFood.fat}
                  onChange={(e) => setCustomFood({ ...customFood, fat: e.target.value })}
                  className="border-gray-300 rounded-custom focus:border-primary focus:ring-primary"
                />
              </div>
            </div>
          </div>
          <Button
            onClick={addCustomFood}
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-custom"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Food
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Today's Meals */}
      <Card className="bg-white border-gray-200 shadow-sm rounded-custom">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Utensils className="h-5 w-5" />
            Today's Meals
          </CardTitle>
          <CardDescription className="text-gray-600">Your logged meals and nutrition progress</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-gray-400" />
              <p className="text-gray-500">Loading meals...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {mealTypes.map((mealType) => {
                const mealsForType = todayMeals.filter((meal) => meal.meal_type === mealType)
                const totalCalories = mealsForType.reduce((sum, meal) => sum + meal.calories, 0)
                const totalProtein = mealsForType.reduce((sum, meal) => sum + meal.protein, 0)

                return (
                  <div key={mealType} className="bg-gray-50 rounded-custom p-4 border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold capitalize flex items-center gap-2 text-gray-900">
                        <Zap className="h-4 w-4" />
                        {mealType}
                      </h3>
                      <div className="flex gap-2">
                        <Badge className="bg-orange-100 text-orange-800 border-orange-200 rounded-custom">
                          {totalCalories} cal
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 rounded-custom">
                          {Math.round(totalProtein * 10) / 10}g protein
                        </Badge>
                      </div>
                    </div>

                    {mealsForType.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        <Clock className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">No meals logged for {mealType}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {mealsForType.map((meal) => (
                          <div
                            key={meal.id}
                            className="flex justify-between items-center p-3 bg-white rounded-custom border border-gray-200"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm text-gray-900">{meal.food_name}</p>
                                {getSourceIcon(meal.food_source)}
                              </div>
                              {meal.food_brand && <p className="text-xs text-gray-600 mb-1">{meal.food_brand}</p>}
                              <p className="text-xs text-gray-600">
                                {meal.serving_size} {meal.serving_unit}
                              </p>
                              <div className="flex gap-2 text-xs text-gray-500 mt-1">
                                <span>P:{meal.protein}g</span>
                                <span>C:{meal.carbs}g</span>
                                <span>F:{meal.fat}g</span>
                                {meal.fiber && <span>Fiber:{meal.fiber}g</span>}
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{meal.calories} cal</p>
                                <div className="flex gap-1 text-xs text-gray-500">
                                  <Clock className="h-3 w-3" />
                                  {new Date(meal.logged_at).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMealEntry(meal.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-custom"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Food Database Information */}
      <Card className="bg-blue-50 border-blue-200 rounded-custom">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Database className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Comprehensive Food Database</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p>
                  • <strong>Local Database:</strong> Curated nutrition data for common foods
                </p>
                <p>
                  • <strong>Custom Foods:</strong> Add your own foods with nutrition information
                </p>
                <p>
                  • <strong>Accurate Tracking:</strong> Detailed macronutrient and calorie information
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout
  return ((...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}
