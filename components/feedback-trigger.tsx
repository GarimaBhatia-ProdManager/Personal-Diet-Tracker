"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageSquare, Bug, Lightbulb } from "lucide-react"
import { userbackClient } from "@/lib/userback-client"

export default function FeedbackTrigger() {
  const [isLoading, setIsLoading] = useState(false)

  const handleFeedback = async (type: "bug" | "feature" | "general") => {
    setIsLoading(true)
    try {
      const success = await userbackClient.openFeedback(type)
      if (!success) {
        console.warn("Userback not available, falling back to built-in feedback")
        // You could redirect to your built-in feedback form here
      }
    } catch (error) {
      console.error("Error opening feedback:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2">
      <Button
        onClick={() => handleFeedback("general")}
        disabled={isLoading}
        className="rounded-full w-12 h-12 p-0"
        title="General Feedback"
      >
        <MessageSquare className="h-5 w-5" />
      </Button>

      <Button
        onClick={() => handleFeedback("bug")}
        disabled={isLoading}
        variant="destructive"
        className="rounded-full w-12 h-12 p-0"
        title="Report Bug"
      >
        <Bug className="h-5 w-5" />
      </Button>

      <Button
        onClick={() => handleFeedback("feature")}
        disabled={isLoading}
        variant="secondary"
        className="rounded-full w-12 h-12 p-0"
        title="Feature Request"
      >
        <Lightbulb className="h-5 w-5" />
      </Button>
    </div>
  )
}
