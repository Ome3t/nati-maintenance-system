import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;

    // Create sale with items in a transaction
    const sale = await prisma.$transaction(async (tx) => {
      // Create the sale
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

      // Create sale items and update inventory
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

        // Decrease inventory
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              decrement: item.quantity,
            },
          },
        });

        // Create inventory movement
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
      }

      // Create payment record
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

      return newSale;
    });

    return NextResponse.json(sale);
  } catch (error: any) {
    console.error("Sale error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create sale" },
      { status: 500 }
    );
  }
}