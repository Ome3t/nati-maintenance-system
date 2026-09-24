import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { notifyLowStock } from "@/lib/notifications";

export async function GET() {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        customer: true,
        cashier: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json(sales);
  } catch (error) {
    console.error("Sales GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;

    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          invoiceNumber,
          customerId: body.customerId || null,
          cashierId: body.cashierId,
          subtotal: body.subtotal,
          total: body.total,
          paidAmount: body.paidAmount,
          remainingAmount: body.remainingAmount,
          status: body.status || "PAID",
          paymentMethod: body.paymentMethod,
        },
      });

      const lowStockProducts: Array<{ name: string; currentStock: number; minimumStock: number }> = [];

      for (const item of body.items) {
        await tx.saleItem.create({
          data: {
            saleId: newSale.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          },
        });

        const updatedProduct = await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            type: "SALE",
            quantity: -item.quantity,
            referenceId: newSale.id,
            createdBy: body.cashierId,
            notes: `Sale ${invoiceNumber}`,
          },
        });

        // Check if product dropped to/below minimum stock
        if (updatedProduct.currentStock <= updatedProduct.minimumStock) {
          lowStockProducts.push({
            name: updatedProduct.name,
            currentStock: updatedProduct.currentStock,
            minimumStock: updatedProduct.minimumStock,
          });
        }
      }

      if (body.paidAmount > 0) {
        await tx.payment.create({
          data: {
            paymentNumber: `PAY-${Date.now().toString().slice(-8)}`,
            customerId: body.customerId || null,
            saleId: newSale.id,
            receivedById: body.cashierId,
            amount: body.paidAmount,
            method: body.paymentMethod || "CASH",
          },
        });
      }

      return { sale: newSale, lowStockProducts };
    });

    // Log activity (outside transaction)
    await logActivity({
      userId: body.cashierId,
      action: `Sale completed: ${invoiceNumber} (${Number(sale.sale.total).toLocaleString()} ETB)`,
      module: "SALES",
      recordId: sale.sale.id,
      details: { invoiceNumber, total: Number(sale.sale.total) },
    });

    // Trigger low-stock alerts (outside transaction)
    for (const product of sale.lowStockProducts) {
      await notifyLowStock(product.name, product.currentStock, product.minimumStock);
    }

    return NextResponse.json(sale.sale);
  } catch (error: any) {
    console.error("Sale creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed" },
      { status: 500 }
    );
  }
}