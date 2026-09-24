import Link from "next/link"
import { notFound } from "next/navigation"
import { getCustomerDetail } from "@/actions/customers"
import { Panel } from "@/components/shared/panel"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { PaymentStatusBadge } from "@/components/shared/payment-status-badge"
import { PaymentMethodBadge } from "@/components/shared/payment-method-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Wrench,
  ShoppingCart,
} from "lucide-react"

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params
  const customer = await getCustomerDetail(id)

  if (!customer) {
    notFound()
  }

  const initials = customer.name
    .split(" ")
    .map((part: string) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/manager" className="hover:text-foreground transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href="/manager/customers" className="hover:text-foreground transition-colors">Customers</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{customer.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <Calendar className="h-3 w-3" /> Customer since {fmtDate(customer.joinDate)}
            </p>
          </div>
        </div>
        <Link href="/manager/customers">
          <button className="flex items-center gap-2 rounded-lg bg-card border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-all">
            <ArrowLeft className="h-4 w-4" /> Back to Customers
          </button>
        </Link>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Jobs" value={customer.totalJobs} hint="Repair history" />
        <StatCard label="Total Spent" value={customer.totalSpent} suffix=" ETB" hint="All time" trend="up" />
        <StatCard label="Payments" value={customer.payments.length} hint="Transactions recorded" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: contact + payments */}
        <div className="space-y-6">
          <Panel title="Contact Information">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{customer.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{customer.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{customer.address}</span>
              </div>
            </div>
          </Panel>

          {customer.notes && (
            <Panel title="Notes">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{customer.notes}</p>
            </Panel>
          )}

          <Panel title="Payment History">
            {customer.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No payments recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {customer.payments.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 transition-colors hover:bg-muted/50">
                    <div>
                      <p className="font-mono text-xs text-foreground">#{payment.paymentNumber}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(payment.createdAt)} · {payment.receivedBy}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-500">{Number(payment.amount).toLocaleString()} ETB</p>
                      <div className="mt-0.5"><PaymentMethodBadge method={payment.method} /></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* Right column: jobs + sales */}
        <div className="lg:col-span-2 space-y-6">
          <Panel title="Repair Jobs" action={<Wrench className="h-4 w-4 text-muted-foreground" />}>
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Job #</TableHead>
                    <TableHead className="text-muted-foreground">Device</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Payment</TableHead>
                    <TableHead className="text-muted-foreground text-right">Total</TableHead>
                    <TableHead className="text-muted-foreground text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.jobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No repair jobs yet.</TableCell>
                    </TableRow>
                  ) : (
                    customer.jobs.map((job: any) => (
                      <TableRow key={job.id} className="border-border/50 hover:bg-accent/50 transition-colors">
                        <TableCell>
                          <Link href={`/jobs/${job.id}`} className="font-mono text-sm text-emerald-500 hover:text-emerald-400 transition-colors">
                            #{job.jobNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm text-foreground">
                          {job.deviceType} {job.deviceModel !== "N/A" ? job.deviceModel : ""}
                        </TableCell>
                        <TableCell><StatusBadge status={job.status} /></TableCell>
                        <TableCell><PaymentStatusBadge status={job.paymentStatus} /></TableCell>
                        <TableCell className="text-sm font-semibold text-foreground text-right">
                          {Number(job.totalCost).toLocaleString()} ETB
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground text-right">{fmtDate(job.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Panel>

          <Panel title="Product Sales" action={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}>
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Invoice</TableHead>
                    <TableHead className="text-muted-foreground">Items</TableHead>
                    <TableHead className="text-muted-foreground">Cashier</TableHead>
                    <TableHead className="text-muted-foreground text-right">Total</TableHead>
                    <TableHead className="text-muted-foreground text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.sales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No product sales yet.</TableCell>
                    </TableRow>
                  ) : (
                    customer.sales.map((sale: any) => (
                      <TableRow key={sale.id} className="border-border/50 hover:bg-accent/50 transition-colors">
                        <TableCell className="font-mono text-sm text-foreground">{sale.invoiceNumber}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{sale.items.length} item(s)</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{sale.cashier}</TableCell>
                        <TableCell className="text-sm font-semibold text-foreground text-right">
                          {Number(sale.totalCost).toLocaleString()} ETB
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground text-right">{fmtDate(sale.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}