"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft, Printer, Copy, Check, User, Phone, Wrench, Calendar,
  Play, PackageCheck, Truck, Ban, Receipt, Package, Smartphone, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/shared/stat-card";
import { cn } from "@/lib/utils";

const statusStyle = (status: string) => {
  const styles: Record<string, { dot: string; label: string; color: string; pulse?: boolean }> = {
    IN_PROGRESS: { dot: "bg-blue-500", label: "In progress", color: "text-blue-500", pulse: true },
    WAITING_FOR_PARTS: { dot: "bg-amber-500", label: "Waiting for parts", color: "text-amber-500", pulse: true },
    COMPLETED: { dot: "bg-emerald-500", label: "Completed", color: "text-emerald-500" },
    READY_FOR_PICKUP: { dot: "bg-purple-500", label: "Ready for pickup", color: "text-purple-500", pulse: true },
    PENDING: { dot: "bg-zinc-400", label: "New", color: "text-zinc-400" },
    ASSIGNED: { dot: "bg-cyan-500", label: "Assigned", color: "text-cyan-500", pulse: true },
    CANCELLED: { dot: "bg-red-500", label: "Cancelled", color: "text-red-500" },
    NOT_REPAIRABLE: { dot: "bg-red-500", label: "Not repairable", color: "text-red-500" },
    DELIVERED: { dot: "bg-zinc-500", label: "Delivered", color: "text-zinc-500" },
  };
  return styles[status] || { dot: "bg-zinc-400", label: status, color: "text-zinc-400" };
};

const priorityStyle = (p: string) => {
  const styles: Record<string, string> = {
    URGENT: "bg-red-500/10 text-red-500 border-red-500/20",
    HIGH: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    MEDIUM: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    LOW: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
  };
  return styles[p] || styles.LOW;
};

const paymentStatusStyle = (s: string) => {
  const styles: Record<string, string> = {
    PAID: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    PARTIALLY_PAID: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    UNPAID: "bg-red-500/10 text-red-500 border-red-500/20",
  };
  return styles[s] || styles.UNPAID;
};

