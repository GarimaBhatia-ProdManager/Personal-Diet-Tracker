"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"

export function SimpleFeedback() {
  const [loading, setLoading] = useState(false)
  const [userbackReady, setUserbackReady] = useState(false)

  useEffect(() => {
    // Load Userback on component mount
    loadUserback()
  }, [])

  const loadUserback = async () => {
    try {
      const response = await fetch("/api/userback")
      if (response.ok) {
        const script = await response.text()
        new Function(script)()

        // Check if Userback is ready
        const checkReady = () => {
          if (typeof window !== "undefined" && window.Userback && window.Userback.access_token) {
            setUserbackReady(true)
            console.log("Userback is ready")
          } else {
            setTimeout(checkReady, 500)
          }
        }

        setTimeout(checkReady, 1000)
      }
    } catch (error) {
      console.warn("Userback not available:", error)
    }
  }

  const handleFeedback = async () => {
    setLoading(true)
    try {
      if (typeof window !== "undefined" && window.Userback) {
        // Try to open Userback widget
        if (typeof window.Userback.open === "function") {
          window.Userback.open()
        } else {
          // Fallback: trigger Userback manually
          const event = new CustomEvent("userback:open")
          window.dispatchEvent(event)
        }
      } else {
        // Fallback to email
        window.location.href = "mailto:feedback@example.com?subject=App Feedback"
      }
    } catch (error) {
      console.warn("Error opening feedback:", error)
      // Fallback to email
      window.location.href = "mailto:feedback@example.com?subject=App Feedback"
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleFeedback}
      disabled={loading}
      variant="outline"
      size="sm"
      className="fixed bottom-4 right-4 z-50"
    >
      <MessageSquare className="w-4 h-4 mr-2" />
      {loading ? "Loading..." : userbackReady ? "Feedback" : "Feedback (Email)"}
    </Button>
  )
}
