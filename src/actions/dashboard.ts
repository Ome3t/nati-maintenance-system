"use server"

import { prisma } from "@/lib/prisma"

export async function getManagerDashboardData(): Promise<any> {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      todaySalesAgg,
      todayPaymentsCount,
      todayJobPaymentsAgg,
      activeJobs,
      todayJobs,
      needsAttentionJobs,
      recentJobsRaw,
      technicianWorkloadRaw,
      recentActivityRaw,
      revenueTrendRaw,
      jobPaymentTrendRaw,
    ] = await Promise.all([
      prisma.sale.aggregate({
        where: { createdAt: { gte: today } },
        _sum: { total: true },
      }),
      prisma.payment.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.payment.aggregate({
        where: {
          createdAt: { gte: today },
          jobId: { not: null },
        },
        _sum: { amount: true },
      }),
      prisma.job.count({
        where: {
          status: { in: ["IN_PROGRESS", "WAITING_FOR_PARTS", "ASSIGNED", "READY_FOR_PICKUP"] },
        },
      }),
      prisma.job.count({ where: { createdAt: { gte: today } } }),
      prisma.job.count({
        where: { status: { in: ["READY_FOR_PICKUP", "WAITING_FOR_PARTS"] } },
      }),
      prisma.job.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { name: true } },
        },
      }),
      prisma.user.findMany({
        where: { role: { in: ["TECHNICIAN", "OWNER"] }, isActive: true },
        include: {
          technicianJobs: {
            where: {
              status: { in: ["IN_PROGRESS", "WAITING_FOR_PARTS", "READY_FOR_PICKUP", "ASSIGNED"] },
            },
            include: {
              customer: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true } },
        },
      }),
      prisma.sale.findMany({
        where: { createdAt: { gte: weekAgo } },
        select: { createdAt: true, total: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.payment.findMany({
        where: {
          createdAt: { gte: weekAgo },
          jobId: { not: null },
        },
        select: { createdAt: true, amount: true },
        orderBy: { createdAt: "asc" },
      }),
    ])

    const recentJobs = recentJobsRaw.map((job) => ({
      id: job.id,
      jobNumber: job.jobNumber,
      customerName: job.customer?.name || "Walk-in",
      deviceName: `${job.deviceType} ${job.deviceModel || ""}`.trim(),
      status: job.status,
      createdAt: job.createdAt.toISOString(),
    }))

    const technicianActivity = technicianWorkloadRaw.map((tech) => ({
      technicianId: tech.id,
      technicianName: tech.name,
      activeJobs: tech.technicianJobs.length,
      activeJobsList: tech.technicianJobs.map((job) => ({
        id: job.id,
        jobNumber: job.jobNumber,
        deviceName: `${job.deviceType} ${job.deviceModel || ""}`.trim(),
        status: job.status,
        customerName: job.customer?.name || "Walk-in",
        priority: job.priority,
      })),
    }))

    const recentActivity = recentActivityRaw.map((log) => ({
      id: log.id,
      message: log.action,
      actorName: log.user.name,
      createdAt: log.createdAt.toISOString(),
      module: log.module,
    }))

    // ✅ FIXED: always emit a full 7-day series (zero-filled) so the chart
    // renders even when the database only has one day of data
    const revenueByDay = new Map<string, number>()
    for (let i = 6; i >= 0; i--) {
      const dayKey = new Date(now.getTime() - i * 86400000).toISOString().split("T")[0]
      revenueByDay.set(dayKey, 0)
    }
    revenueTrendRaw.forEach((sale) => {
      const dayKey = sale.createdAt.toISOString().split("T")[0]
      if (revenueByDay.has(dayKey)) {
        revenueByDay.set(dayKey, (revenueByDay.get(dayKey) || 0) + Number(sale.total))
      }
    })
    jobPaymentTrendRaw.forEach((payment) => {
      const dayKey = payment.createdAt.toISOString().split("T")[0]
      if (revenueByDay.has(dayKey)) {
        revenueByDay.set(dayKey, (revenueByDay.get(dayKey) || 0) + Number(payment.amount))
      }
    })

    const revenueTrend = Array.from(revenueByDay.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const productSalesToday = Number(todaySalesAgg._sum.total || 0)
    const jobPaymentsToday = Number(todayJobPaymentsAgg._sum.amount || 0)
    const totalRevenueToday = productSalesToday + jobPaymentsToday

    return {
      summary: {
        todayRevenue: totalRevenueToday,
        todayPaymentCount: todayPaymentsCount,
        activeJobs,
        todayJobs,
        needsAttentionCount: needsAttentionJobs,
      },
      attentionItems: [],
      recentJobs,
      technicianActivity,
      recentActivity,
      revenueTrend,
    }
  } catch (error) {
    console.error("Dashboard data fetch error:", error)
    throw new Error("Failed to load dashboard data")
  }
}