const fmtDate = (d: any) =>
  d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/jobs/${params.id}`)
      .then((r) => r.json())
      .then((data) => { setJob(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Job number copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const updateStatus = async (status: string) => {
    if (!job) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setJob(updated);
      toast.success(`Status updated: ${status.replace(/_/g, " ").toLowerCase()}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-page-enter">
        <div className="h-4 w-48 bg-muted/50 rounded animate-pulse" />
        <div className="h-8 w-72 bg-muted/50 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-muted/50 rounded-xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-muted/50 rounded-xl animate-pulse" />
          <div className="h-64 bg-muted/50 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!job || job.error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground animate-page-enter">
        <Package className="h-12 w-12 mb-3 opacity-20" />
        <p className="text-sm mb-4">Job not found.</p>
        <Button variant="outline" onClick={() => router.push("/jobs")} className="gap-2 border-border/50">
          <ArrowLeft className="h-4 w-4" /> Back to Jobs
        </Button>
      </div>
    );
  }

  const s = statusStyle(job.status);

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href="/jobs" className="hover:text-foreground transition-colors">Jobs</Link>
        <span>/</span>
        <span className="text-foreground font-medium font-mono">#{job.jobNumber}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">
              {job.deviceType} {job.deviceModel || ""}
            </h1>
            <button
              onClick={() => copyToClipboard(job.jobNumber)}
              className="flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/30 px-3 py-1 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              #{job.jobNumber}
              {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={cn("flex items-center gap-1.5 text-xs font-medium", s.color)}>
              <span className="relative flex h-2 w-2">
                {s.pulse && <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", s.dot)} />}
                <span className={cn("relative inline-flex rounded-full h-2 w-2", s.dot)} />
              </span>
              {s.label}
            </span>
            <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", priorityStyle(job.priority))}>
              {job.priority}
            </span>
            <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", paymentStatusStyle(job.paymentStatus))}>
              {job.paymentStatus?.replace(/_/g, " ").toLowerCase()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/jobs")} className="gap-2 border-border/50 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Link href={`/receipts/job/${job.id}`}>
            <Button className="gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Printer className="h-4 w-4" /> Receipt / Delivery Note
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={Number(job.total)} suffix=" ETB" hint="Job value" />
        <StatCard label="Paid" value={Number(job.paidAmount)} suffix=" ETB" hint="Collected so far" trend="up" />
        <StatCard label="Remaining" value={Number(job.remainingAmount)} suffix=" ETB" hint="Balance due" trend="down" />
        <StatCard label="Labor Charge" value={Number(job.laborCharge)} suffix=" ETB" hint={`Parts: ${Number(job.partsCharge).toLocaleString()} ETB`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Problem */}
          <div className="bg-card border border-border/50 shadow-sm rounded-xl p-5 transition-all duration-300 ease-out hover:border-white/10 dark:hover:border-zinc-700">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Reported Problem</h3>
            <p className="text-sm text-foreground leading-relaxed">{job.problem}</p>
          </div>

          {/* Diagnosis */}
          {job.diagnosis && (
            <div className="bg-card border border-border/50 shadow-sm rounded-xl p-5 transition-all duration-300 ease-out hover:border-white/10 dark:hover:border-zinc-700">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Diagnosis / Technician Notes</h3>
              <p className="text-sm text-foreground leading-relaxed">{job.diagnosis}</p>
            </div>
          )}

          {/* Materials */}
          <div className="bg-card border border-border/50 shadow-sm rounded-xl overflow-hidden transition-all duration-300 ease-out hover:border-white/10 dark:hover:border-zinc-700">
            <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Materials Used</h3>
            </div>
            {job.items?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Material</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Qty</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Unit Cost</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {job.items.map((item: any) => (
                      <tr key={item.id} className="border-b border-border/50 last:border-0 transition-colors hover:bg-accent/50">
                        <td className="px-5 py-3 text-sm font-medium text-foreground">{item.name}</td>
                        <td className="px-5 py-3 text-sm text-muted-foreground text-right">{item.quantity}</td>
                        <td className="px-5 py-3 text-sm text-muted-foreground text-right">{Number(item.unitCost).toLocaleString()}</td>
                        <td className="px-5 py-3 text-sm font-semibold text-foreground text-right">{Number(item.total).toLocaleString()} ETB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">No materials used yet.</p>
            )}
          </div>

          {/* Payment History */}
          <div className="bg-card border border-border/50 shadow-sm rounded-xl overflow-hidden transition-all duration-300 ease-out hover:border-white/10 dark:hover:border-zinc-700">
            <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Payment History</h3>
            </div>
            {job.payments?.length ? (
              <div className="divide-y divide-border/50">
                {job.payments.map((p: any) => (
                  <div key={p.id} className="px-5 py-3 flex items-center justify-between transition-colors hover:bg-accent/50">
                    <div>
                      <p className="text-sm font-medium text-foreground font-mono">{p.paymentNumber}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {p.method?.replace(/_/g, " ").toLowerCase()} · {fmtDate(p.createdAt)}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-emerald-500">+{Number(p.amount).toLocaleString()} ETB</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">No payments recorded yet.</p>
            )}
          </div>
        </div>

        {/* Right column (1/3) */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="bg-card border border-border/50 shadow-sm rounded-xl p-5 space-y-2 transition-all duration-300 ease-out hover:border-white/10 dark:hover:border-zinc-700">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Customer</h3>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <User className="h-4 w-4 text-muted-foreground" /> {job.customer?.name || "—"}
            </div>
            {job.customer?.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" /> {job.customer.phone}
              </div>
            )}
          </div>

          {/* Device */}
          <div className="bg-card border border-border/50 shadow-sm rounded-xl p-5 space-y-2 transition-all duration-300 ease-out hover:border-white/10 dark:hover:border-zinc-700">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Device</h3>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Smartphone className="h-4 w-4 text-muted-foreground" /> {job.deviceType} {job.deviceModel || ""}
            </div>
            {job.serialNumber && (
              <div className="text-xs text-muted-foreground font-mono pl-6">SN: {job.serialNumber}</div>
            )}
          </div>

          {/* Technician */}
          <div className="bg-card border border-border/50 shadow-sm rounded-xl p-5 transition-all duration-300 ease-out hover:border-white/10 dark:hover:border-zinc-700">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Assigned To</h3>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              {job.technician?.name || <span className="text-amber-500">Unassigned</span>}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-card border border-border/50 shadow-sm rounded-xl p-5 space-y-3 transition-all duration-300 ease-out hover:border-white/10 dark:hover:border-zinc-700">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Timeline</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" /> Created {fmtDate(job.createdAt)}
            </div>
            {job.startedAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Play className="h-4 w-4" /> Started {fmtDate(job.startedAt)}
              </div>
            )}
            {job.completedAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <PackageCheck className="h-4 w-4" /> Completed {fmtDate(job.completedAt)}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" /> Updated {fmtDate(job.updatedAt)}
            </div>
          </div>

          {/* Owner quick actions */}
          {userRole === "OWNER" && !["DELIVERED", "CANCELLED", "NOT_REPAIRABLE"].includes(job.status) && (
            <div className="bg-card border border-border/50 shadow-sm rounded-xl p-5 space-y-2 transition-all duration-300 ease-out hover:border-white/10 dark:hover:border-zinc-700">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Quick Actions</h3>
              {["PENDING", "ASSIGNED"].includes(job.status) && (
                <Button size="sm" variant="outline" disabled={updating} onClick={() => updateStatus("IN_PROGRESS")} className="w-full gap-2 border-border/50 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <Play className="h-3.5 w-3.5" /> Start Work
                </Button>
              )}
              {["IN_PROGRESS", "WAITING_FOR_PARTS"].includes(job.status) && (
                <Button size="sm" variant="outline" disabled={updating} onClick={() => updateStatus("READY_FOR_PICKUP")} className="w-full gap-2 border-border/50 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <PackageCheck className="h-3.5 w-3.5" /> Ready for Pickup
                </Button>
              )}
              {job.status === "READY_FOR_PICKUP" && (
                <Button size="sm" variant="outline" disabled={updating} onClick={() => updateStatus("DELIVERED")} className="w-full gap-2 border-border/50 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <Truck className="h-3.5 w-3.5" /> Mark Delivered
                </Button>
              )}
              <Button size="sm" variant="outline" disabled={updating} onClick={() => updateStatus("NOT_REPAIRABLE")} className="w-full gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <Ban className="h-3.5 w-3.5" /> Not Repairable
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}