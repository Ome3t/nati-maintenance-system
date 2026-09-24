"use server"

import { prisma } from "@/lib/prisma"

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

export async function getReportData(range: string): Promise<any> {
  const now = new Date()
  let startDate: Date
  switch (range) {
    case "TODAY":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case "WEEK":
      startDate = new Date(now.getTime() - 7 * 86400000)
      break
    case "YEAR":
      startDate = new Date(now.getFullYear(), 0, 1)
      break
    default: // MONTH
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  }

  const [
    salesAgg,
    paymentsAgg,
    jobsAll,
    completedCount,
    topJobsRaw,
    deviceGroups,
    techRows,
    repairRows,
    salesStream,
    paymentsStream,
  ] = await Promise.all([
    prisma.sale.aggregate({ where: { createdAt: { gte: startDate } }, _sum: { total: true } }),
    prisma.payment.aggregate({ where: { createdAt: { gte: startDate }, jobId: { not: null } }, _sum: { amount: true } }),
    prisma.job.findMany({ where: { createdAt: { gte: startDate } } }),
    prisma.job.count({ where: { createdAt: { gte: startDate }, status: { in: ["COMPLETED", "DELIVERED"] } } }),
    prisma.job.findMany({
      where: { createdAt: { gte: startDate } },
      orderBy: { total: "desc" },
      take: 5,
      include: { customer: { select: { name: true } } },
    }),
    prisma.job.groupBy({
      by: ["deviceType"],
      where: { createdAt: { gte: startDate } },
      _count: { _all: true },
    }),
    prisma.user.findMany({
      where: { role: { in: ["TECHNICIAN", "OWNER"] }, isActive: true },
      include: {
        technicianJobs: {
          where: { createdAt: { gte: startDate }, status: { in: ["COMPLETED", "DELIVERED"] } },
          select: { total: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.job.findMany({
      where: { createdAt: { gte: startDate }, startedAt: { not: null }, completedAt: { not: null } },
      select: { startedAt: true, completedAt: true },
    }),
    prisma.sale.findMany({ where: { createdAt: { gte: startDate } }, select: { createdAt: true, total: true } }),
    prisma.payment.findMany({ where: { createdAt: { gte: startDate }, jobId: { not: null } }, select: { createdAt: true, amount: true } }),
  ])

  // Combined revenue = product sales + job payments
  const totalRevenue = Number(salesAgg._sum.total || 0) + Number(paymentsAgg._sum.amount || 0)
  const totalJobs = jobsAll.length
  const completionRate = totalJobs > 0 ? Math.round((completedCount / totalJobs) * 100) : 0

  const validRepairs = repairRows.filter((j) => j.startedAt && j.completedAt)
  const avgRepairTime = validRepairs.length > 0
    ? Math.round(
        validRepairs.reduce((sum, j) => sum + (j.completedAt!.getTime() - j.startedAt!.getTime()) / 3600000, 0) /
          validRepairs.length
      )
    : 0

  // Revenue trend bucketed by day in JS (2 queries total, very fast)
  const bucket = new Map<string, number>()
  salesStream.forEach((s) => {
    const k = dayKey(s.createdAt)
    bucket.set(k, (bucket.get(k) || 0) + Number(s.total))
  })
  paymentsStream.forEach((p) => {
    const k = dayKey(p.createdAt)
    bucket.set(k, (bucket.get(k) || 0) + Number(p.amount))
  })

  const revenueTrend: any[] = []
  for (let t = startDate.getTime(); t <= now.getTime(); t += 86400000) {
    const k = dayKey(new Date(t))
    const revenue = bucket.get(k) || 0
    revenueTrend.push({ date: k, revenue, value: revenue })
  }

  // Device breakdown with every alias the chart component might read
  const deviceBreakdown = deviceGroups.map((g: any) => {
    const count = typeof g._count === "number" ? g._count : (g._count?._all ?? 0)
    return {
      deviceType: g.deviceType,
      name: g.deviceType,
      label: g.deviceType,
      device: g.deviceType,
      count,
      value: count,
      jobs: count,
    }
  })

  // Technician performance with every alias the chart component might read
  const technicianPerformance = techRows.map((t: any) => {
    const completedJobs = t.technicianJobs.length
    const revenue = t.technicianJobs.reduce((s: number, j: any) => s + Number(j.total), 0)
    return {
      id: t.id,
      name: t.name,
      technicianName: t.name,
      technician: t.name,
      completedJobs,
      jobs: completedJobs,
      value: completedJobs,
      revenue,
      totalRevenue: revenue,
    }
  })

  const topJobs = topJobsRaw.map((j) => ({
    id: j.id,
    jobNumber: j.jobNumber,
    device: `${j.deviceType} ${j.deviceModel || ""}`.trim(),
    deviceName: `${j.deviceType} ${j.deviceModel || ""}`.trim(),
    customer: j.customer?.name || "Walk-in",
    customerName: j.customer?.name || "Walk-in",
    revenue: Number(j.total),
    total: Number(j.total),
    status: j.status,
  }))

  return {
    summary: { totalRevenue, totalJobs, avgRepairTime, completionRate },
    revenueTrend,
    deviceBreakdown,
    technicianPerformance,
    topJobs,
  }
}