"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"

export function SimpleFeedback() {
  const [loading, setLoading] = useState(false)

  const handleFeedback = async () => {
    setLoading(true)
    try {
      // Load Userback script dynamically
      const response = await fetch("/api/userback")
      if (response.ok) {
        const script = await response.text()
        new Function(script)()

        // Wait a bit for Userback to initialize
        setTimeout(() => {
          if (typeof window !== "undefined" && window.Userback) {
            window.Userback("open")
          }
        }, 1000)
      }
    } catch (error) {
      console.warn("Userback not available:", error)
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
      {loading ? "Loading..." : "Feedback"}
    </Button>
  )
}
