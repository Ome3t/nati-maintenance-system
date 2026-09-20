import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!body.deviceType || !body.problem) {
      return NextResponse.json({ error: "Device type and problem are required" }, { status: 400 });
    }

    // Resolve existing customer or create a new one (flexible)
    let customerId = body.customerId || null;
    if (!customerId) {
      const name = (body.customerName || "").trim();
      if (!name) {
        return NextResponse.json({ error: "Customer is required" }, { status: 400 });
      }
      const phone = (body.customerPhone || "").trim() || null;
      let customer = await prisma.customer.findFirst({
        where: phone ? { name, phone } : { name },
      });
      if (!customer) {
        customer = await prisma.customer.create({ data: { name, phone } });
      }
      customerId = customer.id;
    }

    const jobNumber = `JOB-${Date.now().toString().slice(-8)}`;
    const job = await prisma.job.create({
      data: {
        jobNumber,
        customerId,
        createdById: session.user.id,
        deviceType: body.deviceType,
        deviceModel: body.deviceModel || null,
        serialNumber: body.serialNumber || null,
        problem: body.problem,
        priority: body.priority || "MEDIUM",
        notes: body.notes || null,
        status: "PENDING",
        paymentStatus: "UNPAID",
      },
      include: { customer: true },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error("Job intake error:", error);
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}