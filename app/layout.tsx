import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { UserbackScript } from "@/components/userback-script"
import { ThemeProvider } from "@/components/theme-provider"
import { ClientProviders } from "@/components/client-providers"

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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ClientProviders>
            <main>{children}</main>
          </ClientProviders>
        </ThemeProvider>
        <UserbackScript />
      </body>
    </html>
  )
}
