import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const jobs = await prisma.job.findMany({
    include: {
      customer: true,
      technician: true,
      createdBy: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(jobs);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: {
        phone: body.customerPhone,
      },
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

    // Create job with transaction
    const job = await prisma.$transaction(async (tx) => {
      // Create the job
      const newJob = await tx.job.create({
        data: {
          jobNumber,
          customerId: customer!.id,
          technicianId: body.technicianId,
          createdById: body.createdById,
          deviceType: body.deviceType,
          deviceModel: body.deviceModel,
          problem: body.problem,
          priority: body.priority || "MEDIUM",
          status: body.status || "ASSIGNED",
          laborCharge: body.laborCharge || 0,
          total: body.laborCharge || 0,
          paidAmount: body.paidAmount || 0,
          remainingAmount: (body.laborCharge || 0) - (body.paidAmount || 0),
          paymentStatus: body.paidAmount > 0 ? "PARTIALLY_PAID" : "UNPAID",
          paymentMethod: body.paymentMethod,
        },
        include: {
          customer: true,
          technician: true,
        },
      });

      // Create payment if amount is paid
      if (body.paidAmount > 0) {
        await tx.payment.create({
          data: {
            paymentNumber: `PAY-${Date.now().toString().slice(-8)}`,
            customerId: customer!.id,
            jobId: newJob.id,
            receivedById: body.createdById,
            amount: body.paidAmount,
            method: body.paymentMethod || "CASH",
          },
        });
      }

      // Create notification for technician
      await tx.notification.create({
        data: {
          userId: body.technicianId,
          title: "New Job Assigned",
          message: `Job ${jobNumber} has been assigned to you`,
          type: "JOB_ASSIGNED",
        },
      });

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