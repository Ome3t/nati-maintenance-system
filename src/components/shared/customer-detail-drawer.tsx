"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { FileText, Wrench, Loader2 } from "lucide-react"

interface CustomerDetailDrawerProps {
  customerId: string | null
}

const fmtDate = (iso: string) =>
  iso && !isNaN(new Date(iso).getTime())
    ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—"

export function CustomerDetailDrawer({ customerId }: CustomerDetailDrawerProps) {
  const router = useRouter()
  const [customer, setCustomer] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  // ✅ Fetch details client-side so the drawer opens INSTANTLY
  useEffect(() => {
    if (!customerId) {
      setCustomer(null)
      return
    }
    let cancelled = false
    setLoading(true)
    fetch(`/api/customers/${customerId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) {
          setCustomer(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCustomer(null)
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [customerId])

  const handleClose = () => router.push("/manager/customers")

  const deviceNameOf = (job: any) =>
    `${job.deviceType || ""} ${job.deviceModel && job.deviceModel !== "N/A" ? job.deviceModel : ""}`.trim() || "Device"

  return (
    <Sheet open={!!customerId} onOpenChange={(open) => { if (!open) handleClose() }}>
      <SheetContent side="right" className="w-full sm:w-[480px] border-l border-border bg-background text-foreground h-full overflow-y-auto p-6">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !customer ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Wrench className="h-8 w-8 opacity-20" />
            <p className="text-sm">Customer not found</p>
          </div>
        ) : (
          <div className="animate-page-enter flex flex-col h-full">
            <SheetHeader className="mb-6 border-b border-border pb-4">
              <SheetTitle className="text-2xl font-bold text-foreground">{customer.name}</SheetTitle>
              <SheetDescription className="text-muted-foreground text-base mt-1">{customer.phone}</SheetDescription>
            </SheetHeader>

            <div className="space-y-6 flex-1">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-muted/50 p-5">
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Jobs</div>
                  <div className="text-2xl font-bold text-foreground mt-1">{customer.totalJobs}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Service</div>
                  <div className="text-sm font-medium text-foreground mt-1">{customer.lastServiceDate || "—"}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{customer.lastServiceDevice || "—"}</div>
                </div>
              </div>

              {/* Service History */}
              <div>
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Service History</h3>
                <div className="space-y-3">
                  {(!customer.jobs || customer.jobs.length === 0) ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <Wrench className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No repair jobs yet</p>
                    </div>
                  ) : (
                    customer.jobs.map((job: any) => (
                      <div key={job.id} className="rounded-xl border border-border bg-muted/30 p-5 transition-colors hover:bg-muted/60">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="font-semibold text-foreground">Job #{job.jobNumber} — {deviceNameOf(job)}</div>
                            <div className="mt-1 text-sm text-muted-foreground">{job.problem}</div>
                          </div>
                          <StatusBadge status={job.status} />
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-sm">
                          <span className="text-muted-foreground">{fmtDate(job.createdAt)}</span>
                          <div className="flex items-center gap-4">
                            <span className={`font-bold ${job.paymentStatus === "PAID" ? "text-emerald-500" : "text-amber-500"}`}>
                              {(job.paymentStatus || "UNPAID").replace(/_/g, " ")}
                            </span>
                            <span className="font-semibold text-foreground">{Number(job.totalCost).toLocaleString()} ETB</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* View Full Details → full profile page */}
            <div className="mt-6 border-t border-border/50 pt-4">
              <Button
                onClick={() => router.push(`/manager/customers/${customer.id}`)}
                className="w-full gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <FileText className="h-4 w-4" /> View Full Details
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}