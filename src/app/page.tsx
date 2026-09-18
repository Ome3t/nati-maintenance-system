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
    PHONE_TECHNICIAN: "/technician",
    COMPUTER_TECHNICIAN: "/technician",
  }

  redirect(roleRoutes[user.role])
}