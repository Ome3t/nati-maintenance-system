import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function TechnicianGuardLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const role = (session.user as any).role
  if (role !== "TECHNICIAN" && role !== "OWNER") {
    redirect("/pos")
  }
  return <>{children}</>
}