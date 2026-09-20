import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // 1. Add Promise<>
) {
  try {
    const { id } = await params; // 2. Unwrap the Promise to get the actual ID
    const body = await request.json();

    const data: any = {};

    if (body.status) data.status = body.status;
    if (body.diagnosis !== undefined) data.diagnosis = body.diagnosis;
    if (body.laborCharge !== undefined) data.laborCharge = body.laborCharge;
    if (body.partsCharge !== undefined) data.partsCharge = body.partsCharge;
    if (body.total !== undefined) {
      data.total = body.total;
      const job = await prisma.job.findUnique({ where: { id } }); // 3. Use 'id'
      const paid = Number(job?.paidAmount || 0);
      data.remainingAmount = body.total - paid;
      if (body.total === paid) data.paymentStatus = "PAID";
      else if (paid > 0) data.paymentStatus = "PARTIALLY_PAID";
      else data.paymentStatus = "UNPAID";
    }

    if (body.status === "IN_PROGRESS") data.startedAt = new Date();
    if (body.status === "COMPLETED" || body.status === "NOT_REPAIRABLE") {
      data.completedAt = new Date();
    }

    // Handle items (materials)
    if (body.items) {
      await prisma.jobItem.deleteMany({ where: { jobId: id } }); // 3. Use 'id'
      await prisma.jobItem.createMany({
        data: body.items.map((item: any) => ({
          jobId: id, // 3. Use 'id'
          name: item.name,
          quantity: item.quantity,
          unitCost: item.unitCost,
          total: item.total,
          productId: item.productId || null,
        })),
      });
    }

    const job = await prisma.job.update({
      where: { id }, // 3. Use 'id'
      data,
      include: { items: true, customer: true, technician: true },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update job" },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const include = { items: true, customer: true, technician: true, payments: true };

  // Try by id first, then fall back to jobNumber (used by payment receipts)
  let job = await prisma.job.findUnique({ where: { id }, include });
  if (!job) {
    job = await prisma.job.findFirst({ where: { jobNumber: id }, include });
  }

  return NextResponse.json(job);
}