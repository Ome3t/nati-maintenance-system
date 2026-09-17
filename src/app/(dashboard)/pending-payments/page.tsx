"use client";

import { useState, useEffect } from "react";
import { Banknote, CreditCard, Smartphone, Check, X, Package } from "lucide-react";

export default function PendingPaymentsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paidAmount, setPaidAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchPendingJobs();
  }, []);

  const fetchPendingJobs = async () => {
    try {
      const res = await fetch("/api/jobs?status=READY_FOR_PICKUP");
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openJob = (job: any) => {
    setSelectedJob(job);
    setPaidAmount(String(job.total));
    setPaymentMethod("CASH");
    setError("");
  };

  const handleCollect = async () => {
    if (!selectedJob) return;
    const amount = parseFloat(paidAmount) || 0;
    if (amount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    setProcessing(true);
    setError("");

    try {
      const res = await fetch(`/api/jobs/${selectedJob.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          method: paymentMethod,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to record payment");
      }

      setSuccess(
        `${amount.toLocaleString()} ETB collected from ${selectedJob.customer.name}`
      );
      setSelectedJob(null);
      fetchPendingJobs();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const methodLabel = (m: string) =>
    m === "CASH" ? "Cash" : m === "BANK_TRANSFER" ? "Bank" : "Mobile";

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">Pending Payments</h1>
          <p className="text-sm text-slate-500 mt-1">
            Jobs ready for customer pickup — collect payment
          </p>
        </div>

        {success && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700 flex items-center gap-2">
            <Check className="h-4 w-4" />
            {success}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            Loading...
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 text-center py-16">
            <Package className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">
              No jobs waiting for payment
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => openJob(job)}
                className={`bg-white rounded-lg border cursor-pointer transition-all ${
                  selectedJob?.id === job.id
                    ? "border-slate-900"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">
                        Job #{job.jobNumber.replace(/^JOB-?/, "")}
                      </p>
                      <p className="text-base font-semibold text-slate-900">
                        {job.customer.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {job.customer.phone}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Total</p>
                      <p className="text-xl font-bold text-slate-900">
                        {Number(job.total).toLocaleString()} ETB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-600 pt-3 border-t border-slate-100">
                    <span>
                      <span className="text-slate-400">Device:</span>{" "}
                      {job.deviceType} {job.deviceModel || ""}
                    </span>
                    <span>
                      <span className="text-slate-400">Materials:</span>{" "}
                      {Number(job.partsCharge || 0).toLocaleString()} ETB
                    </span>
                    <span>
                      <span className="text-slate-400">Labor:</span>{" "}
                      {Number(job.laborCharge || 0).toLocaleString()} ETB
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Side Panel */}
      {selectedJob && (
        <div className="w-[420px] bg-white border-l border-slate-200 fixed right-0 top-0 h-screen overflow-y-auto scrollbar-thin z-20 shadow-lg">
          <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between sticky top-0 bg-white">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">
                Collect Payment
              </p>
              <h2 className="text-base font-bold text-slate-900">
                {selectedJob.customer.name}
              </h2>
            </div>
            <button
              onClick={() => setSelectedJob(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Bill Breakdown */}
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Bill Breakdown
            </h3>
            <div className="space-y-2">
              {selectedJob.items && selectedJob.items.length > 0 && (
                <>
                  {selectedJob.items.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-slate-600">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="font-medium text-slate-900">
                        {Number(item.total).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-100">
                    <span className="text-slate-600">Materials subtotal</span>
                    <span className="font-medium text-slate-900">
                      {Number(selectedJob.partsCharge || 0).toLocaleString()}
                    </span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Labor</span>
                <span className="font-medium text-slate-900">
                  {Number(selectedJob.laborCharge || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t-2 border-slate-200">
                <span className="text-sm font-bold text-slate-900">TOTAL</span>
                <span className="text-2xl font-bold text-slate-900">
                  {Number(selectedJob.total).toLocaleString()} ETB
                </span>
              </div>
            </div>
          </div>

          {/* Payment Input */}
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Amount to Collect (ETB)
            </h3>
            <input
              type="number"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              min="0"
              className="w-full px-3 py-3 text-lg font-semibold bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Method */}
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Payment Method
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "CASH", label: "Cash", Icon: Banknote },
                { key: "BANK_TRANSFER", label: "Bank", Icon: CreditCard },
                { key: "MOBILE_MONEY", label: "Mobile", Icon: Smartphone },
              ].map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => setPaymentMethod(key)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-md border text-xs font-medium transition-colors ${
                    paymentMethod === key
                      ? "bg-slate-900 text-white border-slate-900"
                      : "border-slate-200 text-slate-700 hover:border-slate-900"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="px-5 py-3">
              <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                {error}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="px-5 py-4 sticky bottom-0 bg-white border-t border-slate-100">
            <button
              onClick={handleCollect}
              disabled={processing}
              className="w-full py-3 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Check className="h-4 w-4" />
              {processing ? "Processing..." : "Collect Payment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}