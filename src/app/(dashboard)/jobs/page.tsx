"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Plus, X, Phone, User, Calendar, DollarSign, Wrench } from "lucide-react";

interface Job {
  id: string;
  jobNumber: string;
  customer: { name: string; phone?: string };
  technician?: { name: string };
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

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      setJobs(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.jobNumber.toLowerCase().includes(search.toLowerCase()) ||
      job.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      job.deviceType.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "ALL" || job.status === filter;
    return matchesSearch && matchesFilter;
  });

  const statusStyle = (status: string) => {
    const styles: Record<string, { dot: string; label: string }> = {
      IN_PROGRESS: { dot: "bg-blue-500", label: "In progress" },
      WAITING_FOR_PARTS: { dot: "bg-amber-500", label: "Waiting for parts" },
      COMPLETED: { dot: "bg-green-500", label: "Completed" },
      READY_FOR_PICKUP: { dot: "bg-purple-500", label: "Ready for pickup" },
      PENDING: { dot: "bg-slate-400", label: "New" },
      ASSIGNED: { dot: "bg-cyan-500", label: "Assigned" },
      CANCELLED: { dot: "bg-red-500", label: "Cancelled" },
    };
    return styles[status] || { dot: "bg-slate-400", label: status };
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case "URGENT": return "text-red-600 bg-red-50";
      case "HIGH": return "text-orange-600 bg-orange-50";
      case "MEDIUM": return "text-slate-600 bg-slate-100";
      case "LOW": return "text-slate-500 bg-slate-50";
      default: return "text-slate-600 bg-slate-100";
    }
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

  // Stat counts
  const counts = {
    ALL: jobs.length,
    PENDING: jobs.filter((j) => j.status === "PENDING").length,
    ASSIGNED: jobs.filter((j) => j.status === "ASSIGNED").length,
    IN_PROGRESS: jobs.filter((j) => j.status === "IN_PROGRESS").length,
    WAITING_FOR_PARTS: jobs.filter((j) => j.status === "WAITING_FOR_PARTS").length,
    READY_FOR_PICKUP: jobs.filter((j) => j.status === "READY_FOR_PICKUP").length,
    COMPLETED: jobs.filter((j) => j.status === "COMPLETED").length,
  };

  return (
    <div className="flex gap-6">
      {/* Main List */}
      <div className="flex-1 min-w-0">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">Jobs</h1>
          <Link
            href="/jobs/new"
            className="px-4 py-2 bg-slate-900 text-white text-sm rounded-md hover:bg-slate-800 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Job
          </Link>
        </div>

        {/* Status Filter Tabs */}
        <div className="bg-white rounded-lg border border-slate-200 mb-4 p-1 flex gap-1 overflow-x-auto">
          {[
            { key: "ALL", label: "All" },
            { key: "PENDING", label: "New" },
            { key: "ASSIGNED", label: "Assigned" },
            { key: "IN_PROGRESS", label: "In Progress" },
            { key: "WAITING_FOR_PARTS", label: "Waiting" },
            { key: "READY_FOR_PICKUP", label: "Ready" },
            { key: "COMPLETED", label: "Completed" },
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
              {counts[tab.key as keyof typeof counts] > 0 && (
                <span
                  className={`ml-1.5 text-xs ${
                    filter === tab.key ? "text-slate-300" : "text-slate-400"
                  }`}
                >
                  {counts[tab.key as keyof typeof counts]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg border border-slate-200 mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by job number, customer, or device..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-slate-500 text-sm">Loading...</div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No jobs found
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Job #
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Customer
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Device
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Technician
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => {
                  const s = statusStyle(job.status);
                  return (
                    <tr
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className={`border-b border-slate-50 last:border-0 cursor-pointer transition-colors ${
                        selectedJob?.id === job.id ? "bg-slate-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-5 py-4 text-sm font-medium text-slate-900">
                        #{job.jobNumber.replace(/^JOB-?/, "")}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700">
                        {job.customer.name}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700">
                        {job.deviceType} {job.deviceModel || ""}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {job.technician?.name || (
                          <span className="text-amber-600 text-xs font-medium">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-2 text-sm text-slate-700">
                          <span className={`w-2 h-2 rounded-full ${s.dot}`}></span>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-xs text-slate-500">
                        {timeAgo(job.updatedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Side Panel */}
      {selectedJob && (
        <div className="w-96 bg-white border-l border-slate-200 fixed right-0 top-0 h-screen overflow-y-auto scrollbar-thin z-20 shadow-lg">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between">
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

          {/* Status */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${statusStyle(selectedJob.status).dot}`}></span>
              <span className="text-sm font-medium text-slate-700">
                {statusStyle(selectedJob.status).label}
              </span>
            </div>
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${priorityColor(selectedJob.priority)}`}>
              {selectedJob.priority}
            </span>
          </div>

          {/* Customer */}
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Customer
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <User className="h-4 w-4 text-slate-400" />
                {selectedJob.customer.name}
              </div>
              {selectedJob.customer.phone && (
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Phone className="h-4 w-4 text-slate-400" />
                  {selectedJob.customer.phone}
                </div>
              )}
            </div>
          </div>

          {/* Problem */}
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Problem
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              {selectedJob.problem}
            </p>
          </div>

          {/* Technician */}
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Assigned To
            </h3>
            <p className="text-sm text-slate-700">
              {selectedJob.technician?.name || (
                <span className="text-amber-600">Not assigned yet</span>
              )}
            </p>
          </div>

          {/* Payment */}
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Payment
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Total</span>
                <span className="text-sm font-bold text-slate-900">
                  {Number(selectedJob.total).toLocaleString()} ETB
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Paid</span>
                <span className="text-sm font-medium text-green-600">
                  {Number(selectedJob.paidAmount).toLocaleString()} ETB
                </span>
              </div>
              {Number(selectedJob.remainingAmount) > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-sm font-medium text-slate-700">Remaining</span>
                  <span className="text-sm font-bold text-amber-600">
                    {Number(selectedJob.remainingAmount).toLocaleString()} ETB
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Timeline
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="h-4 w-4 text-slate-400" />
                Created {timeAgo(selectedJob.createdAt)}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="h-4 w-4 text-slate-400" />
                Updated {timeAgo(selectedJob.updatedAt)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 py-4 sticky bottom-0 bg-white border-t border-slate-100 space-y-2">
            <Link
              href={`/jobs/${selectedJob.id}`}
              className="block w-full py-2 bg-slate-900 text-white text-sm rounded-md hover:bg-slate-800 text-center"
            >
              View Full Details
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}