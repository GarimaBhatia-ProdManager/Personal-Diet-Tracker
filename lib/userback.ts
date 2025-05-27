"use client"

declare global {
  interface Window {
    Userback?: any
  }
}

export interface UserbackConfig {
  token: string
  user?: {
    id: string
    name?: string
    email?: string
  }
  metadata?: Record<string, any>
}

export class UserbackIntegration {
  private static instance: UserbackIntegration
  private isInitialized = false
  private config: UserbackConfig | null = null
  private isLoading = false

  private constructor() {}

  static getInstance(): UserbackIntegration {
    if (!UserbackIntegration.instance) {
      UserbackIntegration.instance = new UserbackIntegration()
    }
    return UserbackIntegration.instance
  }

  async initialize(config: UserbackConfig): Promise<void> {
    if (this.isInitialized || this.isLoading) return

    this.isLoading = true
    this.config = config

    try {
      // Initialize Userback queue first
      this.initializeUserbackQueue()

      // Load the script
      await this.loadUserbackScript()

      // Configure Userback
      this.configureUserback(config)

      // Wait for Userback to be ready
      await this.waitForUserbackReady()

      // Set user information if provided
      if (config.user) {
        this.setUser(config.user)
      }

      // Set metadata if provided
      if (config.metadata) {
        this.setMetadata(config.metadata)
      }

      this.isInitialized = true
      console.log("Userback initialized successfully")
    } catch (error) {
      console.error("Failed to initialize Userback:", error)
      throw error
    } finally {
      this.isLoading = false
    }
  }

  private initializeUserbackQueue(): void {
    if (typeof window !== "undefined") {
      // Initialize the Userback queue if it doesn't exist
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

  private configureUserback(config: UserbackConfig): void {
    if (typeof window !== "undefined" && window.Userback && Array.isArray(window.Userback)) {
      // Push the initialization configuration
      window.Userback.push(["init", { token: config.token }])
    }
  }

  private waitForUserbackReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      let attempts = 0
      const maxAttempts = 100 // 10 seconds max wait

      const checkUserback = () => {
        attempts++

        if (typeof window !== "undefined" && window.Userback && typeof window.Userback === "function") {
          // Userback has transformed from array to function - it's ready
          resolve()
          return
        }

        if (attempts >= maxAttempts) {
          reject(new Error("Userback failed to become ready within timeout"))
          return
        }

        setTimeout(checkUserback, 100)
      }

      checkUserback()
    })
  }

  setUser(user: { id: string; name?: string; email?: string }): void {
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
        this.show() // Fallback to general show
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
        this.show() // Fallback to general show
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
        this.show() // Fallback to general show
      }
    }
  }

  updateContext(context: Record<string, any>): void {
    if (this.isReady()) {
      try {
        if (typeof window.Userback === "function") {
          window.Userback("metadata", {
            ...this.config?.metadata,
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
    return (
      this.isInitialized && typeof window !== "undefined" && window.Userback && typeof window.Userback === "function"
    )
  }
}

export const userback = UserbackIntegration.getInstance()
