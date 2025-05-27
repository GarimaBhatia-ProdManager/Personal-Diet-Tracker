"use client"

// Simple Userback integration that just loads the widget
export class SimpleUserback {
  private static instance: SimpleUserback
  private token: string | null = null
  private isLoaded = false

  private constructor() {}

  static getInstance(): SimpleUserback {
    if (!SimpleUserback.instance) {
      SimpleUserback.instance = new SimpleUserback()
    }
    return SimpleUserback.instance
  }

  async initialize(token: string): Promise<void> {
    if (this.isLoaded || !token) return

    this.token = token

    try {
      await this.loadScript(token)
      this.isLoaded = true
      console.log("Simple Userback loaded successfully")
    } catch (error) {
      console.error("Failed to load Simple Userback:", error)
      throw error
    }
  }

  private loadScript(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("Window is not defined"))
        return
      }

      // Check if already loaded
      if (document.querySelector('script[src*="userback.io"]')) {
        resolve()
        return
      }

      // Create script element with token in URL
      const script = document.createElement("script")
      script.src = `https://static.userback.io/widget/v1.js?token=${token}`
      script.async = true

      script.onload = () => {
        console.log("Userback widget script loaded")
        resolve()
      }

      script.onerror = () => {
        console.error("Failed to load Userback widget script")
        reject(new Error("Failed to load Userback widget script"))
      }

      document.head.appendChild(script)
    })
  }

  isReady(): boolean {
    return this.isLoaded && !!this.token
  }
}

export const simpleUserback = SimpleUserback.getInstance()
