import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "LoveNotes - Never Miss a Moment to Show Her You Care",
  description:
    "Get personalized message suggestions sent to your phone. Copy, customize, and send sweet texts that will make her day. Join 2,847+ loving husbands.",
  keywords: "relationship messages, husband wife communication, love texts, marriage advice, relationship service",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
