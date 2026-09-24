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
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const data: any = {};
    if (body.currentStock !== undefined) data.currentStock = body.currentStock;
    if (body.name !== undefined) data.name = body.name;
    if (body.sellingPrice !== undefined) data.sellingPrice = body.sellingPrice;

    const product = await prisma.product.update({
      where: { id },
      data,
    });

    // If stock was manually adjusted, log it
    if (body.currentStock !== undefined) {
      const oldProduct = await prisma.product.findUnique({
        where: { id },
        select: { currentStock: true },
      });

      if (oldProduct) {
        const stockChange = body.currentStock - oldProduct.currentStock;

        await prisma.inventoryMovement.create({
          data: {
            productId: id,
            type: "ADJUSTMENT",
            quantity: stockChange,
            createdBy: session.user.id,
            notes: body.notes || "Manual stock adjustment",
          },
        });

        await logActivity({
          userId: session.user.id,
          action: `Stock adjusted: ${product.name} (${stockChange > 0 ? "+" : ""}${stockChange} units)`,
          module: "INVENTORY",
          recordId: id,
          details: { oldStock: oldProduct.currentStock, newStock: body.currentStock, change: stockChange },
        });

        // Check if product is now low stock
        if (product.currentStock <= product.minimumStock) {
          await notifyLowStock(product.name, product.currentStock, product.minimumStock);
        }
      }
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}