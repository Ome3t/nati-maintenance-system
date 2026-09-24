"use client"

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { Wrench } from "lucide-react"

/* Crash-proof tooltip: never assumes payload length */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null

  const jobsEntry = payload.find((p: any) => p.dataKey === "completedJobs")
  const revenueEntry = payload.find((p: any) => p.dataKey === "revenue")

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-xl">
      <p className="text-sm font-bold text-foreground mb-1">{label}</p>
      {jobsEntry && (
        <p className="text-xs text-emerald-500">
          {Number(jobsEntry.value || 0)} Jobs Completed
        </p>
      )}
      {revenueEntry && (
        <p className="text-xs text-blue-500">
          {Number(revenueEntry.value || 0).toLocaleString()} ETB Revenue
        </p>
      )}
    </div>
  )
}

export function TechnicianChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[280px] flex-col items-center justify-center gap-2 text-muted-foreground">
        <Wrench className="h-8 w-8 opacity-20" />
        <p className="text-sm">No completed jobs in this period</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: "#71717a", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="jobs"
          allowDecimals={false}
          tick={{ fill: "#71717a", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="revenue"
          orientation="right"
          tick={{ fill: "#71717a", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Legend
          formatter={(value: string) => (
            <span className="text-xs text-muted-foreground">
              {value === "completedJobs" ? "Jobs Completed" : "Revenue (ETB)"}
            </span>
          )}
        />
        <Bar yAxisId="jobs" dataKey="completedJobs" name="completedJobs" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar yAxisId="revenue" dataKey="revenue" name="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}