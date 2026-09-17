<<<<<<< HEAD
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/mock-session"

export default async function Home() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const roleRoutes = {
    MANAGER: "/manager",
    CASHIER: "/cashier",
    TECHNICIAN: "/technician",
  } as const

  redirect(roleRoutes[user.role])
=======
﻿import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login");
>>>>>>> main
}
