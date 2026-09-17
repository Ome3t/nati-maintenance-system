import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    todaySalesAgg,
    todayJobsCount,
    activeJobsCount,
    longRunningJobs,
    unassignedJobs,
    unpaidCompletedJobs,
    recentJobs,
    technicians,
    recentActivity,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: { createdAt: { gte: today } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.job.count({ where: { createdAt: { gte: today } } }),
    prisma.job.count({
      where: {
        status: {
          in: ["ASSIGNED", "IN_PROGRESS", "WAITING_FOR_PARTS", "READY_FOR_PICKUP"],
        },
      },
    }),
    prisma.job.count({
      where: {
        status: { in: ["ASSIGNED", "IN_PROGRESS", "WAITING_FOR_PARTS"] },
        createdAt: { lt: twentyFourHoursAgo },
      },
    }),
    prisma.job.count({
      where: {
        technicianId: null,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
    }),
    prisma.job.count({
      where: {
        status: "COMPLETED",
        paymentStatus: { not: "PAID" },
      },
    }),
    prisma.job.findMany({
      include: { customer: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.user.findMany({
      where: { role: "TECHNICIAN" },
      include: {
        technicianJobs: {
          select: { status: true },
        },
      },
      take: 5,
    }),
    prisma.job.findMany({
      include: { customer: true, technician: true },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
  ]);

  const todayRevenue = Number(todaySalesAgg._sum.total || 0);
  const todayPayments = todaySalesAgg._count;
  const needsAttention = longRunningJobs + unassignedJobs + unpaidCompletedJobs;

  const statusStyle = (status: string) => {
    const styles: Record<string, { dot: string; label: string }> = {
      IN_PROGRESS: { dot: "bg-blue-500", label: "In progress" },
      WAITING_FOR_PARTS: { dot: "bg-amber-500", label: "Waiting" },
      COMPLETED: { dot: "bg-green-500", label: "Completed" },
      READY_FOR_PICKUP: { dot: "bg-purple-500", label: "Ready for pickup" },
      PENDING: { dot: "bg-slate-400", label: "New" },
      ASSIGNED: { dot: "bg-cyan-500", label: "Assigned" },
      CANCELLED: { dot: "bg-red-500", label: "Cancelled" },
    };
    return styles[status] || { dot: "bg-slate-400", label: status };
  };

  const timeAgo = (date: Date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  const attentionItems = [
    longRunningJobs > 0 && {
      color: "bg-amber-500",
      title: `${longRunningJobs} job${longRunningJobs > 1 ? "s" : ""} waiting more than 24 hours`,
      subtitle: "Long-running jobs",
      href: "/jobs",
    },
    unassignedJobs > 0 && {
      color: "bg-red-500",
      title: `${unassignedJobs} job${unassignedJobs > 1 ? "s" : ""} ${unassignedJobs > 1 ? "have" : "has"} no technician assigned`,
      subtitle: "Need technician assignment",
      href: "/jobs",
    },
    unpaidCompletedJobs > 0 && {
      color: "bg-amber-500",
      title: `${unpaidCompletedJobs} completed job${unpaidCompletedJobs > 1 ? "s have" : " has"} an unpaid balance`,
      subtitle: "Payment required",
      href: "/payments",
    },
  ].filter(Boolean) as {
    color: string;
    title: string;
    subtitle: string;
    href: string;
  }[];

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Today's revenue
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {todayRevenue.toLocaleString()} ETB
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {todayPayments} payment{todayPayments !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Today's jobs
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{todayJobsCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Active jobs
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{activeJobsCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Needs attention
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{needsAttention}</p>
        </div>
      </div>

      {/* Needs Attention */}
      {attentionItems.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Needs attention</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {attentionItems.map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className={`w-2 h-2 rounded-full ${item.color} mt-1.5 flex-shrink-0`}></span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.subtitle}</p>
                  </div>
                </div>
                <span className="text-slate-400 text-lg">›</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Jobs */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Recent jobs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Job #
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Customer
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Device
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {recentJobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500">
                    No jobs yet. Create your first job from the Jobs page.
                  </td>
                </tr>
              ) : (
                recentJobs.map((job) => {
                  const s = statusStyle(job.status);
                  return (
                    <tr
                      key={job.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-900">
                        #{job.jobNumber.replace(/^JOB-?/, "")}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-700">
                        {job.customer.name}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-700">
                        {job.deviceType} {job.deviceModel || ""}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-2 text-sm text-slate-700">
                          <span className={`w-2 h-2 rounded-full ${s.dot}`}></span>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-xs text-slate-500">
                        {timeAgo(job.updatedAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Technician Activity */}
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">
              Technician activity
            </h2>
          </div>
          <div className="p-3">
            {technicians.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">
                No technicians yet
              </p>
            ) : (
              technicians.map((tech) => {
                const active = tech.technicianJobs.filter((j) =>
                  ["IN_PROGRESS", "ASSIGNED", "WAITING_FOR_PARTS"].includes(j.status)
                ).length;
                const completed = tech.technicianJobs.filter(
                  (j) => j.status === "COMPLETED"
                ).length;
                return (
                  <div
                    key={tech.id}
                    className="flex items-center justify-between px-2 py-3 hover:bg-slate-50 rounded transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-slate-600">
                          {tech.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-slate-700">
                        {tech.name}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {active} active, {completed} completed
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Recent activity</h2>
          </div>
          <div className="p-3 space-y-1">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">
                No activity yet
              </p>
            ) : (
              recentActivity.map((job) => {
                const s = statusStyle(job.status);
                return (
                  <div
                    key={job.id}
                    className="flex items-start justify-between px-2 py-3 hover:bg-slate-50 rounded transition-colors"
                  >
                    <div>
                      <p className="text-sm text-slate-700">
                        Job #{job.jobNumber.replace(/^JOB-?/, "")} moved to{" "}
                        {s.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {job.technician?.name || "Unassigned"}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap ml-3">
                      {timeAgo(job.updatedAt)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}