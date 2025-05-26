"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, Calendar, BarChart3, PieChart, Target } from "lucide-react"

export default function TrendsAnalytics() {
  // Mock data for demonstration
  const weeklyData = [
    { day: "Mon", calories: 1850, protein: 140, carbs: 200, fat: 60, completion: 92 },
    { day: "Tue", calories: 2100, protein: 155, carbs: 250, fat: 70, completion: 98 },
    { day: "Wed", calories: 1750, protein: 130, carbs: 180, fat: 55, completion: 87 },
    { day: "Thu", calories: 2050, protein: 150, carbs: 240, fat: 68, completion: 95 },
    { day: "Fri", calories: 1900, protein: 145, carbs: 210, fat: 62, completion: 90 },
    { day: "Sat", calories: 2200, protein: 160, carbs: 260, fat: 75, completion: 100 },
    { day: "Sun", calories: 1650, protein: 120, carbs: 180, fat: 45, completion: 85 },
  ]

  const monthlyStats = {
    avgCalories: 1950,
    avgProtein: 143,
    avgCompletion: 92,
    bestStreak: 12,
    totalMealsLogged: 84,
    favoriteFood: "Grilled Chicken",
    mostActiveDay: "Saturday",
  }

  const nutritionTrends = [
    { nutrient: "Calories", trend: "up", change: "+5%", status: "good" },
    { nutrient: "Protein", trend: "up", change: "+12%", status: "excellent" },
    { nutrient: "Carbs", trend: "down", change: "-3%", status: "good" },
    { nutrient: "Fat", trend: "stable", change: "±1%", status: "good" },
  ]

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
          {/* Weekly Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                This Week's Progress
              </CardTitle>
              <CardDescription>Your nutrition tracking for the past 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weeklyData.map((day, index) => (
                  <div key={day.day} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="font-semibold">{day.day}</p>
                        <p className="text-xs text-gray-600">Day {index + 1}</p>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">Completion</span>
                          <span className="text-sm">{day.completion}%</span>
                        </div>
                        <Progress value={day.completion} className="h-2" />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{day.calories} cal</p>
                      <p className="text-xs text-gray-600">
                        P:{day.protein}g C:{day.carbs}g F:{day.fat}g
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Nutrition Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Nutrition Trends
              </CardTitle>
              <CardDescription>How your nutrition has changed this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nutritionTrends.map((item) => (
                  <div key={item.nutrient} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTrendIcon(item.trend)}
                      <div>
                        <p className="font-medium">{item.nutrient}</p>
                        <p className="text-sm text-gray-600">{item.change} vs last week</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6">
          {/* Monthly Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Monthly Overview
              </CardTitle>
              <CardDescription>Your nutrition summary for this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{monthlyStats.avgCalories}</p>
                  <p className="text-sm text-gray-600">Avg Daily Calories</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{monthlyStats.avgProtein}g</p>
                  <p className="text-sm text-gray-600">Avg Daily Protein</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{monthlyStats.avgCompletion}%</p>
                  <p className="text-sm text-gray-600">Avg Completion</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{monthlyStats.bestStreak}</p>
                  <p className="text-sm text-gray-600">Best Streak (days)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Insights</CardTitle>
              <CardDescription>Key patterns and achievements this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Achievements</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Logged {monthlyStats.totalMealsLogged} meals</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Best streak: {monthlyStats.bestStreak} days</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm">Most active: {monthlyStats.mostActiveDay}s</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">Favorites</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm">Top food: {monthlyStats.favoriteFood}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Preferred meal: Lunch</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                      <span className="text-sm">Avg log time: 2.3 min</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* AI-Powered Insights */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Personalized Insights
              </CardTitle>
              <CardDescription>AI-powered analysis of your nutrition patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-lg border-l-4 border-green-500">
                  <h4 className="font-semibold text-green-700 mb-2">🎯 Goal Achievement</h4>
                  <p className="text-sm text-gray-700">
                    You've consistently hit your protein goals 85% of the time this month. This is excellent for your
                    muscle building objectives!
                  </p>
                </div>

                <div className="p-4 bg-white rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-semibold text-blue-700 mb-2">📊 Pattern Recognition</h4>
                  <p className="text-sm text-gray-700">
                    You tend to log more complete meals on weekends. Consider setting weekday reminders to maintain
                    consistency.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-lg border-l-4 border-orange-500">
                  <h4 className="font-semibold text-orange-700 mb-2">⚡ Optimization Tip</h4>
                  <p className="text-sm text-gray-700">
                    Your calorie intake varies by 400+ calories daily. Try meal prepping to maintain more consistent
                    energy levels.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-lg border-l-4 border-purple-500">
                  <h4 className="font-semibold text-purple-700 mb-2">🔮 Prediction</h4>
                  <p className="text-sm text-gray-700">
                    Based on your current trends, you're on track to reach your monthly goals with 94% completion rate.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Behavioral Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Behavioral Analytics</CardTitle>
              <CardDescription>Understanding your nutrition habits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-lg font-bold text-green-600">Morning</p>
                  <p className="text-sm text-gray-600">Most consistent logging</p>
                  <p className="text-xs text-gray-500">95% completion rate</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-lg font-bold text-blue-600">2.3 min</p>
                  <p className="text-sm text-gray-600">Avg time per log</p>
                  <p className="text-xs text-gray-500">15% faster than average</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-lg font-bold text-purple-600">Weekends</p>
                  <p className="text-sm text-gray-600">Peak activity time</p>
                  <p className="text-xs text-gray-500">20% more detailed logs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
