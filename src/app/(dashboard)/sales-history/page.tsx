"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Receipt, X, User, Banknote, CreditCard, Smartphone, Printer } from "lucide-react";

export default function SalesHistoryPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selectedSale, setSelectedSale] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const res = await fetch("/api/sales");
      const data = await res.json();
      setSales(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openSale = async (sale) => {
    setLoadingDetails(true);
    setSelectedSale(sale);
    try {
      const res = await fetch("/api/sales/" + sale.id);
      const fullSale = await res.json();
      setSelectedSale(fullSale);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      s.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (s.customer?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "ALL" || s.status === filter;
    return matchesSearch && matchesFilter;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySales = sales.filter((s) => new Date(s.createdAt) >= today);
  const todayTotal = todaySales.reduce((sum, s) => sum + Number(s.total), 0);
  const totalAll = sales.reduce((sum, s) => sum + Number(s.total), 0);

  const statusStyle = (status) => {
    const styles = {
      PAID: { dot: "bg-green-500", label: "Paid", color: "text-green-600" },
      PARTIALLY_PAID: { dot: "bg-amber-500", label: "Partial", color: "text-amber-600" },
      UNPAID: { dot: "bg-red-500", label: "Unpaid", color: "text-red-600" },
    };
    return styles[status] || { dot: "bg-slate-400", label: status, color: "text-slate-600" };
  };

  const methodIcon = (method) => {
    if (method === "CASH") return Banknote;
    if (method === "BANK_TRANSFER") return CreditCard;
    if (method === "MOBILE_MONEY") return Smartphone;
    return Banknote;
  };

  const methodLabel = (method) => {
    if (method === "CASH") return "Cash";
    if (method === "BANK_TRANSFER") return "Bank Transfer";
    if (method === "MOBILE_MONEY") return "Mobile Money";
    return method || "—";
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return mins + " min ago";
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + " hr" + (hrs > 1 ? "s" : "") + " ago";
    const days = Math.floor(hrs / 24);
    return days + " day" + (days > 1 ? "s" : "") + " ago";
  };

  const counts = {
    ALL: sales.length,
    PAID: sales.filter((s) => s.status === "PAID").length,
    PARTIALLY_PAID: sales.filter((s) => s.status === "PARTIALLY_PAID").length,
    UNPAID: sales.filter((s) => s.status === "UNPAID").length,
  };

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">Sales History</h1>
          <p className="text-sm text-slate-500 mt-1">All completed sales and transactions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Today's Sales</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{todaySales.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">{todayTotal.toLocaleString()} ETB</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">All Sales</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{sales.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">transactions</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Revenue</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalAll.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-0.5">ETB</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 mb-4 p-1 flex gap-1">
          {[
            { key: "ALL", label: "All" },
            { key: "PAID", label: "Paid" },
            { key: "PARTIALLY_PAID", label: "Partial" },
            { key: "UNPAID", label: "Unpaid" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={"px-3 py-2 text-sm font-medium rounded-md transition-colors " + (filter === tab.key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50")}
            >
              {tab.label}
              <span className={"ml-1.5 text-xs " + (filter === tab.key ? "text-slate-300" : "text-slate-400")}>
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg border border-slate-200 mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by invoice or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-slate-500 text-sm">Loading...</div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">No sales found</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Invoice</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Method</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => {
                  const s = statusStyle(sale.status);
                  const MethodIcon = methodIcon(sale.paymentMethod);
                  return (
                    <tr
                      key={sale.id}
                      onClick={() => openSale(sale)}
                      className={"border-b border-slate-50 last:border-0 cursor-pointer transition-colors " + (selectedSale?.id === sale.id ? "bg-slate-50" : "hover:bg-slate-50")}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-900">{sale.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700">{sale.customer?.name || "Walk-in Customer"}</td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-2 text-sm text-slate-600">
                          <MethodIcon className="h-4 w-4 text-slate-400" />
                          {methodLabel(sale.paymentMethod)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-2 text-sm text-slate-700">
                          <span className={"w-1.5 h-1.5 rounded-full " + s.dot}></span>
                          <span className={s.color + " font-medium"}>{s.label}</span>
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-slate-900 text-right">
                        {Number(sale.total).toLocaleString()} ETB
                      </td>
                      <td className="px-5 py-4 text-right text-xs text-slate-500">{timeAgo(sale.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedSale && (
        <div className="w-[420px] bg-white border-l border-slate-200 fixed right-0 top-0 h-screen overflow-y-auto z-20 shadow-lg">
          <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between sticky top-0 bg-white">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Invoice</p>
              <h2 className="text-base font-bold text-slate-900">{selectedSale.invoiceNumber}</h2>
            </div>
            <button onClick={() => setSelectedSale(null)} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-5 py-6 border-b border-slate-100 text-center">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Amount</p>
            <p className="text-3xl font-bold text-slate-900">{Number(selectedSale.total).toLocaleString()} ETB</p>
            <div className="mt-3">
              <span className={"inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium " + (selectedSale.status === "PAID" ? "bg-green-50 text-green-700" : selectedSale.status === "PARTIALLY_PAID" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700")}>
                <span className={"w-1.5 h-1.5 rounded-full " + statusStyle(selectedSale.status).dot}></span>
                {statusStyle(selectedSale.status).label}
              </span>
            </div>
          </div>

          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Customer</h3>
            <div className="flex items-center gap-2 text-sm text-slate-900 font-medium">
              <User className="h-4 w-4 text-slate-400" />
              {selectedSale.customer?.name || "Walk-in Customer"}
            </div>
            {selectedSale.customer?.phone && (
              <p className="text-xs text-slate-500 ml-6 mt-1">{selectedSale.customer.phone}</p>
            )}
          </div>

          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Items ({selectedSale.items?.length || 0})
            </h3>
            {loadingDetails ? (
              <p className="text-sm text-slate-500 text-center py-3">Loading...</p>
            ) : selectedSale.items && selectedSale.items.length > 0 ? (
              <div className="space-y-2">
                {selectedSale.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-slate-50 rounded-md px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{item.product?.name || "Product"}</p>
                      <p className="text-xs text-slate-500">{item.quantity} x {Number(item.unitPrice).toLocaleString()} ETB</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 ml-2">{Number(item.total).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-3">No items</p>
            )}
          </div>

          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Payment Summary</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Subtotal</span>
                <span className="text-sm font-medium text-slate-900">{Number(selectedSale.subtotal).toLocaleString()} ETB</span>
              </div>
              {Number(selectedSale.discount) > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Discount</span>
                  <span className="text-sm font-medium text-red-600">- {Number(selectedSale.discount).toLocaleString()} ETB</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-sm font-bold text-slate-900">Total</span>
                <span className="text-base font-bold text-slate-900">{Number(selectedSale.total).toLocaleString()} ETB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Paid</span>
                <span className="text-sm font-medium text-green-600">{Number(selectedSale.paidAmount).toLocaleString()} ETB</span>
              </div>
              {Number(selectedSale.remainingAmount) > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Remaining</span>
                  <span className="text-sm font-medium text-amber-600">{Number(selectedSale.remainingAmount).toLocaleString()} ETB</span>
                </div>
              )}
            </div>
          </div>

          <div className="px-5 py-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Details</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Cashier</span>
                <span className="text-sm text-slate-900">{selectedSale.cashier?.name || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Method</span>
                <span className="text-sm text-slate-900">{methodLabel(selectedSale.paymentMethod)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Date</span>
                <span className="text-sm text-slate-900">
                  {new Date(selectedSale.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Time</span>
                <span className="text-sm text-slate-900">{new Date(selectedSale.createdAt).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          <div className="px-5 py-4 sticky bottom-0 bg-white border-t border-slate-100">
            <Link
              href={"/receipts/" + selectedSale.id}
              className="w-full py-2.5 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 flex items-center justify-center gap-2"
            >
              <Printer className="h-4 w-4" />
              View Receipt / Print
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}