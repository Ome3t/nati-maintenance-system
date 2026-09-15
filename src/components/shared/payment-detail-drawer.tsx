"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { PaymentStatusBadge } from "@/components/shared/payment-status-badge"
import { PaymentMethodBadge } from "@/components/shared/payment-method-badge"
import type { PaymentDetail } from "../../domain/types/payment"
import { useRouter } from "next/navigation"
import { FileText, User, Wrench, CheckCircle2 } from "lucide-react"

interface PaymentDetailDrawerProps {
  payment: PaymentDetail | null
  isOpen: boolean
}

export function PaymentDetailDrawer({ payment, isOpen }: PaymentDetailDrawerProps) {
  const router = useRouter()

  const handleClose = () => {
    router.push("/manager/payments")
  }

  if (!payment) return null

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-[480px] sm:w-[540px] border-l border-white/10 bg-[#09090b] text-white p-6">
        <SheetHeader className="mb-6 border-b border-white/10 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-2xl font-bold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-500" />
                Receipt #{payment.paymentNumber}
              </SheetTitle>
              <SheetDescription className="text-zinc-400 text-sm mt-1">
                Recorded on {payment.paidAt}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Main Amount & Status */}
          <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6 text-center">
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Amount Collected</div>
            <div className="text-4xl font-bold text-white mb-3">
              {payment.amount.toLocaleString()} <span className="text-lg text-zinc-500">ETB</span>
            </div>
            <div className="flex justify-center gap-3">
              <PaymentStatusBadge status={payment.paymentStatus} />
              <PaymentMethodBadge method={payment.paymentMethod} />
            </div>
          </div>

          {/* Job Context */}
          <div className="grid grid-cols-1 gap-4">
            <div className="rounded-xl border border-white/10 bg-zinc-900/30 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase mb-2">
                <Wrench className="h-3 w-3" /> Related Job
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-white">Job #{payment.jobNumber}</div>
                  <div className="text-sm text-zinc-400 mt-1">{payment.jobDetails.deviceName}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-zinc-500">Total Cost</div>
                  <div className="font-semibold text-white">{payment.jobDetails.totalCost.toLocaleString()} ETB</div>
                </div>
              </div>
              {payment.jobDetails.remainingBalance > 0 && (
                <div className="mt-3 pt-3 border-t border-white/5 text-sm">
                  <span className="text-zinc-400">Remaining Balance: </span>
                  <span className="font-bold text-amber-500">{payment.jobDetails.remainingBalance.toLocaleString()} ETB</span>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-zinc-900/30 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase mb-2">
                <User className="h-3 w-3" /> Customer & Staff
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Customer</span>
                  <span className="font-medium text-white">{payment.customerName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Recorded By</span>
                  <span className="font-medium text-white">{payment.recordedBy}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {payment.notes && (
            <div className="rounded-xl border border-white/10 bg-zinc-900/30 p-4">
              <div className="text-xs font-bold text-zinc-500 uppercase mb-2">Notes</div>
              <p className="text-sm text-zinc-300">{payment.notes}</p>
            </div>
          )}

          {/* Action Button */}
          <button className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 flex items-center justify-center gap-2 transition-colors">
            <CheckCircle2 className="h-4 w-4" />
            Print Receipt
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}