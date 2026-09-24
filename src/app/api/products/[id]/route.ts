import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { notifyLowStock } from "@/lib/notifications";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // ✅ Captured once so TypeScript knows it's a definite string
    const userId: string = session.user.id;

    const { id } = await params;
    const body = await request.json();

    const data: any = {};
    if (body.currentStock !== undefined) data.currentStock = body.currentStock;
    if (body.name !== undefined) data.name = body.name;
    if (body.sellingPrice !== undefined) data.sellingPrice = body.sellingPrice;

    const oldProduct = await prisma.product.findUnique({
      where: { id },
      select: { currentStock: true, minimumStock: true },
    });
    if (!oldProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = await prisma.product.update({
      where: { id },
      data,
    });

    // If stock was manually adjusted, log it
    if (body.currentStock !== undefined) {
      const stockChange = Number(body.currentStock) - Number(oldProduct.currentStock);

      await prisma.inventoryMovement.create({
        data: {
          productId: id,
          type: "ADJUSTMENT",
          quantity: stockChange,
          createdBy: userId,
          notes: typeof body.notes === "string" ? body.notes : "Manual stock adjustment",
        },
      });

      await logActivity({
        userId,
        action: `Stock adjusted: ${product.name} (${stockChange > 0 ? "+" : ""}${stockChange} units)`,
        module: "INVENTORY",
        recordId: id,
        details: {
          oldStock: Number(oldProduct.currentStock),
          newStock: Number(body.currentStock),
          change: stockChange,
        },
      });

      // Check if product is now low stock
      if (Number(product.currentStock) <= Number(product.minimumStock)) {
        await notifyLowStock(product.name, Number(product.currentStock), Number(product.minimumStock));
      }
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}