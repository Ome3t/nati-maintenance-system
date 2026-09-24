"use client"

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts"
import { Package } from "lucide-react"

/* Design-guideline palette: emerald first, then supporting accents */
const COLORS = [
  "#10b981", // emerald-500
  "#3b82f6", // blue-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ef4444", // red-500
  "#14b8a6", // teal-500
  "#eab308", // yellow-500
  "#ec4899", // pink-500
]

/* Crash-proof tooltip */
const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload || payload.length === 0) return null
  const entry = payload[0]
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-xl">
      <p className="text-sm font-bold text-foreground">{entry.name}</p>
      <p className="text-xs text-emerald-500">{Number(entry.value || 0)} jobs</p>
    </div>
  )
}

export function DeviceBreakdownChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[280px] flex-col items-center justify-center gap-2 text-muted-foreground">
        <Package className="h-8 w-8 opacity-20" />
        <p className="text-sm">No jobs in this period</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          cornerRadius={4}
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<PieTooltip />} />
        <Legend
          formatter={(value: string) => (
            <span className="text-xs text-muted-foreground">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}