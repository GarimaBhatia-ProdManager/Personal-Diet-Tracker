"use client"

import { useEffect, useState } from "react"
import { initializeUserback } from "@/lib/actions/userback-actions"

export function UserbackInitializer() {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (isInitialized) return

    const initUserback = async () => {
      try {
        // Check if Userback is already loaded
        if (typeof window !== "undefined" && window.Userback && typeof window.Userback === "function") {
          console.log("Userback already initialized")
          setIsInitialized(true)
          return
        }

        const result = await initializeUserback()

        if (result.success && result.script) {
          // Execute the script safely
          const scriptElement = document.createElement("script")
          scriptElement.textContent = result.script
          document.head.appendChild(scriptElement)

          // Wait a bit for initialization
          setTimeout(() => {
            setIsInitialized(true)
          }, 2000)
        } else {
          console.warn("Userback initialization failed, using fallback")
        }
      } catch (error) {
        console.error("Error initializing Userback:", error)
      }
    }

    initUserback()
  }, [isInitialized])

  return null
}
