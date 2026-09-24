"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type PaperSize = "80mm" | "A5" | "A4" | "A3";
export type ReceiptKind = "sale" | "payment" | "delivery";

export const PAPER_SIZES: PaperSize[] = ["80mm", "A5", "A4", "A3"];

export const DEFAULT_ORDERS: Record<string, string[]> = {
  sale: ["header", "meta", "items", "totals", "footer"],
  payment: ["header", "meta", "payment", "footer"],
  delivery: ["header", "meta", "job", "declaration", "footer"],
};

export const SECTION_LABELS: Record<string, string> = {
  header: "Shop Header",
  meta: "Receipt Info",
  items: "Items List",
  totals: "Totals",
  payment: "Payment Details",
  job: "Job / Device Details",
  declaration: "Signatures & Declaration",
  footer: "Footer",
};

export const PRINT_CSS = `
@media print {
  body * { visibility: hidden; }
  #receipt-area, #receipt-area * { visibility: visible; }
  #receipt-area { position: absolute; left: 0; top: 0; margin: 0; box-shadow: none !important; border-radius: 0 !important; }
  @page { margin: 4mm; }
}
`;

const paperConfig: Record<PaperSize, { width: string; text: string; padding: string; thermal: boolean }> = {
  "80mm": { width: "80mm", text: "font-mono text-[10px] leading-relaxed", padding: "px-2 py-3", thermal: true },
  A5: { width: "148mm", text: "font-mono text-[11px] leading-relaxed", padding: "p-4", thermal: true },
  A4: { width: "210mm", text: "font-sans text-sm", padding: "p-8", thermal: false },
  A3: { width: "297mm", text: "font-sans text-base", padding: "p-10", thermal: false },
};

const fmt = (n: any) => Number(n || 0).toLocaleString();
const fmtDate = (d: any) =>
  d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
const methodLabel = (m?: string | null) => (m || "CASH").replace(/_/g, " ").toLowerCase();

function Row({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="opacity-70">{label}</span>
      <span className={cn("text-right", bold && "font-bold")}>{value}</span>
    </div>
  );
}

/* ---------- Preferences hook (paper + section order, saved in localStorage) ---------- */
export function useReceiptPrefs() {
  const [paper, setPaper] = useState<PaperSize>("80mm");
  const [orders, setOrders] = useState<Record<string, string[]>>(DEFAULT_ORDERS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("receipt-prefs");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.paper) setPaper(parsed.paper);
        if (parsed.orders) setOrders({ ...DEFAULT_ORDERS, ...parsed.orders });
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("receipt-prefs", JSON.stringify({ paper, orders }));
    } catch {}
  }, [paper, orders, loaded]);

  const moveSection = (kind: string, index: number, dir: -1 | 1) => {
    setOrders((prev) => {
      const list = [...(prev[kind] || DEFAULT_ORDERS[kind])];
      const target = index + dir;
      if (target < 0 || target >= list.length) return prev;
      [list[index], list[target]] = [list[target], list[index]];
      return { ...prev, [kind]: list };
    });
  };

  const resetOrder = (kind: string) => setOrders((prev) => ({ ...prev, [kind]: DEFAULT_ORDERS[kind] }));

  return { paper, setPaper, orders, moveSection, resetOrder };
}

