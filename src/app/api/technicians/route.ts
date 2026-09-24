import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: All users who can be assigned repair jobs (Technicians + Owner)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const technicians = await prisma.user.findMany({
      where: {
        role: { in: ["TECHNICIAN", "OWNER"] }, // ✅ Owner can now be assigned jobs
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(technicians);
  } catch (error) {
    console.error("GET_TECHNICIANS_ERROR:", error);
    return NextResponse.json({ error: "Failed to load technicians" }, { status: 500 });
  }
}