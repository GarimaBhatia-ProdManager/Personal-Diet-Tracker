"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { createOrUpdateUserProfile } from "@/lib/auth"
import { trackAuthEvent } from "@/lib/analytics"

export default function AuthCallback() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Auth callback error:", error)
          setError("Authentication failed. Please try again.")
          return
        }

        if (data.session?.user) {
          // User is authenticated, ensure profile exists
          const userDisplayName =
            data.session.user.user_metadata?.full_name || data.session.user.email?.split("@")[0] || "User"

          try {
            await createOrUpdateUserProfile(data.session.user.id, userDisplayName)

            // Track successful email verification
            await trackAuthEvent("email_verified", data.session.user.email, true)

            // Redirect to main app
            router.push("/")
          } catch (profileError) {
            console.error("Profile creation error:", profileError)
            // Still redirect to app, profile can be created later
            router.push("/")
          }
        } else {
          // No session, redirect to login
          router.push("/")
        }
      } catch (err) {
        console.error("Callback handling error:", err)
        setError("Something went wrong. Please try signing in again.")
      } finally {
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-green-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Confirming your account...</h2>
          <p className="text-gray-600">Please wait while we set up your profile.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-green-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Return to Sign In
          </button>
        </div>
      </div>
    )
  }

  return null
}
