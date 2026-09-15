"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { StatusBadge } from "@/components/shared/status-badge"
import type { JobDetail } from "../../domain/types/job"
import { useRouter } from "next/navigation"
import { User, Wrench, Clock } from "lucide-react"

interface JobDetailDrawerProps {
  job: JobDetail | null
  isOpen: boolean
}

export function JobDetailDrawer({ job, isOpen }: JobDetailDrawerProps) {
  const router = useRouter()

  const handleClose = () => {
    router.push("/manager/jobs")
  }

  if (!job) return null

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-[480px] sm:w-[540px] border-l border-white/10 bg-[#09090b] text-white p-6">
        <SheetHeader className="mb-6 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <SheetTitle className="text-2xl font-bold text-white">Job #{job.jobNumber}</SheetTitle>
            <StatusBadge status={job.status} />
          </div>
          <SheetDescription className="text-zinc-400 text-sm mt-2">
            Created {job.createdAt} • Priority: <span className="text-white">{job.priority}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Customer & Device Info */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase mb-2">
                <User className="h-3 w-3" /> Customer
              </div>
              <div className="font-semibold text-white">{job.customerName}</div>
              <div className="text-sm text-zinc-400">{job.customerPhone}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase mb-2">
                <Wrench className="h-3 w-3" /> Device
              </div>
              <div className="font-semibold text-white">{job.deviceName}</div>
              <div className="text-xs text-zinc-500 mt-1">{job.deviceType}</div>
            </div>
          </div>

          {/* Financial & Assignment State */}
          <div className="rounded-xl border border-white/10 bg-zinc-900/30 p-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Assigned Technician</span>
              <span className="font-semibold text-white">{job.technicianName || "Unassigned"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Total Cost</span>
              <span className="font-bold text-white text-lg">{job.totalCost.toLocaleString()} ETB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Payment Status</span>
              <span className={`font-bold ${
                job.paymentStatus === "PAID" ? "text-emerald-500" : 
                job.paymentStatus === "PARTIALLY_PAID" ? "text-amber-500" : "text-red-500"
              }`}>
                {job.paymentStatus.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Diagnosis & Work */}
          {(job.diagnosis || job.workPerformed) && (
            <div className="space-y-3">
              {job.diagnosis && (
                <div className="rounded-xl border border-white/10 bg-zinc-900/30 p-4">
                  <div className="text-xs font-bold text-zinc-500 uppercase mb-1">Diagnosis</div>
                  <p className="text-sm text-zinc-300">{job.diagnosis}</p>
                </div>
              )}
              {job.workPerformed && (
                <div className="rounded-xl border border-white/10 bg-zinc-900/30 p-4">
                  <div className="text-xs font-bold text-zinc-500 uppercase mb-1">Work Performed</div>
                  <p className="text-sm text-zinc-300">{job.workPerformed}</p>
                </div>
              )}
            </div>
          )}

          {/* Activity Timeline */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <Clock className="h-3 w-3" /> Activity History
            </h3>
            <div className="space-y-4 border-l border-white/10 pl-4 ml-2">
              {job.activities.map((activity) => (
                <div key={activity.id} className="relative">
                  <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-[#09090b]" />
                  <div className="text-sm font-semibold text-white">{activity.action}</div>
                  {activity.details && <div className="text-sm text-zinc-400 mt-0.5">{activity.details}</div>}
                  <div className="mt-1 text-xs text-zinc-500">
                    {activity.timestamp} • {activity.actorName}
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