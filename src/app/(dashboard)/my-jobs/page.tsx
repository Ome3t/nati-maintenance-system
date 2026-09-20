"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Play, Check, Plus, Package, Ban, X, Trash2, Loader2, Copy, Wrench, Clock, FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/shared/stat-card";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { cn } from "@/lib/utils";

export default function MyJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ACTIVE");

  // Detail panel
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [laborCharge, setLaborCharge] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [newMaterial, setNewMaterial] = useState({ name: "", quantity: "1", unitCost: "" });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const fetchMyJobs = async () => {
    try {
      const res = await fetch("/api/my-jobs");
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []); // crash-proof
    } catch (error) {
      toast.error("Failed to load your jobs");
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
    setMaterials(job.items || []);
    setLaborCharge(String(job.laborCharge || ""));
    setDiagnosis(job.diagnosis || "");
  };

  const addMaterial = () => {
    if (!newMaterial.name || !newMaterial.unitCost) {
      toast.error("Material name and unit cost are required");
      return;
    }
    const qty = parseInt(newMaterial.quantity) || 1;
    const cost = parseFloat(newMaterial.unitCost) || 0;
    setMaterials([...materials, { name: newMaterial.name, quantity: qty, unitCost: cost, total: qty * cost, isNew: true }]);
    setNewMaterial({ name: "", quantity: "1", unitCost: "" });
  };

  const removeMaterial = (idx: number) => setMaterials(materials.filter((_, i) => i !== idx));

  const materialsTotal = materials.reduce((sum, m) => sum + Number(m.total), 0);
  const laborTotal = parseFloat(laborCharge) || 0;
  const grandTotal = materialsTotal + laborTotal;

  const saveJob = async (markDone: boolean = false) => {
    if (!selectedJob) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/jobs/${selectedJob.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosis,
          laborCharge: laborTotal,
          partsCharge: materialsTotal,
          total: grandTotal,
          items: materials.map((m) => ({
            name: m.name, quantity: m.quantity, unitCost: m.unitCost, total: m.total,
            productId: m.productId || null,
          })),
          ...(markDone && { status: "READY_FOR_PICKUP" }),
        }),
      });

      if (res.ok) {
        if (markDone) {
          toast.success(`Job #${selectedJob.jobNumber} sent to cashier for payment`);
          setSelectedJob(null);
        } else {
          toast.success("Progress saved");
          const updated = await res.json();
          setSelectedJob(updated);
          setMaterials(updated.items || []);
        }
        await fetchMyJobs();
      } else {
        toast.error("Failed to save job");
      }
    } catch (error) {
      toast.error("Failed to save job");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (jobId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Status updated: ${newStatus.replace(/_/g, " ").toLowerCase()}`);
        fetchMyJobs();
        if (selectedJob?.id === jobId) setSelectedJob({ ...selectedJob, status: newStatus });
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const statusStyle = (status: string) => {
    const styles: Record<string, { dot: string; label: string; color: string; pulse?: boolean }> = {
      IN_PROGRESS: { dot: "bg-blue-500", label: "In progress", color: "text-blue-500", pulse: true },
      WAITING_FOR_PARTS: { dot: "bg-amber-500", label: "Waiting for parts", color: "text-amber-500", pulse: true },
      COMPLETED: { dot: "bg-emerald-500", label: "Completed", color: "text-emerald-500" },
      NOT_REPAIRABLE: { dot: "bg-red-500", label: "Not repairable", color: "text-red-500" },
      READY_FOR_PICKUP: { dot: "bg-purple-500", label: "Ready for payment", color: "text-purple-500", pulse: true },
      DELIVERED: { dot: "bg-zinc-500", label: "Delivered", color: "text-zinc-500" },
      PENDING: { dot: "bg-zinc-400", label: "New", color: "text-zinc-400" },
      ASSIGNED: { dot: "bg-cyan-500", label: "Assigned", color: "text-cyan-500", pulse: true },
      CANCELLED: { dot: "bg-zinc-500", label: "Cancelled", color: "text-zinc-500" },
    };
    return styles[status] || { dot: "bg-zinc-400", label: status, color: "text-zinc-400" };
  };

  const filtered = jobs.filter((j) => {
    if (filter === "ACTIVE") return ["ASSIGNED", "IN_PROGRESS", "WAITING_FOR_PARTS"].includes(j.status);
    if (filter === "WAITING_PAYMENT") return j.status === "READY_FOR_PICKUP";
    if (filter === "DONE") return ["COMPLETED", "DELIVERED"].includes(j.status);
    if (filter === "FAILED") return ["NOT_REPAIRABLE", "CANCELLED"].includes(j.status);
    return true;
  });

  const counts = {
    ACTIVE: jobs.filter((j) => ["ASSIGNED", "IN_PROGRESS", "WAITING_FOR_PARTS"].includes(j.status)).length,
    WAITING_PAYMENT: jobs.filter((j) => j.status === "READY_FOR_PICKUP").length,
    DONE: jobs.filter((j) => ["COMPLETED", "DELIVERED"].includes(j.status)).length,
    FAILED: jobs.filter((j) => ["NOT_REPAIRABLE", "CANCELLED"].includes(j.status)).length,
    ALL: jobs.length,
  };

  const tabs = [
    { key: "ACTIVE", label: "Active" },
    { key: "WAITING_PAYMENT", label: "Ready for Payment" },
    { key: "DONE", label: "Done" },
    { key: "FAILED", label: "Not Repairable" },
    { key: "ALL", label: "All" },
  ];

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-foreground font-medium">My Jobs</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Jobs</h1>
          <p className="text-xs text-muted-foreground mt-1">Manage your repair jobs from intake to delivery.</p>
        </div>
        <Link href="/jobs/new">
          <Button className="gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <Plus className="h-4 w-4" /> New Job
          </Button>
        </Link>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Active Jobs" value={counts.ACTIVE} hint="In your workshop" />
        <StatCard label="Ready for Payment" value={counts.WAITING_PAYMENT} hint="With the cashier" trend="up" />
        <StatCard label="Completed" value={counts.DONE} hint="Delivered or finished" />
        <StatCard label="Total Assigned" value={counts.ALL} hint="All time" />
      </div>

      {/* Filter Tabs */}
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

      {/* Job List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card p-4 animate-pulse">
              <div className="flex justify-between mb-3">
                <div className="h-4 w-32 bg-muted/60 rounded" />
                <div className="h-4 w-24 bg-muted/60 rounded" />
              </div>
              <div className="h-3 w-2/3 bg-muted/60 rounded mb-2" />
              <div className="h-3 w-1/2 bg-muted/60 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border/50 shadow-sm rounded-xl text-center py-16 transition-all duration-300 ease-out hover:border-white/10 dark:hover:border-zinc-700">
          <Package className="mx-auto h-12 w-12 text-muted-foreground opacity-30 mb-3" />
          <p className="text-sm text-muted-foreground">No jobs in this category</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => {
            const s = statusStyle(job.status);
            return (
              <div
                key={job.id}
                onClick={() => openJob(job)}
                className="bg-card border border-border/50 shadow-sm rounded-xl p-4 cursor-pointer transition-all duration-200 ease-out hover:scale-[1.01] hover:border-emerald-500/30 hover:shadow-lg active:scale-[0.99] animate-page-enter"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-bold text-foreground font-mono">
                        #{job.jobNumber.replace(/^JOB-?/, "")}
                      </span>
                      <span className={cn("flex items-center gap-1.5 text-xs font-medium", s.color)}>
                        <span className="relative flex h-1.5 w-1.5">
                          {s.pulse && <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", s.dot)} />}
                          <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", s.dot)} />
                        </span>
                        {s.label}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {job.deviceType} {job.deviceModel || ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="text-sm font-medium text-foreground">{job.customer?.name || "—"}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">{job.problem}</p>
                {Number(job.total) > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Total: <span className="font-semibold text-foreground">{Number(job.total).toLocaleString()} ETB</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Job Editor Drawer */}
      <Sheet open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <SheetContent side="right" className="w-full sm:w-[480px] border-l border-border bg-background text-foreground h-full p-0 flex flex-col">
          {selectedJob && (
            <div className="animate-page-enter flex-1 flex flex-col overflow-hidden">
              <SheetHeader className="px-6 py-5 border-b border-border/50 space-y-1">
                <SheetTitle className="text-xl font-bold text-foreground">
                  {selectedJob.deviceType} {selectedJob.deviceModel || ""}
                </SheetTitle>
                <SheetDescription className="flex items-center gap-2 text-muted-foreground text-sm">
                  <span className="font-mono">#{selectedJob.jobNumber}</span>
                  <button onClick={() => copyToClipboard(selectedJob.jobNumber)} className="hover:text-foreground transition-colors">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Customer */}
                <div className="rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Customer</h3>
                  <p className="text-sm font-medium text-foreground">{selectedJob.customer?.name || "—"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedJob.customer?.phone || "No phone"}</p>
                </div>

                {/* Problem */}
                <div className="rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Reported Problem</h3>
                  <p className="text-sm text-foreground leading-relaxed">{selectedJob.problem}</p>
                </div>

                {/* Diagnosis */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Diagnosis / Notes</label>
                  <textarea
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="What did you find? What did you do?"
                    rows={3}
                    className="flex w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  />
                </div>

                {/* Materials */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Materials Used</label>
                  {materials.length > 0 && (
                    <div className="space-y-2">
                      {materials.map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/50">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                            <p className="text-xs text-muted-foreground">{m.quantity} × {Number(m.unitCost).toLocaleString()} ETB</p>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <span className="text-sm font-semibold text-foreground">{Number(m.total).toLocaleString()}</span>
                            <button onClick={() => removeMaterial(idx)} className="text-muted-foreground hover:text-red-500 p-1 transition-all hover:scale-110 active:scale-95">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="rounded-xl border border-border/50 bg-muted/30 p-3 space-y-2">
                    <Input
                      type="text"
                      placeholder="Material name (e.g., Screen)"
                      value={newMaterial.name}
                      onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                      className="bg-background/50 border-border/50"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Qty"
                        min="1"
                        value={newMaterial.quantity}
                        onChange={(e) => setNewMaterial({ ...newMaterial, quantity: e.target.value })}
                        className="bg-background/50 border-border/50"
                      />
                      <Input
                        type="number"
                        placeholder="Unit cost (ETB)"
                        min="0"
                        value={newMaterial.unitCost}
                        onChange={(e) => setNewMaterial({ ...newMaterial, unitCost: e.target.value })}
                        className="bg-background/50 border-border/50"
                      />
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addMaterial} className="w-full gap-1.5 border-border/50 transition-all hover:scale-[1.02] active:scale-[0.98]">
                      <Plus className="h-3.5 w-3.5" /> Add Material
                    </Button>
                  </div>
                </div>

                {/* Labor */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Labor Charge (ETB)</label>
                  <Input
                    type="number"
                    value={laborCharge}
                    onChange={(e) => setLaborCharge(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="bg-background/50 border-border/50"
                  />
                </div>

                {/* Cost Summary */}
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 transition-colors hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Materials</span>
                    <span className="text-sm font-medium text-foreground">{materialsTotal.toLocaleString()} ETB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Labor</span>
                    <span className="text-sm font-medium text-foreground">{laborTotal.toLocaleString()} ETB</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-sm font-bold text-foreground">Total</span>
                    <span className="text-lg font-bold text-foreground">
                      <AnimatedCounter value={grandTotal} suffix=" ETB" />
                    </span>
                  </div>
                </div>
              </div>

                            {/* Actions Footer */}
                            <div className="border-t border-border/50 p-4 space-y-2 bg-background">
                {/* ✅ View Full Details — always visible, first item */}
                <Link href={`/jobs/${selectedJob.id}`} className="block">
                  <Button variant="outline" className="w-full gap-2 border-border/50 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    <FileText className="h-4 w-4" /> View Full Details
                  </Button>
                </Link>

                {selectedJob.status === "ASSIGNED" && (
                  <Button onClick={() => updateStatus(selectedJob.id, "IN_PROGRESS")} className="w-full gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    <Play className="h-4 w-4" /> Start Work
                  </Button>
                )}

                {["IN_PROGRESS", "WAITING_FOR_PARTS"].includes(selectedJob.status) && (
                  <>
                    <Button variant="outline" onClick={() => saveJob(false)} disabled={saving} className="w-full border-border/50 transition-all hover:scale-[1.02] active:scale-[0.98]">
                      {saving ? (<><Loader2 className="h-4 w-4 animate-spin" />Saving...</>) : "Save Progress"}
                    </Button>
                    <Button onClick={() => saveJob(true)} disabled={saving || grandTotal === 0} className="w-full gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
                      <Check className="h-4 w-4" /> Mark Work Done → Send to Cashier
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => updateStatus(selectedJob.id, "NOT_REPAIRABLE")}
                      className="w-full gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Ban className="h-4 w-4" /> Mark Not Repairable
                    </Button>
                    {selectedJob.status !== "WAITING_FOR_PARTS" && (
                      <button onClick={() => updateStatus(selectedJob.id, "WAITING_FOR_PARTS")} className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5">
                        <Clock className="h-3 w-3" /> Mark as Waiting for Parts
                      </button>
                    )}
                  </>
                )}

                {selectedJob.status === "READY_FOR_PICKUP" && (
                  <div className="text-center py-3">
                    <p className="text-sm text-emerald-500 font-medium flex items-center justify-center gap-2">
                      <Check className="h-4 w-4" /> Sent to Cashier
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Waiting for customer payment</p>
                  </div>
                )}
              </div>
              </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}