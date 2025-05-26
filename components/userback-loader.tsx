"use client"

import { useEffect, useState } from "react"

export default function UserbackLoader() {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (initialized) return

    async function initUserback() {
      try {
        // Fetch the script content from our API
        const response = await fetch("/api/userback")

        if (!response.ok) {
          console.warn("Userback API not available")
          return
        }

        const scriptContent = await response.text()

        // Execute the script content directly
        const scriptFunction = new Function(scriptContent)
        scriptFunction()

        setInitialized(true)
        console.log("Userback initialized via API")
      } catch (error) {
        console.warn("Failed to initialize Userback:", error)

        // Fallback: Initialize empty Userback to prevent errors
        if (typeof window !== "undefined") {
          window.Userback = window.Userback || []
        }
      }
    }

    initUserback()
  }, [initialized])

  return null
}
