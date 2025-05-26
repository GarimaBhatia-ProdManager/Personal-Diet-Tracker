"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Bug, Lightbulb, Mail, ChevronDown, Send } from "lucide-react"
import { useUserback } from "@/hooks/use-userback"
import React from "react"

interface FeedbackButtonProps {
  user?: {
    id: string
    name?: string
    email?: string
  }
  className?: string
  variant?: "default" | "floating" | "minimal"
}

export default function FeedbackButton({ user, className = "", variant = "default" }: FeedbackButtonProps) {
  const {
    isEnabled,
    isInitialized,
    showFeedback,
    triggerBugReport,
    triggerFeatureRequest,
    triggerGeneralFeedback,
    useFallback,
    hasVisualFeedback,
    isLoading,
  } = useUserback({
    user,
    metadata: {
      app_section: "main",
      user_type: "beta_tester",
    },
  })

  const [isOpen, setIsOpen] = useState(false)

  const handleFeedbackClick = (type: string) => {
    switch (type) {
      case "bug":
        triggerBugReport()
        break
      case "feature":
        triggerFeatureRequest()
        break
      case "general":
        triggerGeneralFeedback()
        break
      default:
        showFeedback()
    }
    setIsOpen(false)
  }

  // Show loading state
  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className={className}>
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2" />
        Loading...
      </Button>
    )
  }

  const feedbackMethod = hasVisualFeedback ? "Visual Feedback" : "Email Feedback"
  const feedbackIcon = hasVisualFeedback ? MessageSquare : Mail

  if (variant === "floating") {
    return (
      <div className={`fixed bottom-20 left-6 z-40 ${className}`}>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 hover:scale-105 ${
                hasVisualFeedback ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {React.createElement(feedbackIcon, { className: "h-6 w-6 text-white" })}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" className="w-56 ml-2 rounded-custom border-gray-200 shadow-lg">
            <div className="p-2">
              <div className="flex items-center gap-2 mb-2">
                {React.createElement(feedbackIcon, {
                  className: `h-4 w-4 ${hasVisualFeedback ? "text-purple-600" : "text-blue-600"}`,
                })}
                <span className="font-semibold text-gray-900">{feedbackMethod}</span>
                <Badge variant="secondary" className="text-xs">
                  {hasVisualFeedback ? "Visual" : "Email"}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                {hasVisualFeedback ? "Take screenshots & annotate" : "Send feedback via email"}
              </p>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => handleFeedbackClick("bug")}
              className="cursor-pointer hover:bg-red-50 focus:bg-red-50"
            >
              <Bug className="h-4 w-4 mr-3 text-red-500" />
              <div>
                <div className="font-medium text-gray-900">Report Bug</div>
                <div className="text-xs text-gray-600">Something not working?</div>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => handleFeedbackClick("feature")}
              className="cursor-pointer hover:bg-blue-50 focus:bg-blue-50"
            >
              <Lightbulb className="h-4 w-4 mr-3 text-blue-500" />
              <div>
                <div className="font-medium text-gray-900">Feature Request</div>
                <div className="text-xs text-gray-600">Suggest improvements</div>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => handleFeedbackClick("general")}
              className="cursor-pointer hover:bg-green-50 focus:bg-green-50"
            >
              <MessageSquare className="h-4 w-4 mr-3 text-green-500" />
              <div>
                <div className="font-medium text-gray-900">General Feedback</div>
                <div className="text-xs text-gray-600">Share your thoughts</div>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <div className="p-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {hasVisualFeedback ? (
                  <>
                    <MessageSquare className="h-3 w-3" />
                    <span>Visual feedback enabled</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3 w-3" />
                    <span>Opens email client</span>
                  </>
                )}
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  if (variant === "minimal") {
    return (
      <Button
        onClick={() => handleFeedbackClick("general")}
        variant="ghost"
        size="sm"
        className={`text-gray-600 hover:text-blue-600 hover:bg-blue-50 ${className}`}
      >
        <Mail className="h-4 w-4 mr-2" />
        Feedback
      </Button>
    )
  }

  // Default variant
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={`border-gray-300 hover:border-blue-400 hover:bg-blue-50 ${className}`}>
          <Mail className="h-4 w-4 mr-2" />
          Feedback
          <ChevronDown className="h-3 w-3 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 rounded-custom">
        <div className="p-3 border-b">
          <div className="flex items-center gap-2 mb-1">
            <Send className="h-4 w-4 text-blue-600" />
            <span className="font-semibold">Email Feedback</span>
          </div>
          <p className="text-xs text-gray-600">Send feedback via your email client</p>
        </div>

        <DropdownMenuItem onClick={() => handleFeedbackClick("bug")}>
          <Bug className="h-4 w-4 mr-3 text-red-500" />
          Report Bug
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleFeedbackClick("feature")}>
          <Lightbulb className="h-4 w-4 mr-3 text-blue-500" />
          Feature Request
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleFeedbackClick("general")}>
          <MessageSquare className="h-4 w-4 mr-3 text-green-500" />
          General Feedback
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
