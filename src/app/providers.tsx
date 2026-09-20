"use client"

import { SessionProvider } from "next-auth/react"

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      // These settings stop NextAuth from spamming the server on every click
      refetchOnWindowFocus={false} 
      refetchInterval={0}
    >
      {children}
    </SessionProvider>
  )
}