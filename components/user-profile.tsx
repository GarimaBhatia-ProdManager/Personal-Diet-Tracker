"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { User, Target, Settings, Save } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface UserProfileProps {
  goals: {
    calories: number
    protein: number
    carbs: number
    fat: number
    goal: string
  }
  onGoalsUpdate: (goals: any) => void
}

export default function UserProfile({ goals, onGoalsUpdate }: UserProfileProps) {
  const [profile, setProfile] = useState({
    name: "Alex Johnson",
    email: "alex@example.com",
    age: 28,
    height: 175,
    weight: 70,
    activityLevel: "moderate",
    dietaryRestrictions: "none",
  })

  const [editedGoals, setEditedGoals] = useState(goals)
  const [isEditing, setIsEditing] = useState(false)

  const activityLevels = [
    { value: "sedentary", label: "Sedentary (little/no exercise)" },
    { value: "light", label: "Light (light exercise 1-3 days/week)" },
    { value: "moderate", label: "Moderate (moderate exercise 3-5 days/week)" },
    { value: "active", label: "Active (hard exercise 6-7 days/week)" },
    { value: "very-active", label: "Very Active (very hard exercise, physical job)" },
  ]

  const goalTypes = [
    { value: "weight-loss", label: "Weight Loss", description: "Reduce body weight gradually" },
    { value: "muscle-gain", label: "Muscle Gain", description: "Build lean muscle mass" },
    { value: "maintenance", label: "Maintenance", description: "Maintain current weight" },
    { value: "bulking", label: "Bulking", description: "Gain weight and muscle" },
    { value: "cutting", label: "Cutting", description: "Reduce body fat while preserving muscle" },
  ]

  const calculateMacros = (calories: number, goalType: string) => {
    let proteinRatio, carbRatio, fatRatio

    switch (goalType) {
      case "weight-loss":
        proteinRatio = 0.35
        carbRatio = 0.3
        fatRatio = 0.35
        break
      case "muscle-gain":
        proteinRatio = 0.3
        carbRatio = 0.4
        fatRatio = 0.3
        break
      case "bulking":
        proteinRatio = 0.25
        carbRatio = 0.45
        fatRatio = 0.3
        break
      case "cutting":
        proteinRatio = 0.4
        carbRatio = 0.25
        fatRatio = 0.35
        break
      default:
        proteinRatio = 0.3
        carbRatio = 0.4
        fatRatio = 0.3
    }

    return {
      protein: Math.round((calories * proteinRatio) / 4),
      carbs: Math.round((calories * carbRatio) / 4),
      fat: Math.round((calories * fatRatio) / 9),
    }
  }

  const handleGoalTypeChange = (newGoalType: string) => {
    const macros = calculateMacros(editedGoals.calories, newGoalType)
    setEditedGoals({
      ...editedGoals,
      goal: newGoalType,
      ...macros,
    })
  }

  const handleCaloriesChange = (newCalories: number) => {
    const macros = calculateMacros(newCalories, editedGoals.goal)
    setEditedGoals({
      ...editedGoals,
      calories: newCalories,
      ...macros,
    })
  }

  const saveChanges = () => {
    onGoalsUpdate(editedGoals)
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>Your personal information and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: Number.parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                value={profile.height}
                onChange={(e) => setProfile({ ...profile, height: Number.parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                value={profile.weight}
                onChange={(e) => setProfile({ ...profile, weight: Number.parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="activity">Activity Level</Label>
              <Select
                value={profile.activityLevel}
                onValueChange={(value) => setProfile({ ...profile, activityLevel: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activityLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nutrition Goals */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Nutrition Goals
              </CardTitle>
              <CardDescription>Set your daily nutrition targets</CardDescription>
            </div>
            <Button
              variant={isEditing ? "default" : "outline"}
              onClick={() => (isEditing ? saveChanges() : setIsEditing(true))}
            >
              {isEditing ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Goals
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Goal Type Selection */}
            <div className="space-y-3">
              <Label>Primary Goal</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {goalTypes.map((goalType) => (
                  <div
                    key={goalType.value}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      editedGoals.goal === goalType.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    } ${!isEditing ? "pointer-events-none" : ""}`}
                    onClick={() => isEditing && handleGoalTypeChange(goalType.value)}
                  >
                    <h4 className="font-semibold">{goalType.label}</h4>
                    <p className="text-sm text-gray-600">{goalType.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Macro Targets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Daily Targets</h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="calories">Calories</Label>
                    <Input
                      id="calories"
                      type="number"
                      value={editedGoals.calories}
                      onChange={(e) => handleCaloriesChange(Number.parseInt(e.target.value))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="protein">Protein (g)</Label>
                    <Input
                      id="protein"
                      type="number"
                      value={editedGoals.protein}
                      onChange={(e) => setEditedGoals({ ...editedGoals, protein: Number.parseInt(e.target.value) })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="carbs">Carbohydrates (g)</Label>
                    <Input
                      id="carbs"
                      type="number"
                      value={editedGoals.carbs}
                      onChange={(e) => setEditedGoals({ ...editedGoals, carbs: Number.parseInt(e.target.value) })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fat">Fat (g)</Label>
                    <Input
                      id="fat"
                      type="number"
                      value={editedGoals.fat}
                      onChange={(e) => setEditedGoals({ ...editedGoals, fat: Number.parseInt(e.target.value) })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Macro Distribution</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Protein</span>
                    <Badge variant="outline">
                      {Math.round(((editedGoals.protein * 4) / editedGoals.calories) * 100)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Carbohydrates</span>
                    <Badge variant="outline">
                      {Math.round(((editedGoals.carbs * 4) / editedGoals.calories) * 100)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Fat</span>
                    <Badge variant="outline">{Math.round(((editedGoals.fat * 9) / editedGoals.calories) * 100)}%</Badge>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h5 className="font-medium mb-2">Calculated BMR</h5>
                  <p className="text-sm text-gray-600">
                    Based on your profile: ~
                    {Math.round(88.362 + 13.397 * profile.weight + 4.799 * profile.height - 5.677 * profile.age)}{" "}
                    calories/day
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences & Settings</CardTitle>
          <CardDescription>Customize your tracking experience</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dietary-restrictions">Dietary Restrictions</Label>
              <Textarea
                id="dietary-restrictions"
                placeholder="e.g., Vegetarian, Gluten-free, Lactose intolerant..."
                value={profile.dietaryRestrictions}
                onChange={(e) => setProfile({ ...profile, dietaryRestrictions: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Reminder Notifications</Label>
                <Select defaultValue="enabled">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enabled">Enabled</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                    <SelectItem value="custom">Custom Times</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Units</Label>
                <Select defaultValue="metric">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric (kg, cm)</SelectItem>
                    <SelectItem value="imperial">Imperial (lbs, ft)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
