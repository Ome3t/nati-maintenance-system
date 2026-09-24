"use server"

import { prisma } from "@/lib/prisma"

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

export async function getCustomers(searchQuery?: string): Promise<any[]> {
  try {
    const where: any = {}

    if (searchQuery) {
      where.OR = [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { phone: { contains: searchQuery, mode: "insensitive" } },
        { email: { contains: searchQuery, mode: "insensitive" } },
      ]
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        jobs: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true, deviceType: true, deviceModel: true },
        },
        _count: { select: { jobs: true } },
      },
      orderBy: { name: "asc" },
      take: 100,
    })

    return customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone || "N/A",
      email: customer.email || "N/A",
      totalJobs: customer._count.jobs,
      lastServiceDate: customer.jobs[0]?.createdAt ? fmtDate(customer.jobs[0].createdAt) : "N/A",
      lastServiceDevice: customer.jobs[0]
        ? `${customer.jobs[0].deviceType} ${customer.jobs[0].deviceModel || ""}`.trim()
        : "N/A",
    }))
  } catch (error) {
    console.error("Error fetching customers:", error)
    return []
  }
}

export async function getCustomerDetail(customerId: string): Promise<any | null> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        // Capped lists keep the payload small → drawer opens fast
        jobs: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            technician: { select: { name: true } },
            items: { select: { name: true, quantity: true, unitCost: true, total: true } },
          },
        },
        sales: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            cashier: { select: { name: true } },
            items: { include: { product: { select: { name: true } } } },
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { receivedBy: { select: { name: true } } },
        },
      },
    })

    if (!customer) return null

    const totalSpent =
      customer.jobs.reduce((sum, job) => sum + Number(job.paidAmount), 0) +
      customer.sales.reduce((sum, sale) => sum + Number(sale.paidAmount), 0)

    const lastJob = customer.jobs[0]

    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone || "N/A",
      email: customer.email || "N/A",
      address: customer.address || "N/A",
      notes: customer.notes || "",
      // ✅ FIXED: use 
      totalJobs: customer.jobs.length,
      totalSpent,
      joinDate: customer.createdAt.toISOString(),
      lastServiceDate: lastJob ? fmtDate(lastJob.createdAt) : "N/A",
      lastServiceDevice: lastJob ? `${lastJob.deviceType} ${lastJob.deviceModel || ""}`.trim() : "N/A",

      jobs: customer.jobs.map((job) => ({
        id: job.id,
        jobNumber: job.jobNumber,
        deviceType: job.deviceType,
        deviceModel: job.deviceModel || "N/A",
        deviceName: `${job.deviceType} ${job.deviceModel || ""}`.trim(),
        problem: job.problem,
        reportedProblem: job.problem,
        status: job.status,
        paymentStatus: job.paymentStatus || "UNPAID",
        totalCost: Number(job.total),
        total: Number(job.total),
        paidAmount: Number(job.paidAmount),
        remainingAmount: Number(job.remainingAmount),
        createdAt: job.createdAt.toISOString(),
        technician: job.technician?.name || "Unassigned",
        items: job.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitCost: Number(item.unitCost),
          total: Number(item.total),
        })),
      })),

      sales: customer.sales.map((sale) => ({
        id: sale.id,
        invoiceNumber: sale.invoiceNumber,
        totalCost: Number(sale.total),
        total: Number(sale.total),
        paidAmount: Number(sale.paidAmount),
        remainingAmount: Number(sale.remainingAmount),
        createdAt: sale.createdAt.toISOString(),
        cashier: sale.cashier?.name || "Unknown",
        items: sale.items.map((item) => ({
          productName: item.product?.name || "Item",
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          total: Number(item.total),
        })),
      })),

      payments: customer.payments.map((payment) => ({
        id: payment.id,
        paymentNumber: payment.paymentNumber,
        amount: Number(payment.amount),
        method: payment.method,
        createdAt: payment.createdAt.toISOString(),
        receivedBy: payment.receivedBy?.name || "Unknown",
      })),
    }
  } catch (error) {
    console.error("Error fetching customer detail:", error)
    return null
  }
}