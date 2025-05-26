"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { MessageSquare, Star, Send, Users, TrendingUp, Clock } from "lucide-react"

export default function FeedbackCollection() {
  const [feedback, setFeedback] = useState({
    rating: 0,
    category: "",
    message: "",
    email: "",
  })
  const [submitted, setSubmitted] = useState(false)

  const categories = [
    "User Interface",
    "Food Database",
    "Tracking Features",
    "Analytics",
    "Performance",
    "Feature Request",
    "Bug Report",
    "Other",
  ]

  const betaMetrics = {
    totalUsers: 127,
    activeUsers: 89,
    avgRating: 4.3,
    completionRate: 78,
    avgSessionTime: "8.5 min",
    retentionRate: 65,
  }

  const recentFeedback = [
    {
      id: 1,
      user: "Sarah M.",
      rating: 5,
      comment: "Love the quick meal logging feature! Makes tracking so much easier.",
      category: "Tracking Features",
      date: "2 days ago",
    },
    {
      id: 2,
      user: "Mike R.",
      rating: 4,
      comment: "Great app overall. Would love to see more food options in the database.",
      category: "Food Database",
      date: "3 days ago",
    },
    {
      id: 3,
      user: "Emma L.",
      rating: 4,
      comment: "The trends view is really helpful for understanding my eating patterns.",
      category: "Analytics",
      date: "5 days ago",
    },
  ]

  const handleRatingClick = (rating: number) => {
    setFeedback({ ...feedback, rating })
  }

  const handleSubmit = () => {
    if (feedback.rating && feedback.message) {
      setSubmitted(true)
      // In a real app, this would send to your feedback collection system
      console.log("Feedback submitted:", feedback)
    }
  }

  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
            onClick={() => interactive && handleRatingClick(star)}
          />
        ))}
      </div>
    )
  }

  if (submitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
            <p className="text-gray-600">Your feedback has been submitted and will help us improve the app.</p>
          </div>
          <Button onClick={() => setSubmitted(false)} variant="outline">
            Submit Another Feedback
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Beta Testing Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Beta Testing Program
          </CardTitle>
          <CardDescription>Help us improve the Personal Diet Tracker with your valuable feedback</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{betaMetrics.totalUsers}</p>
              <p className="text-sm text-gray-600">Beta Testers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{betaMetrics.avgRating}</p>
              <p className="text-sm text-gray-600">Avg Rating</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{betaMetrics.completionRate}%</p>
              <p className="text-sm text-gray-600">Completion Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feedback Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Share Your Feedback
            </CardTitle>
            <CardDescription>Your input helps us build a better nutrition tracking experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Overall Rating</Label>
              <div className="flex items-center gap-2">
                {renderStars(feedback.rating, true)}
                <span className="text-sm text-gray-600 ml-2">
                  {feedback.rating > 0 && `${feedback.rating} out of 5 stars`}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={feedback.category === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFeedback({ ...feedback, category })}
                    className="text-xs"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-message">Your Feedback</Label>
              <Textarea
                id="feedback-message"
                placeholder="Tell us about your experience, suggestions for improvement, or any issues you've encountered..."
                value={feedback.message}
                onChange={(e) => setFeedback({ ...feedback, message: e.target.value })}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-email">Email (Optional)</Label>
              <Input
                id="feedback-email"
                type="email"
                placeholder="your.email@example.com"
                value={feedback.email}
                onChange={(e) => setFeedback({ ...feedback, email: e.target.value })}
              />
              <p className="text-xs text-gray-500">We'll only use this to follow up on your feedback if needed</p>
            </div>

            <Button onClick={handleSubmit} className="w-full" disabled={!feedback.rating || !feedback.message}>
              <Send className="h-4 w-4 mr-2" />
              Submit Feedback
            </Button>
          </CardContent>
        </Card>

        {/* Recent Feedback & Analytics */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Beta Metrics
              </CardTitle>
              <CardDescription>Key insights from our beta testing program</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">User Retention</span>
                  <span className="text-sm">{betaMetrics.retentionRate}%</span>
                </div>
                <Progress value={betaMetrics.retentionRate} className="h-2" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Feature Completion</span>
                  <span className="text-sm">{betaMetrics.completionRate}%</span>
                </div>
                <Progress value={betaMetrics.completionRate} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-lg font-semibold text-blue-600">{betaMetrics.activeUsers}</p>
                  <p className="text-xs text-gray-600">Active Users</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-green-600">{betaMetrics.avgSessionTime}</p>
                  <p className="text-xs text-gray-600">Avg Session</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Feedback</CardTitle>
              <CardDescription>What other beta testers are saying</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentFeedback.map((item) => (
                  <div key={item.id} className="border-l-4 border-blue-200 pl-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{item.user}</span>
                        {renderStars(item.rating)}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {item.date}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">{item.comment}</p>
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Testing Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Beta Testing Guidelines</CardTitle>
          <CardDescription>Help us gather the most valuable insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">What to Test</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                  <span>Log meals for different meal types (breakfast, lunch, dinner, snacks)</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                  <span>Try both food search and custom food entry</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                  <span>Explore the trends and analytics features</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                  <span>Update your profile and nutrition goals</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Key Metrics We're Tracking</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
                  <span>Time to log a meal (target: under 2 minutes)</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
                  <span>Daily logging completion rate</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
                  <span>Feature discovery and usage patterns</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
                  <span>User retention and engagement over time</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
