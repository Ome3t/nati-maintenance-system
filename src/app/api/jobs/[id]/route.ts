import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 🔒 HARD LOCK: once any payment is collected, no updates allowed at all
    const existing = await prisma.job.findUnique({
      where: { id },
      select: { paidAmount: true, paymentStatus: true },
    });
    const paymentCollected =
      Number(existing?.paidAmount || 0) > 0 ||
      existing?.paymentStatus === "PAID" ||
      existing?.paymentStatus === "PARTIALLY_PAID";

    if (paymentCollected) {
      return NextResponse.json(
        { error: "Job locked: payment already collected. No further updates allowed." },
        { status: 409 }
      );
    }

    const data: any = {};

    if (body.status) data.status = body.status;
    if (body.technicianId) data.technicianId = body.technicianId;
    if (body.diagnosis !== undefined) data.diagnosis = body.diagnosis;
    if (body.laborCharge !== undefined) data.laborCharge = body.laborCharge;
    if (body.partsCharge !== undefined) data.partsCharge = body.partsCharge;
    if (body.total !== undefined) {
      data.total = body.total;
      const job = await prisma.job.findUnique({ where: { id } });
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
      await prisma.jobItem.deleteMany({ where: { jobId: id } });
      await prisma.jobItem.createMany({
        data: body.items.map((item: any) => ({
          jobId: id,
          name: item.name,
          quantity: item.quantity,
          unitCost: item.unitCost,
          total: item.total,
          productId: item.productId || null,
        })),
      });
    }

    // Handle Transfer to another technician
    if (body.transferToTechnicianId) {
      data.technicianId = body.transferToTechnicianId;
      data.status = "ASSIGNED";

      if (body.transferNote) {
        const currentJob = await prisma.job.findUnique({ where: { id }, select: { diagnosis: true } });
        const transferLog = `\n\n--- TRANSFER NOTE (${new Date().toLocaleString()}) ---\n${body.transferNote}`;
        data.diagnosis = (currentJob?.diagnosis || "") + transferLog;
      }
    }

    const updatePayload: any = { ...data };
    if (body.transferToTechnicianId) {
      updatePayload.assignedTechnicians = {
        connect: { id: body.transferToTechnicianId },
      };
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: updatePayload,
      include: { items: true, customer: true, technician: true, assignedTechnicians: true },
    });

    // If transferred, notify the new technician (with link)
    if (body.transferToTechnicianId) {
      await prisma.notification.create({
        data: {
          userId: body.transferToTechnicianId,
          title: "Job Transferred to You",
          message: `Job ${updatedJob.jobNumber} was transferred to you. ${body.transferNote ? `Note: ${body.transferNote}` : ""}`,
          type: "JOB_TRANSFERRED",
          link: "/my-jobs",
        },
      });
    }

    // After the job update, check if status changed to READY_FOR_PICKUP
    if (body.status === "READY_FOR_PICKUP" && updatedJob) {
      try {
        const { notifyJobReadyForPickup } = await import("@/lib/notifications");
        await notifyJobReadyForPickup(
          updatedJob.jobNumber,
          updatedJob.customer?.name || "Customer",
          Number(updatedJob.total)
        );
      } catch (e) {
        console.error("Notification error:", e);
      }
    }

    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const include = { items: true, customer: true, technician: true, assignedTechnicians: true, payments: true };

  let job = await prisma.job.findUnique({ where: { id }, include });
  if (!job) {
    job = await prisma.job.findFirst({ where: { jobNumber: id }, include });
  }

  return NextResponse.json(job);
}