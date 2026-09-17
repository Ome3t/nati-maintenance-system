import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const amount = Number(body.amount);

    const job = await prisma.job.findUnique({ where: { id: params.id } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const newPaid = Number(job.paidAmount) + amount;
    const total = Number(job.total);
    const remaining = total - newPaid;

    let paymentStatus: "PAID" | "PARTIALLY_PAID" | "UNPAID" = "UNPAID";
    if (newPaid >= total) paymentStatus = "PAID";
    else if (newPaid > 0) paymentStatus = "PARTIALLY_PAID";

    // Create payment record
    await prisma.payment.create({
      data: {
        paymentNumber: `PAY-${Date.now().toString().slice(-8)}`,
        customerId: job.customerId,
        jobId: job.id,
        receivedById: session.user.id,
        amount,
        method: body.method || "CASH",
      },
    });

    // Update job
    const updated = await prisma.job.update({
      where: { id: params.id },
      data: {
        paidAmount: newPaid,
        remainingAmount: remaining > 0 ? remaining : 0,
        paymentStatus,
        paymentMethod: body.method || "CASH",
        ...(paymentStatus === "PAID" && { status: "DELIVERED" }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 }
    );
  }
}