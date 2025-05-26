"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageSquare, Bug, Lightbulb } from "lucide-react"
import { userbackClient } from "@/lib/userback-client"
import { useUserbackContext } from "./userback-provider"
import { submitFeedback } from "@/lib/actions/feedback-actions"

interface FeedbackButtonProps {
  type?: "general" | "bug" | "feature"
  className?: string
}

export function FeedbackButton({ type = "general", className }: FeedbackButtonProps) {
  const { useFallback } = useUserbackContext()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const getIcon = () => {
    switch (type) {
      case "bug":
        return <Bug className="h-4 w-4" />
      case "feature":
        return <Lightbulb className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getLabel = () => {
    switch (type) {
      case "bug":
        return "Report Bug"
      case "feature":
        return "Request Feature"
      default:
        return "Feedback"
    }
  }

  const handleClick = async () => {
    if (useFallback) {
      // Use email fallback
      setIsSubmitting(true)
      try {
        const email = prompt("Please enter your email for feedback:")
        if (email) {
          const message = prompt("Please describe your feedback:")
          if (message) {
            await submitFeedback({
              email,
              message,
              type,
              rating: 3, // Default rating
            })
            alert("Thank you for your feedback!")
          }
        }
      } catch (error) {
        console.error("Error submitting feedback:", error)
        alert("Sorry, there was an error submitting your feedback.")
      } finally {
        setIsSubmitting(false)
      }
    } else {
      // Use Userback
      try {
        switch (type) {
          case "bug":
            await userbackClient.triggerBugReport()
            break
          case "feature":
            await userbackClient.triggerFeatureRequest()
            break
          default:
            await userbackClient.triggerGeneralFeedback()
            break
        }
      } catch (error) {
        console.error("Error triggering Userback:", error)
      }
    }
  }

  return (
    <Button onClick={handleClick} disabled={isSubmitting} variant="outline" size="sm" className={className}>
      {getIcon()}
      {isSubmitting ? "Submitting..." : getLabel()}
    </Button>
  )
}
