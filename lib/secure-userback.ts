"use client"

import { getUserbackConfig } from "@/lib/actions/userback-actions"

declare global {
  interface Window {
    Userback?: any
  }
}

export interface UserbackUser {
  id: string
  name?: string
  email?: string
}

export class SecureUserback {
  private static instance: SecureUserback
  private isInitialized = false
  private isLoading = false
  private token: string | null = null
  private initializationPromise: Promise<boolean> | null = null

  private constructor() {}

  static getInstance(): SecureUserback {
    if (!SecureUserback.instance) {
      SecureUserback.instance = new SecureUserback()
    }
    return SecureUserback.instance
  }

  async initialize(userId?: string): Promise<boolean> {
    // Return existing promise if already initializing
    if (this.initializationPromise) {
      return this.initializationPromise
    }

    // Return true if already initialized
    if (this.isInitialized) {
      return true
    }

    // Create and store the initialization promise
    this.initializationPromise = this.performInitialization(userId)
    return this.initializationPromise
  }

  private async performInitialization(userId?: string): Promise<boolean> {
    if (this.isLoading) return false

    this.isLoading = true

    try {
      // Get configuration from server
      const result = await getUserbackConfig(userId)

      if (!result.success || !result.token) {
        console.warn("Userback not available, will use fallback")
        return false
      }

      this.token = result.token

      // Initialize Userback queue
      this.initializeUserbackQueue()

      // Load the script with timeout
      try {
        await Promise.race([
          this.loadUserbackScript(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Script load timeout")), 10000)),
        ])
      } catch (error) {
        console.warn("Userback script failed to load:", error)
        return false
      }

      // Configure Userback
      this.configureUserback(result.token)

      // Wait for Userback to be ready (with graceful timeout handling)
      try {
        await this.waitForUserbackReady()
      } catch (error) {
        console.warn("Userback ready timeout, continuing with fallback:", error)
        return false
      }

      this.isInitialized = true
      console.log("Secure Userback initialized successfully")
      return true
    } catch (error) {
      console.error("Failed to initialize Secure Userback:", error)
      return false
    } finally {
      this.isLoading = false
    }
  }

  private initializeUserbackQueue(): void {
    if (typeof window !== "undefined") {
      window.Userback = window.Userback || []
    }
  }

  private loadUserbackScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("Window is not defined"))
        return
      }

      // Check if script is already loaded
      const existingScript = document.querySelector('script[src*="userback.io"]')
      if (existingScript) {
        resolve()
        return
      }

      const script = document.createElement("script")
      script.src = "https://static.userback.io/widget/v1.js"
      script.async = true

      script.onload = () => {
        console.log("Userback script loaded successfully")
        resolve()
      }

      script.onerror = () => {
        console.error("Failed to load Userback script")
        reject(new Error("Failed to load Userback script"))
      }

      document.head.appendChild(script)
    })
  }

  private configureUserback(token: string): void {
    if (typeof window !== "undefined" && window.Userback && Array.isArray(window.Userback)) {
      window.Userback.push(["init", { token }])
    }
  }

  private waitForUserbackReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      let attempts = 0
      const maxAttempts = 50 // Reduced from 100 to 5 seconds max wait

      const checkUserback = () => {
        attempts++

        if (typeof window !== "undefined") {
          // Check if Userback has transformed from array to function
          if (window.Userback && typeof window.Userback === "function") {
            console.log("Userback is ready as function")
            resolve()
            return
          }

          // Also check if Userback is available as an object with methods
          if (window.Userback && typeof window.Userback === "object" && window.Userback.init) {
            console.log("Userback is ready as object")
            resolve()
            return
          }

          // Check if the script has loaded but Userback is still an array
          if (window.Userback && Array.isArray(window.Userback) && attempts > 10) {
            // Try to force initialization
            try {
              if (this.token) {
                window.Userback.push(["init", { token: this.token }])
              }
            } catch (error) {
              console.warn("Error forcing Userback init:", error)
            }
          }
        }

        if (attempts >= maxAttempts) {
          console.warn("Userback initialization timeout, but continuing...")
          // Don't reject, just resolve to allow fallback
          resolve()
          return
        }

        setTimeout(checkUserback, 100)
      }

      checkUserback()
    })
  }

  setUser(user: UserbackUser): void {
    if (this.isReady()) {
      try {
        if (typeof window.Userback === "function") {
          window.Userback("identify", {
            id: user.id,
            name: user.name,
            email: user.email,
          })
        }
      } catch (error) {
        console.error("Error setting Userback user:", error)
      }
    }
  }

  setMetadata(metadata: Record<string, any>): void {
    if (this.isReady()) {
      try {
        if (typeof window.Userback === "function") {
          window.Userback("metadata", metadata)
        }
      } catch (error) {
        console.error("Error setting Userback metadata:", error)
      }
    }
  }

  show(): void {
    if (this.isReady()) {
      try {
        if (typeof window.Userback === "function") {
          window.Userback("show")
        }
      } catch (error) {
        console.error("Error showing Userback:", error)
      }
    }
  }

  hide(): void {
    if (this.isReady()) {
      try {
        if (typeof window.Userback === "function") {
          window.Userback("hide")
        }
      } catch (error) {
        console.error("Error hiding Userback:", error)
      }
    }
  }

  triggerBugReport(): void {
    if (this.isReady()) {
      try {
        if (typeof window.Userback === "function") {
          window.Userback("open", { type: "bug" })
        }
      } catch (error) {
        console.error("Error triggering bug report:", error)
        this.show()
      }
    }
  }

  triggerFeatureRequest(): void {
    if (this.isReady()) {
      try {
        if (typeof window.Userback === "function") {
          window.Userback("open", { type: "feature" })
        }
      } catch (error) {
        console.error("Error triggering feature request:", error)
        this.show()
      }
    }
  }

  triggerGeneralFeedback(): void {
    if (this.isReady()) {
      try {
        if (typeof window.Userback === "function") {
          window.Userback("open")
        }
      } catch (error) {
        console.error("Error triggering general feedback:", error)
        this.show()
      }
    }
  }

  updateContext(context: Record<string, any>): void {
    if (this.isReady()) {
      try {
        if (typeof window.Userback === "function") {
          window.Userback("metadata", {
            ...context,
            timestamp: new Date().toISOString(),
          })
        }
      } catch (error) {
        console.error("Error updating Userback context:", error)
      }
    }
  }

  isReady(): boolean {
    if (!this.isInitialized || !this.token) {
      return false
    }

    if (typeof window === "undefined") {
      return false
    }

    // Check if Userback is available as a function
    if (window.Userback && typeof window.Userback === "function") {
      return true
    }

    // Check if Userback is available as an object with methods
    if (window.Userback && typeof window.Userback === "object" && window.Userback.show) {
      return true
    }

    return false
  }

  hasToken(): boolean {
    return this.token !== null
  }
}

export const secureUserback = SecureUserback.getInstance()
