import { Banknote, CreditCard, Smartphone, Wallet, HelpCircle } from "lucide-react"

interface PaymentMethodBadgeProps {
  method?: string | null
  showIcon?: boolean
}

const config: Record<string, { label: string; Icon: any; classes: string }> = {
  CASH: {
    label: "Cash",
    Icon: Banknote,
    classes: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  BANK_TRANSFER: {
    label: "Bank",
    Icon: CreditCard,
    classes: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  MOBILE_MONEY: {
    label: "Mobile",
    Icon: Smartphone,
    classes: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  },
  CREDIT: {
    label: "Credit",
    Icon: Wallet,
    classes: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  OTHER: {
    label: "Other",
    Icon: HelpCircle,
    classes: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  },
}

export function PaymentMethodBadge({ method, showIcon = true }: PaymentMethodBadgeProps) {
  // Safe lookup: unknown or null methods fall back to "Other" instead of crashing
  const key = String(method || "OTHER").toUpperCase()
  const entry = config[key] || config.OTHER
  const Icon = entry.Icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${entry.classes}`}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {entry.label}
    </span>
  )
}