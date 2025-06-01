"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  PieChart,
  Target,
  Plus,
  Utensils,
  Clock,
  ChefHat,
} from "lucide-react"
import { getMealEntriesForDate, getWeeklyMealSummary } from "@/lib/meal-logging"
import { getWaterHistory } from "@/lib/water-logging"
import { usePageTracking, trackEvent, ANALYTICS_EVENTS } from "@/lib/analytics"
import { getISTDate } from "@/lib/timezone-utils"

interface TrendsAnalyticsProps {
  userId: string
  onLogMeal?: () => void
}

export default function TrendsAnalytics({ userId, onLogMeal }: TrendsAnalyticsProps) {
  usePageTracking("trends")
  const [hasData, setHasData] = useState(false)
  const [loading, setLoading] = useState(true)
  const [totalMealsLogged, setTotalMealsLogged] = useState(0)
  const [daysWithData, setDaysWithData] = useState(0)
  const [todayMealsCount, setTodayMealsCount] = useState(0)
  const [weeklyData, setWeeklyData] = useState<any[]>([])
  const [waterData, setWaterData] = useState<any[]>([])

  useEffect(() => {
    checkUserData()
  }, [userId])

  useEffect(() => {
    trackEvent({ event_type: ANALYTICS_EVENTS.TRENDS_VIEW })
  }, [])

  const checkUserData = async () => {
    setLoading(true)
    try {
      // Check the last 30 days for any meal entries using IST dates
      let totalMeals = 0
      let daysWithMeals = 0
      let todayMeals = 0

      for (let i = 0; i < 30; i++) {
        const dateString = getISTDate(-i) // Get IST date for i days ago

        const meals = await getMealEntriesForDate(userId, dateString)
        if (meals.length > 0) {
          totalMeals += meals.length
          daysWithMeals++

          // Count today's meals specifically
          if (i === 0) {
            todayMeals = meals.length
          }
        }
      }

      setTotalMealsLogged(totalMeals)
      setDaysWithData(daysWithMeals)
      setTodayMealsCount(todayMeals)

      // Consider user has meaningful data if they have logged meals on at least 3 days
      const hasEnoughData = daysWithMeals >= 3
      setHasData(hasEnoughData)

      // If user has data, load actual trends
      if (hasEnoughData) {
        await loadActualTrends()
      }
    } catch (error) {
      console.error("Error checking user data:", error)
      setHasData(false)
    } finally {
      setLoading(false)
    }
  }

  const loadActualTrends = async () => {
    try {
      // Load actual weekly data
      const endDate = getISTDate()
      const weeklyMeals = await getWeeklyMealSummary(userId, endDate)
      setWeeklyData(weeklyMeals)

      // Load water data
      const waterHistory = await getWaterHistory(userId, 7)
      setWaterData(waterHistory)
    } catch (error) {
      console.error("Error loading trends:", error)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your trends...</p>
        </div>
      </div>
    )
  }

  // Empty state for new users
  if (!hasData) {
    return (
      <div className="space-y-6">
        {/* Welcome Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 rounded-custom">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-primary rounded-custom flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-gray-900">
              {todayMealsCount > 0 ? "Great Start!" : "Start Your Nutrition Journey!"}
            </CardTitle>
            <CardDescription className="text-gray-600 text-lg">
              {todayMealsCount > 0
                ? "You've logged meals today! Keep tracking for a few more days to unlock detailed insights."
                : "Track your meals for a few days to unlock personalized insights and trends"}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-white rounded-custom border border-gray-200">
                <Utensils className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 mb-1">Log Your Meals</h3>
                <p className="text-sm text-gray-600">Start by logging your breakfast, lunch, and dinner</p>
              </div>
              <div className="p-4 bg-white rounded-custom border border-gray-200">
                <Clock className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 mb-1">Track Consistently</h3>
                <p className="text-sm text-gray-600">Log meals for at least 3-5 days to see patterns</p>
              </div>
              <div className="p-4 bg-white rounded-custom border border-gray-200">
                <TrendingUp className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 mb-1">Unlock Insights</h3>
                <p className="text-sm text-gray-600">Get personalized trends and recommendations</p>
              </div>
            </div>

            <div className="bg-white rounded-custom p-4 border border-gray-200 mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Your Progress So Far</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{totalMealsLogged}</p>
                  <p className="text-sm text-gray-600">Meals Logged</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{daysWithData}</p>
                  <p className="text-sm text-gray-600">Days Tracked</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{todayMealsCount}</p>
                  <p className="text-sm text-gray-600">Today's Meals</p>
                </div>
              </div>

              {totalMealsLogged > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress to Trends</span>
                    <span className="text-sm text-gray-600">{Math.min(daysWithData, 3)}/3 days</span>
                  </div>
                  <Progress value={(Math.min(daysWithData, 3) / 3) * 100} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    {daysWithData >= 3
                      ? "Almost there! Log a few more meals to unlock trends."
                      : `${3 - daysWithData} more days of logging to unlock trends`}
                  </p>
                </div>
              )}
            </div>

            <Button
              className="bg-primary hover:bg-primary/90 text-white rounded-custom px-8 py-3"
              onClick={() => {
                if (onLogMeal) {
                  onLogMeal()
                } else {
                  // Navigate to log tab
                  const tabTrigger = document.querySelector('[data-state="inactive"][value="log"]') as HTMLElement
                  if (tabTrigger) {
                    tabTrigger.click()
                  }
                }
              }}
            >
              <Plus className="h-5 w-5 mr-2" />
              {todayMealsCount > 0 ? "Log Another Meal" : "Log Your First Meal"}
            </Button>
          </CardContent>
        </Card>

        {/* Tips for New Users */}
        <Card className="bg-white border-gray-200 shadow-sm rounded-custom">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <ChefHat className="h-5 w-5 text-primary" />
              Quick Start Tips
            </CardTitle>
            <CardDescription className="text-gray-600">
              Make the most of your nutrition tracking journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-custom border border-green-200">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-green-800 mb-1">Start Simple</h4>
                  <p className="text-sm text-green-700">
                    Begin by logging just your main meals. You can add snacks and details later.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-custom border border-blue-200">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-800 mb-1">Be Consistent</h4>
                  <p className="text-sm text-blue-700">
                    Try to log meals at the same time each day. Even 3-4 days of data reveals patterns.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-custom border border-purple-200">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-800 mb-1">Use Quick Add</h4>
                  <p className="text-sm text-purple-700">
                    Use the quick-add buttons on the dashboard for common foods to save time.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-custom border border-orange-200">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-orange-800 mb-1">Don't Stress Perfection</h4>
                  <p className="text-sm text-orange-700">
                    Approximate portions are fine. The goal is to understand your eating patterns.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What You'll Unlock */}
        <Card className="bg-gradient-to-r from-gray-50 to-green-50 border-gray-200 rounded-custom">
          <CardHeader>
            <CardTitle className="text-gray-900">What You'll Unlock</CardTitle>
            <CardDescription className="text-gray-600">
              Here's what you'll see once you have enough data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">📊 Weekly Trends</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Daily calorie and macro patterns</li>
                  <li>• Meal completion rates</li>
                  <li>• Nutrition goal progress</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">🎯 Smart Insights</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Personalized recommendations</li>
                  <li>• Eating pattern analysis</li>
                  <li>• Goal achievement predictions</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">📈 Monthly Analytics</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Long-term progress tracking</li>
                  <li>• Habit formation insights</li>
                  <li>• Favorite foods analysis</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">🏆 Achievements</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Streak tracking</li>
                  <li>• Goal milestones</li>
                  <li>• Consistency rewards</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Real trends content for users with actual data
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "bg-green-100 text-green-800"
      case "good":
        return "bg-blue-100 text-blue-800"
      case "needs-improvement":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="weekly" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-6">
          {/* Weekly Overview with REAL data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                This Week's Progress
              </CardTitle>
              <CardDescription>Your actual nutrition tracking for the past 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weeklyData.length > 0 ? (
                  weeklyData.map((day, index) => (
                    <div key={day.date} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="font-semibold">
                            {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
                          </p>
                          <p className="text-xs text-gray-600">{day.date}</p>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Meals Logged</span>
                            <span className="text-sm">{day.meal_count}</span>
                          </div>
                          <Progress value={Math.min((day.meal_count / 4) * 100, 100)} className="h-2" />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{day.total_calories} cal</p>
                        <p className="text-xs text-gray-600">
                          P:{day.total_protein}g C:{day.total_carbs}g F:{day.total_fat}g
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">No data available for this week</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6">
          {/* Monthly Stats with REAL data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Monthly Overview
              </CardTitle>
              <CardDescription>Your actual nutrition summary for this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {weeklyData.length > 0
                      ? Math.round(weeklyData.reduce((sum, day) => sum + day.total_calories, 0) / weeklyData.length)
                      : 0}
                  </p>
                  <p className="text-sm text-gray-600">Avg Daily Calories</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {weeklyData.length > 0
                      ? Math.round(weeklyData.reduce((sum, day) => sum + day.total_protein, 0) / weeklyData.length)
                      : 0}
                    g
                  </p>
                  <p className="text-sm text-gray-600">Avg Daily Protein</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {weeklyData.length > 0
                      ? Math.round((weeklyData.filter((day) => day.meal_count > 0).length / weeklyData.length) * 100)
                      : 0}
                    %
                  </p>
                  <p className="text-sm text-gray-600">Days with Meals</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{totalMealsLogged}</p>
                  <p className="text-sm text-gray-600">Total Meals Logged</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Real insights based on actual data */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Your Personal Insights
              </CardTitle>
              <CardDescription>Based on your actual nutrition tracking data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {daysWithData >= 7 ? (
                  <>
                    <div className="p-4 bg-white rounded-lg border-l-4 border-green-500">
                      <h4 className="font-semibold text-green-700 mb-2">🎯 Consistency Achievement</h4>
                      <p className="text-sm text-gray-700">
                        Great job! You've been tracking for {daysWithData} days. This consistency will help you
                        understand your eating patterns better.
                      </p>
                    </div>

                    <div className="p-4 bg-white rounded-lg border-l-4 border-blue-500">
                      <h4 className="font-semibold text-blue-700 mb-2">📊 Data Pattern</h4>
                      <p className="text-sm text-gray-700">
                        You've logged {totalMealsLogged} meals across {daysWithData} days. Your average is{" "}
                        {Math.round((totalMealsLogged / daysWithData) * 10) / 10} meals per day.
                      </p>
                    </div>

                    {weeklyData.length > 0 && (
                      <div className="p-4 bg-white rounded-lg border-l-4 border-purple-500">
                        <h4 className="font-semibold text-purple-700 mb-2">🔮 Weekly Trend</h4>
                        <p className="text-sm text-gray-700">
                          Your weekly average is{" "}
                          {Math.round(weeklyData.reduce((sum, day) => sum + day.total_calories, 0) / weeklyData.length)}{" "}
                          calories per day. Keep tracking to see more detailed patterns!
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 bg-white rounded-lg border-l-4 border-orange-500">
                    <h4 className="font-semibold text-orange-700 mb-2">📈 Keep Going!</h4>
                    <p className="text-sm text-gray-700">
                      You're off to a great start with {daysWithData} days of tracking! Log meals for a few more days to
                      unlock detailed insights and personalized recommendations.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
