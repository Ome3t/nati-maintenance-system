import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // 1. Promise<> fix for Next.js 16
) {
  try {
    const { id } = await params; // 2. Unwrap the Promise

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        cashier: { select: { name: true } },
        items: {
          include: {
            product: { select: { name: true, sku: true } },
          },
        },
        payments: true, // 3. Added: needed for the Payment Receipt type
      },
    });

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    return NextResponse.json(sale);
  } catch (error) {
    console.error("Error fetching sale:", error);
    return NextResponse.json(
      { error: "Failed to fetch sale" },
      { status: 500 }
    );
  }
}