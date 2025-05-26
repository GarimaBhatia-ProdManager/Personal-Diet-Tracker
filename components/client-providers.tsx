"use client"

import type React from "react"

interface ClientProvidersProps {
  children: React.ReactNode
  userId?: string
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return <>{children}</>
}
