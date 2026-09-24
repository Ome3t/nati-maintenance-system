"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer, ArrowUp, ArrowDown, RotateCcw, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ReceiptPreview, useReceiptPrefs, PAPER_SIZES, SECTION_LABELS, DEFAULT_ORDERS, PRINT_CSS, type ReceiptKind,
} from "@/components/shared/receipt-preview";
import { cn } from "@/lib/utils";

const KINDS: { key: ReceiptKind; label: string }[] = [
  { key: "sale", label: "Sale Receipt" },
  { key: "payment", label: "Payment Receipt" },
];

export default function SaleReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const [sale, setSale] = useState<any>(null);
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState<ReceiptKind>("sale");
  const { paper, setPaper, orders, moveSection, resetOrder } = useReceiptPrefs();

  useEffect(() => {
    Promise.all([
      fetch(`/api/sales/${params.id}`).then((r) => r.json()),
      fetch("/api/settings/business-profile").then((r) => r.json()),
    ])
      .then(([saleData, profileData]) => {
        setSale(saleData);
        setBusinessProfile(profileData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const order = orders[kind] || DEFAULT_ORDERS[kind];

  return (
    <div className="space-y-6 animate-page-enter">
      <style>{PRINT_CSS}</style>

      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Receipt {sale?.invoiceNumber || ""}</span>
      </nav>

      {/* Toolbar */}
      <div className="bg-card border border-border/50 shadow-sm rounded-xl p-4 flex flex-wrap items-center gap-3 justify-between transition-all duration-300 ease-out hover:border-white/10 dark:hover:border-zinc-700">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-2 border-border/50 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex rounded-lg border border-border/50 bg-muted/30 p-1">
            {KINDS.map((k) => (
              <button key={k.key} onClick={() => setKind(k.key)}
                className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all", kind === k.key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                {k.label}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-border/50 bg-muted/30 p-1">
            {PAPER_SIZES.map((p) => (
              <button key={p} onClick={() => setPaper(p)}
                className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all", paper === p ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={() => window.print()} className="gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
          <Printer className="h-4 w-4" /> Print
        </Button>
      </div>

      {/* Receipt Preview */}
      <div className="overflow-auto rounded-xl border border-border/50 bg-muted/30 p-6 flex justify-center">
        {loading ? (
          <div className="w-[80mm] bg-white rounded-md p-4 space-y-3 animate-pulse">
            <div className="h-4 w-2/3 mx-auto bg-zinc-200 rounded" />
            <div className="h-3 w-1/2 mx-auto bg-zinc-200 rounded" />
            <div className="h-px bg-zinc-300" />
            <div className="h-3 w-full bg-zinc-200 rounded" />
            <div className="h-3 w-3/4 bg-zinc-200 rounded" />
            <div className="h-3 w-1/2 bg-zinc-200 rounded" />
          </div>
        ) : sale?.error ? (
          <div className="text-center py-12 text-muted-foreground">
            <Receipt className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Receipt not found.</p>
          </div>
        ) : (
          <ReceiptPreview 
                kind={kind} 
                paper={paper} 
                order={order} 
                sale={sale} 
                businessProfile={businessProfile}
    />        )}
      </div>

      {/* Optional Section Rearranger */}
      <div className="bg-card border border-border/50 shadow-sm rounded-xl p-4 transition-all duration-300 ease-out hover:border-white/10 dark:hover:border-zinc-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">
            Section Order <span className="text-xs text-muted-foreground font-normal">(optional — arrange to your preference, saved automatically)</span>
          </h3>
          <Button variant="outline" size="sm" onClick={() => resetOrder(kind)} className="gap-2 border-border/50">
            <RotateCcw className="h-3 w-3" /> Reset
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {order.map((key, i) => (
            <div key={key} className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-3 py-1.5 text-xs font-medium text-foreground">
              {SECTION_LABELS[key] || key}
              <button onClick={() => moveSection(kind, i, -1)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                <ArrowUp className="h-3 w-3" />
              </button>
              <button onClick={() => moveSection(kind, i, 1)} disabled={i === order.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                <ArrowDown className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}