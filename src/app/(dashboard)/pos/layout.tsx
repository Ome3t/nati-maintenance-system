import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function CashierGuardLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const role = (session.user as any).role
  if (role !== "CASHIER" && role !== "OWNER") {
    redirect("/my-jobs")
  }
  return <>{children}</>
}