"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Target, TrendingUp, TrendingDown } from "lucide-react"

interface DailySummaryProps {
  stats: {
    calories: { consumed: number; target: number }
    protein: { consumed: number; target: number }
    carbs: { consumed: number; target: number }
    fat: { consumed: number; target: number }
    water: { consumed: number; target: number }
  }
}

export default function DailySummary({ stats }: DailySummaryProps) {
  const macronutrients = [
    {
      name: "Calories",
      consumed: stats.calories.consumed,
      target: stats.calories.target,
      unit: "kcal",
      color: "bg-green-500",
    },
    {
      name: "Protein",
      consumed: stats.protein.consumed,
      target: stats.protein.target,
      unit: "g",
      color: "bg-blue-500",
    },
    {
      name: "Carbs",
      consumed: stats.carbs.consumed,
      target: stats.carbs.target,
      unit: "g",
      color: "bg-orange-500",
    },
    {
      name: "Fat",
      consumed: stats.fat.consumed,
      target: stats.fat.target,
      unit: "g",
      color: "bg-purple-500",
    },
  ]

  const getProgressStatus = (consumed: number, target: number) => {
    const percentage = (consumed / target) * 100
    if (percentage < 80) return { icon: TrendingDown, color: "text-red-500", status: "Under" }
    if (percentage > 120) return { icon: TrendingUp, color: "text-orange-500", status: "Over" }
    return { icon: Target, color: "text-green-500", status: "On Track" }
  }

  return (
    <div className="space-y-6">
      {/* Daily Overview */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Today's Summary
          </CardTitle>
          <CardDescription>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {macronutrients.map((macro) => {
              const percentage = (macro.consumed / macro.target) * 100
              const status = getProgressStatus(macro.consumed, macro.target)
              const StatusIcon = status.icon

              return (
                <div key={macro.name} className="text-center">
                  <div className="mb-2">
                    <div
                      className={`w-16 h-16 mx-auto rounded-full ${macro.color} flex items-center justify-center text-white font-bold text-lg`}
                    >
                      {Math.round(percentage)}%
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm">{macro.name}</h3>
                  <p className="text-xs text-gray-600">
                    {macro.consumed}/{macro.target} {macro.unit}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <StatusIcon className={`h-3 w-3 ${status.color}`} />
                    <span className={`text-xs ${status.color}`}>{status.status}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Macronutrient Breakdown</CardTitle>
            <CardDescription>Detailed progress for each nutrient</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {macronutrients.map((macro) => {
              const percentage = (macro.consumed / macro.target) * 100
              const remaining = Math.max(0, macro.target - macro.consumed)

              return (
                <div key={macro.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{macro.name}</span>
                    <Badge variant="outline">
                      {macro.consumed}/{macro.target} {macro.unit}
                    </Badge>
                  </div>
                  <Progress value={Math.min(percentage, 100)} className="h-2" />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{Math.round(percentage)}% of goal</span>
                    <span>{remaining > 0 ? `${remaining} ${macro.unit} remaining` : "Goal reached!"}</span>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hydration & Wellness</CardTitle>
            <CardDescription>Track your water intake and wellness metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Water Intake</span>
                <Badge variant="outline">
                  {stats.water.consumed}/{stats.water.target} glasses
                </Badge>
              </div>
              <Progress value={(stats.water.consumed / stats.water.target) * 100} className="h-2" />
              <p className="text-sm text-gray-600">
                {stats.water.target - stats.water.consumed > 0
                  ? `${stats.water.target - stats.water.consumed} more glasses to go!`
                  : "Hydration goal achieved! 💧"}
              </p>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3">Quick Stats</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Meals Logged</p>
                  <p className="font-semibold">3 of 4</p>
                </div>
                <div>
                  <p className="text-gray-600">Streak</p>
                  <p className="font-semibold">7 days 🔥</p>
                </div>
                <div>
                  <p className="text-gray-600">Avg. Meal Time</p>
                  <p className="font-semibold">2.5 min</p>
                </div>
                <div>
                  <p className="text-gray-600">Completion</p>
                  <p className="font-semibold">85%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights & Recommendations */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle>Today's Insights</CardTitle>
          <CardDescription>Personalized recommendations based on your progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg border">
              <h4 className="font-semibold text-green-600 mb-2">✅ Doing Great</h4>
              <p className="text-sm text-gray-700">
                Your protein intake is on track! This supports your muscle building goals.
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border">
              <h4 className="font-semibold text-orange-600 mb-2">⚠️ Needs Attention</h4>
              <p className="text-sm text-gray-700">
                You're 350 calories under your goal. Consider adding a healthy snack.
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border">
              <h4 className="font-semibold text-blue-600 mb-2">💡 Suggestion</h4>
              <p className="text-sm text-gray-700">Try adding some nuts or avocado to increase healthy fats.</p>
            </div>
            <div className="p-4 bg-white rounded-lg border">
              <h4 className="font-semibold text-purple-600 mb-2">🎯 Goal Progress</h4>
              <p className="text-sm text-gray-700">You're 85% towards your daily goal. Keep it up!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
