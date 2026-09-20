"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Banknote, CreditCard, Smartphone, Check, Package, Loader2, Copy, Printer, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/shared/stat-card";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { cn } from "@/lib/utils";

const paymentMethods = [
  { key: "CASH", label: "Cash", Icon: Banknote },
  { key: "BANK_TRANSFER", label: "Bank", Icon: CreditCard },
  { key: "MOBILE_MONEY", label: "Mobile", Icon: Smartphone },
];

export default function PendingPaymentsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paidAmount, setPaidAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchPendingJobs();
  }, []);

  const fetchPendingJobs = async () => {
    try {
      const res = await fetch("/api/jobs?status=READY_FOR_PICKUP");
      const data = await res.json();
      // Only show jobs that still owe money
      setJobs((Array.isArray(data) ? data : []).filter((j: any) => j.paymentStatus !== "PAID"));
    } catch (error) {
      toast.error("Failed to load pending payments");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Job number copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const openJob = (job: any) => {
    setSelectedJob(job);
    // Pre-fill with what's actually still owed (falls back to total)
    const due = Number(job.remainingAmount) > 0 ? Number(job.remainingAmount) : Number(job.total);
    setPaidAmount(String(due));
    setPaymentMethod("CASH");
  };

  const handleCollect = async () => {
    if (!selectedJob) return;
    const amount = parseFloat(paidAmount) || 0;
    if (amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setProcessing(true);

    try {
      const res = await fetch(`/api/jobs/${selectedJob.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, method: paymentMethod }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to record payment");
      }

      toast.success(`${amount.toLocaleString()} ETB collected from ${selectedJob.customer?.name}`, {
        action: { label: "Print Receipt", onClick: () => window.location.href = `/receipts/job/${selectedJob.id}` },
      });
      setSelectedJob(null);
      fetchPendingJobs();
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment");
    } finally {
      setProcessing(false);
    }
  };

  /* ---------- Aging badge: how long the money has been waiting ---------- */
  const daysWaiting = (job: any) => {
    const base = job.completedAt || job.updatedAt;
    if (!base) return 0;
    return Math.floor((Date.now() - new Date(base).getTime()) / 86400000);
  };

  const agingStyle = (days: number) => {
    if (days <= 0) return { label: "Today", cls: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" };
    if (days < 3) return { label: `Waiting ${days}d`, cls: "bg-amber-500/10 text-amber-500 border-amber-500/20" };
    return { label: `Overdue ${days}d`, cls: "bg-red-500/10 text-red-500 border-red-500/20" };
  };

  const filteredJobs = jobs.filter((j) => {
    const q = search.toLowerCase();
    return (
      !q ||
      j.jobNumber.toLowerCase().includes(q) ||
      (j.customer?.name || "").toLowerCase().includes(q) ||
      (j.deviceType || "").toLowerCase().includes(q) ||
      (j.deviceModel || "").toLowerCase().includes(q)
    );
  });

  const totalOutstanding = jobs.reduce((sum, j) => sum + (Number(j.remainingAmount) || Number(j.total) || 0), 0);
  const totalValue = jobs.reduce((sum, j) => sum + Number(j.total || 0), 0);
  const avgBill = jobs.length > 0 ? totalValue / jobs.length : 0;

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Pending Payments</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pending Payments</h1>
        <p className="text-xs text-muted-foreground mt-1">Jobs ready for customer pickup — collect payment</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Jobs Awaiting" value={jobs.length} hint="Ready for pickup" />
        <StatCard label="Outstanding" value={totalOutstanding} suffix=" ETB" hint="To collect" trend="down" />
        <StatCard label="Total Bill Value" value={totalValue} suffix=" ETB" hint="All pending jobs" />
        <StatCard label="Avg. Bill" value={Math.round(avgBill)} suffix=" ETB" hint="Per job" />
      </div>

      {/* Search */}
      <div className="bg-card border border-border/50 shadow-sm rounded-xl p-4 transition-all duration-300 ease-out hover:border-white/10 dark:hover:border-zinc-700">
        <div className="relative">
          <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by job #, customer, or device..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50 border-border/50"
          />
        </div>
      </div>

      {/* Job Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card p-5 animate-pulse">
              <div className="h-4 w-1/3 bg-muted/60 rounded mb-3" />
              <div className="h-5 w-1/2 bg-muted/60 rounded mb-2" />
              <div className="h-3 w-2/3 bg-muted/60 rounded mb-4" />
              <div className="h-4 w-full bg-muted/60 rounded" />
            </div>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-card border border-border/50 shadow-sm rounded-xl text-center py-16 transition-all duration-300 ease-out hover:border-white/10 dark:hover:border-zinc-700">
          <Package className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-3" />
          <p className="text-sm text-muted-foreground">
            {jobs.length === 0 ? "No jobs waiting for payment" : "No jobs match your search"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredJobs.map((job) => {
            const days = daysWaiting(job);
            const age = agingStyle(days);
            return (
              <button
                key={job.id}
                onClick={() => openJob(job)}
                className="bg-card border border-border/50 shadow-sm rounded-xl p-5 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-emerald-500/30 hover:shadow-lg animate-page-enter"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-muted-foreground font-mono">
                        #{job.jobNumber.replace(/^JOB-?/, "")}
                      </span>
                      <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", age.cls)}>
                        {age.label}
                      </span>
                    </div>
                    <p className="text-base font-semibold text-foreground">{job.customer?.name || "Walk-in"}</p>
                    <p className="text-sm text-muted-foreground">{job.customer?.phone || "No phone"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-xl font-bold text-foreground">{Number(job.total).toLocaleString()} ETB</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-amber-500 mb-3">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                  </span>
                  Ready for pickup
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border/50">
                  <span>Device: <span className="text-foreground">{job.deviceType} {job.deviceModel || ""}</span></span>
                  <span>Materials: <span className="text-foreground">{Number(job.partsCharge || 0).toLocaleString()}</span></span>
                  <span>Labor: <span className="text-foreground">{Number(job.laborCharge || 0).toLocaleString()}</span></span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Collect Payment Drawer */}
      <Sheet open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <SheetContent side="right" className="w-full sm:w-[480px] border-l border-border bg-background text-foreground h-full p-0 flex flex-col">
          {selectedJob && (
            <div className="animate-page-enter flex-1 flex flex-col overflow-hidden">
              <SheetHeader className="px-6 py-5 border-b border-border/50 space-y-1">
                <SheetTitle className="text-xl font-bold text-foreground">Collect Payment</SheetTitle>
                <SheetDescription className="flex items-center gap-2 text-muted-foreground text-sm">
                  <span className="font-mono">#{selectedJob.jobNumber}</span>
                  <button onClick={() => copyToClipboard(selectedJob.jobNumber)} className="hover:text-foreground transition-colors">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <span>· {selectedJob.customer?.name}</span>
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Bill Breakdown */}
                <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-2 transition-colors hover:bg-muted/50">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Bill Breakdown</h3>
                  {selectedJob.items && selectedJob.items.length > 0 && (
                    <>
                      {selectedJob.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{item.name} × {item.quantity}</span>
                          <span className="font-medium text-foreground">{Number(item.total).toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between text-sm pt-2 border-t border-border/50">
                        <span className="text-muted-foreground">Materials subtotal</span>
                        <span className="font-medium text-foreground">{Number(selectedJob.partsCharge || 0).toLocaleString()}</span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Labor</span>
                    <span className="font-medium text-foreground">{Number(selectedJob.laborCharge || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t-2 border-border/50">
                    <span className="text-sm font-bold text-foreground">TOTAL</span>
                    <span className="text-2xl font-bold text-foreground">
                      <AnimatedCounter value={Number(selectedJob.total)} suffix=" ETB" />
                    </span>
                  </div>
                  {Number(selectedJob.paidAmount) > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Already paid</span>
                      <span className="font-medium text-emerald-500">{Number(selectedJob.paidAmount).toLocaleString()} ETB</span>
                    </div>
                  )}
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount to Collect (ETB)</label>
                  <Input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    min="0"
                    className="bg-background/50 border-border/50 text-lg font-bold"
                  />
                </div>

                {/* Method */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {paymentMethods.map(({ key, label, Icon }) => (
                      <button
                        key={key}
                        onClick={() => setPaymentMethod(key)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                          paymentMethod === key
                            ? "bg-primary text-primary-foreground border-primary shadow-md"
                            : "border-border/50 text-muted-foreground hover:border-emerald-500/30 hover:text-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer actions */}
              <div className="border-t border-border/50 p-4 bg-background space-y-2">
                <Button onClick={handleCollect} disabled={processing} className="w-full gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Collect Payment
                    </>
                  )}
                </Button>
                <Link href={`/receipts/job/${selectedJob.id}`} className="block">
                  <Button variant="outline" className="w-full gap-2 border-border/50 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    <Printer className="h-4 w-4" /> View Receipt / Delivery Note
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}