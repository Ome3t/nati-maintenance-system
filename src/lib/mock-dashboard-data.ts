// TEMPORARY — swap getManagerDashboardData() for real server actions once
// Jobs/Payments/Customers exist. These types are the target contract for
// those future endpoints — keep them stable so the swap is a one-file change.

export type JobStatusValue =
  | "NEW"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "WAITING"
  | "COMPLETED"
  | "READY_FOR_PICKUP"
  | "DELIVERED"
  | "CANCELLED"

export type DashboardSummary = {
  todayRevenue: number
  todayPaymentCount: number
  todayJobs: number
  activeJobs: number
  needsAttentionCount: number
}

export type AttentionItem = {
  id: string
  title: string
  description: string
  severity: "info" | "warning" | "critical"
  href?: string
}

export type RecentJob = {
  id: string
  jobNumber: number
  customerName: string
  deviceName: string
  status: JobStatusValue
  updatedAt: string
}

export type TechnicianActiveJob = {
  jobNumber: number
  deviceName: string
  status: JobStatusValue
}

export type TechnicianActivity = {
  technicianId: string
  technicianName: string
  role: string
  activeJobs: number
  completedToday: number
  activeJobsList: TechnicianActiveJob[]
}

export type RecentActivityItem = {
  id: string
  message: string
  actorName: string
  createdAt: string
}

export type ManagerDashboardData = {
  summary: DashboardSummary
  attentionItems: AttentionItem[]
  recentJobs: RecentJob[]
  technicianActivity: TechnicianActivity[]
  recentActivity: RecentActivityItem[]
}

export async function getManagerDashboardData(): Promise<ManagerDashboardData> {
  return {
    summary: {
      todayRevenue: 8450,
      todayPaymentCount: 12,
      todayJobs: 14,
      activeJobs: 5,
      needsAttentionCount: 3,
    },
    // Add these inside the return object of getManagerDashboardData()
revenueTrend: [
  { date: "Mon", revenue: 4200, jobs: 5 },
  { date: "Tue", revenue: 3800, jobs: 4 },
  { date: "Wed", revenue: 5100, jobs: 7 },
  { date: "Thu", revenue: 4600, jobs: 6 },
  { date: "Fri", revenue: 8450, jobs: 12 }, // Today
  { date: "Sat", revenue: 6200, jobs: 8 },
  { date: "Sun", revenue: 2100, jobs: 3 },
],
deviceBreakdown: [
  { name: "Phones", value: 65, color: "#10b981" }, // Emerald
  { name: "Computers", value: 25, color: "#3b82f6" }, // Blue
  { name: "Tablets", value: 10, color: "#f59e0b" }, // Amber
],
    attentionItems: [
      {
        id: "att1",
        title: "3 jobs waiting more than 24 hours",
        description: "Long-running jobs",
        severity: "warning",
      },
      {
        id: "att2",
        title: "2 jobs have no technician assigned",
        description: "Need technician assignment",
        severity: "critical",
      },
      {
        id: "att3",
        title: "1 completed job has an unpaid balance",
        description: "Payment required",
        severity: "warning",
      },
    ],
    recentJobs: [
      { id: "j1", jobNumber: 1042, customerName: "Fikru Alemu", deviceName: "iPhone 12", status: "IN_PROGRESS", updatedAt: "10 min ago" },
      { id: "j2", jobNumber: 1041, customerName: "Bethelhem T.", deviceName: "Dell Latitude", status: "WAITING", updatedAt: "35 min ago" },
      { id: "j3", jobNumber: 1040, customerName: "Kebede W.", deviceName: "Samsung A14", status: "COMPLETED", updatedAt: "1 hr ago" },
      { id: "j4", jobNumber: 1039, customerName: "Hanna M.", deviceName: "HP Pavilion", status: "READY_FOR_PICKUP", updatedAt: "2 hr ago" },
      { id: "j5", jobNumber: 1038, customerName: "Robel S.", deviceName: "iPhone 13", status: "NEW", updatedAt: "3 hr ago" },
    ],
    technicianActivity: [
      {
        technicianId: "t1",
        technicianName: "Dawit A.",
        role: "Phone Technician",
        activeJobs: 3,
        completedToday: 2,
        activeJobsList: [
          { jobNumber: 1042, deviceName: "iPhone 12", status: "IN_PROGRESS" },
          { jobNumber: 1037, deviceName: "Samsung A14", status: "WAITING" },
          { jobNumber: 1031, deviceName: "iPhone 11", status: "IN_PROGRESS" },
        ],
      },
      {
        technicianId: "t2",
        technicianName: "Selam G.",
        role: "Computer Technician",
        activeJobs: 2,
        completedToday: 3,
        activeJobsList: [
          { jobNumber: 1035, deviceName: "Dell Latitude", status: "IN_PROGRESS" },
          { jobNumber: 1033, deviceName: "HP Pavilion", status: "WAITING" },
        ],
      },
      {
        technicianId: "t3",
        technicianName: "Yonas B.",
        role: "Phone Technician",
        activeJobs: 1,
        completedToday: 4,
        activeJobsList: [
          { jobNumber: 1030, deviceName: "iPhone 13", status: "IN_PROGRESS" },
        ],
      },
    ],
    recentActivity: [
      { id: "a1", message: "Job #1042 moved to In Progress", actorName: "Dawit A.", createdAt: "10 min ago" },
      { id: "a2", message: "Payment recorded — 1,200 ETB", actorName: "Meron K. (Cashier)", createdAt: "22 min ago" },
      { id: "a3", message: "Job #1041 moved to Waiting", actorName: "Selam G.", createdAt: "35 min ago" },
      { id: "a4", message: "Job #1040 completed", actorName: "Yonas B.", createdAt: "1 hr ago" },
    ],
  }
}