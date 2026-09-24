import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCustomerDetail } from "@/actions/customers";

// GET: full customer profile for the detail drawer (owner only)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const customer = await getCustomerDetail(id);

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("GET_CUSTOMER_DETAIL_ERROR:", error);
    return NextResponse.json({ error: "Failed to load customer" }, { status: 500 });
  }
}