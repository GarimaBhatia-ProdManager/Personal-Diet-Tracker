"use client"

declare global {
  interface Window {
    Userback?: any
    userbackInitialized?: boolean
  }
}

export interface UserbackUser {
  id: string
  name?: string
  email?: string
}

class UserbackClient {
  private static instance: UserbackClient

  private constructor() {}

  static getInstance(): UserbackClient {
    if (!UserbackClient.instance) {
      UserbackClient.instance = new UserbackClient()
    }
    return UserbackClient.instance
  }

  private async waitForUserback(timeout = 10000): Promise<boolean> {
    return new Promise((resolve) => {
      const startTime = Date.now()

      const checkUserback = () => {
        if (typeof window !== "undefined" && window.Userback && typeof window.Userback === "function") {
          resolve(true)
          return
        }

        if (Date.now() - startTime > timeout) {
          resolve(false)
          return
        }

        setTimeout(checkUserback, 100)
      }

      checkUserback()
    })
  }

  async setUser(user: UserbackUser): Promise<boolean> {
    const isReady = await this.waitForUserback()
    if (isReady && typeof window.Userback === "function") {
      try {
        window.Userback("identify", {
          id: user.id,
          name: user.name,
          email: user.email,
        })
        return true
      } catch (error) {
        console.error("Error setting Userback user:", error)
      }
    }
    return false
  }

  async setMetadata(metadata: Record<string, any>): Promise<boolean> {
    const isReady = await this.waitForUserback()
    if (isReady && typeof window.Userback === "function") {
      try {
        window.Userback("metadata", {
          ...metadata,
          timestamp: new Date().toISOString(),
        })
        return true
      } catch (error) {
        console.error("Error setting Userback metadata:", error)
      }
    }
    return false
  }

  async show(): Promise<boolean> {
    const isReady = await this.waitForUserback()
    if (isReady && typeof window.Userback === "function") {
      try {
        window.Userback("show")
        return true
      } catch (error) {
        console.error("Error showing Userback:", error)
      }
    }
    return false
  }

  async hide(): Promise<boolean> {
    const isReady = await this.waitForUserback()
    if (isReady && typeof window.Userback === "function") {
      try {
        window.Userback("hide")
        return true
      } catch (error) {
        console.error("Error hiding Userback:", error)
      }
    }
    return false
  }

  async openFeedback(type?: "bug" | "feature" | "general"): Promise<boolean> {
    const isReady = await this.waitForUserback()
    if (isReady && typeof window.Userback === "function") {
      try {
        if (type && type !== "general") {
          window.Userback("open", { type })
        } else {
          window.Userback("open")
        }
        return true
      } catch (error) {
        console.error("Error opening Userback feedback:", error)
        // Fallback to show
        return await this.show()
      }
    }
    return false
  }

  isReady(): boolean {
    return typeof window !== "undefined" && window.Userback && typeof window.Userback === "function"
  }

  isLoaded(): boolean {
    return typeof window !== "undefined" && window.userbackInitialized === true
  }
}

export const userbackClient = UserbackClient.getInstance()
