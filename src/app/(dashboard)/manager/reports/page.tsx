"use client"

import { useEffect, useState } from "react"
import { getReportData } from "@/actions/reports"
import { StatCard } from "@/components/shared/stat-card"
import { Panel } from "@/components/shared/panel"
import { RevenueChart } from "@/components/shared/revenue-chart"
import { DeviceBreakdownChart } from "@/components/shared/device-breakdown-chart"
import { TechnicianChart } from "@/components/shared/technician-chart"
import { StatusBadge } from "@/components/shared/status-badge"
import { cn } from "@/lib/utils"
import { downloadCSV, convertArrayToCSV } from "@/lib/csv-export"
import { Download, RefreshCw, FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"
import type { ReportData, DateRange } from "../../../../domain/types/reports"

const dateRanges: { label: string; value: DateRange }[] = [
  { label: "Today", value: "TODAY" },
  { label: "This Week", value: "WEEK" },
  { label: "This Month", value: "MONTH" },
  { label: "This Year", value: "YEAR" },
]

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [range, setRange] = useState<DateRange>("MONTH")
  const [isLoading, setIsLoading] = useState(true)
  const [counterKey, setCounterKey] = useState(0)

  useEffect(() => {
    loadData(true)
  }, [])

  const loadData = async (triggerCounter = false) => {
    setIsLoading(true)
    const reportData = await getReportData(range)
    setData(reportData)
    setIsLoading(false)
    if (triggerCounter) setCounterKey((prev) => prev + 1)
  }

  const handleRangeChange = (newRange: DateRange) => {
    setRange(newRange)
    setTimeout(() => loadData(true), 50)
  }

  // --- NEW EXPORT FUNCTION ---
  const handleExport = () => {
    if (!data) return

    // 1. Format Summary
    const summaryCSV = `Metric,Value\nTotal Revenue,${data.summary.totalRevenue}\nTotal Jobs,${data.summary.totalJobs}\nAvg Repair Time,${data.summary.avgRepairTime}\nCompletion Rate,${data.summary.completionRate}%\n`
    
    // 2. Format Revenue Trend
    const revenueCSV = convertArrayToCSV(data.revenueTrend)
    
    // 3. Format Technician Performance
    const techCSV = convertArrayToCSV(data.technicianPerformance)
    
    // 4. Format Top Jobs
    const jobsCSV = convertArrayToCSV(data.topJobs)

    // 5. Combine into one file with section headers
    const fullReport = `NATI MAINTENANCE SYSTEM - REPORT (${range})\n\n--- SUMMARY ---\n${summaryCSV}\n--- REVENUE TREND ---\n${revenueCSV}\n--- TECHNICIAN PERFORMANCE ---\n${techCSV}\n--- TOP JOBS ---\n${jobsCSV}`

    // 6. Download
    const fileName = `nati-report-${range.toLowerCase()}-${new Date().toISOString().split("T")[0]}.csv`
    downloadCSV(fullReport, fileName)
    
    toast.success("Report exported successfully", {
      description: `Saved as ${fileName}`,
    })
  }
  // ---------------------------

  if (isLoading || !data) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <RefreshCw className="h-5 w-5 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-sm text-zinc-400 mt-1">Business performance overview</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Range Segmented Control */}
          <div className="flex rounded-lg border border-white/10 bg-zinc-900/50 p-1">
            {dateRanges.map((r) => (
              <button
                key={r.value}
                onClick={() => handleRangeChange(r.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  range === r.value ? "bg-emerald-500/20 text-emerald-500" : "text-zinc-400 hover:text-white"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          
          {/* EXPORT BUTTON (Now Wired) */}
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 border border-emerald-500/20 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-all"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard key={`rev-${counterKey}`} label="Total Revenue" value={data.summary.totalRevenue} suffix=" ETB" trend="up" />
        <StatCard key={`jobs-${counterKey}`} label="Total Jobs" value={data.summary.totalJobs} hint="Processed" />
        <StatCard key={`time-${counterKey}`} label="Avg. Repair Time" value={data.summary.avgRepairTime} suffix=" hrs" />
        <StatCard key={`rate-${counterKey}`} label="Completion Rate" value={data.summary.completionRate} suffix="%" trend="up" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Panel title="Revenue Trend">
            <RevenueChart data={data.revenueTrend} />
          </Panel>
        </div>
        <div className="lg:col-span-1">
          <Panel title="Device Breakdown">
            <DeviceBreakdownChart data={data.deviceBreakdown} />
          </Panel>
        </div>
      </div>

      {/* Charts Row 2 & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Technician Performance">
          <TechnicianChart data={data.technicianPerformance} />
        </Panel>
        
        <Panel title="Top Revenue Jobs">
          <div className="space-y-3">
            {data.topJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-zinc-900/30 p-4">
                <div>
                  <div className="font-medium text-white">Job #{job.jobNumber} - {job.device}</div>
                  <div className="text-xs text-zinc-500 mt-1">{job.customer}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-500">{job.revenue.toLocaleString()} ETB</div>
                  <div className="mt-1"><StatusBadge status={job.status as any} /></div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}