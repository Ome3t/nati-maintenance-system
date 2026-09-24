"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Plus, Phone, User, Calendar, Wrench, Copy, Check, Package } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/shared/stat-card";
import { cn } from "@/lib/utils";

interface Job {
  id: string;
  jobNumber: string;
  customer: { name: string; phone?: string };
  technician?: { name: string };
  assignedTechnicians?: { id: string; name: string }[];
  deviceType: string;
  deviceModel?: string;
  problem: string;
  status: string;
  priority: string;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Failed to load jobs");
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

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.jobNumber.toLowerCase().includes(search.toLowerCase()) ||
      job.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      job.deviceType.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "ALL" || job.status === filter;
    return matchesSearch && matchesFilter;
  });

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

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  const counts = {
    ALL: jobs.length,
    PENDING: jobs.filter((j) => j.status === "PENDING").length,
    ASSIGNED: jobs.filter((j) => j.status === "ASSIGNED").length,
    IN_PROGRESS: jobs.filter((j) => j.status === "IN_PROGRESS").length,
    WAITING_FOR_PARTS: jobs.filter((j) => j.status === "WAITING_FOR_PARTS").length,
    READY_FOR_PICKUP: jobs.filter((j) => j.status === "READY_FOR_PICKUP").length,
    COMPLETED: jobs.filter((j) => j.status === "COMPLETED").length,
  };

  const tabs = [
    { key: "ALL", label: "All" },
    { key: "PENDING", label: "New" },
    { key: "ASSIGNED", label: "Assigned" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "WAITING_FOR_PARTS", label: "Waiting" },
    { key: "READY_FOR_PICKUP", label: "Ready" },
    { key: "COMPLETED", label: "Completed" },
  ];

  return (
    <div className="space-y-6 animate-page-enter">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Jobs</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Jobs</h1>
          <p className="text-xs text-muted-foreground mt-1">Track every repair job across the whole workshop.</p>
        </div>
        <Link href="/jobs/new">
          <Button className="gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <Plus className="h-4 w-4" /> New Job
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Jobs" value={counts.ALL} hint="All time" />
        <StatCard label="In Workshop" value={counts.ASSIGNED + counts.IN_PROGRESS + counts.WAITING_FOR_PARTS} hint="Being worked on" />
        <StatCard label="Ready for Pickup" value={counts.READY_FOR_PICKUP} hint="Awaiting payment" trend="up" />
        <StatCard label="Completed" value={counts.COMPLETED} hint="Finished jobs" />
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
            placeholder="Search by job number, customer, or device..."
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
                  <div className="h-4 w-20 bg-muted/50 rounded" />
                  <div className="h-4 w-28 bg-muted/50 rounded" />
                  <div className="h-4 w-32 bg-muted/50 rounded" />
                  <div className="h-4 w-24 bg-muted/50 rounded ml-auto" />
                </div>
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No jobs found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 hover:bg-transparent">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Job #</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Device</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Technician(s)</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => {
                  const s = statusStyle(job.status);
                  return (
                    <tr
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className="border-b border-border/50 last:border-0 cursor-pointer transition-colors hover:bg-accent/50"
                    >
                      <td className="px-5 py-4 text-sm font-bold text-foreground font-mono">
                        #{job.jobNumber.replace(/^JOB-?/, "")}
                      </td>
                      <td className="px-5 py-4 text-sm text-foreground">{job.customer?.name || "—"}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground hidden md:table-cell">
                        {job.deviceType} {job.deviceModel || ""}
                      </td>
                      <td className="px-5 py-4 text-sm hidden sm:table-cell">
                        {job.assignedTechnicians && job.assignedTechnicians.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {job.assignedTechnicians.map((t) => (
                              <span key={t.id} className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                {t.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          job.technician?.name || <span className="text-amber-500 text-xs font-medium">Unassigned</span>
                        )}
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
                      <td className="px-5 py-4 text-right text-xs text-muted-foreground">{timeAgo(job.updatedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

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
                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                  <span className={cn("flex items-center gap-2 text-sm font-medium", statusStyle(selectedJob.status).color)}>
                    <span className="relative flex h-2 w-2">
                      {statusStyle(selectedJob.status).pulse && (
                        <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", statusStyle(selectedJob.status).dot)} />
                      )}
                      <span className={cn("relative inline-flex rounded-full h-2 w-2", statusStyle(selectedJob.status).dot)} />
                    </span>
                    {statusStyle(selectedJob.status).label}
                  </span>
                  <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", priorityStyle(selectedJob.priority))}>
                    {selectedJob.priority}
                  </span>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 transition-colors hover:bg-muted/50">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Customer</h3>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {selectedJob.customer?.name || "—"}
                  </div>
                  {selectedJob.customer?.phone && (
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {selectedJob.customer.phone}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Problem</h3>
                  <p className="text-sm text-foreground leading-relaxed">{selectedJob.problem}</p>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Assigned To</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.assignedTechnicians && selectedJob.assignedTechnicians.length > 0 ? (
                      selectedJob.assignedTechnicians.map((t) => (
                        <span key={t.id} className="flex items-center gap-1.5 text-sm text-foreground bg-primary/10 px-2 py-1 rounded-md">
                          <Wrench className="h-3.5 w-3.5 text-primary" />
                          {t.name}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-foreground flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                        {selectedJob.technician?.name || <span className="text-amber-500">Not assigned yet</span>}
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 transition-colors hover:bg-muted/50">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Payment</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="text-sm font-bold text-foreground">{Number(selectedJob.total).toLocaleString()} ETB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Paid</span>
                    <span className="text-sm font-medium text-emerald-500">{Number(selectedJob.paidAmount).toLocaleString()} ETB</span>
                  </div>
                  {Number(selectedJob.remainingAmount) > 0 && (
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <span className="text-sm font-medium text-foreground">Remaining</span>
                      <span className="text-sm font-bold text-amber-500">{Number(selectedJob.remainingAmount).toLocaleString()} ETB</span>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 transition-colors hover:bg-muted/50">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Timeline</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" /> Created {timeAgo(selectedJob.createdAt)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" /> Updated {timeAgo(selectedJob.updatedAt)}
                  </div>
                </div>
              </div>

              <div className="border-t border-border/50 p-4 bg-background">
                <Link href={`/jobs/${selectedJob.id}`} className="block">
                  <Button className="w-full transition-all hover:scale-[1.02] active:scale-[0.98]">View Full Details</Button>
                </Link>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}