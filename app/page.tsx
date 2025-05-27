"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Flame, Droplets } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getCurrentUser, getUserProfile, signOut, createOrUpdateUserProfile } from "@/lib/auth"
import type { User as AuthUser } from "@supabase/supabase-js"
import type { UserProfileType } from "@/lib/supabase"
import { getDailyNutritionSummary } from "@/lib/actions/nutrition-actions"
import { getMealEntriesForDate, logMealEntry } from "@/lib/meal-logging"
import { logWaterIntake, getWaterIntake } from "@/lib/water-logging"
import { analytics, sessionManager, trackAuthEvent, usePageTracking, useTimeTracking } from "@/lib/analytics"
import { getISTDate } from "@/lib/timezone-utils"
import React from "react"
import { ClientProviders } from "@/components/client-providers"

// Lazy load heavy components
const MealLogger = React.lazy(() => import("@/components/meal-logger"))
const TrendsAnalytics = React.lazy(() => import("@/components/trends-analytics"))
const UserProfile = React.lazy(() => import("@/components/user-profile"))
const AuthForm = React.lazy(() => import("@/components/auth/auth-form"))

// Loading component
const ComponentLoader = () => (
  <div className="flex items-center justify-center p-8">
    <div className="w-6 h-6 border-2 border-gray-200 border-t-primary rounded-full animate-spin"></div>
  </div>
)

// Get time-based greeting
function getTimeBasedGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

