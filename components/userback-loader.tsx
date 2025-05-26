"use client"

import { useEffect, useState } from "react"

export default function UserbackLoader() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (loaded) return

    // Load the Userback script from our secure API route
    const script = document.createElement("script")
    script.src = "/api/userback"
    script.async = true

    script.onload = () => {
      setLoaded(true)
      console.log("Userback script loaded from API")
    }

    script.onerror = () => {
      console.warn("Failed to load Userback script from API")
    }

    document.head.appendChild(script)

    return () => {
      // Cleanup if component unmounts
      const existingScript = document.querySelector('script[src="/api/userback"]')
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [loaded])

  return null // This component doesn't render anything visible
}
