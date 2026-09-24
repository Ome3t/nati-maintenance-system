import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.businessProfile.findUnique({
      where: { id: "default" },
    });

    // Return preferences from profile, or defaults if not set
    const preferences = {
      smsNotifications: profile?.smsNotifications ?? false,
      autoGenerateReceipts: profile?.autoGenerateReceipts ?? true,
      allowPartialPayments: profile?.allowPartialPayments ?? true,
    };

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("GET_PREFERENCES_ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

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
        smsNotifications: body.smsNotifications,
        autoGenerateReceipts: body.autoGenerateReceipts,
        allowPartialPayments: body.allowPartialPayments,
      },
      create: {
        id: "default",
        businessName: "Nati Maintenance",
        smsNotifications: body.smsNotifications ?? false,
        autoGenerateReceipts: body.autoGenerateReceipts ?? true,
        allowPartialPayments: body.allowPartialPayments ?? true,
      },
    });

    return NextResponse.json({
      smsNotifications: profile.smsNotifications,
      autoGenerateReceipts: profile.autoGenerateReceipts,
      allowPartialPayments: profile.allowPartialPayments,
    });
  } catch (error) {
    console.error("PATCH_PREFERENCES_ERROR:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}