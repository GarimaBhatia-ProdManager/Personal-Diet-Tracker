"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Camera, Mic, Plus, Target, LogOut, Zap, Flame, Droplets, Clock, Award, ChevronRight } from "lucide-react"
import MealLogger from "@/components/meal-logger"
import TrendsAnalytics from "@/components/trends-analytics"
import UserProfile from "@/components/user-profile"
import AuthForm from "@/components/auth/auth-form"
import { supabase } from "@/lib/supabase"
import { getCurrentUser, getUserProfile, signOut, createOrUpdateUserProfile } from "@/lib/auth"
import type { User as AuthUser } from "@supabase/supabase-js"
import type { UserProfileType } from "@/lib/supabase"
import { getDailyNutritionSummary } from "@/lib/actions/nutrition-actions"

export default function DietTrackerApp() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfileType | null>(null)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [loading, setLoading] = useState(true)
  const [showCamera, setShowCamera] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [todayStats, setTodayStats] = useState({
    calories: { consumed: 0, target: userProfile?.daily_calories || 2000 },
    protein: { consumed: 0, target: userProfile?.daily_protein || 150 },
    carbs: { consumed: 0, target: userProfile?.daily_carbs || 250 },
    fat: { consumed: 0, target: userProfile?.daily_fat || 67 },
    water: { consumed: 5, target: 8 },
  })

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)

      if (currentUser) {
        await loadUserProfile(currentUser.id)
      }
    } catch (error) {
      console.error("Error initializing auth:", error)
    } finally {
      setLoading(false)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id)

      setUser(session?.user ?? null)

      if (session?.user) {
        await loadUserProfile(session.user.id)
      } else {
        setUserProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }

  const loadUserProfile = async (userId: string) => {
    if (profileLoading) return

    setProfileLoading(true)

    try {
      console.log("Loading profile for user:", userId)

      let profile = await getUserProfile(userId)

      if (!profile) {
        console.log("No profile found, creating one...")

        const userDisplayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"

        profile = await createOrUpdateUserProfile(userId, userDisplayName)
        console.log("Created new profile:", profile)
      }

      setUserProfile(profile)
      console.log("Profile loaded successfully:", profile)

      await loadDailyStats()
    } catch (error) {
      console.error("Error loading user profile:", error)

      try {
        const userDisplayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"

        const newProfile = await createOrUpdateUserProfile(userId, userDisplayName)
        setUserProfile(newProfile)
        console.log("Fallback profile created:", newProfile)
      } catch (fallbackError) {
        console.error("Failed to create fallback profile:", fallbackError)
        setUserProfile({
          id: "temp",
          user_id: userId,
          full_name: user?.user_metadata?.full_name || "User",
          daily_calories: 2000,
          daily_protein: 150,
          daily_carbs: 250,
          daily_fat: 67,
          goal_type: "maintenance",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    } finally {
      setProfileLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setUser(null)
      setUserProfile(null)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const handleVoiceInput = () => {
    setIsListening(!isListening)
  }

  const loadDailyStats = async () => {
    if (!user?.id) return

    try {
      const today = new Date().toISOString().split("T")[0]
      const summary = await getDailyNutritionSummary(user.id, today)

      setTodayStats({
        calories: { consumed: summary.total_calories, target: userProfile?.daily_calories || 2000 },
        protein: { consumed: summary.total_protein, target: userProfile?.daily_protein || 150 },
        carbs: { consumed: summary.total_carbs, target: userProfile?.daily_carbs || 250 },
        fat: { consumed: summary.total_fat, target: userProfile?.daily_fat || 67 },
        water: { consumed: 5, target: 8 }, // Keep water tracking separate for now
      })
    } catch (error) {
      console.error("Error loading daily stats:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-green-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading your nutrition journey...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm onAuthSuccess={() => {}} />
  }

  if (profileLoading || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-green-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          </div>
          <p className="text-gray-600 font-medium">Setting up your profile...</p>
        </div>
      </div>
    )
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

  const macroData = [
    {
      name: "Protein",
      value: todayStats.protein.consumed,
      target: todayStats.protein.target,
      color: "#3B82F6",
      percentage: 30,
    },
    {
      name: "Carbs",
      value: todayStats.carbs.consumed,
      target: todayStats.carbs.target,
      color: "#F59E0B",
      percentage: 45,
    },
    { name: "Fat", value: todayStats.fat.consumed, target: todayStats.fat.target, color: "#EF4444", percentage: 25 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      {/* Camera Overlay */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <div className="relative w-full h-full max-w-md mx-auto">
            <div className="absolute inset-4 border-2 border-white/50 rounded-custom">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-64 h-64 border-4 border-white rounded-custom relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary-green rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary-green rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary-green rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary-green rounded-br-lg"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-white text-center text-sm">
                      Point camera at food
                      <br />
                      <span className="text-primary-green">AI will detect nutrition</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setShowCamera(false)}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white text-black hover:bg-gray-100 rounded-custom"
            >
              Close Camera
            </Button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Good morning! 🌅</h1>
            <p className="text-gray-600 text-sm">{userProfile?.full_name || "Nutrition Explorer"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-white border-primary rounded-custom">Day 7 🔥</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-gray-600 hover:bg-gray-100 rounded-custom"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Animated Calorie Circle */}
        <Card className="mb-6 bg-white border-gray-200 shadow-sm rounded-custom">
          <CardContent className="p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" stroke="#E5E7EB" strokeWidth="8" fill="none" />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="#00B74A"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${calorieProgress * 3.14} 314`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">{todayStats.calories.consumed}</span>
                  <span className="text-xs text-gray-500">of {todayStats.calories.target}</span>
                  <span className="text-xs text-gray-400">calories</span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold mb-1 text-gray-900">
                {remaining > 0 ? `${remaining} calories left` : "Goal reached! 🎉"}
              </p>
              <p className="text-sm text-gray-600">{Math.round(calorieProgress)}% of daily goal</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-white border-gray-200 shadow-sm rounded-custom">
            <CardContent className="p-4 text-center">
              <Droplets className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <p className="text-lg font-bold text-gray-900">
                {todayStats.water.consumed}/{todayStats.water.target}
              </p>
              <p className="text-xs text-gray-500">glasses</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 shadow-sm rounded-custom">
            <CardContent className="p-4 text-center">
              <Zap className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <p className="text-lg font-bold text-gray-900">{todayStats.protein.consumed}g</p>
              <p className="text-xs text-gray-500">protein</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 shadow-sm rounded-custom">
            <CardContent className="p-4 text-center">
              <Award className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-lg font-bold text-gray-900">85%</p>
              <p className="text-xs text-gray-500">complete</p>
            </CardContent>
          </Card>
        </div>

        {/* Nutrition Pie Chart */}
        <Card className="mb-6 bg-white border-gray-200 shadow-sm rounded-custom">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900">
              <Target className="h-5 w-5" />
              Macro Breakdown
            </h3>
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="#E5E7EB" strokeWidth="8" fill="none" />
                  {macroData.map((macro, index) => {
                    const offset = macroData.slice(0, index).reduce((sum, m) => sum + m.percentage * 2.51, 0)
                    return (
                      <circle
                        key={macro.name}
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={macro.color}
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${macro.percentage * 2.51} 251`}
                        strokeDashoffset={-offset}
                        className="transition-all duration-1000 ease-out"
                      />
                    )
                  })}
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              {macroData.map((macro) => (
                <div key={macro.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: macro.color }}></div>
                    <span className="text-sm text-gray-700">{macro.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{macro.value}g</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Add Foods */}
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
                  onClick={() => {
                    console.log(`Added ${food.name}`)
                  }}
                >
                  <span className="text-2xl">{food.emoji}</span>
                  <span className="text-xs font-medium">{food.name}</span>
                  <span className="text-xs text-gray-500">{food.calories} cal</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Meals */}
        <Card className="mb-6 bg-white border-gray-200 shadow-sm rounded-custom">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2 text-gray-900">
                <Clock className="h-5 w-5" />
                Today's Meals
              </h3>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-100 rounded-custom">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-custom">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🥣</span>
                  <div>
                    <p className="font-medium text-sm text-gray-900">Breakfast</p>
                    <p className="text-xs text-gray-500">Oatmeal with berries</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm text-gray-900">320 cal</p>
                  <p className="text-xs text-gray-500">8:30 AM</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-custom">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🥗</span>
                  <div>
                    <p className="font-medium text-sm text-gray-900">Lunch</p>
                    <p className="text-xs text-gray-500">Caesar salad</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm text-gray-900">450 cal</p>
                  <p className="text-xs text-gray-500">12:45 PM</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
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

          <TabsContent value="log" className="mt-6">
            <MealLogger userId={user.id} />
          </TabsContent>

          <TabsContent value="trends" className="mt-6">
            <TrendsAnalytics userId={user.id} />
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <UserProfile user={user} userProfile={userProfile} onProfileUpdate={setUserProfile} />
          </TabsContent>
        </Tabs>

        {/* Floating Action Buttons */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-3">
          {/* Voice Input Button */}
          <Button
            onClick={handleVoiceInput}
            className={`w-14 h-14 rounded-custom shadow-lg transition-all duration-300 ${
              isListening ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            <Mic className="h-6 w-6 text-white" />
          </Button>

          {/* Camera Button */}
          <Button
            onClick={() => setShowCamera(true)}
            className="w-14 h-14 rounded-custom bg-gray-600 hover:bg-gray-700 shadow-lg transition-all duration-300"
          >
            <Camera className="h-6 w-6 text-white" />
          </Button>

          {/* Add Meal Button */}
          <Button
            onClick={() => setActiveTab("log")}
            className="w-16 h-16 rounded-custom bg-primary hover:bg-primary/90 shadow-lg transition-all duration-300"
          >
            <Plus className="h-8 w-8 text-white" />
          </Button>
        </div>
      </div>
    </div>
  )
}
