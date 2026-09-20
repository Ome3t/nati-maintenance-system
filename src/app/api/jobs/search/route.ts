import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  if (!q) return NextResponse.json([]);

  const jobs = await prisma.job.findMany({
    where: {
      OR: [
        { jobNumber: { contains: q, mode: "insensitive" } },
        { deviceType: { contains: q, mode: "insensitive" } },
        { deviceModel: { contains: q, mode: "insensitive" } },
        { serialNumber: { contains: q, mode: "insensitive" } },
        { customer: { name: { contains: q, mode: "insensitive" } } },
        { customer: { phone: { contains: q } } },
      ],
    },
    include: { customer: true, technician: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json(jobs);
}