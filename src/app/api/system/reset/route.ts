import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * FULL SYSTEM DATA RESET — master owner only.
 * Wipes all business data so the system can be handed over clean.
 * Keeps: the master owner account + business profile + preferences.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if ((session.user as any).role !== "OWNER") {
      return NextResponse.json({ error: "Only the owner role can perform a system reset" }, { status: 403 });
    }

    // 🔒 Master-only: the first-created active owner account
    const master = await prisma.user.findFirst({
      where: { role: "OWNER", isActive: true },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (!master || master.id !== session.user.id) {
      return NextResponse.json(
        { error: "Only the master owner account can perform a system reset" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    if (body.confirm !== "RESET") {
      return NextResponse.json({ error: "Confirmation text did not match" }, { status: 400 });
    }

    // Delete in strict FK-safe order inside one transaction
    const result = await prisma.$transaction(async (tx) => {
      const payments = await tx.payment.deleteMany({});
      const saleItems = await tx.saleItem.deleteMany({});
      const sales = await tx.sale.deleteMany({});
      const jobItems = await tx.jobItem.deleteMany({});
      const jobs = await tx.job.deleteMany({});
      const movements = await tx.inventoryMovement.deleteMany({});
      const activities = await tx.activityLog.deleteMany({});
      const notifications = await tx.notification.deleteMany({});
      const expenses = await tx.expense.deleteMany({});
      const customers = await tx.customer.deleteMany({});
      const products = await tx.product.deleteMany({});
      const suppliers = await tx.supplier.deleteMany({});
      const categories = await tx.category.deleteMany({});
      // Remove every account except the master (sessions/accounts cascade)
      const users = await tx.user.deleteMany({ where: { id: { not: master.id } } });

      return {
        payments: payments.count,
        sales: sales.count,
        jobs: jobs.count,
        customers: customers.count,
        products: products.count,
        expenses: expenses.count,
        users: users.count,
      };
    });

    return NextResponse.json({ success: true, deleted: result });
  } catch (error) {
    console.error("SYSTEM_RESET_ERROR:", error);
    return NextResponse.json({ error: "Failed to reset system data" }, { status: 500 });
  }
}