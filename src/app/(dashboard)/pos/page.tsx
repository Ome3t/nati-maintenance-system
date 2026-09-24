"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, Plus, Minus, Trash2, X, Banknote, CreditCard, Smartphone,
  Loader2, ShoppingCart, PackageSearch, Wrench, ClipboardList, User, RefreshCw, Inbox, Printer, Package,
} from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { cn } from "@/lib/utils";

const selectClasses =
  "flex h-9 w-full rounded-md border border-border/50 bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const paymentMethods = [
  { key: "CASH", label: "Cash", Icon: Banknote },
  { key: "BANK_TRANSFER", label: "Bank", Icon: CreditCard },
  { key: "MOBILE_MONEY", label: "Mobile", Icon: Smartphone },
];

export default function POSPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [mode, setMode] = useState<"products" | "jobs">("products");

  // Products mode
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [stockProducts, setStockProducts] = useState<any[]>([]);
  const [stockLoading, setStockLoading] = useState(true);
  const [stockRefreshing, setStockRefreshing] = useState(false);
  const [stockFilter, setStockFilter] = useState<"ALL" | "IN" | "LOW" | "OUT">("ALL");
  const [cart, setCart] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [processing, setProcessing] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);

  // Jobs mode
  const [jobQuery, setJobQuery] = useState("");
  const [jobResults, setJobResults] = useState<any[]>([]);
  const [jobSearching, setJobSearching] = useState(false);
  const [queueJobs, setQueueJobs] = useState<any[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueRefreshing, setQueueRefreshing] = useState(false);
  const [payingJob, setPayingJob] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payProcessing, setPayProcessing] = useState(false);
  const [jobTotalInput, setJobTotalInput] = useState("");
  const [lastJobPayment, setLastJobPayment] = useState<any>(null);

  // Job intake
  const [showIntake, setShowIntake] = useState(false);
  const [intCustomerId, setIntCustomerId] = useState("");
  const [intNewName, setIntNewName] = useState("");
  const [intNewPhone, setIntNewPhone] = useState("");
  const [intDeviceType, setIntDeviceType] = useState("");
  const [intDeviceModel, setIntDeviceModel] = useState("");
  const [intSerial, setIntSerial] = useState("");
  const [intProblem, setIntProblem] = useState("");
  const [intPriority, setIntPriority] = useState("MEDIUM");
  const [intNotes, setIntNotes] = useState("");
  const [intSaving, setIntSaving] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null)


  const [preferences, setPreferences] = useState({
    autoGenerateReceipts: true,
    allowPartialPayments: true,
  })

  useEffect(() => {
    fetch("/api/customers").then((r) => r.json()).then(setCustomers).catch(() => {})
    fetch("/api/settings/preferences")
      .then((r) => r.json())
      .then((data) => setPreferences(data))
      .catch(() => {})
  }, [])

  // Add this useEffect after the existing one that fetches preferences
