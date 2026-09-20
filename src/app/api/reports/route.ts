import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "daily";
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const now = new Date();
  let startDate: Date;
  let endDate: Date = new Date();
  let groupBy: "hour" | "day" | "month" = "day";

  if (fromParam && toParam) {
    startDate = new Date(fromParam);
    endDate = new Date(toParam);
    endDate.setHours(23, 59, 59, 999);
    groupBy = "day";
  } else {
    switch (period) {
      case "daily":
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        groupBy = "hour";
        break;
      case "weekly":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        groupBy = "day";
        break;
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        groupBy = "day";
        break;
      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1);
        groupBy = "month";
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        groupBy = "day";
    }
  }

  const [sales, jobs, payments, expenses] = await Promise.all([
    prisma.sale.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true, total: true, paidAmount: true, status: true },
    }),
    prisma.job.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true, total: true, status: true, paidAmount: true },
    }),
    prisma.payment.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true, amount: true, method: true },
    }),
    prisma.expense.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      select: { date: true, amount: true, category: true },
    }),
  ]);

  const chartMap: Record<string, { label: string; revenue: number; sales: number; jobs: number; expenses: number }> = {};

  const getKey = (date: Date) => {
    const d = new Date(date);
    if (groupBy === "hour") {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:00`;
    }
    if (groupBy === "day") {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  const formatLabel = (key: string) => {
    if (groupBy === "hour") {
      const hour = key.split(" ")[1];
      return hour;
    }
    if (groupBy === "month") {
      const [y, m] = key.split("-");
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[parseInt(m) - 1]} ${y.slice(2)}`;
    }
    const [y, m, d] = key.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${parseInt(d)} ${months[parseInt(m) - 1]}`;
  };

  const ensure = (key: string) => {
    if (!chartMap[key]) {
      chartMap[key] = { label: formatLabel(key), revenue: 0, sales: 0, jobs: 0, expenses: 0 };
    }
    return chartMap[key];
  };

  sales.forEach((s) => {
    const entry = ensure(getKey(s.createdAt));
    entry.revenue += Number(s.total);
    entry.sales += 1;
  });

  jobs.forEach((j) => {
    const entry = ensure(getKey(j.createdAt));
    entry.jobs += 1;
  });

  expenses.forEach((e) => {
    const entry = ensure(getKey(e.date));
    entry.expenses += Number(e.amount);
  });

  const chartData = Object.keys(chartMap)
    .sort()
    .map((k) => chartMap[k]);

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total), 0);
  const totalJobs = jobs.length;
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const profit = totalRevenue - totalExpenses;

  const methodTotals: Record<string, number> = {};
  payments.forEach((p) => {
    methodTotals[p.method] = (methodTotals[p.method] || 0) + Number(p.amount);
  });
  const paymentMethods = Object.entries(methodTotals).map(([method, amount]) => ({
    method: method.replace(/_/g, " "),
    amount,
  }));

  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount);
  });
  const expenseCategories = Object.entries(categoryTotals).map(([category, amount]) => ({
    category,
    amount,
  }));

  const jobStatusTotals: Record<string, number> = {};
  jobs.forEach((j) => {
    jobStatusTotals[j.status] = (jobStatusTotals[j.status] || 0) + 1;
  });
  const jobStatuses = Object.entries(jobStatusTotals).map(([status, count]) => ({
    status: status.replace(/_/g, " "),
    count,
  }));

  const topProductsRaw = await prisma.saleItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true, total: true },
    where: {
      sale: { createdAt: { gte: startDate, lte: endDate } },
    },
    orderBy: { _sum: { total: "desc" } },
    take: 5,
  });

  const productIds = topProductsRaw.map((p) => p.productId);
  const productDetails = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, sku: true },
  });

  const topProducts = topProductsRaw.map((p) => {
    const product = productDetails.find((pr) => pr.id === p.productId);
    return {
      name: product?.name || "Unknown",
      sku: product?.sku || "",
      quantity: p._sum.quantity || 0,
      revenue: Number(p._sum.total || 0),
    };
  });

  return NextResponse.json({
    summary: {
      totalRevenue,
      totalJobs,
      totalExpenses,
      totalPayments,
      profit,
      salesCount: sales.length,
    },
    chartData,
    paymentMethods,
    expenseCategories,
    jobStatuses,
    topProducts,
    range: {
      from: startDate.toISOString(),
      to: endDate.toISOString(),
      period,
      groupBy,
    },
  });
}