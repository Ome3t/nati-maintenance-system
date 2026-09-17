"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, User, Plus, X, Wrench, Phone, Mail, MapPin } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
  _count?: { sales: number; jobs: number };
}

interface Job {
  id: string;
  jobNumber: string;
  deviceType: string;
  deviceModel?: string;
  problem: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerJobs, setCustomerJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      setCustomers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setLoadingJobs(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}/jobs`);
      const data = await res.json();
      setCustomerJobs(data);
    } catch (error) {
      setCustomerJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? "s" : ""} ago`;
  };

  const statusDot = (status: string) => {
    switch (status) {
      case "IN_PROGRESS": return "bg-blue-500";
      case "WAITING_FOR_PARTS": return "bg-amber-500";
      case "COMPLETED": return "bg-green-500";
      case "READY_FOR_PICKUP": return "bg-purple-500";
      case "PENDING": return "bg-slate-400";
      case "ASSIGNED": return "bg-cyan-500";
      default: return "bg-slate-400";
    }
  };

  return (
    <div className="flex gap-6">
      {/* Main List */}
      <div className="flex-1 min-w-0">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">Customers</h1>
          <Link
            href="/customers/new"
            className="px-4 py-2 bg-slate-900 text-white text-sm rounded-md hover:bg-slate-800 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search customers by name, phone or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              All customers
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-500 text-sm">Loading...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No customers found
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Customer name
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Phone
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Total jobs
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Last service
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => openCustomer(customer)}
                    className={`border-b border-slate-50 last:border-0 cursor-pointer transition-colors ${
                      selectedCustomer?.id === customer.id
                        ? "bg-slate-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-5 py-4 text-sm font-medium text-slate-900">
                      {customer.name}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {customer.phone || "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-900 text-right font-medium">
                      {customer._count?.jobs || 0}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500 text-right">
                      {timeAgo(customer.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Side Panel */}
      {selectedCustomer && (
        <div className="w-96 bg-white border-l border-slate-200 fixed right-0 top-0 h-screen overflow-y-auto scrollbar-thin z-20 shadow-lg">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {selectedCustomer.name}
              </h2>
              {selectedCustomer.phone && (
                <p className="text-sm text-slate-500 mt-0.5">
                  {selectedCustomer.phone}
                </p>
              )}
            </div>
            <button
              onClick={() => setSelectedCustomer(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Stats */}
          <div className="px-5 py-4 grid grid-cols-2 gap-3 border-b border-slate-100">
            <div className="bg-slate-50 rounded-md p-3">
              <p className="text-xs text-slate-500 mb-1">Total Jobs</p>
              <p className="text-lg font-bold text-slate-900">
                {selectedCustomer._count?.jobs || customerJobs.length}
              </p>
            </div>
            <div className="bg-slate-50 rounded-md p-3">
              <p className="text-xs text-slate-500 mb-1">Last Service</p>
              <p className="text-sm font-medium text-slate-900">
                {customerJobs.length > 0
                  ? timeAgo(customerJobs[0].createdAt)
                  : "—"}
              </p>
            </div>
          </div>

          {/* Service History */}
          <div className="px-5 py-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Service history
            </h3>

            {loadingJobs ? (
              <p className="text-sm text-slate-500 text-center py-6">Loading...</p>
            ) : customerJobs.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">
                No jobs yet
              </p>
            ) : (
              <div className="space-y-3">
                {customerJobs.map((job) => (
                  <div
                    key={job.id}
                    className="border border-slate-200 rounded-md p-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-900">
                        Job #{job.jobNumber.replace(/^JOB-?/, "")} — {job.deviceType} {job.deviceModel || ""}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDot(job.status)}`}></span>
                        {job.status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toLowerCase())}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                      {job.problem}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        {timeAgo(job.createdAt)}
                      </span>
                      <span
                        className={`font-semibold ${
                          job.paymentStatus === "PAID"
                            ? "text-green-600"
                            : "text-amber-600"
                        }`}
                      >
                        {job.paymentStatus.replace(/_/g, " ")} {Number(job.total).toFixed(0)} ETB
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-5 py-4 border-t border-slate-100 sticky bottom-0 bg-white">
            <Link
              href={`/jobs/new?customerId=${selectedCustomer.id}`}
              className="block w-full py-2 bg-slate-900 text-white text-sm rounded-md hover:bg-slate-800 text-center"
            >
              Create New Job
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}