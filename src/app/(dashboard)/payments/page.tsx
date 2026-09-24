import { prisma } from "@/lib/prisma";

export default async function ReportsPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    todaySales,
    monthSales,
    totalSales,
    todayJobPayments,
    monthJobPayments,
    totalJobPayments,
    todayJobs,
    monthJobs,
    completedJobs,
    pendingJobs,
    totalExpenses,
    monthExpenses,
    totalPayments,
    outstanding,
    topProducts,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: { createdAt: { gte: today } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: { createdAt: { gte: monthStart } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.sale.aggregate({ _sum: { total: true }, _count: true }),
    // Job payments today
    prisma.payment.aggregate({
      where: { 
        createdAt: { gte: today },
        jobId: { not: null }
      },
      _sum: { amount: true },
    }),
    // Job payments this month
    prisma.payment.aggregate({
      where: { 
        createdAt: { gte: monthStart },
        jobId: { not: null }
      },
      _sum: { amount: true },
    }),
    // All job payments
    prisma.payment.aggregate({
      where: { jobId: { not: null } },
      _sum: { amount: true },
    }),
    prisma.job.count({ where: { createdAt: { gte: today } } }),
    prisma.job.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.job.count({ where: { status: "COMPLETED" } }),
    prisma.job.count({
      where: { status: { in: ["PENDING", "ASSIGNED", "IN_PROGRESS", "WAITING_FOR_PARTS", "READY_FOR_PICKUP"] } },
    }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.expense.aggregate({
      where: { date: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.job.aggregate({
      where: { paymentStatus: { not: "PAID" } },
      _sum: { remainingAmount: true },
    }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  const productIds = topProducts.map((p) => p.productId);
  const productDetails = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  // Calculate combined revenue (product sales + job payments)
  const todayProductRevenue = Number(todaySales._sum.total || 0);
  const todayJobRevenue = Number(todayJobPayments._sum.amount || 0);
  const todayRevenue = todayProductRevenue + todayJobRevenue;

  const monthProductRevenue = Number(monthSales._sum.total || 0);
  const monthJobRevenue = Number(monthJobPayments._sum.amount || 0);
  const monthRevenue = monthProductRevenue + monthJobRevenue;

  const totalProductRevenue = Number(totalSales._sum.total || 0);
  const totalJobRevenue = Number(totalJobPayments._sum.amount || 0);
  const totalRevenue = totalProductRevenue + totalJobRevenue;

  const totalCosts = Number(totalExpenses._sum.amount || 0);
  const monthCosts = Number(monthExpenses._sum.amount || 0);
  const profit = totalRevenue - totalCosts;
  const outstandingAmount = Number(outstanding._sum.remainingAmount || 0);

  const cards = [
    { label: "Today's Revenue", value: `${todayRevenue.toLocaleString()} ETB`, subtitle: `${todaySales._count} sales + job payments` },
    { label: "This Month", value: `${monthRevenue.toLocaleString()} ETB`, subtitle: `${monthSales._count} sales + job payments` },
    { label: "Total Revenue", value: `${totalRevenue.toLocaleString()} ETB`, subtitle: `Product: ${totalProductRevenue.toLocaleString()} | Jobs: ${totalJobRevenue.toLocaleString()}` },
    { label: "Total Payments", value: `${Number(totalPayments._sum.amount || 0).toLocaleString()} ETB`, subtitle: "All time" },
    { label: "Today's Jobs", value: todayJobs.toString(), subtitle: "Created today" },
    { label: "This Month Jobs", value: monthJobs.toString(), subtitle: "Created this month" },
    { label: "Completed Jobs", value: completedJobs.toString(), subtitle: "All time" },
    { label: "Pending Jobs", value: pendingJobs.toString(), subtitle: "Active jobs" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Reports</h1>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg border border-slate-200 p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {card.label}
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{card.value}</p>
            <p className="text-xs text-slate-500 mt-1">{card.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Financial Summary */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Financial Summary</h2>
        </div>
        <div className="p-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-600">Product Sales Revenue</span>
              <span className="text-lg font-bold text-green-600">
                {totalProductRevenue.toLocaleString()} ETB
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-600">Job Payments Revenue</span>
              <span className="text-lg font-bold text-green-600">
                {totalJobRevenue.toLocaleString()} ETB
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-slate-200 bg-slate-50 px-3 rounded">
              <span className="text-sm font-semibold text-slate-900">Total Revenue</span>
              <span className="text-xl font-bold text-slate-900">
                {totalRevenue.toLocaleString()} ETB
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-slate-100">
              <span className="text-sm text-slate-600">Total Expenses</span>
              <span className="text-lg font-bold text-red-600">
                {totalCosts.toLocaleString()} ETB
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-slate-100">
              <span className="text-sm text-slate-600">This Month Expenses</span>
              <span className="text-base font-medium text-red-600">
                {monthCosts.toLocaleString()} ETB
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-t border-slate-200 bg-slate-50 px-3 rounded">
              <span className="text-sm font-semibold text-slate-900">Net Profit</span>
              <span className="text-2xl font-bold text-slate-900">
                {profit.toLocaleString()} ETB
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-600">Outstanding Balance</span>
              <span className="text-base font-bold text-amber-600">
                {outstandingAmount.toLocaleString()} ETB
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Top Selling Products</h2>
        </div>
        {topProducts.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No product sales yet</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Product
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Qty Sold
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((tp) => {
                const product = productDetails.find((p) => p.id === tp.productId);
                return (
                  <tr key={tp.productId} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-3.5 text-sm text-slate-900">
                      {product?.name || "Unknown"}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-700 text-right">
                      {tp._sum.quantity || 0}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-900 text-right">
                      {Number(tp._sum.total || 0).toLocaleString()} ETB
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}