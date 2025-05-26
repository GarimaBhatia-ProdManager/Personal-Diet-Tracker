import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ClientProviders } from "@/components/client-providers"
import UserbackLoader from "@/components/userback-loader"

export const metadata: Metadata = {
  title: "Personal Diet Tracker",
  description: "Track your nutrition goals and build healthy habits",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>
          {children}
          <UserbackLoader />
        </ClientProviders>
      </body>
    </html>
  )
}
