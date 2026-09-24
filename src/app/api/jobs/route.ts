import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where: any = {};
  if (status) where.status = status;

  const jobs = await prisma.job.findMany({
    where,
    include: {
      customer: true,
      technician: true,
      assignedTechnicians: true, // <-- ADDED: Fetch all assigned techs for the owner view
      createdBy: true,
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(jobs);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const session = await auth();

    // FIX: never allow createdById to be undefined (this was crashing Prisma)
    const createdById = body.createdById || session?.user?.id || body.technicianId;

    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: { phone: body.customerPhone },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: body.customerName,
          phone: body.customerPhone,
        },
      });
    }

    // Generate job number
    const jobNumber = `JOB-${Date.now().toString().slice(-6)}`;

    // FIX: correct payment math (fully paid => PAID, never negative remaining)
    const labor = Number(body.laborCharge) || 0;
    const paid = Number(body.paidAmount) || 0;
    const remaining = Math.max(0, labor - paid);
    const paymentStatus = paid > 0 && paid >= labor ? "PAID" : paid > 0 ? "PARTIALLY_PAID" : "UNPAID";

    // Prepare multi-technician array
    const technicianIds: string[] = body.technicianIds || (body.technicianId ? [body.technicianId] : []);
    const primaryTechnicianId = body.technicianId || (technicianIds.length > 0 ? technicianIds[0] : null);

    // Create job with transaction
    const job = await prisma.$transaction(async (tx) => {
      const newJob = await tx.job.create({
        data: {
          jobNumber,
          customerId: customer!.id,
          technicianId: primaryTechnicianId, // Primary assignee
          createdById,
          deviceType: body.deviceType,
          deviceModel: body.deviceModel || null,
          serialNumber: body.serialNumber || null, 
          problem: body.problem,
          priority: body.priority || "MEDIUM",
          status: body.status || "ASSIGNED",
          laborCharge: labor,
          total: labor,
          paidAmount: paid,
          remainingAmount: remaining,
          paymentStatus,
          paymentMethod: body.paymentMethod || null,
          // <-- ADDED: Connect multiple technicians
          assignedTechnicians: technicianIds.length > 0 ? {
            connect: technicianIds.map((id: string) => ({ id }))
          } : undefined,
        },
        include: {
          customer: true,
          technician: true,
          assignedTechnicians: true,
        },
      });

      // Create payment if amount is paid
      if (paid > 0) {
        await tx.payment.create({
          data: {
            paymentNumber: `PAY-${Date.now().toString().slice(-8)}`,
            customerId: customer!.id,
            jobId: newJob.id,
            receivedById: createdById,
            amount: paid,
            method: body.paymentMethod || "CASH",
          },
        });
      }

      // Create notification for ALL assigned technicians
      for (const techId of technicianIds) {
        await tx.notification.create({
          data: {
            userId: techId,
            title: "New Job Assigned",
            message: `Job ${jobNumber} has been assigned to you`,
            type: "JOB_ASSIGNED",
            link: "/my-jobs",
          },
        });
      }

      return newJob;
    });

    return NextResponse.json(job);
  } catch (error: any) {
    console.error("Job creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create job" },
      { status: 500 }
    );
  }
}