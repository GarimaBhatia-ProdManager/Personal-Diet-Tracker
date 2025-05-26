"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageSquare, Mail } from "lucide-react"

interface FeedbackButtonProps {
  user?: {
    id: string
    name?: string
    email?: string
  }
  variant?: "minimal" | "floating"
}

export default function FeedbackButton({ user, variant = "minimal" }: FeedbackButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleFeedback = async () => {
    setLoading(true)
    try {
      // Try to load Userback
      const response = await fetch("/api/userback")
      if (response.ok) {
        const script = await response.text()
        new Function(script)()

        // Wait for Userback to initialize
        setTimeout(() => {
          if (typeof window !== "undefined" && window.Userback) {
            window.Userback("open")
          } else {
            // Fallback to email
            window.location.href = `mailto:feedback@example.com?subject=App Feedback&body=Hi, I have feedback about the app...`
          }
        }, 1000)
      } else {
        // Fallback to email
        window.location.href = `mailto:feedback@example.com?subject=App Feedback&body=Hi, I have feedback about the app...`
      }
    } catch (error) {
      console.warn("Feedback system not available:", error)
      // Fallback to email
      window.location.href = `mailto:feedback@example.com?subject=App Feedback&body=Hi, I have feedback about the app...`
    } finally {
      setLoading(false)
    }
  }

  if (variant === "floating") {
    return (
      <Button
        onClick={handleFeedback}
        disabled={loading}
        className="w-14 h-14 rounded-full bg-purple-500 hover:bg-purple-600 shadow-lg"
      >
        <MessageSquare className="w-6 h-6 text-white" />
      </Button>
    )
  }

  return (
    <Button
      onClick={handleFeedback}
      disabled={loading}
      variant="ghost"
      size="sm"
      className="text-gray-600 hover:bg-gray-100"
    >
      {loading ? <Mail className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
    </Button>
  )
}
