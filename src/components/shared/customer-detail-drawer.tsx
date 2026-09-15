"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { StatusBadge } from "@/components/shared/status-badge"
import type { CustomerDetail, CustomerJobHistory } from "../../domain/types/customer"
import { useRouter } from "next/navigation"

interface CustomerDetailDrawerProps {
  customer: CustomerDetail | null
  isOpen: boolean
}

export function CustomerDetailDrawer({ customer, isOpen }: CustomerDetailDrawerProps) {
  const router = useRouter()

  const handleClose = () => {
    router.push("/manager/customers")
  }

  if (!customer) return null

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-[480px] sm:w-[540px] border-l border-white/10 bg-[#09090b] text-white p-6">
        <SheetHeader className="mb-6 border-b border-white/10 pb-4">
          <SheetTitle className="text-2xl font-bold text-white">{customer.name}</SheetTitle>
          <SheetDescription className="text-zinc-400 text-base mt-1">
            {customer.phone}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-white/10 bg-zinc-900/50 p-5">
            <div>
              <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Jobs</div>
              <div className="text-2xl font-bold text-white mt-1">{customer.totalJobs}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Last Service</div>
              <div className="text-sm font-medium text-white mt-1">{customer.lastServiceDate}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{customer.lastServiceDevice}</div>
            </div>
          </div>

          {/* Job History */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-500">
              Service History
            </h3>
            <div className="space-y-3">
              {customer.jobs.map((job: CustomerJobHistory) => (
                <div key={job.id} className="rounded-xl border border-white/10 bg-zinc-900/30 p-5 transition-colors hover:bg-zinc-900/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-semibold text-white">
                        Job #{job.jobNumber} — {job.deviceName}
                      </div>
                      <div className="mt-1 text-sm text-zinc-400">
                        {job.reportedProblem}
                      </div>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-sm">
                    <span className="text-zinc-500">{job.createdAt}</span>
                    <div className="flex items-center gap-4">
                      <span className={`font-bold ${
                        job.paymentStatus === "PAID" ? "text-emerald-500" : "text-amber-500"
                      }`}>
                        {job.paymentStatus.replace("_", " ")}
                      </span>
                      <span className="font-semibold text-white">{job.totalCost.toLocaleString()} ETB</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}