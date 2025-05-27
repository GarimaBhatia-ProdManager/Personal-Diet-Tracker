"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Edit, Save, X, User, Target, Activity, Scale, Ruler, Calendar, Heart, Eye, EyeOff, Lock } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { User as AuthUser } from "@supabase/supabase-js"
import type { UserProfileType } from "@/lib/supabase"
import { analytics, usePageTracking } from "@/lib/analytics"
import { trackEvent } from "@/lib/analytics"

interface UserProfileProps {
  user: AuthUser
  userProfile: UserProfileType
  onProfileUpdate: (profile: UserProfileType) => void
}

export default function UserProfile({ user, userProfile, onProfileUpdate }: UserProfileProps) {
  usePageTracking("profile")
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [passwordLoading, setPasswordLoading] = useState(false)

  const [formData, setFormData] = useState({
    full_name: userProfile?.full_name || "",
    age: userProfile?.age || "",
    height: userProfile?.height || "",
    weight: userProfile?.weight || "",
    activity_level: userProfile?.activity_level || "moderate",
    goal_type: userProfile?.goal_type || "maintenance",
    dietary_restrictions: userProfile?.dietary_restrictions || "",
    daily_calories: userProfile?.daily_calories || 2000,
    daily_protein: userProfile?.daily_protein || 150,
    daily_carbs: userProfile?.daily_carbs || 250,
    daily_fat: userProfile?.daily_fat || 67,
  })

  useEffect(() => {
    if (userProfile) {
      setFormData({
        full_name: userProfile.full_name || "",
        age: userProfile.age || "",
        height: userProfile.height || "",
        weight: userProfile.weight || "",
        activity_level: userProfile.activity_level || "moderate",
        goal_type: userProfile.goal_type || "maintenance",
        dietary_restrictions: userProfile.dietary_restrictions || "",
        daily_calories: userProfile.daily_calories || 2000,
        daily_protein: userProfile.daily_protein || 150,
        daily_carbs: userProfile.daily_carbs || 250,
        daily_fat: userProfile.daily_fat || 67,
      })
    }
  }, [userProfile])

  // Calculate TDEE based on profile data
  const calculateTDEE = (weight: number, height: number, age: number, activityLevel: string) => {
    // Mifflin-St Jeor Equation (assuming male for simplicity)
    const bmr = 10 * weight + 6.25 * height - 5 * age + 5

    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      "very-active": 1.9,
    }

    return Math.round(bmr * (activityMultipliers[activityLevel as keyof typeof activityMultipliers] || 1.55))
  }

  // Calculate macros based on goal type
  const calculateMacros = (calories: number, goalType: string) => {
    let proteinRatio, carbRatio, fatRatio

    switch (goalType) {
      case "weight-loss":
        proteinRatio = 0.35
        carbRatio = 0.35
        fatRatio = 0.3
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
        carbRatio = 0.3
        fatRatio = 0.3
        break
      default: // maintenance
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

  const updateCalculatedValues = (newFormData: any) => {
    const weight = Number.parseFloat(newFormData.weight) || 70
    const height = Number.parseFloat(newFormData.height) || 170
    const age = Number.parseInt(newFormData.age) || 25

    const tdee = calculateTDEE(weight, height, age, newFormData.activity_level)

    let targetCalories = tdee
    switch (newFormData.goal_type) {
      case "weight-loss":
        targetCalories = Math.round(tdee * 0.8)
        break
      case "muscle-gain":
        targetCalories = Math.round(tdee * 1.1)
        break
      case "bulking":
        targetCalories = Math.round(tdee * 1.2)
        break
      case "cutting":
        targetCalories = Math.round(tdee * 0.75)
        break
      default:
        targetCalories = tdee
    }

    const macros = calculateMacros(targetCalories, newFormData.goal_type)

    return {
      ...newFormData,
      daily_calories: targetCalories,
      daily_protein: macros.protein,
      daily_carbs: macros.carbs,
      daily_fat: macros.fat,
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    const newFormData = { ...formData, [field]: value }

    if (["weight", "height", "age", "activity_level", "goal_type"].includes(field)) {
      const updatedData = updateCalculatedValues(newFormData)
      setFormData(updatedData)
    } else {
      setFormData(newFormData)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Track which fields changed
      const changedFields: string[] = []
      if (formData.full_name !== userProfile?.full_name) changedFields.push("full_name")
      if (formData.age !== userProfile?.age) changedFields.push("age")
      if (formData.height !== userProfile?.height) changedFields.push("height")
      if (formData.weight !== userProfile?.weight) changedFields.push("weight")
      if (formData.activity_level !== userProfile?.activity_level) changedFields.push("activity_level")
      if (formData.goal_type !== userProfile?.goal_type) changedFields.push("goal_type")
      if (formData.dietary_restrictions !== userProfile?.dietary_restrictions)
        changedFields.push("dietary_restrictions")

      // Track goal adjustments specifically
      if (formData.daily_calories !== userProfile?.daily_calories) {
        await analytics.trackGoalAdjusted("calories", userProfile?.daily_calories || 0, formData.daily_calories)
      }
      if (formData.daily_protein !== userProfile?.daily_protein) {
        await analytics.trackGoalAdjusted("protein", userProfile?.daily_protein || 0, formData.daily_protein)
      }

      const { data, error: updateError } = await supabase
        .from("user_profiles")
        .update({
          full_name: formData.full_name,
          age: Number.parseInt(formData.age) || null,
          height: Number.parseFloat(formData.height) || null,
          weight: Number.parseFloat(formData.weight) || null,
          activity_level: formData.activity_level,
          goal_type: formData.goal_type,
          dietary_restrictions: formData.dietary_restrictions,
          daily_calories: formData.daily_calories,
          daily_protein: formData.daily_protein,
          daily_carbs: formData.daily_carbs,
          daily_fat: formData.daily_fat,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select()
        .single()

      if (updateError) throw updateError

      // Track profile update analytics
      await analytics.trackProfileUpdated(changedFields)

      onProfileUpdate(data)
      setIsEditing(false)
      setSuccess("Profile updated successfully!")

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      full_name: userProfile?.full_name || "",
      age: userProfile?.age || "",
      height: userProfile?.height || "",
      weight: userProfile?.weight || "",
      activity_level: userProfile?.activity_level || "moderate",
      goal_type: userProfile?.goal_type || "maintenance",
      dietary_restrictions: userProfile?.dietary_restrictions || "",
      daily_calories: userProfile?.daily_calories || 2000,
      daily_protein: userProfile?.daily_protein || 150,
      daily_carbs: userProfile?.daily_carbs || 250,
      daily_fat: userProfile?.daily_fat || 67,
    })
    setIsEditing(false)
    setError(null)
    setSuccess(null)
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords don't match")
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError("New password must be at least 6 characters")
      return
    }

    setPasswordLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (error) throw error

      setSuccess("Password updated successfully!")
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setShowPasswordSection(false)

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to update password")
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {error && (
        <Alert variant="destructive" className="rounded-custom">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border border-green-200 rounded-custom">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Personal Information */}
      <Card className="bg-white border-gray-200 shadow-sm rounded-custom">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle className="text-gray-900">Personal Information</CardTitle>
            </div>
            {!isEditing ? (
              <Button
                onClick={() => {
                  trackEvent({
                    event_type: "profile_edit_start",
                    event_data: {},
                  })
                  setIsEditing(true)
                }}
                variant="outline"
                size="sm"
                className="rounded-custom border-gray-300"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  size="sm"
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 rounded-custom"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Saving..." : "Save"}
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm" className="rounded-custom border-gray-300">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-gray-700">
                Full Name
              </Label>
              {isEditing ? (
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange("full_name", e.target.value)}
                  className="border-gray-300 rounded-custom focus:border-primary focus:ring-primary"
                />
              ) : (
                <p className="text-gray-900 font-medium">{formData.full_name || "Not set"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="age" className="text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Age
              </Label>
              {isEditing ? (
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  className="border-gray-300 rounded-custom focus:border-primary focus:ring-primary"
                  placeholder="25"
                />
              ) : (
                <p className="text-gray-900 font-medium">{formData.age ? `${formData.age} years` : "Not set"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="height" className="text-gray-700 flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                Height (cm)
              </Label>
              {isEditing ? (
                <Input
                  id="height"
                  type="number"
                  value={formData.height}
                  onChange={(e) => handleInputChange("height", e.target.value)}
                  className="border-gray-300 rounded-custom focus:border-primary focus:ring-primary"
                  placeholder="170"
                />
              ) : (
                <p className="text-gray-900 font-medium">{formData.height ? `${formData.height} cm` : "Not set"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight" className="text-gray-700 flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Weight (kg)
              </Label>
              {isEditing ? (
                <Input
                  id="weight"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleInputChange("weight", e.target.value)}
                  className="border-gray-300 rounded-custom focus:border-primary focus:ring-primary"
                  placeholder="70"
                />
              ) : (
                <p className="text-gray-900 font-medium">{formData.weight ? `${formData.weight} kg` : "Not set"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity_level" className="text-gray-700 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Activity Level
              </Label>
              {isEditing ? (
                <Select
                  value={formData.activity_level}
                  onValueChange={(value) => handleInputChange("activity_level", value)}
                >
                  <SelectTrigger className="border-gray-300 rounded-custom focus:border-primary focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-custom">
                    <SelectItem value="sedentary">Sedentary</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="very-active">Very Active</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-gray-900 font-medium">
                  {formData.activity_level.charAt(0).toUpperCase() + formData.activity_level.slice(1)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal_type" className="text-gray-700 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Goal Type
              </Label>
              {isEditing ? (
                <Select value={formData.goal_type} onValueChange={(value) => handleInputChange("goal_type", value)}>
                  <SelectTrigger className="border-gray-300 rounded-custom focus:border-primary focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-custom">
                    <SelectItem value="weight-loss">Weight Loss</SelectItem>
                    <SelectItem value="muscle-gain">Muscle Gain</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="bulking">Bulking</SelectItem>
                    <SelectItem value="cutting">Cutting</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className="bg-primary text-white rounded-custom">
                  {formData.goal_type.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dietary_restrictions" className="text-gray-700 flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Dietary Restrictions
            </Label>
            {isEditing ? (
              <Textarea
                id="dietary_restrictions"
                value={formData.dietary_restrictions}
                onChange={(e) => handleInputChange("dietary_restrictions", e.target.value)}
                className="border-gray-300 rounded-custom focus:border-primary focus:ring-primary"
                placeholder="e.g., Vegetarian, Gluten-free, Nut allergies..."
                rows={3}
              />
            ) : (
              <p className="text-gray-900">{formData.dietary_restrictions || "None specified"}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Password Change Section */}
      <Card className="bg-white border-gray-200 shadow-sm rounded-custom">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <CardTitle className="text-gray-900">Security</CardTitle>
            </div>
            <Button
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              variant="outline"
              size="sm"
              className="rounded-custom border-gray-300"
            >
              {showPasswordSection ? "Cancel" : "Change Password"}
            </Button>
          </div>
        </CardHeader>
        {showPasswordSection && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_password" className="text-gray-700">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="border-gray-300 rounded-custom focus:border-primary focus:ring-primary pr-10"
                  placeholder="Enter new password (min 6 characters)"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password" className="text-gray-700">
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id="confirm_password"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="border-gray-300 rounded-custom focus:border-primary focus:ring-primary pr-10"
                  placeholder="Confirm new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              onClick={handlePasswordChange}
              disabled={passwordLoading || !passwordData.newPassword || !passwordData.confirmPassword}
              className="w-full bg-primary hover:bg-primary/90 rounded-custom"
            >
              {passwordLoading ? "Updating..." : "Update Password"}
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Nutrition Goals */}
      <Card className="bg-white border-gray-200 shadow-sm rounded-custom">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Daily Nutrition Goals
          </CardTitle>
          <CardDescription className="text-gray-600">
            Automatically calculated based on your profile and goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-custom">
              <p className="text-2xl font-bold text-gray-900">{formData.daily_calories}</p>
              <p className="text-sm text-gray-600">Calories</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-custom">
              <p className="text-2xl font-bold text-blue-600">{formData.daily_protein}g</p>
              <p className="text-sm text-gray-600">Protein</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-custom">
              <p className="text-2xl font-bold text-yellow-600">{formData.daily_carbs}g</p>
              <p className="text-sm text-gray-600">Carbs</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-custom">
              <p className="text-2xl font-bold text-red-600">{formData.daily_fat}g</p>
              <p className="text-sm text-gray-600">Fat</p>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600 space-y-1">
            <p>
              <strong>Macro Distribution:</strong>{" "}
              {Math.round(((formData.daily_protein * 4) / formData.daily_calories) * 100)}% Protein,{" "}
              {Math.round(((formData.daily_carbs * 4) / formData.daily_calories) * 100)}% Carbs,{" "}
              {Math.round(((formData.daily_fat * 9) / formData.daily_calories) * 100)}% Fat
            </p>
            <p>
              <strong>Goal:</strong> {formData.goal_type.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
