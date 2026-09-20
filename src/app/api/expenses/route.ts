import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const expenses = await prisma.expense.findMany({
    include: { employee: true }, // <-- Now "Recorded By" will actually show
    orderBy: { date: "desc" },
  });

  return NextResponse.json(expenses);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.category || body.amount === undefined || body.amount === "") {
      return NextResponse.json({ error: "Name, category and amount are required" }, { status: 400 });
    }

    // Attach the logged-in user as the employee who recorded it
    let employeeId: string | null = null;
    try {
      const session = await auth();
      employeeId = session?.user?.id ?? null;
    } catch {}

    const expense = await prisma.expense.create({
      data: {
        name: body.name,
        category: body.category,
        amount: parseFloat(body.amount),
        date: body.date ? new Date(body.date) : new Date(),
        description: body.description || null,
        employeeId,
      },
      include: { employee: true },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}