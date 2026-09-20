"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Plus, Receipt, Calendar, User, Tag, TrendingDown, Copy, Check, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/shared/stat-card";

interface Expense {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
  employee?: { name: string };
}

const NEW_VALUE = "__new";

const EXPENSE_CATEGORIES = ["Rent", "Electricity", "Internet", "Transport", "Salaries", "Supplies", "Maintenance", "Other"];

const selectClasses =
  "flex h-9 w-full rounded-md border border-border/50 bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Add Expense Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [expName, setExpName] = useState("");
  const [expCategory, setExpCategory] = useState("");
  const [expNewCategory, setExpNewCategory] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10));
  const [expDescription, setExpDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/expenses");
      const data = await res.json();
      setExpenses(data);
    } catch (error) {
      toast.error("Failed to load expenses");
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    toast.success("Expense ID copied");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleAddExpense = async () => {
    const category = expCategory === NEW_VALUE ? expNewCategory.trim() : expCategory;
    if (!expName.trim() || !category || !expAmount) {
      toast.error("Please fill in Name, Category, and Amount");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: expName.trim(),
          category,
          amount: parseFloat(expAmount),
          date: new Date(expDate + "T12:00:00").toISOString(),
          description: expDescription.trim() || null,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success("Expense recorded successfully");
      setShowAddModal(false);
      setExpName("");
      setExpCategory("");
      setExpNewCategory("");
      setExpAmount("");
      setExpDescription("");
      setExpDate(new Date().toISOString().slice(0, 10));
      fetchExpenses();
    } catch {
      toast.error("Failed to record expense");
    } finally {
      setSaving(false);
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
  const totalToday = expenses.filter((e) => new Date(e.date) >= today).reduce((sum, e) => sum + Number(e.amount), 0);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const totalMonth = expenses.filter((e) => new Date(e.date) >= monthStart).reduce((sum, e) => sum + Number(e.amount), 0);

  const categories = Array.from(new Set(expenses.map((e) => e.category)));

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  // Dark-mode friendly category badges (matches RoleBadge style)
  const categoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      Rent: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      Electricity: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      Internet: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      Transport: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
      Salaries: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
      Supplies: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      Maintenance: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    };
    return colors[category] || "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20";
  };

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Dynamic Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/manager" className="hover:text-foreground transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Expenses</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expenses</h1>
          <p className="text-xs text-muted-foreground mt-1">Track and manage all business spending.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
          <Plus className="h-4 w-4" /> Add Expense
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Today" value={totalToday} suffix=" ETB" hint="Spent so far today" />
        <StatCard label="This Month" value={totalMonth} suffix=" ETB" hint="Since the 1st" />
        <StatCard label="Total All-Time" value={totalAll} suffix=" ETB" hint="Cumulative spend" trend="down" />
      </div>

      {/* Filter Bar */}
      <div className="bg-card border border-border/50 shadow-sm rounded-xl p-4 transition-all duration-300 ease-out hover:border-white/10 dark:hover:border-zinc-700">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-background/50 border-border/50" />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className={selectClasses + " sm:w-48"}>
            <option value="ALL">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border/50 shadow-sm rounded-xl overflow-hidden transition-all duration-300 ease-out hover:border-white/10 dark:hover:border-zinc-700">
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton />
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No expenses found matching your criteria.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 hover:bg-transparent">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Expense</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Recorded By</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    onClick={() => setSelectedExpense(expense)}
                    className="border-b border-border/50 last:border-0 cursor-pointer transition-colors hover:bg-accent/50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground">{expense.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${categoryBadgeColor(expense.category)}`}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground hidden md:table-cell">
                      {expense.employee?.name || "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{formatDate(expense.date)}</td>
                    <td className="px-5 py-4 text-sm font-bold text-red-500 text-right">
                      - {Number(expense.amount).toLocaleString()} ETB
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Expense Detail Drawer (Smooth slide-in + staggered content) */}
      <Sheet open={!!selectedExpense} onOpenChange={(open) => !open && setSelectedExpense(null)}>
        <SheetContent side="right" className="w-full sm:w-[480px] border-l border-border bg-background text-foreground h-full p-0 flex flex-col">
          {selectedExpense && (
            <div className="animate-page-enter flex-1 flex flex-col overflow-hidden">
              <SheetHeader className="px-6 py-5 border-b border-border/50 space-y-1">
                <SheetTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-muted-foreground" />
                  {selectedExpense.name}
                </SheetTitle>
                <SheetDescription className="flex items-center gap-2 text-muted-foreground text-sm">
                  <span className="font-mono text-xs">ID: {selectedExpense.id.slice(0, 12)}…</span>
                  <button onClick={() => copyToClipboard(selectedExpense.id)} className="hover:text-foreground transition-colors">
                    {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Amount Hero */}
                <div className="rounded-xl border border-border bg-muted/50 p-6 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Amount</p>
                  <p className="text-3xl font-bold text-red-500">
                    - {Number(selectedExpense.amount).toLocaleString()} ETB
                  </p>
                </div>

                <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-5 transition-colors hover:bg-muted/60">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Tag className="h-4 w-4" /> Category
                    </span>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${categoryBadgeColor(selectedExpense.category)}`}>
                      {selectedExpense.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Date
                    </span>
                    <span className="text-sm text-foreground">
                      {new Date(selectedExpense.date).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <User className="h-4 w-4" /> Recorded By
                    </span>
                    <span className="text-sm text-foreground">{selectedExpense.employee?.name || "—"}</span>
                  </div>
                </div>

                {selectedExpense.description && (
                  <div>
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</h3>
                    <p className="text-sm text-foreground leading-relaxed rounded-xl border border-border bg-muted/30 p-5">
                      {selectedExpense.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Expense Modal (Slide-up from bottom) */}
      <Sheet open={showAddModal} onOpenChange={setShowAddModal}>
        <SheetContent side="bottom" className="h-auto max-h-[85vh] border-t border-border bg-background text-foreground p-6 rounded-t-2xl overflow-y-auto">
          <div className="animate-page-enter max-w-2xl mx-auto">
            <SheetHeader className="mb-6 space-y-1">
              <SheetTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                Record New Expense
              </SheetTitle>
              <SheetDescription className="text-muted-foreground text-base">
                Log a business expense. It will appear in your reports instantly.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Expense Name *</label>
                  <Input value={expName} onChange={(e) => setExpName(e.target.value)} placeholder="e.g., Office Rent September" className="bg-background/50 border-border/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Amount (ETB) *</label>
                  <Input type="number" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} placeholder="0.00" className="bg-background/50 border-border/50" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" /> Category *
                  </label>
                  <select value={expCategory} onChange={(e) => setExpCategory(e.target.value)} className={selectClasses}>
                    <option value="">Select category</option>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    {categories.filter((c) => !EXPENSE_CATEGORIES.includes(c)).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value={NEW_VALUE}>+ Add new category…</option>
                  </select>
                  {expCategory === NEW_VALUE && (
                    <Input autoFocus value={expNewCategory} onChange={(e) => setExpNewCategory(e.target.value)} placeholder="Type new category name" className="bg-background/50 border-border/50 animate-page-enter" />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Date
                  </label>
                  <Input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} className="bg-background/50 border-border/50" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Description (Optional)</label>
                <textarea
                  value={expDescription}
                  onChange={(e) => setExpDescription(e.target.value)}
                  placeholder="Any extra notes about this expense..."
                  className="flex min-h-[80px] w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1 transition-all hover:scale-[1.02] active:scale-[0.98] border-border/50">
                  Cancel
                </Button>
                <Button onClick={handleAddExpense} disabled={saving} className="flex-1 gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Expense
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="p-5 space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          <div className="h-4 w-4 bg-muted/50 rounded" />
          <div className="h-4 w-32 bg-muted/50 rounded" />
          <div className="h-4 w-20 bg-muted/50 rounded ml-auto" />
          <div className="h-4 w-16 bg-muted/50 rounded" />
        </div>
      ))}
    </div>
  );
}