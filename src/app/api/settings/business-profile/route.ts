import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: Fetch the business profile
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the default profile, or create it if it doesn't exist yet
    let profile = await prisma.businessProfile.findUnique({
      where: { id: "default" },
    });

    if (!profile) {
      profile = await prisma.businessProfile.create({
        data: {
          id: "default",
          businessName: "Nati Maintenance",
          phone: "+251 911 000 000",
          email: "contact@natimaintenance.com",
          address: "Hawassa, Ethiopia",
        },
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("GET_BUSINESS_PROFILE_ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

// PATCH: Update the business profile (Owner only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();

    const profile = await prisma.businessProfile.upsert({
      where: { id: "default" },
      update: {
        businessName: body.businessName,
        phone: body.phone,
        email: body.email,
        address: body.address,
        taxId: body.taxId,
      },
      create: {
        id: "default",
        businessName: body.businessName || "Nati Maintenance",
        phone: body.phone,
        email: body.email,
        address: body.address,
        taxId: body.taxId,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("PATCH_BUSINESS_PROFILE_ERROR:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}