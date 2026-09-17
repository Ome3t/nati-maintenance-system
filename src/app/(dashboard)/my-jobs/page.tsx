"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Wrench, Clock, CheckCircle, PlayCircle, Banknote, CreditCard, Smartphone } from "lucide-react";

export default function MyJobsPage() {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const fetchMyJobs = async () => {
    try {
      const res = await fetch("/api/my-jobs");
      const data = await res.json();
      setJobs(data);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (jobId, newStatus) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchMyJobs();
      }
    } catch (error) {
      console.error("Failed to update job:", error);
    }
  };

  const statusColors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    ASSIGNED: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-purple-100 text-purple-800",
    WAITING_FOR_PARTS: "bg-orange-100 text-orange-800",
    READY_FOR_PICKUP: "bg-teal-100 text-teal-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  const paymentStatusColors = {
    UNPAID: "bg-red-100 text-red-800",
    PARTIALLY_PAID: "bg-yellow-100 text-yellow-800",
    PAID: "bg-green-100 text-green-800",
  };

  const methodIcons = {
    CASH: Banknote,
    BANK_TRANSFER: CreditCard,
    MOBILE_MONEY: Smartphone,
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Jobs</h1>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Wrench className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-500">No jobs assigned to you</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const MethodIcon = methodIcons[job.paymentMethod] || Banknote;
            return (
              <div key={job.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold text-lg">{job.jobNumber}</p>
                    <p className="text-sm text-gray-500">{job.customer.name}</p>
                    <p className="text-sm text-gray-500">{job.customer.phone}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[job.status] || "bg-gray-100"}`}>
                    {job.status}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium">Device: {job.deviceType} {job.deviceModel || ""}</p>
                  <p className="text-sm text-gray-600 mt-1">{job.problem}</p>
                </div>

                {/* Payment Info */}
                <div className="mb-4 bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Payment Status:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${paymentStatusColors[job.paymentStatus] || "bg-gray-100"}`}>
                      {job.paymentStatus}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total: ETB {Number(job.total)}</span>
                    <span className="text-sm text-gray-600">Paid: ETB {Number(job.paidAmount)}</span>
                  </div>
                  {job.remainingAmount > 0 && (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-red-600 font-medium">Remaining: ETB {Number(job.remainingAmount)}</span>
                    </div>
                  )}
                  {job.paymentMethod && (
                    <div className="flex items-center mt-2">
                      <MethodIcon className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm text-gray-600">{job.paymentMethod}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {job.status === "ASSIGNED" && (
                    <button
                      onClick={() => updateJobStatus(job.id, "IN_PROGRESS")}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                    >
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Start Job
                    </button>
                  )}

                  {job.status === "IN_PROGRESS" && (
                    <button
                      onClick={() => updateJobStatus(job.id, "COMPLETED")}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Complete Job
                    </button>
                  )}

                  {(job.status === "IN_PROGRESS" || job.status === "ASSIGNED") && (
                    <button
                      onClick={() => updateJobStatus(job.id, "WAITING_FOR_PARTS")}
                      className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center"
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Waiting for Parts
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}