"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Download, FileSpreadsheet, FileText, TrendingUp, TrendingDown, DollarSign, Wrench, Receipt } from "lucide-react";

const COLORS = ["#0f172a", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function ReportsPage() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly" | "custom">("weekly");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  useEffect(() => {
    fetchReport();
  }, [period]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = `/api/reports?period=${period}`;
      if (period === "custom" && customFrom && customTo) {
        url += `&from=${customFrom}&to=${customTo}`;
      }
      const res = await fetch(url);
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomRange = () => {
    if (customFrom && customTo) {
      fetchReport();
    }
  };

  const exportCSV = () => {
    if (!data) return;
    const rows: any[] = [];

    rows.push(["NATI MAINTENANCE - REPORT"]);
    rows.push([`Period: ${period}`]);
    rows.push([`From: ${new Date(data.range.from).toLocaleDateString()}`]);
    rows.push([`To: ${new Date(data.range.to).toLocaleDateString()}`]);
    rows.push([]);

    rows.push(["SUMMARY"]);
    rows.push(["Total Revenue", data.summary.totalRevenue]);
    rows.push(["Total Payments", data.summary.totalPayments]);
    rows.push(["Total Jobs", data.summary.totalJobs]);
    rows.push(["Total Sales", data.summary.salesCount]);
    rows.push(["Total Expenses", data.summary.totalExpenses]);
    rows.push(["Net Profit", data.summary.profit]);
    rows.push([]);

    rows.push(["CHART DATA"]);
    rows.push(["Period", "Revenue", "Sales", "Jobs", "Expenses"]);
    data.chartData.forEach((d: any) => {
      rows.push([d.label, d.revenue, d.sales, d.jobs, d.expenses]);
    });
    rows.push([]);

    rows.push(["PAYMENT METHODS"]);
    rows.push(["Method", "Amount"]);
    data.paymentMethods.forEach((p: any) => {
      rows.push([p.method, p.amount]);
    });
    rows.push([]);

    rows.push(["EXPENSE CATEGORIES"]);
    rows.push(["Category", "Amount"]);
    data.expenseCategories.forEach((e: any) => {
      rows.push([e.category, e.amount]);
    });
    rows.push([]);

    rows.push(["JOB STATUS"]);
    rows.push(["Status", "Count"]);
    data.jobStatuses.forEach((j: any) => {
      rows.push([j.status, j.count]);
    });
    rows.push([]);

    rows.push(["TOP PRODUCTS"]);
    rows.push(["Product", "SKU", "Quantity", "Revenue"]);
    data.topProducts.forEach((p: any) => {
      rows.push([p.name, p.sku, p.quantity, p.revenue]);
    });

    const csvContent = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nati-report-${period}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    window.print();
  };

  if (loading || !data) {
    return <div className="text-center py-12 text-slate-500 text-sm">Loading report...</div>;
  }

  const { summary, chartData, paymentMethods, expenseCategories, jobStatuses, topProducts } = data;

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500 mt-1">
            Business analytics and financial reports
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm rounded-md hover:bg-slate-50 flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel (CSV)
          </button>
          <button
            onClick={exportPDF}
            className="px-4 py-2 bg-slate-900 text-white text-sm rounded-md hover:bg-slate-800 flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center border-b pb-4">
        <h1 className="text-2xl font-bold">NATI MAINTENANCE</h1>
        <p className="text-sm text-slate-600 mt-1">Business Report</p>
        <p className="text-xs text-slate-500 mt-1">
          {new Date(data.range.from).toLocaleDateString()} — {new Date(data.range.to).toLocaleDateString()}
        </p>
      </div>

      {/* Period Filter */}
      <div className="bg-white rounded-lg border border-slate-200 p-1 flex gap-1 print:hidden overflow-x-auto">
        {[
          { key: "daily", label: "Today" },
          { key: "weekly", label: "This Week" },
          { key: "monthly", label: "This Month" },
          { key: "yearly", label: "This Year" },
          { key: "custom", label: "Custom Range" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setPeriod(tab.key as any)}
            className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
              period === tab.key
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Custom Range */}
      {period === "custom" && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-end gap-3 print:hidden">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">From</label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">To</label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <button
            onClick={handleCustomRange}
            className="px-5 py-2 bg-slate-900 text-white text-sm rounded-md hover:bg-slate-800"
          >
            Apply
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Total Revenue
            </p>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {summary.totalRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">ETB</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Net Profit
            </p>
            {summary.profit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </div>
          <p className={`text-2xl font-bold ${summary.profit >= 0 ? "text-slate-900" : "text-red-600"}`}>
            {summary.profit.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">ETB</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Total Jobs
            </p>
            <Wrench className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{summary.totalJobs}</p>
          <p className="text-xs text-slate-500 mt-1">Repair jobs</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Total Expenses
            </p>
            <Receipt className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {summary.totalExpenses.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">ETB</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">
          Revenue & Expenses
        </h2>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="revenue" fill="#0f172a" name="Revenue (ETB)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses (ETB)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Jobs & Sales Chart */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">
          Sales & Jobs Activity
        </h2>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Sales"
                dot={{ fill: "#3b82f6", r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="jobs"
                stroke="#10b981"
                strokeWidth={2}
                name="Jobs"
                dot={{ fill: "#10b981", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-Column: Payments & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">
            Payment Methods
          </h2>
          {paymentMethods.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No payments yet</p>
          ) : (
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={paymentMethods}
                    dataKey="amount"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry: any) => `${entry.method}: ${Number(entry.amount).toLocaleString()}`}
                    labelLine={false}
                  >
                    {paymentMethods.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">
            Expense Breakdown
          </h2>
          {expenseCategories.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No expenses yet</p>
          ) : (
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={expenseCategories}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry: any) => `${entry.category}`}
                    labelLine={false}
                  >
                    {expenseCategories.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                    formatter={(value: any) => `${Number(value).toLocaleString()} ETB`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Two-Column: Job Status & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">
            Jobs by Status
          </h2>
          {jobStatuses.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No jobs yet</p>
          ) : (
            <div className="space-y-3">
              {jobStatuses.map((j: any) => {
                const total = jobStatuses.reduce((s: number, x: any) => s + x.count, 0);
                const pct = total > 0 ? (j.count / total) * 100 : 0;
                return (
                  <div key={j.status}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-slate-700 capitalize">{j.status}</span>
                      <span className="text-sm font-medium text-slate-900">
                        {j.count} <span className="text-xs text-slate-500">({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-900 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">
            Top Selling Products
          </h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No sales yet</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Product
                  </th>
                  <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Qty
                  </th>
                  <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-50 last:border-0">
                    <td className="py-3">
                      <p className="text-sm font-medium text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.sku}</p>
                    </td>
                    <td className="py-3 text-sm text-slate-700 text-right">
                      {p.quantity}
                    </td>
                    <td className="py-3 text-sm font-medium text-slate-900 text-right">
                      {p.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
}