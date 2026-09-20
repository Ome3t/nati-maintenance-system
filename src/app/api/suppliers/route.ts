import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(suppliers);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const name = body.name.trim();

    // If the supplier already exists, reuse it (no duplicates)
    const existing = await prisma.supplier.findFirst({ where: { name } });
    if (existing) return NextResponse.json(existing);

    const supplier = await prisma.supplier.create({
      data: { name, phone: body.phone || null, email: body.email || null },
    });
    return NextResponse.json(supplier);
  } catch (error) {
    console.error("Error creating supplier:", error);
    return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });
  }
}