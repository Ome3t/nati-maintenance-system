"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Receipt, X, Calendar, User, Tag, TrendingDown } from "lucide-react";

interface Expense {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
  employee?: { name: string };
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await fetch("/api/expenses");
      const data = await res.json();
      setExpenses(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase()) ||
      e.description?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "ALL" || e.category === filter;
    return matchesSearch && matchesFilter;
  });

  const totalAll = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const totalToday = expenses
    .filter((e) => new Date(e.date) >= today)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const totalMonth = expenses
    .filter((e) => new Date(e.date) >= monthStart)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Group by category
  const categories = Array.from(new Set(expenses.map((e) => e.category)));
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount);
  });

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const categoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      Rent: "bg-purple-50 text-purple-700",
      Electricity: "bg-amber-50 text-amber-700",
      Internet: "bg-blue-50 text-blue-700",
      Transport: "bg-cyan-50 text-cyan-700",
      Salaries: "bg-pink-50 text-pink-700",
      Supplies: "bg-green-50 text-green-700",
      Maintenance: "bg-orange-50 text-orange-700",
      Other: "bg-slate-100 text-slate-700",
    };
    return colors[category] || "bg-slate-100 text-slate-700";
  };

  return (
    <div className="flex gap-6">
      {/* Main List */}
      <div className="flex-1 min-w-0">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">Expenses</h1>
          <button className="px-4 py-2 bg-slate-900 text-white text-sm rounded-md hover:bg-slate-800 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Expense
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Today
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {totalToday.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">ETB</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              This Month
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {totalMonth.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">ETB</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              Total All-Time
            </p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {totalAll.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">ETB</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-lg border border-slate-200 mb-4 p-3 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="ALL">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-slate-500 text-sm">Loading...</div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No expenses found
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Expense
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Category
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Date
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    onClick={() => setSelectedExpense(expense)}
                    className={`border-b border-slate-50 last:border-0 cursor-pointer transition-colors ${
                      selectedExpense?.id === expense.id
                        ? "bg-slate-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-slate-900">
                          {expense.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${categoryBadgeColor(
                          expense.category
                        )}`}
                      >
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-red-600 text-right">
                      - {Number(expense.amount).toLocaleString()} ETB
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Side Panel */}
      {selectedExpense && (
        <div className="w-96 bg-white border-l border-slate-200 fixed right-0 top-0 h-screen overflow-y-auto scrollbar-thin z-20 shadow-lg">
          <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Expense</p>
              <h2 className="text-base font-bold text-slate-900">
                {selectedExpense.name}
              </h2>
            </div>
            <button
              onClick={() => setSelectedExpense(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Amount */}
          <div className="px-5 py-6 border-b border-slate-100 text-center">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
              Amount
            </p>
            <p className="text-3xl font-bold text-red-600">
              - {Number(selectedExpense.amount).toLocaleString()} ETB
            </p>
          </div>

          {/* Category */}
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Category
            </h3>
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-slate-400" />
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${categoryBadgeColor(
                  selectedExpense.category
                )}`}
              >
                {selectedExpense.category}
              </span>
            </div>
          </div>

          {/* Date */}
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Date
            </h3>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Calendar className="h-4 w-4 text-slate-400" />
              {new Date(selectedExpense.date).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>

          {/* Employee */}
          {selectedExpense.employee && (
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Recorded By
              </h3>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <User className="h-4 w-4 text-slate-400" />
                {selectedExpense.employee.name}
              </div>
            </div>
          )}

          {/* Description */}
          {selectedExpense.description && (
            <div className="px-5 py-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Description
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                {selectedExpense.description}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}