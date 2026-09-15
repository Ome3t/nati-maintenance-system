import { Suspense } from "react"

import { getCustomers, getCustomerDetail } from "@/actions/customers"

import { Panel } from "@/components/shared/panel"
import { CustomerDetailDrawer } from "@/components/shared/customer-detail-drawer"
import { CustomerSearch } from "@/components/shared/customer-search"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import Link from "next/link"

interface CustomersPageProps {
  searchParams: Promise<{
    customer?: string
    q?: string
  }>
}

export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const {
    customer: selectedCustomerId,
    q: searchQuery,
  } = await searchParams

  const customers = await getCustomers(searchQuery)

  const selectedCustomer = selectedCustomerId
    ? await getCustomerDetail(selectedCustomerId)
    : null

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Customers</h1>

        <CustomerSearch initialQuery={searchQuery} />
      </div>

      {/* Customers Table */}
      <Panel title="All Customers">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-center">
                Total Jobs
              </TableHead>
              <TableHead>Last Service</TableHead>
              <TableHead className="text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {customers.map((customer) => {
              const customerUrl = `/manager/customers?customer=${
                customer.id
              }${
                searchQuery
                  ? `&q=${encodeURIComponent(searchQuery)}`
                  : ""
              }`

              return (
                <TableRow
                  key={customer.id}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  {/* Customer Name */}
                  <TableCell className="font-medium">
                    <Link
                      href={customerUrl}
                      className="block h-full w-full"
                    >
                      {customer.name}
                    </Link>
                  </TableCell>

                  {/* Phone */}
                  <TableCell>
                    {customer.phone}
                  </TableCell>

                  {/* Total Jobs */}
                  <TableCell className="text-center">
                    {customer.totalJobs}
                  </TableCell>

                  {/* Last Service */}
                  <TableCell>
                    <div className="text-sm">
                      {customer.lastServiceDate}
                    </div>

                    <div className="text-xs text-[var(--color-text-muted)]">
                      {customer.lastServiceDevice}
                    </div>
                  </TableCell>

                  {/* Action */}
                  <TableCell className="text-right">
                    <Link
                      href={customerUrl}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      View Details
                    </Link>
                  </TableCell>
                </TableRow>
              )
            })}

            {/* Empty State */}
            {customers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-[var(--color-text-muted)]"
                >
                  No customers found matching your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Panel>

      {/* Customer Details Drawer */}
      <Suspense fallback={null}>
        <CustomerDetailDrawer
          customer={selectedCustomer}
          isOpen={!!selectedCustomerId}
        />
      </Suspense>
    </div>
  )
}