"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { secureUserback } from "@/lib/secure-userback"

interface UserbackContextType {
  isEnabled: boolean
  isInitialized: boolean
  isLoading: boolean
  hasToken: boolean
  error: string | null
  useFallback: boolean
}

const UserbackContext = createContext<UserbackContextType>({
  isEnabled: false,
  isInitialized: false,
  isLoading: false, // Changed to false by default
  hasToken: false,
  error: null,
  useFallback: true,
})

export const useUserbackContext = () => useContext(UserbackContext)

interface UserbackProviderProps {
  children: React.ReactNode
  userId?: string
}

export function UserbackProvider({ children, userId }: UserbackProviderProps) {
  const [isLoading, setIsLoading] = useState(false) // Start as false
  const [isInitialized, setIsInitialized] = useState(false)
  const [hasToken, setHasToken] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Don't block UI, initialize in background
    if (userId) {
      initializeUserback()
    }
  }, [userId])

  const initializeUserback = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Set a shorter timeout for the entire initialization process
      const initPromise = secureUserback.initialize(userId)
      const timeoutPromise = new Promise<boolean>(
        (resolve) =>
          setTimeout(() => {
            console.warn("Userback initialization timeout, using fallback")
            resolve(false)
          }, 5000), // Reduced to 5 seconds
      )

      const success = await Promise.race([initPromise, timeoutPromise])

      if (success) {
        setIsInitialized(true)
        setHasToken(secureUserback.hasToken())
        console.log("Userback initialized successfully with visual feedback")
      } else {
        setIsInitialized(false)
        setHasToken(false)
        console.log("Userback not available, using email fallback")
      }
    } catch (err: any) {
      setError(null) // Don't show error to user, just use fallback
      setIsInitialized(false)
      setHasToken(false)
      console.warn("Userback initialization failed, using email fallback:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const contextValue: UserbackContextType = {
    isEnabled: true, // Always enabled (either Userback or email fallback)
    isInitialized,
    isLoading,
    hasToken,
    error,
    useFallback: !isInitialized || !hasToken,
  }

  return <UserbackContext.Provider value={contextValue}>{children}</UserbackContext.Provider>
}
