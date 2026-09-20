import { cn } from "@/lib/utils"
import { Shield, Wallet, Wrench } from "lucide-react"

interface RoleBadgeProps {
  role: string
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const config: Record<string, { label: string; icon: any; className: string }> = {
    OWNER: { 
      label: "Owner", 
      icon: Shield, 
      className: "bg-purple-500/10 text-purple-500 border-purple-500/20" 
    },
    CASHIER: { 
      label: "Cashier", 
      icon: Wallet, 
      className: "bg-blue-500/10 text-blue-500 border-blue-500/20" 
    },
    TECHNICIAN: { 
      label: "Technician", 
      icon: Wrench, 
      className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
    },
    // Fallback for any unexpected roles
    DEFAULT: { 
      label: role || "Unknown", 
      icon: Shield, 
      className: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" 
    },
  }

  const roleConfig = config[role] || config.DEFAULT
  const { label, icon: Icon, className } = roleConfig

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", className)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}