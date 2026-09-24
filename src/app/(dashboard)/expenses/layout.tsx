import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function OwnerGuardLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const role = (session.user as any).role
  if (role !== "OWNER") {
    redirect(role === "CASHIER" ? "/pos" : "/my-jobs")
  }
  return <>{children}</>
}