import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  // Safety: no session OR no user id → return an empty list (never an error object,
  // and never accidentally return all jobs if id is undefined)
  if (!session?.user?.id) {
    return NextResponse.json([]);
  }

  const jobs = await prisma.job.findMany({
    where: { technicianId: session.user.id },
    include: {
      customer: true,
      items: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(jobs);
}