"use client"

import type React from "react"

import type { Metadata } from "next"
import "./globals.css"
import { useEffect } from "react"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("@/lib/userback-integration").then(({ initializeUserback }) => {
        initializeUserback()
      })
    }
  }, [])
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
