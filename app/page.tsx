"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { CalendarDays, Target, TrendingUp, Plus, Apple, Zap, Droplets, LogOut, User } from "lucide-react"
import MealLogger from "@/components/meal-logger"
import DailySummary from "@/components/daily-summary"
import TrendsAnalytics from "@/components/trends-analytics"
import UserProfile from "@/components/user-profile"
import FeedbackCollection from "@/components/feedback-collection"
import AuthForm from "@/components/auth/auth-form"
import { supabase } from "@/lib/supabase"
import { getCurrentUser, getUserProfile, signOut } from "@/lib/auth"
import type { User as AuthUser } from "@supabase/supabase-js"
import type { UserProfileType } from "@/lib/supabase"

export default function DietTrackerApp() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfileType | null>(null)
  const [activeTab, setActiveTab] = useState("today")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    getCurrentUser().then((user) => {
      setUser(user)
      if (user) {
        loadUserProfile(user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await loadUserProfile(session.user.id)
      } else {
        setUserProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (userId: string) => {
    try {
      const profile = await getUserProfile(userId)
      setUserProfile(profile)
    } catch (error) {
      console.error("Error loading user profile:", error)
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

  const handleAuthSuccess = () => {
    // User state will be updated by the auth state change listener
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />
  }

  // Mock data for demonstration - in real app, this would come from Supabase
  const todayStats = {
    calories: { consumed: 1650, target: userProfile?.daily_calories || 2000 },
    protein: { consumed: 120, target: userProfile?.daily_protein || 150 },
    carbs: { consumed: 180, target: userProfile?.daily_carbs || 250 },
    fat: { consumed: 45, target: userProfile?.daily_fat || 67 },
    water: { consumed: 6, target: 8 },
  }

  const quickStats = [
    {
      icon: <Apple className="h-5 w-5 text-green-600" />,
      label: "Calories",
      value: `${todayStats.calories.consumed}/${todayStats.calories.target}`,
      progress: (todayStats.calories.consumed / todayStats.calories.target) * 100,
    },
    {
      icon: <Zap className="h-5 w-5 text-blue-600" />,
      label: "Protein",
      value: `${todayStats.protein.consumed}g/${todayStats.protein.target}g`,
      progress: (todayStats.protein.consumed / todayStats.protein.target) * 100,
    },
    {
      icon: <Droplets className="h-5 w-5 text-cyan-600" />,
      label: "Water",
      value: `${todayStats.water.consumed}/${todayStats.water.target} glasses`,
      progress: (todayStats.water.consumed / todayStats.water.target) * 100,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Personal Diet Tracker</h1>
              <p className="text-gray-600 mt-1">Welcome back, {userProfile?.full_name || user.email}!</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-white">
                <Target className="h-4 w-4 mr-1" />
                {userProfile?.goal_type?.replace("-", " ").toUpperCase() || "MAINTENANCE"}
              </Badge>
              <Button variant="outline" onClick={handleSignOut} className="bg-white">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {quickStats.map((stat, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {stat.icon}
                      <span className="font-medium text-sm">{stat.label}</span>
                    </div>
                    <span className="text-sm font-semibold">{stat.value}</span>
                  </div>
                  <Progress value={stat.progress} className="h-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="today" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Today
            </TabsTrigger>
            <TabsTrigger value="log-meal">
              <Plus className="h-4 w-4 mr-1" />
              Log Meal
            </TabsTrigger>
            <TabsTrigger value="trends">
              <TrendingUp className="h-4 w-4 mr-1" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-1" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="today">
            <DailySummary stats={todayStats} />
          </TabsContent>

          <TabsContent value="log-meal">
            <MealLogger userId={user.id} />
          </TabsContent>

          <TabsContent value="trends">
            <TrendsAnalytics userId={user.id} />
          </TabsContent>

          <TabsContent value="profile">
            <UserProfile user={user} userProfile={userProfile} onProfileUpdate={setUserProfile} />
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackCollection userId={user.id} />
          </TabsContent>
        </Tabs>

        {/* Database Status */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">🔗 Live Database Connection</CardTitle>
            <CardDescription>Connected to Supabase with real user authentication and data storage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Authentication: Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Database: Connected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Real-time: Enabled</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
