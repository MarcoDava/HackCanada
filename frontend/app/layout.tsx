"use client"
import { AuthProvider } from "@/components/AuthContext"
import { Analytics } from "@vercel/analytics/react"
import "./globals.css"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Networkify | Find Your Warmest Path to Any Company</title>
        <meta name="description" content="Upload your LinkedIn connections and discover hidden referral paths, rank contacts, and craft outreach messages with AI." />
        <link rel="icon" href="/logo.png" type="image/png" />
      </head>
      <body className="min-h-screen bg-dark-bg">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}

