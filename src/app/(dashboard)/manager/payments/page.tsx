"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getPayments, getPaymentSummary, getPaymentDetail } from "@/actions/payments"
import { StatCard } from "@/components/shared/stat-card"
import { Panel } from "@/components/shared/panel"
import { PaymentStatusBadge } from "@/components/shared/payment-status-badge"
import { PaymentMethodBadge } from "@/components/shared/payment-method-badge"
import { PaymentDetailDrawer } from "@/components/shared/payment-detail-drawer"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RefreshCw, Search, Download } from "lucide-react"
import type { Payment, PaymentDetail } from "../../../domain/types/payment"

function PaymentsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedPaymentId = searchParams.get("payment")

  const [payments, setPayments] = useState<Payment[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [selectedPayment, setSelectedPayment] = useState<PaymentDetail | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [isLoading, setIsLoading] = useState(true)
  
  // This key controls when the counter animation triggers
  const [counterKey, setCounterKey] = useState(0)

  // Initial load - fetch data and trigger counter
  useEffect(() => {
    loadData(true) // true = trigger counter animation
  }, [])

  // Fetch detail when URL param changes
  useEffect(() => {
    if (selectedPaymentId) {
      getPaymentDetail(selectedPaymentId).then(setSelectedPayment)
    } else {
      setSelectedPayment(null)
    }
  }, [selectedPaymentId])

  // Search and filter - update table immediately but DON'T trigger counter
  useEffect(() => {
    if (searchQuery || statusFilter !== "ALL") {
      loadFilteredData() // No counter animation
    }
  }, [searchQuery, statusFilter])

  const loadData = async (triggerCounter = false) => {
    setIsLoading(true)
    const [paymentsData, summaryData] = await Promise.all([
      getPayments(statusFilter, searchQuery),
      getPaymentSummary(),
    ])
    setPayments(paymentsData)
    setSummary(summaryData)
    setIsLoading(false)
    
    if (triggerCounter) {
      setCounterKey(prev => prev + 1)
    }
  }

  const loadFilteredData = async () => {
    // Only update payments, not summary (to avoid counter trigger)
    const paymentsData = await getPayments(statusFilter, searchQuery)
    setPayments(paymentsData)
  }

  const handleRefresh = () => {
    loadData(true) // Trigger counter animation on manual refresh
  }

  if (isLoading || !summary) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading payments...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Payments</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Track all transactions and payment history
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 rounded-lg bg-card border border-border px-4 py-2 text-sm font-medium text-white hover:bg-accent transition-all"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* KPI Cards - key prop triggers animation only when counterKey changes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          key={`revenue-${counterKey}`}
          label="Total Revenue"
          value={summary.totalRevenue}
          suffix=" ETB"
          hint="This month"
          trend="up"
        />
        <StatCard
          key={`today-${counterKey}`}
          label="Today's Collections"
          value={summary.todayCollections}
          suffix=" ETB"
          hint="Recent activity"
          trend="up"
        />
        <StatCard
          key={`pending-${counterKey}`}
          label="Pending Payments"
          value={summary.pendingPayments}
          hint="Awaiting payment"
          trend="down"
        />
        <StatCard
          key={`avg-${counterKey}`}
          label="Avg. Ticket Size"
          value={summary.averageTicketSize}
          suffix=" ETB"
          hint="Per transaction"
        />
      </div>

      {/* Payments Table */}
      <Panel
        title="All Transactions"
        action={
          <button className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors">
            <Download className="h-3 w-3" />
            Export
          </button>
        }
      >
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder="Search by customer, job #, or payment #"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-900/50 border-white/10 text-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-white/10 bg-zinc-900/50 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-zinc-400">Payment #</TableHead>
              <TableHead className="text-zinc-400">Job #</TableHead>
              <TableHead className="text-zinc-400">Customer</TableHead>
              <TableHead className="text-zinc-400">Amount</TableHead>
              <TableHead className="text-zinc-400">Method</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400">Date</TableHead>
              <TableHead className="text-zinc-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow
                key={payment.id}
                className="border-white/10 hover:bg-white/5 cursor-pointer"
                onClick={() => router.push(`/manager/payments?payment=${payment.id}`)}
              >
                <TableCell className="font-mono text-sm text-white">
                  #{payment.paymentNumber}
                </TableCell>
                <TableCell className="font-mono text-sm text-zinc-400">
                  #{payment.jobNumber}
                </TableCell>
                <TableCell className="text-white">
                  <div className="font-medium">{payment.customerName}</div>
                </TableCell>
                <TableCell className="font-semibold text-white">
                  {payment.amount.toLocaleString()} ETB
                </TableCell>
                <TableCell>
                  <PaymentMethodBadge method={payment.paymentMethod} />
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge status={payment.paymentStatus} />
                </TableCell>
                <TableCell className="text-sm text-zinc-400">
                  {payment.paidAt}
                </TableCell>
                <TableCell className="text-right">
                  <button className="text-xs text-emerald-500 hover:text-emerald-400 font-medium">
                    View
                  </button>
                </TableCell>
              </TableRow>
            ))}
            {payments.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-zinc-500">
                  No payments found matching your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Panel>

      {/* Payment Detail Drawer */}
      <Suspense fallback={null}>
        <PaymentDetailDrawer 
          payment={selectedPayment} 
          isOpen={!!selectedPaymentId} 
        />
      </Suspense>
    </div>
  )
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[400px] items-center justify-center">
        <RefreshCw className="h-5 w-5 animate-spin text-zinc-400" />
      </div>
    }>
      <PaymentsContent />
    </Suspense>
  )
}