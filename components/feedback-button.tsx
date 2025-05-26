"use client"

import { Button } from "@/components/ui/button"
import { MessageSquare, Bug, Lightbulb } from "lucide-react"
import { useUserback } from "./userback-provider"

interface FeedbackButtonProps {
  type?: "bug" | "feature" | "general"
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "default" | "lg"
  className?: string
}

export function FeedbackButton({
  type = "general",
  variant = "outline",
  size = "sm",
  className = "",
}: FeedbackButtonProps) {
  const { openFeedback, isReady } = useUserback()

  const handleClick = async () => {
    const success = await openFeedback(type)
    if (!success) {
      console.warn("Userback not available, could implement fallback here")
    }
  }

  const getIcon = () => {
    switch (type) {
      case "bug":
        return <Bug className="w-4 h-4" />
      case "feature":
        return <Lightbulb className="w-4 h-4" />
      default:
        return <MessageSquare className="w-4 h-4" />
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

  return (
    <Button onClick={handleClick} variant={variant} size={size} className={className} disabled={!isReady}>
      {getIcon()}
      <span className="ml-2">{getLabel()}</span>
    </Button>
  )
}