useEffect(() => {
  if (payingJob && !preferences.allowPartialPayments) {
    const remaining = Number(payingJob.remainingAmount) > 0 
      ? String(Number(payingJob.remainingAmount)) 
      : "";
    setPayAmount(remaining);
  }
}, [preferences.allowPartialPayments, payingJob]);

  /* ---------- Live inventory queue (auto-loads + refreshes every 60s in Products mode) ---------- */
  const fetchStock = async (manual = false) => {
    if (manual) setStockRefreshing(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setStockProducts(Array.isArray(data) ? data : []);
    } catch {
      // silent
    } finally {
      setStockLoading(false);
      if (manual) setTimeout(() => setStockRefreshing(false), 600);
    }
  };

  useEffect(() => {
    if (mode !== "products") return;
    fetchStock();
    const timer = setInterval(() => fetchStock(), 60000);
    return () => clearInterval(timer);
  }, [mode]);

  /* ---------- Live payment queue (auto-loads + refreshes every 30s in Jobs mode) ---------- */
  const fetchQueue = async (manual = false) => {
    if (manual) setQueueRefreshing(true);
    try {
      const res = await fetch("/api/jobs/queue");
      const data = await res.json();
      setQueueJobs(Array.isArray(data) ? data : []);
    } catch {
      // silent
    } finally {
      setQueueLoading(false);
      if (manual) setTimeout(() => setQueueRefreshing(false), 600);
    }
  };

  useEffect(() => {
    if (mode !== "jobs") return;
    fetchQueue();
    const timer = setInterval(() => fetchQueue(), 30000);
    return () => clearInterval(timer);
  }, [mode]);

  // Debounced product search
  useEffect(() => {
    if (searchQuery.length >= 1) {
      setSearching(true);
      const timer = setTimeout(() => {
        fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}`)
          .then((res) => res.json())
          .then((data) => { setProducts(data); setSearching(false); })
          .catch(() => setSearching(false));
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setProducts([]);
      setSearching(false);
    }
  }, [searchQuery]);

  // Debounced job search
  useEffect(() => {
    if (jobQuery.length >= 1) {
      setJobSearching(true);
      const timer = setTimeout(() => {
        fetch(`/api/jobs/search?q=${encodeURIComponent(jobQuery)}`)
          .then((res) => res.json())
          .then((data) => { setJobResults(data); setJobSearching(false); })
          .catch(() => setJobSearching(false));
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setJobResults([]);
      setJobSearching(false);
    }
  }, [jobQuery]);

  /* ---------------- Stock helpers ---------------- */
  const stockStatusOf = (p: any): "IN" | "LOW" | "OUT" => {
    if (p.currentStock === 0) return "OUT";
    if (p.currentStock <= p.minimumStock) return "LOW";
    return "IN";
  };

  const stockCounts = {
    ALL: stockProducts.length,
    IN: stockProducts.filter((p) => stockStatusOf(p) === "IN").length,
    LOW: stockProducts.filter((p) => stockStatusOf(p) === "LOW").length,
    OUT: stockProducts.filter((p) => stockStatusOf(p) === "OUT").length,
  };

  const visibleStock = [...stockProducts]
    .filter((p) => stockFilter === "ALL" || stockStatusOf(p) === stockFilter)
    .sort((a, b) => {
      const order = { OUT: 0, LOW: 1, IN: 2 };
      return order[stockStatusOf(a)] - order[stockStatusOf(b)] || a.name.localeCompare(b.name);
    });

  /* ---------------- Cart logic ---------------- */
  const addToCart = (product: any) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.currentStock) {
        toast.error(`Insufficient stock for ${product.name}`);
        return;
      }
      setCart(cart.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, {
        id: product.id, name: product.name, sku: product.sku,
        price: Number(product.sellingPrice), quantity: 1, stock: product.currentStock,
      }]);
    }
    setSearchQuery("");
    setProducts([]);
  };

  const removeFromCart = (id: string) => setCart(cart.filter((i) => i.id !== id));

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map((item) => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        if (newQty > item.stock) {
          toast.error(`Only ${item.stock} in stock for ${item.name}`);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  const total = subtotal;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCompleteSale = async () => {
    if (cart.length === 0) { toast.error("Cart is empty"); return; }
    setProcessing(true);
    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer || null,
          cashierId: session?.user?.id,
          items: cart.map((item) => ({
            productId: item.id, quantity: item.quantity,
            unitPrice: item.price, total: item.price * item.quantity,
          })),
          paymentMethod, subtotal, total,
          paidAmount: total, remainingAmount: 0, status: "PAID",
        }),
      });
      if (!response.ok) throw new Error("Failed");
      const sale = await response.json();
      
      // Store the transaction for the visible success bar
      setLastTransaction({
        type: "sale",
        id: sale.id,
        invoiceNumber: sale.invoiceNumber,
        url: `/receipts/${sale.id}`
      });
      
      toast.success(`Sale completed! Invoice: ${sale.invoiceNumber}`);
      setCart([]); setSelectedCustomer(""); setPaymentMethod("CASH");
      setShowPayment(false); setShowMobileCart(false);
      fetchStock(); // refresh stock instantly after a sale
      setTimeout(() => router.push(`/receipts/${sale.id}`), 1200);
    } catch (err: any) {
      toast.error(err.message || "Failed to complete sale");
    } finally {
      setProcessing(false);
    }
  };

  /* ---------------- Job payment ---------------- */
  const openJobPayment = (job: any) => {
    setPayingJob(job);
    // FIX: Always pre-fill with the remaining amount (or total if no payments yet)
    const due = Number(job.remainingAmount) > 0 ? Number(job.remainingAmount) : Number(job.total);
    setPayAmount(String(due));
    setJobTotalInput("");
  };

  const handleJobPayment = async () => {
    if (!payingJob) return;
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    setPayProcessing(true);
    try {
      if (Number(payingJob.total) === 0) {
        const newTotal = parseFloat(jobTotalInput);
        if (!newTotal || newTotal <= 0) {
          toast.error("Set the job total first");
          setPayProcessing(false);
          return;
        }
        const patchRes = await fetch(`/api/jobs/${payingJob.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ total: newTotal }),
        });
        if (!patchRes.ok) throw new Error("Failed to set job total");
      }

      const res = await fetch(`/api/jobs/${payingJob.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, method: payMethod }),
      });
      if (!res.ok) throw new Error("Failed");
      
      // Store the transaction for the visible success bar
      setLastTransaction({
        type: "job",
        id: payingJob.id,
        jobNumber: payingJob.jobNumber,
        url: `/receipts/job/${payingJob.id}`
      });
      
      toast.success(`Payment recorded for ${payingJob.jobNumber}`);
      setLastJobPayment({ id: payingJob.id, jobNumber: payingJob.jobNumber })
      setPayingJob(null); setPayAmount(""); setPayMethod("CASH"); setJobTotalInput("");
      fetchQueue();
    } catch {
      toast.error("Failed to record payment");
    } finally {
      setPayProcessing(false);
    }
  };
    

  /* ---------------- Job intake ---------------- */
  const handleIntake = async () => {
    if (!intDeviceType.trim() || !intProblem.trim()) {
      toast.error("Device type and problem are required");
      return;
    }
    if (!intCustomerId && !intNewName.trim()) {
      toast.error("Select a customer or type a new customer name");
      return;
    }
    setIntSaving(true);
    try {
      const res = await fetch("/api/jobs/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: intCustomerId || null,
          customerName: intNewName, customerPhone: intNewPhone,
          deviceType: intDeviceType.trim(), deviceModel: intDeviceModel.trim(),
          serialNumber: intSerial.trim(), problem: intProblem.trim(),
          priority: intPriority, notes: intNotes.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const job = await res.json();
      toast.success(`Job ${job.jobNumber} registered successfully`);
      setShowIntake(false);
      setIntCustomerId(""); setIntNewName(""); setIntNewPhone("");
      setIntDeviceType(""); setIntDeviceModel(""); setIntSerial("");
      setIntProblem(""); setIntPriority("MEDIUM"); setIntNotes("");
    } catch {
      toast.error("Failed to register job");
    } finally {
      setIntSaving(false);
    }
  };

  /* ---------------- Product card (queue + search) ---------------- */
  const renderProductCard = (product: any) => {
    const st = stockStatusOf(product);
    return (
      <button
        key={product.id}
        onClick={() => addToCart(product)}
        disabled={product.currentStock === 0}
        className="bg-card border border-border/50 shadow-sm rounded-xl p-3 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-emerald-500/30 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-sm animate-page-enter"
        >
        <p className="text-sm font-medium text-foreground line-clamp-2">{product.name}</p>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">{product.sku}</p>
        <p className="text-sm font-bold text-foreground mt-2">{Number(product.sellingPrice).toLocaleString()} ETB</p>
        <p className="flex items-center gap-1.5 text-xs mt-1">
          <span className="relative flex h-1.5 w-1.5">
            {st !== "OUT" && (
              <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", st === "LOW" ? "bg-amber-500" : "bg-emerald-500")} />
            )}
            <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", st === "OUT" ? "bg-red-500" : st === "LOW" ? "bg-amber-500" : "bg-emerald-500")} />
          </span>
          <span className={st === "OUT" ? "text-red-500 font-medium" : st === "LOW" ? "text-amber-500 font-medium" : "text-muted-foreground"}>
            {st === "OUT" ? "Out of stock" : `${product.currentStock} in stock`}
          </span>
        </p>
      </button>
    );
  };

  /* ---------------- Job card (queue + search) ---------------- */
  const renderJobCard = (job: any) => {
    const remaining = Number(job.remainingAmount);
    const isPaid = job.paymentStatus === "PAID";
    return (
      <button
        key={job.id}
        disabled={isPaid}
        onClick={() => openJobPayment(job)}
        className="bg-card border border-border/50 shadow-sm rounded-xl p-4 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-emerald-500/30 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-sm animate-page-enter"      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-bold text-foreground font-mono">#{job.jobNumber}</span>
          <span className={`flex items-center gap-1.5 text-xs font-medium ${isPaid ? "text-emerald-500" : "text-amber-500"}`}>
            {!isPaid && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
              </span>
            )}
            {job.paymentStatus.replace(/_/g, " ").toLowerCase()}
          </span>
        </div>
        <p className="text-sm text-foreground">{job.customer?.name || "Walk-in"}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {job.deviceType} {job.deviceModel ? `— ${job.deviceModel}` : ""}
          <span className="opacity-60"> · {job.status.replace(/_/g, " ").toLowerCase()}</span>
        </p>
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50 text-xs">
          <span className="text-muted-foreground">Total: <span className="text-foreground font-medium">{Number(job.total).toLocaleString()}</span></span>
          <span className="text-muted-foreground">Paid: <span className="text-emerald-500 font-medium">{Number(job.paidAmount).toLocaleString()}</span></span>
          <span className="text-muted-foreground">Due: <span className="text-red-500 font-bold">{remaining.toLocaleString()} ETB</span></span>
        </div>
      </button>
    );
  };

  /* ---------------- Cart UI ---------------- */
  const cartList = cart.length === 0 ? (
    <div className="text-center py-12 text-muted-foreground">
      <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-30" />
      <p className="text-sm">Cart is empty</p>
    </div>
  ) : (
    <div className="space-y-2">
      {cart.map((item) => (
        <div key={item.id} className="rounded-xl border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50 animate-page-enter">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.price.toLocaleString()} ETB each</p>
            </div>
            <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-red-500 p-1 ml-2 transition-all hover:scale-110 active:scale-95">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center rounded-lg border border-border/50 overflow-hidden">
              <button onClick={() => updateQuantity(item.id, -1)} className="px-2 py-1.5 hover:bg-accent transition-colors"><Minus className="h-3 w-3" /></button>
              <span className="px-3 py-1.5 text-sm font-medium border-x border-border/50 min-w-[2.5rem] text-center text-foreground">{item.quantity}</span>
              <button onClick={() => updateQuantity(item.id, 1)} className="px-2 py-1.5 hover:bg-accent transition-colors"><Plus className="h-3 w-3" /></button>
            </div>
            <span className="text-sm font-bold text-foreground">{(item.price * item.quantity).toLocaleString()} ETB</span>
          </div>
        </div>
      ))}
    </div>
  );

  const cartFooter = (
    <div className="border-t border-border/50 p-4 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-xl font-bold text-foreground"><AnimatedCounter value={total} suffix=" ETB" /></span>
      </div>
      <Button onClick={() => { setShowMobileCart(false); setShowPayment(true); }} disabled={cart.length === 0} className="w-full transition-all hover:scale-[1.02] active:scale-[0.98]">
        Proceed to Payment
      </Button>
    </div>
  );

  const stockChips = [
    { key: "ALL" as const, label: "All", count: stockCounts.ALL, dot: null as string | null, pulse: false },
    { key: "IN" as const, label: "In Stock", count: stockCounts.IN, dot: "bg-emerald-500", pulse: true },
    { key: "LOW" as const, label: "Low Stock", count: stockCounts.LOW, dot: "bg-amber-500", pulse: true },
    { key: "OUT" as const, label: "Out of Stock", count: stockCounts.OUT, dot: "bg-red-500", pulse: false },
  ];

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Point of Sale</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Point of Sale</h1>
          <p className="text-xs text-muted-foreground mt-1">Sell products, collect job payments, and register repairs.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border/50 bg-muted/30 p-1">
            <button onClick={() => setMode("products")}
              className={cn("flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all", mode === "products" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <ShoppingCart className="h-4 w-4" /> Products
            </button>
            <button onClick={() => setMode("jobs")}
              className={cn("flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all", mode === "jobs" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <Wrench className="h-4 w-4" /> Job Payments
            </button>
          </div>
          
        </div>
      </div>

      <div className="flex gap-6 h-[calc(100vh-15rem)] min-h-[420px]">
        {/* Left column */}
        <div className="flex-1 flex flex-col min-w-0 gap-4">
          {mode === "products" ? (
            <>
              <div className="bg-card border border-border/50 shadow-sm rounded-xl p-4 space-y-3 transition-all duration-300 ease-out hover:border-white/10 dark:hover:border-zinc-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</label>
                    <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} className={selectClasses}>
                      <option value="">Walk-in Customer</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} {c.phone ? `— ${c.phone}` : ""}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Search Products (optional)</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="text" placeholder="Search by name or SKU..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus className="pl-9 bg-background/50 border-border/50" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1">
                {searchQuery.length === 0 ? (
                  /* ---------- LIVE INVENTORY QUEUE ---------- */
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        Live Inventory ({stockProducts.length})
                      </h2>
                      <button onClick={() => fetchStock(true)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <RefreshCw className={cn("h-3 w-3", stockRefreshing && "animate-spin")} /> Refresh
                      </button>
                    </div>

                    {/* Status filter chips */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {stockChips.map((chip) => (
                        <button
                          key={chip.key}
                          onClick={() => setStockFilter(chip.key)}
                          className={cn(
                            "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all hover:scale-[1.03] active:scale-[0.97]",
                            stockFilter === chip.key
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "border-border/50 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {chip.dot && (
                            <span className="relative flex h-1.5 w-1.5">
                              {chip.pulse && <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", chip.dot)} />}
                              <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", chip.dot)} />
                            </span>
                          )}
                          {chip.label}
                          <span className={stockFilter === chip.key ? "opacity-80" : "opacity-60"}>{chip.count}</span>
                        </button>
                      ))}
                    </div>

                    {stockLoading ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                          <div key={i} className="rounded-xl border border-border/50 bg-card p-3 animate-pulse">
                            <div className="h-4 w-3/4 bg-muted/60 rounded mb-2" />
                            <div className="h-3 w-1/2 bg-muted/60 rounded mb-3" />
                            <div className="h-4 w-2/3 bg-muted/60 rounded" />
                          </div>
                        ))}
                      </div>
                    ) : visibleStock.length === 0 ? (
                      <div className="text-center py-16 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">No products in this category yet</p>
                        <p className="text-xs mt-1 opacity-70">Add products from the Inventory page to see them here</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {visibleStock.map(renderProductCard)}
                      </div>
                    )}
                  </>
                ) : (
                  /* ---------- SEARCH RESULTS ---------- */
                  <>
                    {searching && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                          <div key={i} className="rounded-xl border border-border/50 bg-card p-3 animate-pulse">
                            <div className="h-4 w-3/4 bg-muted/60 rounded mb-2" />
                            <div className="h-3 w-1/2 bg-muted/60 rounded mb-3" />
                            <div className="h-4 w-2/3 bg-muted/60 rounded" />
                          </div>
                        ))}
                      </div>
                    )}
                    {!searching && products.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground text-sm">
                        <PackageSearch className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        No products found for &ldquo;{searchQuery}&rdquo;
                      </div>
                    )}
                    {!searching && products.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {products.map(renderProductCard)}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Job search (optional) */}
              <div className="bg-card border border-border/50 shadow-sm rounded-xl p-4 transition-all duration-300 ease-out hover:border-white/10 dark:hover:border-zinc-700">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Search Jobs (optional)</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="text" placeholder="Search by job #, customer, phone, or device..." value={jobQuery} onChange={(e) => setJobQuery(e.target.value)} className="pl-9 bg-background/50 border-border/50" />
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1">
                {jobQuery.length === 0 ? (
                  /* ---------- LIVE PAYMENT QUEUE ---------- */
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        Waiting for Payment ({queueJobs.length})
                      </h2>
                      <button onClick={() => fetchQueue(true)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <RefreshCw className={cn("h-3 w-3", queueRefreshing && "animate-spin")} /> Refresh
                      </button>
                    </div>

                    {queueLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="rounded-xl border border-border/50 bg-card p-4 animate-pulse">
                            <div className="h-4 w-1/3 bg-muted/60 rounded mb-2" />
                            <div className="h-3 w-2/3 bg-muted/60 rounded mb-3" />
                            <div className="h-4 w-1/2 bg-muted/60 rounded" />
                          </div>
                        ))}
                      </div>
                    ) : queueJobs.length === 0 ? (
                      <div className="text-center py-16 text-muted-foreground">
                        <Inbox className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">No jobs waiting for payment right now</p>
                        <p className="text-xs mt-1 opacity-70">Jobs appear here automatically when a technician marks them ready</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {queueJobs.map(renderJobCard)}
                      </div>
                    )}
                  </>
                ) : (
                  /* ---------- JOB SEARCH RESULTS ---------- */
                  <>
                    {jobSearching && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="rounded-xl border border-border/50 bg-card p-4 animate-pulse">
                            <div className="h-4 w-1/3 bg-muted/60 rounded mb-2" />
                            <div className="h-3 w-2/3 bg-muted/60 rounded mb-3" />
                            <div className="h-4 w-1/2 bg-muted/60 rounded" />
                          </div>
                        ))}
                      </div>
                    )}
                    {!jobSearching && jobResults.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground text-sm">
                        <Wrench className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        No jobs found for &ldquo;{jobQuery}&rdquo;
                      </div>
                    )}
                    {!jobSearching && jobResults.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {jobResults.map(renderJobCard)}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right: Cart (desktop) */}
        <div className="hidden lg:flex w-96 bg-card border border-border/50 shadow-sm rounded-xl flex-col overflow-hidden transition-all duration-300 ease-out hover:border-white/10 dark:hover:border-zinc-700">
          <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Cart ({cartCount} {cartCount === 1 ? "item" : "items"})</h2>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs text-muted-foreground hover:text-red-500 transition-colors">Clear all</button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3">{cartList}</div>
          {cartFooter}
        </div>
      </div>

      {/* Mobile floating cart */}
      {cartCount > 0 && (
        <button onClick={() => setShowMobileCart(true)} className="lg:hidden fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full bg-primary text-primary-foreground pl-4 pr-5 py-3 shadow-2xl transition-all hover:scale-105 active:scale-95 animate-dropdown-enter">
          <span className="relative">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -top-2 -right-2 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{cartCount}</span>
          </span>
          <span className="text-sm font-bold">{total.toLocaleString()} ETB</span>
        </button>
      )}

      {/* Mobile cart sheet */}
      <Sheet open={showMobileCart} onOpenChange={setShowMobileCart}>
        <SheetContent side="bottom" className="h-[75vh] border-t border-border bg-background text-foreground p-0 rounded-t-2xl flex flex-col">
          <div className="animate-page-enter flex-1 flex flex-col overflow-hidden">
            <SheetHeader className="px-5 py-4 border-b border-border/50 space-y-0">
              <SheetTitle className="text-lg font-bold text-foreground">Cart ({cartCount} {cartCount === 1 ? "item" : "items"})</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-3">{cartList}</div>
            {cartFooter}
          </div>
        </SheetContent>
      </Sheet>

      {/* Product payment modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowPayment(false)}>
          <div className="w-full max-w-md bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden animate-dropdown-enter" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">Payment</h3>
              <button onClick={() => setShowPayment(false)} className="text-muted-foreground hover:text-foreground p-1 transition-all hover:scale-110 active:scale-95"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5">
              <div className="rounded-xl border border-border bg-muted/50 p-5 text-center mb-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total amount</p>
                <p className="text-3xl font-bold text-foreground"><AnimatedCounter value={total} suffix=" ETB" /></p>
                <p className="text-xs text-muted-foreground mt-1">{cartCount} items in this sale</p>
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Payment method</p>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {paymentMethods.map(({ key, label, Icon }) => (
                  <button key={key} onClick={() => setPaymentMethod(key)}
                    className={cn("flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                      paymentMethod === key ? "bg-primary text-primary-foreground border-primary shadow-md" : "border-border/50 text-muted-foreground hover:border-emerald-500/30 hover:text-foreground")}>
                    <Icon className="h-5 w-5" />{label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPayment(false)} className="flex-1 transition-all hover:scale-[1.02] active:scale-[0.98] border-border/50">Cancel</Button>
                <Button onClick={handleCompleteSale} disabled={processing} className="flex-1 gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  {processing ? (<><Loader2 className="h-4 w-4 animate-spin" />Processing...</>) : "Complete Sale"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job payment sheet */}
      <Sheet open={!!payingJob} onOpenChange={(open) => !open && setPayingJob(null)}>
        <SheetContent side="bottom" className="h-auto max-h-[85vh] border-t border-border bg-background text-foreground p-6 rounded-t-2xl overflow-y-auto">
          {payingJob && (
            <div className="animate-page-enter max-w-md mx-auto">
              <SheetHeader className="mb-6 space-y-1">
                <SheetTitle className="text-2xl font-bold text-foreground font-mono">#{payingJob.jobNumber}</SheetTitle>
                <SheetDescription className="text-muted-foreground text-base">
                  {payingJob.customer?.name} — {payingJob.deviceType} {payingJob.deviceModel || ""}
                </SheetDescription>
              </SheetHeader>

              <div className="rounded-xl border border-border bg-muted/50 p-5 mb-6 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total</span><span className="font-medium text-foreground">{Number(payingJob.total).toLocaleString()} ETB</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Already paid</span><span className="font-medium text-emerald-500">{Number(payingJob.paidAmount).toLocaleString()} ETB</span></div>
                <div className="flex justify-between text-sm pt-2 border-t border-border/50"><span className="text-muted-foreground">Remaining</span><span className="font-bold text-red-500">{Number(payingJob.remainingAmount).toLocaleString()} ETB</span></div>
              </div>

              <div className="space-y-4">
                {Number(payingJob.total) === 0 && (
                  <div className="space-y-2 animate-page-enter">
                    <label className="text-sm font-medium text-foreground">Set Job Total (ETB) *</label>
                    <Input type="number" value={jobTotalInput} onChange={(e) => setJobTotalInput(e.target.value)} placeholder="e.g., 1500" className="bg-background/50 border-border/50 text-lg font-bold" />
                    <p className="text-xs text-muted-foreground">The technician didn&apos;t set charges for this job. Enter the agreed price to continue.</p>
                  </div>
                )}

<div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Amount to receive (ETB)</label>
                  <Input 
                    type="number" 
                    value={payAmount} 
                    onChange={(e) => setPayAmount(e.target.value)} 
                    disabled={!preferences.allowPartialPayments}
                    className={cn(
                      "bg-background/50 border-border/50 text-lg font-bold",
                      !preferences.allowPartialPayments && "opacity-70 cursor-not-allowed"
                    )} 
                  />
                  {!preferences.allowPartialPayments && (
                    <p className="text-xs text-amber-500 mt-1">Partial payments are disabled. Full payment required.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {paymentMethods.map(({ key, label, Icon }) => (
                      <button key={key} onClick={() => setPayMethod(key)}
                        className={cn("flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                          payMethod === key ? "bg-primary text-primary-foreground border-primary shadow-md" : "border-border/50 text-muted-foreground hover:border-emerald-500/30 hover:text-foreground")}>
                        <Icon className="h-5 w-5" />{label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setPayingJob(null)} className="flex-1 transition-all hover:scale-[1.02] active:scale-[0.98] border-border/50">Cancel</Button>
                  <Button onClick={handleJobPayment} disabled={payProcessing} className="flex-1 gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    {payProcessing ? (<><Loader2 className="h-4 w-4 animate-spin" />Recording...</>) : "Record Payment"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* New Job intake sheet */}
      <Sheet open={showIntake} onOpenChange={setShowIntake}>
        <SheetContent side="bottom" className="h-auto max-h-[85vh] border-t border-border bg-background text-foreground p-6 rounded-t-2xl overflow-y-auto">
          <div className="animate-page-enter max-w-2xl mx-auto">
            <SheetHeader className="mb-6 space-y-1">
              <SheetTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" /> Register New Repair Job
              </SheetTitle>
              <SheetDescription className="text-muted-foreground text-base">
                Intake a device for repair. The job will appear in the technician queue instantly.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2"><User className="h-3.5 w-3.5 text-muted-foreground" /> Customer *</label>
                  <select value={intCustomerId} onChange={(e) => setIntCustomerId(e.target.value)} className={selectClasses}>
                    <option value="">Select existing customer…</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} {c.phone ? `— ${c.phone}` : ""}</option>
                    ))}
                  </select>
                  {!intCustomerId && (
                    <div className="space-y-2 animate-page-enter">
                      <Input value={intNewName} onChange={(e) => setIntNewName(e.target.value)} placeholder="…or type new customer name *" className="bg-background/50 border-border/50" />
                      <Input value={intNewPhone} onChange={(e) => setIntNewPhone(e.target.value)} placeholder="Phone (optional)" className="bg-background/50 border-border/50" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Priority</label>
                  <select value={intPriority} onChange={(e) => setIntPriority(e.target.value)} className={selectClasses}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Device Type *</label>
                  <Input value={intDeviceType} onChange={(e) => setIntDeviceType(e.target.value)} placeholder="e.g., Smartphone" className="bg-background/50 border-border/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Model</label>
                  <Input value={intDeviceModel} onChange={(e) => setIntDeviceModel(e.target.value)} placeholder="e.g., iPhone 12 Pro" className="bg-background/50 border-border/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Serial / IMEI</label>
                  <Input value={intSerial} onChange={(e) => setIntSerial(e.target.value)} placeholder="Optional" className="bg-background/50 border-border/50 font-mono" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Reported Problem *</label>
                <textarea value={intProblem} onChange={(e) => setIntProblem(e.target.value)} placeholder="e.g., Cracked screen, device won't charge..." className="flex min-h-[70px] w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Notes (Optional)</label>
                <textarea value={intNotes} onChange={(e) => setIntNotes(e.target.value)} placeholder="Accessories received, lock pattern, etc..." className="flex min-h-[60px] w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowIntake(false)} className="flex-1 transition-all hover:scale-[1.02] active:scale-[0.98] border-border/50">Cancel</Button>
                <Button onClick={handleIntake} disabled={intSaving} className="flex-1 gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  {intSaving ? (<><Loader2 className="h-4 w-4 animate-spin" />Registering...</>) : (<><ClipboardList className="h-4 w-4" />Register Job</>)}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
            {/* Transaction Success Bar */}
            {lastTransaction && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 border-t-2 border-emerald-400 shadow-2xl">
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-white">
                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-base">
                    {lastTransaction.type === "sale" ? "Sale Completed!" : "Payment Recorded!"}
                  </p>
                  <p className="text-sm text-white/90">
                    {lastTransaction.type === "sale" 
                      ? `Invoice: ${lastTransaction.invoiceNumber}` 
                      : `Job: ${lastTransaction.jobNumber}`
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {preferences.autoGenerateReceipts && (
                  <Link href={lastTransaction.url}>
                    <Button 
                      size="lg"
                      className="bg-white text-emerald-700 hover:bg-white/90 font-semibold gap-2 shadow-lg transition-all hover:scale-105 active:scale-95"
                    >
                      <Printer className="w-5 h-5" />
                      Print Receipt
                    </Button>
                  </Link>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setLastTransaction(null)}
                  className="text-white hover:bg-white/20 p-2"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}