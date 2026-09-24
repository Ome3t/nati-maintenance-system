"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Receipt, User, Banknote, CreditCard, Smartphone, Printer, Copy, Check, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/shared/stat-card";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { cn } from "@/lib/utils";

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [preferences, setPreferences] = useState({
    autoGenerateReceipts: true,
  });

  useEffect(() => {
    fetchSales();
    fetch("/api/settings/preferences")
      .then((r) => r.json())
      .then((data) => setPreferences(data))
      .catch(() => {});
  }, []);

  const fetchSales = async () => {
    try {
      const res = await fetch("/api/sales");
      const data = await res.json();
      setSales(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Invoice number copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const openSale = async (sale: any) => {
    setLoadingDetails(true);
    setSelectedSale(sale);
    try {
      const res = await fetch("/api/sales/" + sale.id);
      const fullSale = await res.json();
      setSelectedSale(fullSale);
    } catch (error) {
      toast.error("Failed to load sale details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredSales = sales.filter((s: any) => {
    const matchesSearch =
      s.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (s.customer?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "ALL" || s.status === filter;
    return matchesSearch && matchesFilter;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySales = sales.filter((s) => new Date(s.createdAt) >= today);
  const todayTotal = todaySales.reduce((sum, s) => sum + Number(s.total), 0);
  const totalAll = sales.reduce((sum, s) => sum + Number(s.total), 0);
  const avgTransaction = sales.length > 0 ? totalAll / sales.length : 0;

  const statusStyle = (status: string) => {
    const styles: Record<string, { dot: string; label: string; color: string; pulse: boolean }> = {
      PAID: { dot: "bg-emerald-500", label: "Paid", color: "text-emerald-500", pulse: false },
      PARTIALLY_PAID: { dot: "bg-amber-500", label: "Partial", color: "text-amber-500", pulse: true },
      UNPAID: { dot: "bg-red-500", label: "Unpaid", color: "text-red-500", pulse: true },
    };
    return styles[status] || { dot: "bg-zinc-400", label: status, color: "text-zinc-400", pulse: false };
  };

  const methodIcon = (method: string) => {
    if (method === "CASH") return Banknote;
    if (method === "BANK_TRANSFER") return CreditCard;
    if (method === "MOBILE_MONEY") return Smartphone;
    return Banknote;
  };

  const methodLabel = (method: string) => {
    if (method === "CASH") return "Cash";
    if (method === "BANK_TRANSFER") return "Bank Transfer";
    if (method === "MOBILE_MONEY") return "Mobile Money";
    return method || "—";
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return mins + " min ago";
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + " hr" + (hrs > 1 ? "s" : "") + " ago";
    const days = Math.floor(hrs / 24);
    return days + " day" + (days > 1 ? "s" : "") + " ago";
  };

  const counts = {
    ALL: sales.length,
    PAID: sales.filter((s) => s.status === "PAID").length,
    PARTIALLY_PAID: sales.filter((s) => s.status === "PARTIALLY_PAID").length,
    UNPAID: sales.filter((s) => s.status === "UNPAID").length,
  };

  const tabs = [
    { key: "ALL", label: "All" },
    { key: "PAID", label: "Paid" },
    { key: "PARTIALLY_PAID", label: "Partial" },
    { key: "UNPAID", label: "Unpaid" },
  ];

  return (
    <div className="space-y-6 animate-page-enter">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Sales History</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Sales History</h1>
        <p className="text-xs text-muted-foreground mt-1">All completed sales and transactions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Today's Sales" value={todaySales.length} hint={`${todayTotal.toLocaleString()} ETB`} />
        <StatCard label="All Sales" value={sales.length} hint="transactions" />
        <StatCard label="Total Revenue" value={totalAll} suffix=" ETB" hint="All time" trend="up" />
        <StatCard label="Avg. Transaction" value={Math.round(avgTransaction)} suffix=" ETB" hint="Per sale" />
      </div>

      <div className="flex rounded-lg border border-border/50 bg-muted/30 p-1 overflow-x-auto w-fit max-w-full">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all",
              filter === tab.key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            <span className={cn("ml-1.5 text-xs", filter === tab.key ? "opacity-80" : "opacity-60")}>
              {counts[tab.key as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-card border border-border/50 shadow-sm rounded-xl p-4 transition-all duration-300 ease-out hover:border-white/10 dark:hover:border-zinc-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by invoice or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50 border-border/50"
          />
        </div>
      </div>

      <div className="bg-card border border-border/50 shadow-sm rounded-xl overflow-hidden transition-all duration-300 ease-out hover:border-white/10 dark:hover:border-zinc-700">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-5 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="h-4 w-24 bg-muted/50 rounded" />
                  <div className="h-4 w-32 bg-muted/50 rounded" />
                  <div className="h-4 w-20 bg-muted/50 rounded" />
                  <div className="h-4 w-24 bg-muted/50 rounded ml-auto" />
                </div>
              ))}
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No sales found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 hover:bg-transparent">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Invoice</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Method</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => {
                  const s = statusStyle(sale.status);
                  const MethodIcon = methodIcon(sale.paymentMethod);
                  return (
                    <tr
                      key={sale.id}
                      onClick={() => openSale(sale)}
                      className="border-b border-border/50 last:border-0 cursor-pointer transition-colors hover:bg-accent/50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-bold text-foreground font-mono">{sale.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-foreground">{sale.customer?.name || "Walk-in Customer"}</td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MethodIcon className="h-4 w-4" />
                          {methodLabel(sale.paymentMethod)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn("flex items-center gap-2 text-xs font-medium", s.color)}>
                          <span className="relative flex h-1.5 w-1.5">
                            {s.pulse && <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", s.dot)} />}
                            <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", s.dot)} />
                          </span>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-foreground text-right">
                        {Number(sale.total).toLocaleString()} ETB
                      </td>
                      <td className="px-5 py-4 text-right text-xs text-muted-foreground hidden sm:table-cell">{timeAgo(sale.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Sheet open={!!selectedSale} onOpenChange={(open) => !open && setSelectedSale(null)}>
        <SheetContent side="right" className="w-full sm:w-[480px] border-l border-border bg-background text-foreground h-full p-0 flex flex-col">
          {selectedSale && (
            <div className="animate-page-enter flex-1 flex flex-col overflow-hidden">
              <SheetHeader className="px-6 py-5 border-b border-border/50 space-y-1">
                <SheetTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-muted-foreground" />
                  {selectedSale.invoiceNumber}
                </SheetTitle>
                <SheetDescription className="flex items-center gap-2 text-muted-foreground text-sm">
                  <button onClick={() => copyToClipboard(selectedSale.invoiceNumber)} className="hover:text-foreground transition-colors">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <span>Recorded {timeAgo(selectedSale.createdAt)}</span>
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="rounded-xl border border-border bg-muted/50 p-6 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Amount</p>
                  <p className="text-3xl font-bold text-foreground">
                    <AnimatedCounter value={Number(selectedSale.total)} suffix=" ETB" />
                  </p>
                  <div className="mt-3">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
                      selectedSale.status === "PAID" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                      selectedSale.status === "PARTIALLY_PAID" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                      "bg-red-500/10 text-red-500 border border-red-500/20"
                    )}>
                      <span className="relative flex h-1.5 w-1.5">
                        {statusStyle(selectedSale.status).pulse && <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", statusStyle(selectedSale.status).dot)} />}
                        <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", statusStyle(selectedSale.status).dot)} />
                      </span>
                      {statusStyle(selectedSale.status).label}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 transition-colors hover:bg-muted/50">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Customer</h3>
                  <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {selectedSale.customer?.name || "Walk-in Customer"}
                  </div>
                  {selectedSale.customer?.phone && (
                    <p className="text-xs text-muted-foreground ml-6">{selectedSale.customer.phone}</p>
                  )}
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Items ({selectedSale.items?.length || 0})
                  </h3>
                  {loadingDetails ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 bg-muted/60 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : selectedSale.items && selectedSale.items.length > 0 ? (
                    <div className="space-y-2">
                      {selectedSale.items.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between rounded-lg bg-background/50 px-3 py-2.5 transition-colors hover:bg-accent/50">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{item.product?.name || "Product"}</p>
                            <p className="text-xs text-muted-foreground">{item.quantity} x {Number(item.unitPrice).toLocaleString()} ETB</p>
                          </div>
                          <span className="text-sm font-semibold text-foreground ml-2">{Number(item.total).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-3">No items</p>
                  )}
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 transition-colors hover:bg-muted/50">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Payment Summary</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Subtotal</span>
                      <span className="text-sm font-medium text-foreground">{Number(selectedSale.subtotal).toLocaleString()} ETB</span>
                    </div>
                    {Number(selectedSale.discount) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Discount</span>
                        <span className="text-sm font-medium text-red-500">- {Number(selectedSale.discount).toLocaleString()} ETB</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <span className="text-sm font-bold text-foreground">Total</span>
                      <span className="text-base font-bold text-foreground">{Number(selectedSale.total).toLocaleString()} ETB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Paid</span>
                      <span className="text-sm font-medium text-emerald-500">{Number(selectedSale.paidAmount).toLocaleString()} ETB</span>
                    </div>
                    {Number(selectedSale.remainingAmount) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Remaining</span>
                        <span className="text-sm font-medium text-amber-500">{Number(selectedSale.remainingAmount).toLocaleString()} ETB</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 transition-colors hover:bg-muted/50">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Details</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Cashier</span>
                      <span className="text-sm text-foreground">{selectedSale.cashier?.name || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Method</span>
                      <span className="text-sm text-foreground">{methodLabel(selectedSale.paymentMethod)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Date</span>
                      <span className="text-sm text-foreground">
                        {new Date(selectedSale.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Time</span>
                      <span className="text-sm text-foreground">{new Date(selectedSale.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-border/50 p-4 bg-background">
                {preferences.autoGenerateReceipts && (
                 <Link href={"/receipts/" + selectedSale.id} className="block">
                   <Button className="w-full gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
                   <Printer className="h-4 w-4" /> View Receipt / Print
                </Button>
              </Link>
               )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}