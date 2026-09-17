import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner" // <-- ADD THIS
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Nati Maintenance System",
  description: "Internal business management system for Nati Mobile Maintenance",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
      <ThemeProvider
  attribute="class"
  defaultTheme="dark"
  enableSystem
>
          {children}
          {/* ADD THIS AT THE VERY BOTTOM */}
          <Toaster position="bottom-right" richColors theme="system" /> 
        </ThemeProvider>
      </body>
    </html>
  )
}