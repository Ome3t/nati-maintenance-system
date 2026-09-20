"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, Users, Wrench, CreditCard, FileText, Settings,
  ShoppingCart, Package, Briefcase, Wallet, History
} from "lucide-react"

// Define which roles can see which links
const navigation = [
  // --- OWNER / ADMIN ---
  { name: "Dashboard", href: "/manager", icon: LayoutDashboard, roles: ["OWNER"] },
  { name: "Customers", href: "/manager/customers", icon: Users, roles: ["OWNER"] },
  { name: "All Jobs", href: "/jobs", icon: Wrench, roles: ["OWNER"] },
  { name: "Payments", href: "/manager/payments", icon: CreditCard, roles: ["OWNER"] },
  { name: "Reports", href: "/manager/reports", icon: FileText, roles: ["OWNER"] },
  { name: "Inventory", href: "/inventory", icon: Package, roles: ["OWNER"] },
  { name: "Expenses", href: "/expenses", icon: Wallet, roles: ["OWNER"] },
  
  // --- CASHIER ---
  { name: "POS", href: "/pos", icon: ShoppingCart, roles: ["CASHIER", "OWNER"] },
  { name: "Sales History", href: "/sales-history", icon: History, roles: ["CASHIER", "OWNER"] },
  
  // --- TECHNICIAN ---
  { name: "My Jobs", href: "/my-jobs", icon: Briefcase, roles: ["TECHNICIAN", "OWNER"] },
  { name: "Pending Payments", href: "/pending-payments", icon: CreditCard, roles: ["TECHNICIAN", "OWNER"] },
  
  // --- SHARED ---
  { name: "Settings", href: "/manager/settings", icon: Settings, roles: ["OWNER"] },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  
  // Get the user's role (default to TECHNICIAN if not loaded yet)
  const userRole = (session?.user as any)?.role || "TECHNICIAN"

  // Filter the navigation links based on the user's role
  const filteredNav = navigation.filter(item => item.roles.includes(userRole))

  return (
    <div className="flex h-full flex-col py-6 px-4">
      <div className="mb-8 px-4">
        <h1 className="text-xl font-bold text-white tracking-tight">
          Nati<span className="text-emerald-500">.</span>
        </h1>
        {/* Show current role in sidebar for clarity */}
        <p className="text-xs text-emerald-500 mt-1 capitalize font-medium">
          {userRole} Dashboard
        </p>
      </div>
      
      <nav className="flex-1 space-y-1">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-150 ease-out active:scale-95 cursor-pointer",
                isActive
                  ? "bg-emerald-500/10 text-emerald-500" 
                  : "text-zinc-400 hover:bg-white/5 hover:text-white" 
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}