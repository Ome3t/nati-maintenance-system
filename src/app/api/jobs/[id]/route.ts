import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const jobId = params.id;

    const job = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: body.status,
        ...(body.status === "COMPLETED" ? { completedAt: new Date() } : {}),
        ...(body.status === "IN_PROGRESS" ? { startedAt: new Date() } : {}),
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error("Job update error:", error);
    return NextResponse.json(
      { error: "Failed to update job" },
      { status: 500 }
    );
  }
}