import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(["OWNER", "CASHIER", "TECHNICIAN"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

async function getMasterOwnerId(): Promise<string | null> {
  const master = await prisma.user.findFirst({
    where: { role: "OWNER", isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return master?.id ?? null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    const masterId = await getMasterOwnerId();
    const isTargetMaster = id === masterId;
    const isSelf = id === session.user.id;

    if (isTargetMaster) {
      // 🔒 MASTER RULES: only the master can edit their own credentials.
      if (!isSelf) {
        return NextResponse.json(
          { error: "Only the master owner can update this account" },
          { status: 403 }
        );
      }
      if (validatedData.role !== undefined && validatedData.role !== "OWNER") {
        return NextResponse.json(
          { error: "The master account role cannot be changed" },
          { status: 400 }
        );
      }
      if (validatedData.isActive !== undefined) {
        return NextResponse.json(
          { error: "The master account cannot be disabled" },
          { status: 400 }
        );
      }
    } else {
      // Non-master target: any owner may update, with these guards
      if (validatedData.isActive === false) {
        if (isSelf) {
          return NextResponse.json({ error: "You cannot disable your own account" }, { status: 400 });
        }
        const target = await prisma.user.findUnique({
          where: { id },
          select: { role: true, isActive: true },
        });
        if (target?.role === "OWNER" && target.isActive) {
          const activeOwners = await prisma.user.count({ where: { role: "OWNER", isActive: true } });
          if (activeOwners <= 1) {
            return NextResponse.json({ error: "Cannot disable the last active owner account" }, { status: 400 });
          }
        }
      }
    }

    const updateData: any = { ...validatedData };

    // Master edits are limited to credentials only
    if (isTargetMaster) {
      delete updateData.role;
      delete updateData.isActive;
    }

    // Hash password only when provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      delete updateData.password;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
    console.error("PATCH_USER_ERROR:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    // 🔒 You can never delete your own account
    if (id === session.user.id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    // 🔒 The master account can never be deleted by anyone
    const masterId = await getMasterOwnerId();
    if (id === masterId) {
      return NextResponse.json({ error: "The master owner account cannot be deleted" }, { status: 403 });
    }

    // Safety net: always keep at least one active owner
    const target = await prisma.user.findUnique({
      where: { id },
      select: { role: true, isActive: true },
    });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (target.role === "OWNER" && target.isActive) {
      const activeOwners = await prisma.user.count({ where: { role: "OWNER", isActive: true } });
      if (activeOwners <= 1) {
        return NextResponse.json({ error: "Cannot delete the last active owner account" }, { status: 400 });
      }
    }

    try {
      await prisma.user.delete({ where: { id } });
    } catch (delError: any) {
      if (delError instanceof Prisma.PrismaClientKnownRequestError && delError.code === "P2003") {
        return NextResponse.json(
          { error: "This user has existing records (jobs, sales, or payments). Disable the account instead of deleting." },
          { status: 409 }
        );
      }
      throw delError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE_USER_ERROR:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}