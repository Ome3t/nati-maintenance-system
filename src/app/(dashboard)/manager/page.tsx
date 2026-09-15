"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { getManagerDashboardData } from "@/actions/dashboard"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { Panel } from "@/components/shared/panel"
import { AttentionPanel } from "@/components/shared/attention-panel"
import { TechnicianActivityPanel } from "@/components/shared/technician-activity-panel"
import { RevenueChart } from "@/components/shared/revenue-chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Bell, AlertCircle, RefreshCw } from "lucide-react"
import type { ManagerDashboardData } from "../../../domain/types/dashboard"

export default function ManagerDashboardPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [data, setData] = useState<ManagerDashboardData | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Initial data fetch
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const dashboardData = await getManagerDashboardData()
    setData(dashboardData)
    setLastUpdated(new Date())
  }

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh()
      fetchData()
    })
  }

  if (!data) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    )
  }

  const { summary, attentionItems, recentJobs, technicianActivity, recentActivity, revenueTrend } = data

  return (
    <div className="space-y-6">
      {/* Header Section with Live Indicator */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">Overview</h1>
            <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-emerald-500">Live</span>
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-card border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
            {isPending ? "Refreshing..." : "Refresh Data"}
          </button>
          <button className="p-2 rounded-full bg-card border border-border hover:bg-accent transition-colors">
            <Bell className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* 1. KPI Strip (Top Row) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Revenue"
          value={`${summary.todayRevenue.toLocaleString()} ETB`}
          hint={`${summary.todayPaymentCount} payments`}
          trend="up"
        />
        <StatCard 
          label="Active Jobs" 
          value={String(summary.activeJobs)} 
          hint="Currently in workshop"
        />
        <StatCard 
          label="Today's Intake" 
          value={String(summary.todayJobs)} 
          hint="New devices received"
        />
        <StatCard 
          label="Needs Attention" 
          value={String(summary.needsAttentionCount)} 
          hint="Action required"
          trend="down"
        />
      </div>

      {/* 2. Main Grid (Split View) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3 width) - Operations & Charts */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Revenue Chart */}
          <Panel title="Revenue Trend (Last 7 Days)" action={
            <button 
              onClick={handleRefresh}
              className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <RefreshCw className={cn("h-3 w-3", isPending && "animate-spin")} /> 
              Refresh
            </button>
          }>
            <RevenueChart data={revenueTrend} />
          </Panel>

          {/* Needs Attention Panel */}
          {attentionItems.length > 0 && (
            <Panel title="Needs Attention" action={<AlertCircle className="h-4 w-4 text-destructive" />}>
              <AttentionPanel items={attentionItems} />
            </Panel>
          )}

          {/* Recent Jobs Table */}
          <Panel title="Recent Jobs" action={<button className="text-xs text-primary hover:underline">View All</button>}>
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Job #</TableHead>
                  <TableHead className="text-muted-foreground">Customer</TableHead>
                  <TableHead className="text-muted-foreground">Device</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentJobs.map((job) => (
                  <TableRow key={job.id} className="border-border/50 hover:bg-accent/50">
                    <TableCell className="font-mono text-sm text-foreground">#{job.jobNumber}</TableCell>
                    <TableCell className="text-foreground">{job.customerName}</TableCell>
                    <TableCell className="text-muted-foreground">{job.deviceName}</TableCell>
                    <TableCell><StatusBadge status={job.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
        </div>

        {/* Right Column (1/3 width) - Activity & Technicians */}
        <div className="space-y-6">
          
          {/* Technician Activity */}
          <Panel title="Technician Workload">
            <TechnicianActivityPanel technicians={technicianActivity} />
          </Panel>

          {/* Recent Activity Feed */}
          <Panel title="Live Activity">
            <ul className="space-y-4">
              {recentActivity.map((event) => (
                <li key={event.id} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm text-foreground leading-tight">{event.message}</p>
                    <p className="text-xs text-muted-foreground">{event.actorName} • {event.createdAt}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

        </div>
      </div>
    </div>
  )
}

// Helper for conditional classes
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}