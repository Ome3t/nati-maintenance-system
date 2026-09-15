import { Suspense } from "react"
import { getJobs, getJobDetail } from "@/actions/jobs"
import { Panel } from "@/components/shared/panel"
import { StatusBadge } from "@/components/shared/status-badge"
import { JobDetailDrawer } from "@/components/shared/job-detail-drawer"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import Link from "next/link"

interface JobsPageProps {
  searchParams: Promise<{ job?: string; q?: string; status?: string }>
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const { job: selectedJobId, q: searchQuery, status: statusFilter } = await searchParams
  
  const jobs = await getJobs(statusFilter as any, searchQuery)
  const selectedJob = selectedJobId ? await getJobDetail(selectedJobId) : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold">Jobs</h1>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="w-full md:w-64">
            <Input 
              placeholder="Search job #, customer, or device..." 
              defaultValue={searchQuery}
            />
          </div>
          {/* In a real app, this would be a Select dropdown from shadcn/ui */}
          <select 
            defaultValue={statusFilter || "ALL"}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING">Waiting</option>
            <option value="COMPLETED">Completed</option>
            <option value="READY_FOR_PICKUP">Ready for Pickup</option>
            <option value="DELIVERED">Delivered</option>
          </select>
        </div>
      </div>

      <Panel title="All Jobs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Technician</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Payment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((j) => (
              <TableRow key={j.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-mono font-medium">
                  <Link href={`/manager/jobs?job=${j.id}${searchQuery ? `&q=${searchQuery}` : ''}${statusFilter ? `&status=${statusFilter}` : ''}`} className="block w-full h-full">
                    #{j.jobNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{j.customerName}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">{j.customerPhone}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{j.deviceName}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">{j.deviceType}</div>
                </TableCell>
                <TableCell>{j.technicianName || <span className="text-amber-600 text-xs font-medium">Unassigned</span>}</TableCell>
                <TableCell><StatusBadge status={j.status} /></TableCell>
                <TableCell className="text-right">
                  <span className={`text-sm font-medium ${
                    j.paymentStatus === "PAID" ? "text-green-600" : 
                    j.paymentStatus === "PARTIALLY_PAID" ? "text-amber-600" : "text-red-600"
                  }`}>
                    {j.paymentStatus === "PAID" ? "Paid" : j.totalCost.toLocaleString() + " ETB"}
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {jobs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-[var(--color-text-muted)]">
                  No jobs found matching your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Panel>

      <Suspense fallback={null}>
        <JobDetailDrawer 
          job={selectedJob} 
          isOpen={!!selectedJobId} 
        />
      </Suspense>
    </div>
  )
}