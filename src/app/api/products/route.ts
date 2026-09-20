import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    include: { category: true, supplier: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const product = await prisma.product.create({
      data: {
        name: body.name,
        sku: body.sku,
        barcode: body.barcode || null,
        categoryId: body.categoryId || null,
        supplierId: body.supplierId || null,
        sellingPrice: parseFloat(body.sellingPrice),
        purchasePrice: parseFloat(body.purchasePrice || "0"),
        currentStock: parseInt(body.currentStock || "0"),
        minimumStock: parseInt(body.minimumStock || "0"),
        unit: body.unit || "pcs",
        description: body.description || null,
      },
      include: { category: true, supplier: true },
    });
    return NextResponse.json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}