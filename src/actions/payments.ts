"use server"

import { prisma } from "@/lib/prisma"

export async function getPayments(statusFilter: string = "ALL", searchQuery: string = ""): Promise<any[]> {
  try {
    const where: any = {}

    if (statusFilter !== "ALL") {
      if (statusFilter === "PAID") {
        where.OR = [
          { job: { paymentStatus: "PAID" } },
          { sale: { status: "PAID" } },
        ]
      } else if (statusFilter === "PARTIALLY_PAID") {
        where.OR = [
          { job: { paymentStatus: "PARTIALLY_PAID" } },
          { sale: { status: "PARTIALLY_PAID" } },
        ]
      } else if (statusFilter === "PENDING") {
        where.OR = [
          { job: { paymentStatus: "UNPAID" } },
          { sale: { status: "UNPAID" } },
        ]
      }
    }

    if (searchQuery) {
      where.OR = [
        { paymentNumber: { contains: searchQuery, mode: "insensitive" } },
        { job: { jobNumber: { contains: searchQuery, mode: "insensitive" } } },
        { job: { customer: { name: { contains: searchQuery, mode: "insensitive" } } } },
        { sale: { invoiceNumber: { contains: searchQuery, mode: "insensitive" } } },
        { sale: { customer: { name: { contains: searchQuery, mode: "insensitive" } } } },
      ]
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        job: {
          include: {
            customer: { select: { name: true } },
          },
        },
        sale: {
          include: {
            customer: { select: { name: true } },
          },
        },
        receivedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    })

    return payments.map((payment) => ({
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      jobNumber: payment.job?.jobNumber || payment.sale?.invoiceNumber || "N/A",
      customerName: payment.job?.customer?.name || payment.sale?.customer?.name || "Walk-in",
      amount: Number(payment.amount),
      paymentMethod: payment.method,
      paymentStatus: payment.job?.paymentStatus || payment.sale?.status || "PAID",
      recordedBy: payment.receivedBy?.name || "Unknown",
      paidAt: payment.createdAt.toISOString(),
    }))
  } catch (error) {
    console.error("Error fetching payments:", error)
    return []
  }
}

export async function getPaymentSummary() {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [totalRevenue, todayCollections, pendingPayments, avgTicketSize] = await Promise.all([
      Promise.all([
        prisma.sale.aggregate({
          where: { createdAt: { gte: monthStart } },
          _sum: { total: true },
        }),
        prisma.payment.aggregate({
          where: {
            createdAt: { gte: monthStart },
            jobId: { not: null },
          },
          _sum: { amount: true },
        }),
      ]).then(([sales, payments]) => Number(sales._sum.total || 0) + Number(payments._sum.amount || 0)),

      Promise.all([
        prisma.sale.aggregate({
          where: { createdAt: { gte: today } },
          _sum: { total: true },
        }),
        prisma.payment.aggregate({
          where: {
            createdAt: { gte: today },
            jobId: { not: null },
          },
          _sum: { amount: true },
        }),
      ]).then(([sales, payments]) => Number(sales._sum.total || 0) + Number(payments._sum.amount || 0)),

      prisma.job.count({
        where: { paymentStatus: { not: "PAID" } },
      }),

      prisma.payment.aggregate({
        _avg: { amount: true },
      }),
    ])

    return {
      totalRevenue,
      todayCollections,
      pendingPayments,
      averageTicketSize: Math.round(Number(avgTicketSize._avg.amount || 0)),
    }
  } catch (error) {
    console.error("Error fetching payment summary:", error)
    return {
      totalRevenue: 0,
      todayCollections: 0,
      pendingPayments: 0,
      averageTicketSize: 0,
    }
  }
}

export async function getPaymentDetail(paymentId: string): Promise<any | null> {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        job: {
          include: {
            customer: true,
            technician: { select: { name: true } },
            items: true,
          },
        },
        sale: {
          include: {
            customer: true,
            cashier: { select: { name: true } },
            items: {
              include: { product: true },
            },
          },
        },
        receivedBy: { select: { name: true } },
      },
    })

    if (!payment) return null

    const job = payment.job
    const sale = payment.sale

    // Job details with BOTH naming styles so any UI component finds what it needs
    const jobDetails = job
      ? {
          id: job.id,
          jobNumber: job.jobNumber,
          deviceType: job.deviceType,
          deviceModel: job.deviceModel || "N/A",
          deviceName: `${job.deviceType} ${job.deviceModel || ""}`.trim(),
          problem: job.problem,
          reportedProblem: job.problem,
          diagnosis: job.diagnosis || "N/A",
          status: job.status,
          paymentStatus: job.paymentStatus || "UNPAID",
          technician: job.technician?.name || "Unassigned",
          customerName: job.customer?.name || "Walk-in",
          customerPhone: job.customer?.phone || "N/A",
          items: job.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitCost: Number(item.unitCost),
            total: Number(item.total),
          })),
          laborCharge: Number(job.laborCharge),
          partsCharge: Number(job.partsCharge),
          total: Number(job.total),
          totalCost: Number(job.total), // ✅ alias used by PaymentDetailDrawer
          paidAmount: Number(job.paidAmount),
          remainingAmount: Number(job.remainingAmount),
          remainingBalance: Number(job.remainingAmount), // ✅ alias used by PaymentDetailDrawer
        }
      : null

    // Sale details with BOTH naming styles
    const saleDetails = sale
      ? {
          id: sale.id,
          invoiceNumber: sale.invoiceNumber,
          customerName: sale.customer?.name || "Walk-in",
          cashier: sale.cashier?.name || "Unknown",
          items: sale.items.map((item) => ({
            productName: item.product?.name || "Item",
            name: item.product?.name || "Item",
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            total: Number(item.total),
          })),
          subtotal: Number(sale.subtotal),
          total: Number(sale.total),
          totalCost: Number(sale.total), // ✅ alias
          paidAmount: Number(sale.paidAmount),
          remainingAmount: Number(sale.remainingAmount),
          remainingBalance: Number(sale.remainingAmount), // ✅ alias
        }
      : null

    return {
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      jobNumber: job?.jobNumber || sale?.invoiceNumber || "N/A",
      customerName: job?.customer?.name || sale?.customer?.name || "Walk-in",
      customerPhone: job?.customer?.phone || sale?.customer?.phone || "N/A",
      amount: Number(payment.amount),
      paymentMethod: payment.method,
      paymentStatus: job?.paymentStatus || sale?.status || "PAID",
      recordedBy: payment.receivedBy?.name || "Unknown",
      paidAt: payment.createdAt.toISOString(),
      jobDetails,
      saleDetails,
    }
  } catch (error) {
    console.error("Error fetching payment detail:", error)
    return null
  }
}