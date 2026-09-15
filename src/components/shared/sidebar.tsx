"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Wrench, CreditCard, FileText, Settings } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/manager", icon: LayoutDashboard },
  { name: "Customers", href: "/manager/customers", icon: Users },
  { name: "Jobs", href: "/manager/jobs", icon: Wrench },
  { name: "Payments", href: "/manager/payments", icon: CreditCard },
  { name: "Reports", href: "/manager/reports", icon: FileText },
  { name: "Settings", href: "/manager/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col py-6 px-4">
      <div className="mb-8 px-4">
        <h1 className="text-xl font-bold text-white tracking-tight">Nati<span className="text-emerald-500">.</span></h1>
      </div>
      
      <nav className="flex-1 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-emerald-500/10 text-emerald-500" // Active state: Green tint
                  : "text-zinc-400 hover:bg-white/5 hover:text-white" // Inactive: Gray
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