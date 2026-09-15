import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Nati Repair",
  description: "Maintenance management system",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
