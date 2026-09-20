import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Every job that still owes money (any stage), except cancelled / not repairable
  const jobs = await prisma.job.findMany({
    where: {
      paymentStatus: { not: "PAID" },
      status: { notIn: ["CANCELLED", "NOT_REPAIRABLE"] },
    },
    include: { customer: true, technician: true },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    take: 50,
  });

  return NextResponse.json(jobs);
}