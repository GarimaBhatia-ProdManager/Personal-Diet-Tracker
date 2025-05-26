"use client"

import type React from "react"
import { UserbackProvider } from "./userback-provider"

interface ClientProvidersProps {
  children: React.ReactNode
  userId?: string
}

export function ClientProviders({ children, userId }: ClientProvidersProps) {
  return <UserbackProvider userId={userId}>{children}</UserbackProvider>
}
