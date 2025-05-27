"use client"

// Email-based feedback system for secure feedback collection
export class FallbackFeedback {
  private static instance: FallbackFeedback

  private constructor() {}

  static getInstance(): FallbackFeedback {
    if (!FallbackFeedback.instance) {
      FallbackFeedback.instance = new FallbackFeedback()
    }
    return FallbackFeedback.instance
  }

  showFeedback(): void {
    this.openEmailFeedback("general")
  }

  triggerBugReport(): void {
    this.openEmailFeedback("bug")
  }

  triggerFeatureRequest(): void {
    this.openEmailFeedback("feature")
  }

  triggerGeneralFeedback(): void {
    this.openEmailFeedback("general")
  }

  private openEmailFeedback(type: string): void {
    const subject = this.getEmailSubject(type)
    const body = this.getEmailBody(type)

    // Use a generic support email - in production, replace with your actual support email
    const supportEmail = "feedback@example.com"
    const mailtoUrl = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

    if (typeof window !== "undefined") {
      // Try to open email client
      try {
        const link = document.createElement("a")
        link.href = mailtoUrl
        link.target = "_blank"
        link.rel = "noopener noreferrer"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } catch (error) {
        // Fallback: copy to clipboard and show instructions
        this.showFeedbackModal(subject, body, supportEmail)
      }
    }
  }

  private showFeedbackModal(subject: string, body: string, email: string): void {
    // Create a simple modal for feedback
    const modal = document.createElement("div")
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `

    const content = document.createElement("div")
    content.style.cssText = `
      background: white;
      padding: 24px;
      border-radius: 8px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    `

    content.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #1f2937;">Send Feedback</h3>
      <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">
        Please copy the template below and send it to: <strong>${email}</strong>
      </p>
      <textarea 
        readonly 
        style="
          width: 100%; 
          height: 200px; 
          padding: 12px; 
          border: 1px solid #d1d5db; 
          border-radius: 6px; 
          font-family: monospace; 
          font-size: 12px;
          resize: vertical;
        "
      >${subject}\n\n${body}</textarea>
      <div style="margin-top: 16px; display: flex; gap: 8px; justify-content: flex-end;">
        <button id="copyBtn" style="
          padding: 8px 16px; 
          background: #3b82f6; 
          color: white; 
          border: none; 
          border-radius: 6px; 
          cursor: pointer;
          font-size: 14px;
        ">Copy to Clipboard</button>
        <button id="closeBtn" style="
          padding: 8px 16px; 
          background: #6b7280; 
          color: white; 
          border: none; 
          border-radius: 6px; 
          cursor: pointer;
          font-size: 14px;
        ">Close</button>
      </div>
    `

    modal.appendChild(content)
    document.body.appendChild(modal)

    // Add event listeners
    const copyBtn = content.querySelector("#copyBtn")
    const closeBtn = content.querySelector("#closeBtn")
    const textarea = content.querySelector("textarea")

    copyBtn?.addEventListener("click", () => {
      if (textarea) {
        textarea.select()
        document.execCommand("copy")
        copyBtn.textContent = "Copied!"
        setTimeout(() => {
          copyBtn.textContent = "Copy to Clipboard"
        }, 2000)
      }
    })

    closeBtn?.addEventListener("click", () => {
      document.body.removeChild(modal)
    })

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal)
      }
    })
  }

  private getEmailSubject(type: string): string {
    switch (type) {
      case "bug":
        return "🐛 Bug Report - Personal Diet Tracker"
      case "feature":
        return "💡 Feature Request - Personal Diet Tracker"
      default:
        return "💬 Feedback - Personal Diet Tracker"
    }
  }

  private getEmailBody(type: string): string {
    const baseInfo = `
App: Personal Diet Tracker
URL: ${typeof window !== "undefined" ? window.location.href : ""}
User Agent: ${typeof navigator !== "undefined" ? navigator.userAgent : ""}
Timestamp: ${new Date().toISOString()}
Screen Resolution: ${typeof window !== "undefined" ? `${window.screen.width}x${window.screen.height}` : ""}

---

`

    switch (type) {
      case "bug":
        return (
          baseInfo +
          `🐛 BUG REPORT

Please describe the bug you encountered:

Steps to reproduce:
1. 
2. 
3. 

Expected behavior:


Actual behavior:


Additional context or screenshots:

`
        )

      case "feature":
        return (
          baseInfo +
          `💡 FEATURE REQUEST

Please describe the feature you'd like to see:


Problem it would solve:


Proposed solution:


Additional context:

`
        )

      default:
        return (
          baseInfo +
          `💬 GENERAL FEEDBACK

Your feedback:


What you like about the app:


What could be improved:


Additional suggestions:

`
        )
    }
  }
}

export const fallbackFeedback = FallbackFeedback.getInstance()
