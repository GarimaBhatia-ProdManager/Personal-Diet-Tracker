// Centralized timezone utilities for consistent IST handling

export const IST_TIMEZONE = "Asia/Kolkata"

/**
 * Get current IST date as YYYY-MM-DD string
 */
export function getISTDate(offsetDays = 0): string {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toLocaleDateString("en-CA", {
    timeZone: IST_TIMEZONE,
  })
}

/**
 * Get current IST datetime as ISO string
 */
export function getISTDateTime(): string {
  return (
    new Date()
      .toLocaleString("sv-SE", {
        timeZone: IST_TIMEZONE,
      })
      .replace(" ", "T") + "Z"
  )
}

/**
 * Convert any date to IST and return as ISO string
 */
export function toISTDateTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return (
    dateObj
      .toLocaleString("sv-SE", {
        timeZone: IST_TIMEZONE,
      })
      .replace(" ", "T") + "Z"
  )
}

/**
 * Get IST date range for a specific date (start and end of day in IST)
 */
export function getISTDateRange(date: string): { start: string; end: string } {
  // Create date in IST timezone
  const istDate = new Date(date + "T00:00:00")

  // Get start of day in IST
  const startOfDay = new Date(istDate.toLocaleString("en-US", { timeZone: IST_TIMEZONE }))
  startOfDay.setHours(0, 0, 0, 0)

  // Get end of day in IST
  const endOfDay = new Date(istDate.toLocaleString("en-US", { timeZone: IST_TIMEZONE }))
  endOfDay.setHours(23, 59, 59, 999)

  return {
    start: startOfDay.toISOString(),
    end: endOfDay.toISOString(),
  }
}

/**
 * Format UTC timestamp to IST display format
 */
export function formatISTTime(utcTimestamp: string): string {
  return new Date(utcTimestamp).toLocaleString("en-IN", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Format UTC timestamp to IST time only
 */
export function formatISTTimeOnly(utcTimestamp: string): string {
  return new Date(utcTimestamp).toLocaleTimeString("en-IN", {
    timeZone: IST_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Check if a UTC timestamp falls on a specific IST date
 */
export function isOnISTDate(utcTimestamp: string, istDate: string): boolean {
  const timestampISTDate = new Date(utcTimestamp).toLocaleDateString("en-CA", {
    timeZone: IST_TIMEZONE,
  })
  return timestampISTDate === istDate
}

/**
 * Get the IST date from a UTC timestamp
 */
export function getISTDateFromUTC(utcTimestamp: string): string {
  return new Date(utcTimestamp).toLocaleDateString("en-CA", {
    timeZone: IST_TIMEZONE,
  })
}