/* ---------- The Receipt Itself ---------- */
export function ReceiptPreview({
  kind, paper, order, sale, job, businessProfile,
}: {
  kind: ReceiptKind; paper: PaperSize; order: string[]; sale?: any; job?: any; businessProfile?: any;
}) {
  const cfg = paperConfig[paper];
  const doc = sale ? sale.invoiceNumber : job?.jobNumber;
  const title = kind === "sale" ? "SALE RECEIPT" : kind === "payment" ? "PAYMENT RECEIPT" : "JOB DELIVERY NOTE";
  const customer = sale?.customer?.name || job?.customer?.name;
  const customerPhone = sale?.customer?.phone || job?.customer?.phone;
  const servedBy = sale?.cashier?.name || job?.technician?.name;
  const payments = sale?.payments || job?.payments || [];

  // Use business profile data if available, otherwise fallback to defaults
  const shopName = businessProfile?.businessName || "Nati Mobile";
  const shopAddress = businessProfile?.address || "Bole Road, Addis Ababa, Ethiopia";
  const shopPhone = businessProfile?.phone || "+251 911 000 000";

  const Divider = () => (
    <div className={cn("my-2", cfg.thermal ? "border-t border-dashed border-black/40" : "border-t border-black/20")} />
  );

  const sections: Record<string, React.ReactNode> = {
    header: (
      <div key="header" className="text-center">
        <div className={cn("font-bold uppercase", cfg.thermal ? "text-sm tracking-[0.2em]" : "text-2xl tracking-tight")}>{shopName}</div>
        <div>{shopAddress}</div>
        <div>{shopPhone}</div>
        <Divider />
      </div>
    ),
    meta: (
      <div key="meta" className="space-y-0.5">
        <div className="text-center font-bold uppercase tracking-wider mb-1">{title}</div>
        <Row label="No:" value={doc || "—"} bold />
        <Row label="Date:" value={fmtDate(sale?.createdAt || job?.completedAt || job?.createdAt)} />
        {servedBy && <Row label={kind === "delivery" ? "Technician:" : "Served by:"} value={servedBy} />}
        <Row label="Customer:" value={customer ? `${customer}${customerPhone ? ` (${customerPhone})` : ""}` : "Walk-in"} />
        <Divider />
      </div>
    ),
    items: (
      <div key="items">
        {sale
          ? sale.items?.map((it: any) => (
              <div key={it.id} className="mb-1">
                <div className="flex justify-between gap-2">
                  <span>{it.product?.name || "Item"}</span>
                  <span>{fmt(it.total)}</span>
                </div>
                <div className="opacity-70">{it.quantity} x {fmt(it.unitPrice)}</div>
              </div>
            ))
          : job?.items?.length
          ? job.items.map((it: any) => (
              <div key={it.id} className="mb-1">
                <div className="flex justify-between gap-2">
                  <span>{it.name}</span>
                  <span>{fmt(it.total)}</span>
                </div>
                <div className="opacity-70">{it.quantity} x {fmt(it.unitCost)}</div>
              </div>
            ))
          : <div className="opacity-70 mb-1">No parts used</div>}
        <Divider />
      </div>
    ),
    totals: (
      <div key="totals" className="space-y-0.5">
        {sale && (
          <>
            <Row label="Subtotal" value={fmt(sale.subtotal)} />
            {Number(sale.discount) > 0 && <Row label="Discount" value={`- ${fmt(sale.discount)}`} />}
          </>
        )}
        {job && (
          <>
            <Row label="Labor" value={fmt(job.laborCharge)} />
            <Row label="Parts" value={fmt(job.partsCharge)} />
            {Number(job.additionalCharge) > 0 && <Row label="Additional" value={fmt(job.additionalCharge)} />}
            {Number(job.discount) > 0 && <Row label="Discount" value={`- ${fmt(job.discount)}`} />}
          </>
        )}
        <div className={cn("flex justify-between gap-3 font-bold", cfg.thermal ? "text-[11px]" : "text-base")}>
          <span>TOTAL</span>
          <span>{fmt(sale?.total ?? job?.total)} ETB</span>
        </div>
        <Row label="Paid" value={fmt(sale?.paidAmount ?? job?.paidAmount)} />
        <Row label="Remaining" value={fmt(sale?.remainingAmount ?? job?.remainingAmount)} bold />
        <Row label="Method" value={methodLabel(sale?.paymentMethod ?? job?.paymentMethod)} />
        <Divider />
      </div>
    ),
    payment: (
      <div key="payment" className="space-y-1">
        {payments.length ? (
          payments.map((p: any) => (
            <div key={p.id} className="flex justify-between gap-2">
              <span>{p.paymentNumber}<span className="opacity-70"> · {methodLabel(p.method)} · {fmtDate(p.createdAt)}</span></span>
              <span className="font-bold">{fmt(p.amount)}</span>
            </div>
          ))
        ) : (
          <Row label="Payments" value="No separate payment records" />
        )}
        <Divider />
      </div>
    ),
    job: job ? (
      <div key="job" className="space-y-0.5">
        <Row label="Device:" value={`${job.deviceType}${job.deviceModel ? ` ${job.deviceModel}` : ""}`} bold />
        {job.serialNumber && <Row label="Serial/IMEI:" value={job.serialNumber} />}
        <Row label="Status:" value={job.status?.replace(/_/g, " ")} />
        <Row label="Priority:" value={job.priority} />
        <div className="mt-1">
          <span className="opacity-70">Reported problem:</span>
          <div>{job.problem}</div>
        </div>
        {job.diagnosis && (
          <div className="mt-1">
            <span className="opacity-70">Diagnosis:</span>
            <div>{job.diagnosis}</div>
          </div>
        )}
        <Divider />
      </div>
    ) : null,
    declaration: (
      <div key="declaration" className="mt-6">
        <div className="flex justify-between gap-6 text-center">
          <div className="flex-1 pt-8 border-t border-black">Customer Signature</div>
          <div className="flex-1 pt-8 border-t border-black">Technician Signature</div>
        </div>
        <p className="text-center opacity-70 mt-3">Please check your device before leaving. Warranty applies per shop policy.</p>
        <Divider />
      </div>
    ),
    footer: (
      <div key="footer" className="text-center space-y-0.5">
        <div className="font-bold">Thank you for your custom!</div>
        <div className="opacity-70">Keep this receipt for any inquiry.</div>
        <div className="opacity-70">Printed {new Date().toLocaleString("en-GB")}</div>
        {cfg.thermal && <div className="tracking-[0.3em] mt-1">* {doc} *</div>}
      </div>
    ),
  };

  return (
    <div
      id="receipt-area"
      className={cn("bg-white text-black shadow-xl rounded-md", cfg.width, cfg.text, cfg.padding)}
      style={{ minHeight: paper === "80mm" ? "120mm" : undefined }}
    >
      {order.map((key) => sections[key]).filter(Boolean)}
    </div>
  );
}