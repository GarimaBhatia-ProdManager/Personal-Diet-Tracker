"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, EyeOff, Mail, Lock, User, Loader2, AlertCircle, ExternalLink, Copy, CheckCircle } from "lucide-react"
import { signUp, signIn, signInWithGoogle } from "@/lib/auth"
import { trackAuthEvent } from "@/lib/analytics"

interface AuthFormProps {
  onAuthSuccess?: () => void
}

export default function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [activeTab, setActiveTab] = useState("signin")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [googleError, setGoogleError] = useState(false)
  const [showOAuthFix, setShowOAuthFix] = useState(false)
  const [copied, setCopied] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  })

  const supabaseRedirectUri = "https://ussapzuqhkmrrtislyupi.supabase.co/auth/v1/callback"

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear errors when user starts typing
    if (error) setError(null)
    if (googleError) setGoogleError(false)
  }

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError("Please fill in all required fields")
      return false
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      return false
    }

    if (activeTab === "signup") {
      if (!formData.fullName) {
        setError("Please enter your full name")
        return false
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match")
        return false
      }
    }

    return true
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (activeTab === "signup") {
        await trackAuthEvent("signup_attempt", formData.email)
        const result = await signUp(formData.email, formData.password, formData.fullName)

        if (result.user) {
          await trackAuthEvent("signup_success", formData.email, true)

          if (result.user.email_confirmed_at) {
            setSuccess("Account created successfully! You are now signed in.")
            if (onAuthSuccess) {
              onAuthSuccess()
            }
          } else {
            setSuccess("Account created successfully! Please check your email to verify your account.")
            setFormData({ email: "", password: "", confirmPassword: "", fullName: "" })
            setTimeout(() => {
              setActiveTab("signin")
              setSuccess(null)
            }, 3000)
          }
        }
      } else {
        await trackAuthEvent("login_attempt", formData.email)
        const result = await signIn(formData.email, formData.password)

        if (result.user) {
          await trackAuthEvent("login_success", formData.email, true)
          setSuccess("Successfully signed in!")

          if (onAuthSuccess) {
            onAuthSuccess()
          }
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err)
      let errorMessage = "Authentication failed. Please try again."

      if (err.message?.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password. Please check your credentials."
      } else if (err.message?.includes("Email not confirmed")) {
        errorMessage = "Please check your email and click the confirmation link before signing in."
      } else if (err.message?.includes("User already registered")) {
        errorMessage = "An account with this email already exists. Please sign in instead."
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
      await trackAuthEvent(activeTab === "signup" ? "signup_error" : "login_error", formData.email, false, errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    setGoogleError(false)

    try {
      await trackAuthEvent("google_auth_attempt")
      const result = await signInWithGoogle()

      if (result) {
        await trackAuthEvent("google_auth_success", undefined, true)
        setSuccess("Redirecting to Google...")

        if (onAuthSuccess) {
          onAuthSuccess()
        }
      }
    } catch (err: any) {
      console.error("Google auth error:", err)
      setGoogleError(true)

      let errorMessage = "Google authentication failed."

      if (err.message?.includes("redirect_uri_mismatch")) {
        errorMessage = "OAuth redirect URL mismatch detected. Click 'Fix OAuth Setup' below for instructions."
        setShowOAuthFix(true)
      } else if (err.message?.includes("popup_blocked")) {
        errorMessage = "Popup was blocked. Please allow popups and try again."
      } else if (err.message?.includes("access_denied")) {
        errorMessage = "Google sign-in was cancelled."
      } else if (err.message?.includes("network")) {
        errorMessage = "Network error. Please check your connection and try again."
      }

      setError(errorMessage)
      await trackAuthEvent("google_auth_error", undefined, false, errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const fillDemoAccount = () => {
    setFormData({
      ...formData,
      email: "demo@example.com",
      password: "demo123",
    })
    setActiveTab("signin")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-green-50 p-4">
      <Card className="w-full max-w-md bg-white shadow-xl rounded-custom">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-primary rounded-custom flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🥗</span>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Personal Diet Tracker</CardTitle>
          <CardDescription className="text-gray-600">
            Track your nutrition goals and build healthy habits
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="rounded-custom">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="bg-green-50 border border-green-200 rounded-custom">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* OAuth Fix Instructions */}
          {showOAuthFix && (
            <Alert className="bg-red-50 border border-red-200 rounded-custom">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="space-y-3">
                  <p className="font-medium">🔧 OAuth Redirect URI Fix Required</p>
                  <div className="space-y-2">
                    <p className="text-sm">Add this redirect URI to your Google Cloud Console:</p>
                    <div className="flex items-center gap-2 p-2 bg-white rounded border">
                      <code className="text-xs flex-1 break-all">{supabaseRedirectUri}</code>
                      <Button
                        onClick={() => copyToClipboard(supabaseRedirectUri)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        {copied ? <CheckCircle className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => window.open("https://console.cloud.google.com/apis/credentials", "_blank")}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Open Google Console
                      </Button>
                      <Button onClick={() => setShowOAuthFix(false)} variant="ghost" size="sm" className="text-xs">
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Google Sign In Button */}
          <Button
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 rounded-custom h-12 text-base font-medium shadow-sm"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
            ) : (
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">Or continue with email</span>
            </div>
          </div>

          {/* Email/Password Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-custom">
              <TabsTrigger
                value="signin"
                className="text-gray-600 data-[state=active]:bg-white data-[state=active]:text-primary rounded-custom"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="text-gray-600 data-[state=active]:bg-white data-[state=active]:text-primary rounded-custom"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-gray-700 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="border-gray-300 rounded-custom focus:border-primary focus:ring-primary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-gray-700 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className="border-gray-300 rounded-custom focus:border-primary focus:ring-primary pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-white rounded-custom h-11"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name
                  </Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    className="border-gray-300 rounded-custom focus:border-primary focus:ring-primary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-gray-700 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="border-gray-300 rounded-custom focus:border-primary focus:ring-primary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-gray-700 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password (min 6 characters)"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className="border-gray-300 rounded-custom focus:border-primary focus:ring-primary pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password" className="text-gray-700 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      className="border-gray-300 rounded-custom focus:border-primary focus:ring-primary pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-white rounded-custom h-11"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Demo Account Section */}
          <div className="space-y-3">
            <div className="text-center text-sm text-gray-600 bg-gray-50 p-3 rounded-custom">
              <p className="font-medium mb-1">🚀 Try the Demo Account</p>
              <p className="text-xs mb-2">Email: demo@example.com | Password: demo123</p>
              <Button
                onClick={fillDemoAccount}
                variant="outline"
                size="sm"
                className="text-xs rounded-custom border-gray-300"
              >
                Fill Demo Credentials
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
