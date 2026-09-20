import { redirect } from "next/navigation"
import { auth } from "@/lib/auth" // Make sure this path matches your auth file

export default async function Home() {
  const session = await auth()

  // If not logged in, go to login
  if (!session?.user) {
    redirect("/login")
  }

  // Get the role from the session
  const role = (session.user as any).role || "TECHNICIAN"

  // Route based on the Prisma Roles (OWNER, CASHIER, TECHNICIAN)
  if (role === "OWNER" || role === "MANAGER") {
    redirect("/manager") // Sends Admin to your polished dashboard
  } 
  
  if (role === "CASHIER") {
    redirect("/pos") // Sends Cashier to the Point of Sale
  } 
  
  if (role === "TECHNICIAN") {
    redirect("/my-jobs") // Sends Technician to their jobs
  }

  // Fallback
  redirect("/login")
}