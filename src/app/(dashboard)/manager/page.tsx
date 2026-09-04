import { getManagerDashboardData } from "@/actions/dashboard"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { Panel } from "@/components/shared/panel"
import { AttentionPanel } from "@/components/shared/attention-panel"
import { TechnicianActivityPanel } from "@/components/shared/technician-activity-panel"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function ManagerDashboardPage() {
  const { summary, attentionItems, recentJobs, technicianActivity, recentActivity } =
    await getManagerDashboardData()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Today's revenue"
          value={`${summary.todayRevenue.toLocaleString()} ETB`}
          hint={`${summary.todayPaymentCount} payments`}
        />
        <StatCard label="Today's jobs" value={String(summary.todayJobs)} />
        <StatCard label="Active jobs" value={String(summary.activeJobs)} />
        <StatCard label="Needs attention" value={String(summary.needsAttentionCount)} />
      </div>

      <Panel title="Needs attention">
        <AttentionPanel items={attentionItems} />
      </Panel>

      <Panel title="Recent jobs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentJobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-mono text-sm">#{job.jobNumber}</TableCell>
                <TableCell>{job.customerName}</TableCell>
                <TableCell>{job.deviceName}</TableCell>
                <TableCell><StatusBadge status={job.status} /></TableCell>
                <TableCell className="text-right text-[var(--color-text-muted)]">
                  {job.updatedAt}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Panel title="Technician activity">
          <TechnicianActivityPanel technicians={technicianActivity} />
        </Panel>

        <Panel title="Recent activity">
          <ul className="space-y-3">
            {recentActivity.map((event) => (
              <li key={event.id} className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <div className="text-[var(--color-text)]">{event.message}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">{event.actorName}</div>
                </div>
                <div className="shrink-0 text-xs text-[var(--color-text-muted)]">
                  {event.createdAt}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}