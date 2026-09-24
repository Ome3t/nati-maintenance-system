"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2, Save, User, Wrench, Banknote, CreditCard, Smartphone as MobileMoney, Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { cn } from "@/lib/utils";

const selectClasses =
  "flex h-9 w-full rounded-md border border-border/50 bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const priorities = [
  { key: "LOW", label: "Low", active: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 border-zinc-500/40 shadow-sm" },
  { key: "MEDIUM", label: "Medium", active: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/40 shadow-sm" },
  { key: "HIGH", label: "High", active: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/40 shadow-sm" },
  { key: "URGENT", label: "Urgent", active: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/40 shadow-sm" },
];

const paymentMethods = [
  { key: "CASH", label: "Cash", Icon: Banknote },
  { key: "BANK_TRANSFER", label: "Bank", Icon: CreditCard },
  { key: "MOBILE_MONEY", label: "Mobile", Icon: MobileMoney },
];

export default function NewJobPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [problem, setProblem] = useState("");
  const [priority, setPriority] = useState("MEDIUM");

  const [technicians, setTechnicians] = useState<any[]>([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([]);

  const [laborCharge, setLaborCharge] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  const [loading, setLoading] = useState(false);

  const sessionLoading = session === undefined;
  const userRole = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;

  const toggleTechnician = (id: string) => {
    setSelectedTechnicians(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    fetch("/api/technicians")
      .then((r) => r.json())
      .then((data) => {
        setTechnicians(Array.isArray(data) ? data : []);
        if (userRole === "TECHNICIAN" && userId) {
          setSelectedTechnicians([userId]);
        }
      })
      .catch(() => {});
  }, [session, userRole, userId]);

  const labor = parseFloat(laborCharge) || 0;
  const paid = parseFloat(paidAmount) || 0;
  const balance = Math.max(0, labor - paid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !customerPhone || !deviceType || !problem) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (selectedTechnicians.length === 0) {
      toast.error("Please select at least one technician");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          deviceType,
          deviceModel,
          serialNumber,
          problem,
          priority,
          technicianId: selectedTechnicians[0], // Primary assignee
          technicianIds: selectedTechnicians,   // All assignees
          createdById: userId,
          laborCharge: labor,
          paymentMethod,
          paidAmount: paid,
          status: "ASSIGNED",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create job");
      }

      const job = await response.json();
      toast.success(`Job ${job.jobNumber} created successfully`);

      setTimeout(() => {
        if (userRole === "TECHNICIAN") {
          router.push("/my-jobs");
        } else {
          router.push("/jobs");
        }
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || "Failed to create job");
      setLoading(false);
    }
  };

  const backHref = userRole === "TECHNICIAN" ? "/my-jobs" : "/jobs";

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-page-enter">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href={backHref} className="hover:text-foreground transition-colors">Jobs</Link>
        <span>/</span>
        <span className="text-foreground font-medium">New Job</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Create Repair Job</h1>
        <p className="text-xs text-muted-foreground mt-1">Register a new device for repair and assign it to technicians.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card border border-border/50 shadow-sm rounded-xl overflow-hidden transition-all duration-300 ease-out hover:border-white/10 dark:hover:border-zinc-700">
          <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Customer Information</h2>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer Name *</label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full name" className="bg-background/50 border-border/50" required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone Number *</label>
              <Input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="0911223344" className="bg-background/50 border-border/50" required />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/50 shadow-sm rounded-xl overflow-hidden transition-all duration-300 ease-out hover:border-white/10 dark:hover:border-zinc-700">
          <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Device & Problem</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Device Type *</label>
                <select value={deviceType} onChange={(e) => setDeviceType(e.target.value)} className={selectClasses} required>
                  <option value="">Select</option>
                  <option value="Phone">Phone</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Laptop">Laptop</option>
                  <option value="Desktop">Desktop</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Model</label>
                <Input value={deviceModel} onChange={(e) => setDeviceModel(e.target.value)} placeholder="Samsung A24" className="bg-background/50 border-border/50" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Serial / IMEI</label>
                <Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="Optional" className="bg-background/50 border-border/50 font-mono" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Problem Description *</label>
              <textarea
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="Describe the issue..."
                rows={3}
                required
                className="flex w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority</label>
              <div className="grid grid-cols-4 gap-2">
                {priorities.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPriority(p.key)}
                    className={cn(
                      "py-2 text-xs font-medium rounded-xl border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                      priority === p.key
                        ? p.active
                        : "bg-transparent text-muted-foreground border-border/50 hover:text-foreground"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/50 shadow-sm rounded-xl overflow-hidden transition-all duration-300 ease-out hover:border-white/10 dark:hover:border-zinc-700">
          <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Assign Technician(s)</h2>
          </div>
          <div className="p-5">
            {technicians.length === 0 ? (
              <p className="text-xs text-muted-foreground">No technicians found yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {technicians.map((t) => (
                  <label key={t.id} className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.01]",
                    selectedTechnicians.includes(t.id) 
                      ? "bg-primary/10 border-primary text-foreground shadow-sm" 
                      : "border-border/50 hover:bg-accent/50"
                  )}>
                    <input 
                      type="checkbox" 
                      checked={selectedTechnicians.includes(t.id)}
                      onChange={() => toggleTechnician(t.id)}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    <div>
                    <p className="text-sm font-medium">
                        {t.name}
                        {t.role === "OWNER" && <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">(Owner)</span>}
                      </p>
                      {t.phone && <p className="text-xs text-muted-foreground">{t.phone}</p>}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border/50 shadow-sm rounded-xl overflow-hidden transition-all duration-300 ease-out hover:border-white/10 dark:hover:border-zinc-700">
          <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Payment (Optional)</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Estimated Charge (ETB)</label>
                <Input type="number" value={laborCharge} onChange={(e) => setLaborCharge(e.target.value)} placeholder="0" min="0" className="bg-background/50 border-border/50" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Advance Paid (ETB)</label>
                <Input type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="0" min="0" className="bg-background/50 border-border/50" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    type="button"
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

            <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center justify-between transition-colors hover:bg-muted/50">
              <span className="text-sm text-muted-foreground">Balance due after advance</span>
              <span className="text-lg font-bold text-foreground">
                <AnimatedCounter value={balance} suffix=" ETB" />
              </span>
            </div>
          </div>
        </div>

        <Button type="submit" disabled={loading || sessionLoading} className="w-full gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating Job...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Create Job
            </>
          )}
        </Button>
      </form>
    </div>
  );
}