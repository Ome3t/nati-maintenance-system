import type { JobStatusValue } from "@/lib/mock-dashboard-data"

const STATUS_LABEL: Record<JobStatusValue, string> = {
  NEW: "New",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In progress",
  WAITING: "Waiting",
  COMPLETED: "Completed",
  READY_FOR_PICKUP: "Ready for pickup",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
}

const STATUS_COLOR: Record<JobStatusValue, string> = {
  NEW: "var(--color-status-new)",
  ASSIGNED: "var(--color-status-new)",
  IN_PROGRESS: "var(--color-status-progress)",
  WAITING: "var(--color-status-waiting)",
  COMPLETED: "var(--color-status-done)",
  READY_FOR_PICKUP: "var(--color-status-done)",
  DELIVERED: "var(--color-text-muted)",
  CANCELLED: "var(--color-status-urgent)",
}

export function StatusBadge({ status }: { status: JobStatusValue }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text)]">
      <span
        className="h-2 w-2 rounded-full shrink-0"
        style={{ backgroundColor: STATUS_COLOR[status] }}
      />
      {STATUS_LABEL[status]}
    </span>
  )
}