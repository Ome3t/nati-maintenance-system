"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Play,
  Check,
  Clock,
  Plus,
  Package,
  Ban,
  X,
  Trash2,
  DollarSign,
  Wrench,
} from "lucide-react";

export default function MyJobsPage() {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ACTIVE");

  // Detail panel
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [laborCharge, setLaborCharge] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [newMaterial, setNewMaterial] = useState({
    name: "",
    quantity: "1",
    unitCost: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const fetchMyJobs = async () => {
    try {
      const res = await fetch("/api/my-jobs");
      const data = await res.json();
      setJobs(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openJob = (job: any) => {
    setSelectedJob(job);
    setMaterials(job.items || []);
    setLaborCharge(String(job.laborCharge || ""));
    setDiagnosis(job.diagnosis || "");
  };

  const addMaterial = () => {
    if (!newMaterial.name || !newMaterial.unitCost) return;
    const qty = parseInt(newMaterial.quantity) || 1;
    const cost = parseFloat(newMaterial.unitCost) || 0;
    setMaterials([
      ...materials,
      {
        name: newMaterial.name,
        quantity: qty,
        unitCost: cost,
        total: qty * cost,
        isNew: true,
      },
    ]);
    setNewMaterial({ name: "", quantity: "1", unitCost: "" });
  };

  const removeMaterial = (idx: number) => {
    setMaterials(materials.filter((_, i) => i !== idx));
  };

  const materialsTotal = materials.reduce(
    (sum, m) => sum + Number(m.total),
    0
  );
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
            name: m.name,
            quantity: m.quantity,
            unitCost: m.unitCost,
            total: m.total,
            productId: m.productId || null,
          })),
          ...(markDone && { status: "READY_FOR_PICKUP" }),
        }),
      });

      if (res.ok) {
        await fetchMyJobs();
        if (markDone) {
          setSelectedJob(null);
        } else {
          const updated = await res.json();
          setSelectedJob(updated);
          setMaterials(updated.items || []);
        }
      }
    } catch (error) {
      console.error(error);
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
      if (res.ok) fetchMyJobs();
    } catch (error) {
      console.error(error);
    }
  };

  const statusStyle = (status: string) => {
    const styles: Record<string, { dot: string; label: string }> = {
      IN_PROGRESS: { dot: "bg-blue-500", label: "In progress" },
      WAITING_FOR_PARTS: { dot: "bg-amber-500", label: "Waiting for parts" },
      COMPLETED: { dot: "bg-green-500", label: "Completed" },
      NOT_REPAIRABLE: { dot: "bg-red-500", label: "Not repairable" },
      READY_FOR_PICKUP: { dot: "bg-purple-500", label: "Ready for payment" },
      DELIVERED: { dot: "bg-slate-500", label: "Delivered" },
      PENDING: { dot: "bg-slate-400", label: "New" },
      ASSIGNED: { dot: "bg-cyan-500", label: "Assigned" },
      CANCELLED: { dot: "bg-slate-500", label: "Cancelled" },
    };
    return styles[status] || { dot: "bg-slate-400", label: status };
  };

  const filtered = jobs.filter((j) => {
    if (filter === "ACTIVE")
      return ["ASSIGNED", "IN_PROGRESS", "WAITING_FOR_PARTS"].includes(j.status);
    if (filter === "WAITING_PAYMENT")
      return j.status === "READY_FOR_PICKUP";
    if (filter === "DONE")
      return ["COMPLETED", "DELIVERED"].includes(j.status);
    if (filter === "FAILED")
      return ["NOT_REPAIRABLE", "CANCELLED"].includes(j.status);
    return true;
  });

  const counts = {
    ACTIVE: jobs.filter((j) =>
      ["ASSIGNED", "IN_PROGRESS", "WAITING_FOR_PARTS"].includes(j.status)
    ).length,
    WAITING_PAYMENT: jobs.filter((j) => j.status === "READY_FOR_PICKUP").length,
    DONE: jobs.filter((j) => ["COMPLETED", "DELIVERED"].includes(j.status)).length,
    FAILED: jobs.filter((j) => ["NOT_REPAIRABLE", "CANCELLED"].includes(j.status))
      .length,
    ALL: jobs.length,
  };

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">My Jobs</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your repair jobs
            </p>
          </div>
          <Link
            href="/jobs/new"
            className="px-4 py-2 bg-slate-900 text-white text-sm rounded-md hover:bg-slate-800 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Job
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 mb-4 p-1 flex gap-1 overflow-x-auto">
          {[
            { key: "ACTIVE", label: "Active" },
            { key: "WAITING_PAYMENT", label: "Ready for Payment" },
            { key: "DONE", label: "Done" },
            { key: "FAILED", label: "Not Repairable" },
            { key: "ALL", label: "All" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                filter === tab.key
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
              <span
                className={`ml-1.5 text-xs ${
                  filter === tab.key ? "text-slate-300" : "text-slate-400"
                }`}
              >
                {counts[tab.key as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 text-center py-16">
            <Package className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">No jobs in this category</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((job) => {
              const s = statusStyle(job.status);
              return (
                <div
                  key={job.id}
                  onClick={() => openJob(job)}
                  className={`bg-white rounded-lg border cursor-pointer transition-all ${
                    selectedJob?.id === job.id
                      ? "border-slate-900"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-semibold text-slate-900">
                            #{job.jobNumber.replace(/^JOB-?/, "")}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-slate-600">
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
                            {s.label}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-900">
                          {job.deviceType} {job.deviceModel || ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Customer</p>
                        <p className="text-sm font-medium text-slate-900">
                          {job.customer.name}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-1">
                      {job.problem}
                    </p>
                    {Number(job.total) > 0 && (
                      <p className="text-xs text-slate-500 mt-2">
                        Total:{" "}
                        <span className="font-semibold text-slate-900">
                          {Number(job.total).toLocaleString()} ETB
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Side Panel — Job Editor */}
      {selectedJob && (
        <div className="w-[420px] bg-white border-l border-slate-200 fixed right-0 top-0 h-screen overflow-y-auto scrollbar-thin z-20 shadow-lg">
          <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between sticky top-0 bg-white z-10">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">
                Job #{selectedJob.jobNumber.replace(/^JOB-?/, "")}
              </p>
              <h2 className="text-base font-bold text-slate-900">
                {selectedJob.deviceType} {selectedJob.deviceModel || ""}
              </h2>
            </div>
            <button
              onClick={() => setSelectedJob(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Customer Info */}
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Customer
            </h3>
            <p className="text-sm font-medium text-slate-900">
              {selectedJob.customer.name}
            </p>
            <p className="text-xs text-slate-500">
              {selectedJob.customer.phone}
            </p>
          </div>

          {/* Problem */}
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Reported Problem
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              {selectedJob.problem}
            </p>
          </div>

          {/* Diagnosis */}
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Diagnosis / Notes
            </h3>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="What did you find? What did you do?"
              rows={3}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
            />
          </div>

          {/* Materials Used */}
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Materials Used
            </h3>

            {/* Existing materials list */}
            {materials.length > 0 && (
              <div className="space-y-2 mb-3">
                {materials.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-slate-50 rounded-md px-3 py-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {m.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {m.quantity} × {Number(m.unitCost).toLocaleString()} ETB
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {Number(m.total).toLocaleString()}
                      </span>
                      <button
                        onClick={() => removeMaterial(idx)}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add new material */}
            <div className="bg-slate-50 rounded-md p-3 space-y-2">
              <input
                type="text"
                placeholder="Material name (e.g., Screen)"
                value={newMaterial.name}
                onChange={(e) =>
                  setNewMaterial({ ...newMaterial, name: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Qty"
                  min="1"
                  value={newMaterial.quantity}
                  onChange={(e) =>
                    setNewMaterial({ ...newMaterial, quantity: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <input
                  type="number"
                  placeholder="Unit cost (ETB)"
                  min="0"
                  value={newMaterial.unitCost}
                  onChange={(e) =>
                    setNewMaterial({ ...newMaterial, unitCost: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <button
                type="button"
                onClick={addMaterial}
                className="w-full py-2 bg-slate-900 text-white text-xs font-medium rounded-md hover:bg-slate-800 flex items-center justify-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Material
              </button>
            </div>
          </div>

          {/* Labor */}
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Labor Charge (ETB)
            </h3>
            <input
              type="number"
              value={laborCharge}
              onChange={(e) => setLaborCharge(e.target.value)}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Total */}
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Cost Summary
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Materials</span>
                <span className="text-sm font-medium text-slate-900">
                  {materialsTotal.toLocaleString()} ETB
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Labor</span>
                <span className="text-sm font-medium text-slate-900">
                  {laborTotal.toLocaleString()} ETB
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-sm font-bold text-slate-900">Total</span>
                <span className="text-lg font-bold text-slate-900">
                  {grandTotal.toLocaleString()} ETB
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 py-4 sticky bottom-0 bg-white border-t border-slate-100 space-y-2">
            {selectedJob.status === "ASSIGNED" && (
              <button
                onClick={() => updateStatus(selectedJob.id, "IN_PROGRESS")}
                className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Play className="h-4 w-4" />
                Start Work
              </button>
            )}

            {["IN_PROGRESS", "WAITING_FOR_PARTS"].includes(selectedJob.status) && (
              <>
                <button
                  onClick={() => saveJob(false)}
                  disabled={saving}
                  className="w-full py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Progress"}
                </button>
                <button
                  onClick={() => saveJob(true)}
                  disabled={saving || grandTotal === 0}
                  className="w-full py-2.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Mark Work Done → Send to Cashier
                </button>
                <button
                  onClick={() => updateStatus(selectedJob.id, "NOT_REPAIRABLE")}
                  className="w-full py-2.5 bg-red-50 text-red-600 text-sm font-medium rounded-md hover:bg-red-100 flex items-center justify-center gap-2"
                >
                  <Ban className="h-4 w-4" />
                  Mark Not Repairable
                </button>
                {selectedJob.status !== "WAITING_FOR_PARTS" && (
                  <button
                    onClick={() =>
                      updateStatus(selectedJob.id, "WAITING_FOR_PARTS")
                    }
                    className="w-full py-2 text-xs text-slate-500 hover:text-slate-900"
                  >
                    Mark as Waiting for Parts
                  </button>
                )}
              </>
            )}

            {selectedJob.status === "READY_FOR_PICKUP" && (
              <div className="text-center py-3">
                <p className="text-sm text-green-600 font-medium">
                  ✓ Sent to Cashier
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Waiting for customer payment
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}