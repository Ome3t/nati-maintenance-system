import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  // Safety: no session OR no user id → return an empty list
  if (!session?.user?.id) {
    return NextResponse.json([]);
  }

  const jobs = await prisma.job.findMany({
    where: {
      // Fetch jobs where I am the primary tech OR in the multi-tech array
      OR: [
        { technicianId: session.user.id },
        { assignedTechnicians: { some: { id: session.user.id } } }
      ]
    },
    include: {
      customer: true,
      items: true,
      technician: true, // Needed to show WHO is currently working on it
      assignedTechnicians: true, 
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(jobs);
}