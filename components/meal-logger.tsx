"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Clock, Utensils } from "lucide-react"

interface MealEntry {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  serving: string
  time: string
  mealType: string
}

export default function MealLogger() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMealType, setSelectedMealType] = useState("breakfast")
  const [customFood, setCustomFood] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    serving: "",
  })
  const [todayMeals, setTodayMeals] = useState<MealEntry[]>([
    {
      id: "1",
      name: "Greek Yogurt with Berries",
      calories: 150,
      protein: 15,
      carbs: 20,
      fat: 3,
      serving: "1 cup",
      time: "08:30",
      mealType: "breakfast",
    },
    {
      id: "2",
      name: "Grilled Chicken Salad",
      calories: 350,
      protein: 35,
      carbs: 15,
      fat: 18,
      serving: "1 large bowl",
      time: "12:45",
      mealType: "lunch",
    },
  ])

  // Mock food database
  const foodDatabase = [
    { name: "Banana", calories: 105, protein: 1, carbs: 27, fat: 0, serving: "1 medium" },
    { name: "Chicken Breast", calories: 165, protein: 31, carbs: 0, fat: 4, serving: "100g" },
    { name: "Brown Rice", calories: 216, protein: 5, carbs: 45, fat: 2, serving: "1 cup cooked" },
    { name: "Avocado", calories: 234, protein: 3, carbs: 12, fat: 21, serving: "1 medium" },
    { name: "Salmon", calories: 206, protein: 22, carbs: 0, fat: 12, serving: "100g" },
    { name: "Broccoli", calories: 25, protein: 3, carbs: 5, fat: 0, serving: "1 cup" },
  ]

  const filteredFoods = foodDatabase.filter((food) => food.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const addFoodToMeal = (food: any) => {
    const newMeal: MealEntry = {
      id: Date.now().toString(),
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      serving: food.serving,
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      mealType: selectedMealType,
    }
    setTodayMeals([...todayMeals, newMeal])
    setSearchQuery("")
  }

  const addCustomFood = () => {
    if (!customFood.name || !customFood.calories) return

    const newMeal: MealEntry = {
      id: Date.now().toString(),
      name: customFood.name,
      calories: Number.parseInt(customFood.calories),
      protein: Number.parseInt(customFood.protein) || 0,
      carbs: Number.parseInt(customFood.carbs) || 0,
      fat: Number.parseInt(customFood.fat) || 0,
      serving: customFood.serving || "1 serving",
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      mealType: selectedMealType,
    }
    setTodayMeals([...todayMeals, newMeal])
    setCustomFood({ name: "", calories: "", protein: "", carbs: "", fat: "", serving: "" })
  }

  const mealTypes = ["breakfast", "lunch", "dinner", "snack"]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Food Search & Add */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Foods
            </CardTitle>
            <CardDescription>Search our food database or add custom foods</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meal-type">Meal Type</Label>
              <Select value={selectedMealType} onValueChange={setSelectedMealType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mealTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="food-search">Search Food</Label>
              <Input
                id="food-search"
                placeholder="Type food name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {searchQuery && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {filteredFoods.map((food, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => addFoodToMeal(food)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{food.name}</h4>
                        <p className="text-sm text-gray-600">{food.serving}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-semibold">{food.calories} cal</p>
                        <p className="text-gray-600">
                          P:{food.protein}g C:{food.carbs}g F:{food.fat}g
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Custom Food Entry */}
        <Card>
          <CardHeader>
            <CardTitle>Add Custom Food</CardTitle>
            <CardDescription>Can't find your food? Add it manually</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="custom-name">Food Name</Label>
                <Input
                  id="custom-name"
                  placeholder="e.g., Homemade Pasta"
                  value={customFood.name}
                  onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="custom-calories">Calories</Label>
                <Input
                  id="custom-calories"
                  type="number"
                  placeholder="0"
                  value={customFood.calories}
                  onChange={(e) => setCustomFood({ ...customFood, calories: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="custom-serving">Serving Size</Label>
                <Input
                  id="custom-serving"
                  placeholder="e.g., 1 cup"
                  value={customFood.serving}
                  onChange={(e) => setCustomFood({ ...customFood, serving: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="custom-protein">Protein (g)</Label>
                <Input
                  id="custom-protein"
                  type="number"
                  placeholder="0"
                  value={customFood.protein}
                  onChange={(e) => setCustomFood({ ...customFood, protein: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="custom-carbs">Carbs (g)</Label>
                <Input
                  id="custom-carbs"
                  type="number"
                  placeholder="0"
                  value={customFood.carbs}
                  onChange={(e) => setCustomFood({ ...customFood, carbs: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="custom-fat">Fat (g)</Label>
                <Input
                  id="custom-fat"
                  type="number"
                  placeholder="0"
                  value={customFood.fat}
                  onChange={(e) => setCustomFood({ ...customFood, fat: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={addCustomFood} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Food
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Today's Meals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Today's Meals
          </CardTitle>
          <CardDescription>Your logged meals for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mealTypes.map((mealType) => {
              const mealsForType = todayMeals.filter((meal) => meal.mealType === mealType)
              const totalCalories = mealsForType.reduce((sum, meal) => sum + meal.calories, 0)

              return (
                <div key={mealType} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold capitalize">{mealType}</h3>
                    <Badge variant="secondary">{totalCalories} cal</Badge>
                  </div>

                  {mealsForType.length === 0 ? (
                    <p className="text-gray-500 text-sm">No meals logged</p>
                  ) : (
                    <div className="space-y-2">
                      {mealsForType.map((meal) => (
                        <div key={meal.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium text-sm">{meal.name}</p>
                            <p className="text-xs text-gray-600">{meal.serving}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">{meal.calories} cal</p>
                            <div className="flex gap-1 text-xs text-gray-600">
                              <Clock className="h-3 w-3" />
                              {meal.time}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
