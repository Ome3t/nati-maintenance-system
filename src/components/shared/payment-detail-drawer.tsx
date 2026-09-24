"use client"

import { useRouter } from "next/navigation"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { PaymentStatusBadge } from "@/components/shared/payment-status-badge"
import { PaymentMethodBadge } from "@/components/shared/payment-method-badge"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import {
  Wrench,
  ShoppingCart,
  FileText,
  Phone,
  User,
  Package,
} from "lucide-react"

interface PaymentDetailDrawerProps {
  payment: any
  isOpen: boolean
}

const fmtDate = (iso: string) =>
  iso && !isNaN(new Date(iso).getTime())
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—"

export function PaymentDetailDrawer({ payment, isOpen }: PaymentDetailDrawerProps) {
  const router = useRouter()
  const handleClose = () => {
    if (typeof window !== "undefined" && window.location.search.includes("payment=")) {
      router.push("/manager/payments")
    } else {
      router.push("/manager/payments")
    }
  }

  const hasJob = !!payment?.jobDetails
  const hasSale = !!payment?.saleDetails

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <SheetContent side="right" className="w-full sm:w-[520px] border-l border-border bg-background text-foreground h-full overflow-y-auto p-6">
        {!payment ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No payment selected
          </div>
        ) : (
          <div className="animate-page-enter flex flex-col h-full">
            {/* Header */}
            <SheetHeader className="mb-6 border-b border-border pb-4">
              <SheetTitle className="text-2xl font-bold text-foreground font-mono">
                #{payment.paymentNumber}
              </SheetTitle>
              <SheetDescription className="text-muted-foreground text-base mt-1 flex items-center gap-3 flex-wrap">
                <span>{fmtDate(payment.paidAt)}</span>
                <span>•</span>
                <span>{payment.recordedBy || "Unknown"}</span>
              </SheetDescription>
            </SheetHeader>

            {/* Payment summary card */}
            <div className="rounded-xl border border-border bg-muted/50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount Paid</span>
                <span className="text-2xl font-bold text-emerald-500">
                  {Number(payment.amount).toLocaleString()} ETB
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Method</div>
                  <PaymentMethodBadge method={payment.paymentMethod} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Status</div>
                  <PaymentStatusBadge status={payment.paymentStatus} />
                </div>
              </div>
              <div className="pt-2 border-t border-border/50">
                <div className="text-xs text-muted-foreground mb-1">Customer</div>
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {payment.customerName || "Walk-in"}
                  </span>
                  {payment.customerPhone && payment.customerPhone !== "N/A" && (
                    <>
                      <Phone className="h-3.5 w-3.5 text-muted-foreground ml-2" />
                      <span className="text-sm text-muted-foreground">{payment.customerPhone}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Job detail branch */}
            {hasJob && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Repair Job Details</h3>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-foreground">
                        Job #{payment.jobDetails!.jobNumber}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {(payment.jobDetails!.deviceName ||
                          `${payment.jobDetails!.deviceType || ""} ${payment.jobDetails!.deviceModel || ""}`.trim() ||
                          "Device")}
                      </div>
                    </div>
                    <StatusBadge status={payment.jobDetails!.status || "PENDING"} />
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Problem</div>
                    <p className="text-sm text-foreground">
                      {payment.jobDetails!.reportedProblem || payment.jobDetails!.problem || "—"}
                    </p>
                  </div>

                  {payment.jobDetails!.diagnosis && payment.jobDetails!.diagnosis !== "N/A" && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Diagnosis</div>
                      <p className="text-sm text-foreground whitespace-pre-line">
                        {payment.jobDetails!.diagnosis}
                      </p>
                    </div>
                  )}

                  {payment.jobDetails!.technician && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <User className="h-3 w-3" />
                      Technician: <span className="text-foreground">{payment.jobDetails!.technician}</span>
                    </div>
                  )}
                </div>

                {/* Items */}
                {Array.isArray(payment.jobDetails!.items) && payment.jobDetails!.items.length > 0 && (
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Materials Used
                      </span>
                    </div>
                    <div className="space-y-2">
                      {payment.jobDetails!.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-foreground truncate">
                            {item.name} <span className="text-xs text-muted-foreground">×{item.quantity}</span>
                          </span>
                          <span className="text-foreground font-medium">
                            {Number(item.total).toLocaleString()} ETB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cost breakdown */}
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Parts</span>
                    <span className="text-foreground">
                      {Number(payment.jobDetails!.partsCharge || 0).toLocaleString()} ETB
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Labor</span>
                    <span className="text-foreground">
                      {Number(payment.jobDetails!.laborCharge || 0).toLocaleString()} ETB
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold pt-2 border-t border-border/50">
                    <span className="text-foreground">Total</span>
                    <span className="text-foreground">
                      {Number(payment.jobDetails!.totalCost || payment.jobDetails!.total || 0).toLocaleString()} ETB
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-border/50">
                    <span className="text-muted-foreground">Remaining Balance</span>
                    <span className={
                      Number(payment.jobDetails!.remainingBalance || payment.jobDetails!.remainingAmount || 0) > 0
                        ? "text-amber-500 font-semibold"
                        : "text-emerald-500 font-semibold"
                    }>
                      {Number(payment.jobDetails!.remainingBalance || payment.jobDetails!.remainingAmount || 0).toLocaleString()} ETB
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Sale detail branch */}
            {hasSale && !hasJob && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Product Sale Details</h3>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-foreground">
                        Invoice #{payment.saleDetails!.invoiceNumber}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                        <User className="h-3 w-3" />
                        Cashier: {payment.saleDetails!.cashier || "Unknown"}
                      </div>
                    </div>
                    <PaymentStatusBadge status={payment.saleDetails!.status || payment.paymentStatus} />
                  </div>
                </div>

                {/* Items */}
                {Array.isArray(payment.saleDetails!.items) && payment.saleDetails!.items.length > 0 && (
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Items Sold
                      </span>
                    </div>
                    <div className="space-y-2">
                      {payment.saleDetails!.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-foreground truncate">
                            {item.productName || item.name}
                            <span className="text-xs text-muted-foreground"> ×{item.quantity}</span>
                          </span>
                          <span className="text-foreground font-medium">
                            {Number(item.total).toLocaleString()} ETB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">
                      {Number(payment.saleDetails!.subtotal || 0).toLocaleString()} ETB
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold pt-2 border-t border-border/50">
                    <span className="text-foreground">Total</span>
                    <span className="text-foreground">
                      {Number(payment.saleDetails!.totalCost || payment.saleDetails!.total || 0).toLocaleString()} ETB
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-border/50">
                    <span className="text-muted-foreground">Remaining Balance</span>
                    <span className={
                      Number(payment.saleDetails!.remainingBalance || payment.saleDetails!.remainingAmount || 0) > 0
                        ? "text-amber-500 font-semibold"
                        : "text-emerald-500 font-semibold"
                    }>
                      {Number(payment.saleDetails!.remainingBalance || payment.saleDetails!.remainingAmount || 0).toLocaleString()} ETB
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Fallback if neither branch has data */}
            {!hasJob && !hasSale && (
              <div className="mt-6 text-center text-muted-foreground py-8">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No detail records for this payment</p>
              </div>
            )}

            {/* Footer: Print Receipt */}
            <div className="mt-6 border-t border-border/50 pt-4">
              <Button
                onClick={() => {
                  const receiptPath = hasJob
                    ? `/receipts/job/${payment.jobDetails!.jobNumber || payment.jobNumber}`
                    : hasSale
                    ? `/receipts/sale/${payment.saleDetails!.invoiceNumber || payment.jobNumber}`
                    : null
                  if (receiptPath) {
                    window.open(receiptPath, "_blank")
                  }
                }}
                disabled={!hasJob && !hasSale}
                className="w-full gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <FileText className="h-4 w-4" /> Print Receipt
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}