export default function DietTrackerApp() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfileType | null>(null)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [todayStats, setTodayStats] = useState({
    calories: { consumed: 0, target: 2000 },
    protein: { consumed: 0, target: 150 },
    carbs: { consumed: 0, target: 250 },
    fat: { consumed: 0, target: 67 },
    water: { consumed: 0, target: 8 },
  })
  const [waterGlasses, setWaterGlasses] = useState(0)
  const [userStreak, setUserStreak] = useState(0)
  const [timeBasedGreeting, setTimeBasedGreeting] = useState(getTimeBasedGreeting())

  // Analytics tracking
  usePageTracking("dashboard")
  useTimeTracking("main_app")

  // Update greeting every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeBasedGreeting(getTimeBasedGreeting())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  // Track user session when user changes
  React.useEffect(() => {
    if (user?.id) {
      sessionManager.setUserId(user.id)
      analytics.trackDashboardView()
    }
  }, [user?.id])

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)

      if (currentUser) {
        // Load profile in background, don't block UI
        loadUserData(currentUser.id)
      }
    } catch (error) {
      console.error("Error initializing auth:", error)
    } finally {
      setLoading(false) // Set loading to false immediately after auth check
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id)

      setUser(session?.user ?? null)

      if (session?.user) {
        loadUserData(session.user.id)
      } else {
        setUserProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }

  const addWaterGlass = async () => {
    if (!user?.id) {
      console.error("[Water] Cannot add water: No user ID")
      return
    }

    try {
      const newCount = waterGlasses + 1
      console.log("[Water] Adding water glass, new count:", newCount)
      
      // Save to database first
      const result = await logWaterIntake(user.id, newCount)
      console.log("[Water] Supabase save result:", result)
      
      if (result) {
        // Update state atomically
        setWaterGlasses(newCount)
        setTodayStats((prev) => ({
          ...prev,
          water: { consumed: newCount, target: 8 },
        }))

        // Analytics tracking
        analytics.trackWaterGlassAdded(newCount)
        if (newCount >= 8) {
          analytics.trackWaterGoalAchieved(newCount)
        }
        console.log("[Water] State updated successfully:", { waterGlasses: newCount })
      } else {
        console.error("[Water] Failed to save water intake to Supabase")
      }
    } catch (error) {
      console.error("[Water] Error adding water glass:", error)
    }
  }

  const removeWaterGlass = async () => {
    if (!user?.id) {
      console.error("[Water] Cannot remove water: No user ID")
      return
    }
    if (waterGlasses <= 0) {
      console.error("[Water] Cannot remove water: Already at 0")
      return
    }

    try {
      const newCount = waterGlasses - 1
      console.log("[Water] Removing water glass, new count:", newCount)
      
      // Save to database first
      const result = await logWaterIntake(user.id, newCount)
      console.log("[Water] Supabase save result:", result)
      
      if (result) {
        // Update state atomically
        setWaterGlasses(newCount)
        setTodayStats((prev) => ({
          ...prev,
          water: { consumed: newCount, target: 8 },
        }))
        console.log("[Water] State updated successfully:", { waterGlasses: newCount })
      } else {
        console.error("[Water] Failed to save water intake to Supabase")
      }
    } catch (error) {
      console.error("[Water] Error removing water glass:", error)
    }
  }

  const calculateUserStreak = async (userId: string) => {
    // Don't block UI, calculate in background
    try {
      let streak = 0
      const today = getISTDate()

      // Check backwards from today (limit to 7 days for performance)
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(today)
        checkDate.setDate(checkDate.getDate() - i)
        const dateString = checkDate.toLocaleDateString("en-CA")

        const meals = await getMealEntriesForDate(userId, dateString)

        if (meals.length > 0) {
          if (i === 0 || streak === i) {
            streak = i + 1
          } else {
            break
          }
        } else if (i === 0) {
          // If no meals today, streak is 0
          break
        } else {
          break
        }
      }

      setUserStreak(streak)
    } catch (error) {
      console.error("Error calculating streak:", error)
      setUserStreak(0)
    }
  }

  const loadUserData = async (userId: string) => {
    try {
      // Load profile data
      const profile = await getUserProfile(userId)
      if (profile) {
        setUserProfile(profile)
      }

      // Load daily stats including water
      await loadDailyStats(userId)

      // Calculate streak
      await calculateUserStreak(userId)
    } catch (error) {
      console.error("Error loading user data:", error)
    }
  }

  const handleSignOut = async () => {
    try {
      await trackAuthEvent("logout", user?.email)
      await sessionManager.endSession()
      await signOut()
      setUser(null)
      setUserProfile(null)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const loadDailyStats = async (userId: string) => {
    try {
      console.log("[Stats] Loading daily stats for user:", userId)
      const today = getISTDate()
      console.log("[Stats] Current IST date:", today)
      
      // Load nutrition summary
      const summary = await getDailyNutritionSummary(userId, today)
      console.log("[Stats] Nutrition summary:", summary)

      // Load water intake
      const todayWater = await getWaterIntake(userId)
      console.log("[Stats] Water intake loaded:", todayWater)
      
      // Update state atomically to prevent race conditions
      setWaterGlasses(todayWater)
      setTodayStats((prev) => ({
        calories: { consumed: summary.total_calories, target: prev.calories.target },
        protein: { consumed: summary.total_protein, target: prev.protein.target },
        carbs: { consumed: summary.total_carbs, target: prev.carbs.target },
        fat: { consumed: summary.total_fat, target: prev.fat.target },
        water: { consumed: todayWater, target: 8 },
      }))
      console.log("[Stats] State updated:", { waterGlasses: todayWater, summary, todayStats })
    } catch (error) {
      console.error("[Stats] Error loading daily stats:", error)
    }
  }

  // Quick add food function
  const handleQuickAddFood = async (food: any) => {
    if (!user?.id) return

    try {
      // Determine meal type based on current time
      const hour = new Date().getHours()
      let mealType = "snack"
      if (hour >= 6 && hour < 11) mealType = "breakfast"
      else if (hour >= 11 && hour < 16) mealType = "lunch"
      else if (hour >= 16 && hour < 22) mealType = "dinner"

      const normalizedFood = {
        id: `quick-${food.name.toLowerCase()}`,
        name: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        serving: "1 serving",
        source: "local" as const,
      }

      const result = await logMealEntry(user.id, normalizedFood, mealType as any, 1)

      if (result) {
        // Track analytics
        await analytics.trackMealAdded(food.name, mealType, food.calories, "quick_add")

        // Refresh daily stats
        await loadDailyStats(user.id)

        // Show success feedback
        console.log(`Added ${food.name} to ${mealType}!`)
      }
    } catch (error) {
      console.error("Error adding quick food:", error)
    }
  }

  const handleTabChange = async (tab: string) => {
    setActiveTab(tab)
    analytics.trackTabSwitch(activeTab, tab)

    // Reload data when switching to dashboard
    if (tab === "dashboard" && user?.id) {
      await loadDailyStats(user.id)
    }
  }

  // Simple loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-green-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <React.Suspense fallback={<ComponentLoader />}>
        <AuthForm />
      </React.Suspense>
    )
  }

  // Show dashboard immediately with default profile if profile is still loading
  const displayProfile = userProfile || {
    id: "temp",
    user_id: user.id,
    full_name: user?.user_metadata?.full_name || "User",
    daily_calories: 2000,
    daily_protein: 150,
    daily_carbs: 250,
    daily_fat: 67,
    goal_type: "maintenance",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const calorieProgress = (todayStats.calories.consumed / todayStats.calories.target) * 100
  const remaining = todayStats.calories.target - todayStats.calories.consumed

  const quickAddFoods = [
    { emoji: "🍎", name: "Apple", calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
    { emoji: "🥚", name: "Egg", calories: 70, protein: 6, carbs: 0.5, fat: 5 },
    { emoji: "🍗", name: "Chicken", calories: 165, protein: 31, carbs: 0, fat: 3.6 },
    { emoji: "🥑", name: "Avocado", calories: 234, protein: 3, carbs: 12, fat: 21 },
    { emoji: "🍌", name: "Banana", calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
    { emoji: "🥛", name: "Milk", calories: 150, protein: 8, carbs: 12, fat: 8 },
  ]

  return (
    <ClientProviders userId={user?.id}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
        <div className="container py-6">
          {loading ? (
            <ComponentLoader />
          ) : !user ? (
            <React.Suspense fallback={<ComponentLoader />}>
              <AuthForm />
            </React.Suspense>
          ) : (
            <div className="container mx-auto px-4 py-6 max-w-md">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {timeBasedGreeting}
                  </h1>
                  <p className="text-gray-600 text-sm">{displayProfile?.full_name || "Nutrition Explorer"}</p>
                  <p className="text-gray-500 text-xs">IST: {getISTDate()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Dynamic Streak Badge - Only show if user has a streak */}
                  {userStreak > 0 && (
                    <Badge className="bg-primary text-white border-primary rounded-custom">
                      {userStreak} day{userStreak !== 1 ? "s" : ""} 🔥
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="text-gray-600 hover:bg-gray-100 rounded-custom"
                  >
                    Sign Out
                  </Button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
                <TabsList className="grid w-full grid-cols-4 bg-gray-100 rounded-custom">
                  <TabsTrigger
                    value="dashboard"
                    className="text-gray-600 data-[state=active]:bg-white data-[state=active]:text-primary rounded-custom"
                  >
                    Dashboard
                  </TabsTrigger>
                  <TabsTrigger
                    value="log"
                    className="text-gray-600 data-[state=active]:bg-white data-[state=active]:text-primary rounded-custom"
                  >
                    Log
                  </TabsTrigger>
                  <TabsTrigger
                    value="trends"
                    className="text-gray-600 data-[state=active]:bg-white data-[state=active]:text-primary rounded-custom"
                  >
                    Trends
                  </TabsTrigger>
                  <TabsTrigger
                    value="profile"
                    className="text-gray-600 data-[state=active]:bg-white data-[state=active]:text-primary rounded-custom"
                  >
                    Profile
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="mt-6">
                  {/* User Streak */}
                  <Card className="mb-6 bg-gradient-to-r from-primary/10 to-green-100 border-primary/20 rounded-custom">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {userStreak === 0 ? "Start Your Streak!" : `${userStreak} Day Streak! 🔥`}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {userStreak === 0
                              ? "Log your first meal to start building consistency"
                              : userStreak === 1
                                ? "Great start! Keep logging to build your streak"
                                : `You've been consistently tracking for ${userStreak} days`}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{userStreak}</div>
                          <div className="text-xs text-gray-500">days</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Large Calorie Circle with Smaller Macro Rings */}
                  <Card className="mb-6 bg-white border-gray-200 shadow-sm rounded-custom">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center">
                        {/* Main Calorie Circle */}
                        <div className="relative mb-6">
                          <div className="relative w-40 h-40">
                            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
                              <circle cx="80" cy="80" r="70" stroke="#E5E7EB" strokeWidth="12" fill="none" />
                              <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="#00B74A"
                                strokeWidth="12"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={`${calorieProgress * 4.4} 440`}
                                className="transition-all duration-1000 ease-out"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-3xl font-bold text-gray-900">{todayStats.calories.consumed}</span>
                              <span className="text-sm text-gray-500">of {todayStats.calories.target}</span>
                              <span className="text-xs text-gray-400">calories</span>
                            </div>
                          </div>
                        </div>

                        {/* Macro Progress Rings */}
                        <div className="grid grid-cols-4 gap-4 w-full">
                          {/* Protein */}
                          <div className="text-center">
                            <div className="relative w-16 h-16 mx-auto mb-2">
                              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                                <circle cx="32" cy="32" r="28" stroke="#E5E7EB" strokeWidth="4" fill="none" />
                                <circle
                                  cx="32"
                                  cy="32"
                                  r="28"
                                  stroke="#3B82F6"
                                  strokeWidth="4"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeDasharray={`${(todayStats.protein.consumed / todayStats.protein.target) * 175.9} 175.9`}
                                  className="transition-all duration-1000 ease-out"
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xs font-bold text-gray-900">
                                  {Math.round(todayStats.protein.consumed)}g
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600">Protein</p>
                            <p className="text-xs text-blue-600">
                              {Math.round((todayStats.protein.consumed / todayStats.protein.target) * 100)}%
                            </p>
                          </div>

                          {/* Carbs */}
                          <div className="text-center">
                            <div className="relative w-16 h-16 mx-auto mb-2">
                              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                                <circle cx="32" cy="32" r="28" stroke="#E5E7EB" strokeWidth="4" fill="none" />
                                <circle
                                  cx="32"
                                  cy="32"
                                  r="28"
                                  stroke="#F59E0B"
                                  strokeWidth="4"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeDasharray={`${(todayStats.carbs.consumed / todayStats.carbs.target) * 175.9} 175.9`}
                                  className="transition-all duration-1000 ease-out"
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xs font-bold text-gray-900">
                                  {Math.round(todayStats.carbs.consumed)}g
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600">Carbs</p>
                            <p className="text-xs text-orange-600">
                              {Math.round((todayStats.carbs.consumed / todayStats.carbs.target) * 100)}%
                            </p>
                          </div>

                          {/* Fat */}
                          <div className="text-center">
                            <div className="relative w-16 h-16 mx-auto mb-2">
                              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                                <circle cx="32" cy="32" r="28" stroke="#E5E7EB" strokeWidth="4" fill="none" />
                                <circle
                                  cx="32"
                                  cy="32"
                                  r="28"
                                  stroke="#EF4444"
                                  strokeWidth="4"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeDasharray={`${(todayStats.fat.consumed / todayStats.fat.target) * 175.9} 175.9`}
                                  className="transition-all duration-1000 ease-out"
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xs font-bold text-gray-900">
                                  {Math.round(todayStats.fat.consumed)}g
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600">Fat</p>
                            <p className="text-xs text-red-600">
                              {Math.round((todayStats.fat.consumed / todayStats.fat.target) * 100)}%
                            </p>
                          </div>

                          {/* Water */}
                          <div className="text-center">
                            <div className="relative w-16 h-16 mx-auto mb-2">
                              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                                <circle cx="32" cy="32" r="28" stroke="#E5E7EB" strokeWidth="4" fill="none" />
                                <circle
                                  cx="32"
                                  cy="32"
                                  r="28"
                                  stroke="#06B6D4"
                                  strokeWidth="4"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeDasharray={`${(todayStats.water.consumed / todayStats.water.target) * 175.9} 175.9`}
                                  className="transition-all duration-1000 ease-out"
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xs font-bold text-gray-900">{todayStats.water.consumed}</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600">Water</p>
                            <p className="text-xs text-cyan-600">
                              {Math.round((todayStats.water.consumed / todayStats.water.target) * 100)}%
                            </p>
                          </div>
                        </div>

                        {/* Calorie Summary */}
                        <div className="text-center mt-4">
                          <p className="text-lg font-semibold mb-1 text-gray-900">
                            {remaining > 0 ? `${remaining} calories left` : "Goal reached! 🎉"}
                          </p>
                          <p className="text-sm text-gray-600">{Math.round(calorieProgress)}% of daily goal</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Water Logging Section */}
                  <Card className="mb-6 bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200 rounded-custom">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Droplets className="h-5 w-5 text-cyan-600" />
                          <h3 className="font-semibold text-gray-900">Water Intake</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-cyan-600">
                            {todayStats.water.consumed}/{todayStats.water.target}
                          </p>
                          <p className="text-xs text-gray-600">glasses (2L goal)</p>
                        </div>
                      </div>

                      {/* Water Glasses Visual */}
                      <div className="flex justify-center mb-4">
                        <div className="grid grid-cols-4 gap-2">
                          {Array.from({ length: 8 }, (_, i) => (
                            <div
                              key={i}
                              className={`w-8 h-10 rounded-b-lg border-2 transition-all duration-300 ${
                                i < todayStats.water.consumed
                                  ? "bg-cyan-400 border-cyan-500"
                                  : "bg-gray-100 border-gray-300"
                              }`}
                            >
                              <div
                                className={`w-full h-full rounded-b-lg ${
                                  i < todayStats.water.consumed ? "bg-gradient-to-t from-cyan-500 to-cyan-300" : ""
                                }`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Water Controls */}
                      <div className="flex items-center justify-center gap-4">
                        <Button
                          onClick={removeWaterGlass}
                          variant="outline"
                          size="sm"
                          disabled={todayStats.water.consumed === 0}
                          className="rounded-custom border-cyan-300 text-cyan-700 hover:bg-cyan-50"
                        >
                          -1 Glass
                        </Button>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900">{todayStats.water.consumed * 250}ml</p>
                          <p className="text-xs text-gray-600">consumed today</p>
                        </div>
                        <Button
                          onClick={addWaterGlass}
                          variant="outline"
                          size="sm"
                          disabled={todayStats.water.consumed >= 12}
                          className="rounded-custom border-cyan-300 text-cyan-700 hover:bg-cyan-50"
                        >
                          +1 Glass
                        </Button>
                      </div>

                      {todayStats.water.consumed >= 8 && (
                        <div className="mt-3 text-center">
                          <Badge className="bg-cyan-100 text-cyan-800 border-cyan-200 rounded-custom">
                            🎉 Daily hydration goal achieved!
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick Add Foods - Now functional */}
                  <Card className="mb-6 bg-white border-gray-200 shadow-sm rounded-custom">
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900">
                        <Flame className="h-5 w-5" />
                        Quick Add
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        {quickAddFoods.map((food) => (
                          <Button
                            key={food.name}
                            variant="outline"
                            className="h-auto p-3 flex flex-col items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200 rounded-custom"
                            onClick={() => handleQuickAddFood(food)}
                          >
                            <span className="text-2xl">{food.emoji}</span>
                            <span className="text-xs font-medium">{food.name}</span>
                            <span className="text-xs text-gray-500">{food.calories} cal</span>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="log" className="mt-6">
                  <React.Suspense fallback={<ComponentLoader />}>
                    <MealLogger userId={user.id} />
                  </React.Suspense>
                </TabsContent>

                <TabsContent value="trends" className="mt-6">
                  <React.Suspense fallback={<ComponentLoader />}>
                    <TrendsAnalytics userId={user.id} onLogMeal={() => setActiveTab("log")} />
                  </React.Suspense>
                </TabsContent>

                <TabsContent value="profile" className="mt-6">
                  <React.Suspense fallback={<ComponentLoader />}>
                    <UserProfile user={user} userProfile={displayProfile} onProfileUpdate={setUserProfile} />
                  </React.Suspense>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </ClientProviders>
  )
}
