import { prisma } from "@/lib/prisma";

export type ActivityModule = "SALES" | "JOBS" | "INVENTORY" | "USERS" | "SETTINGS";

interface LogActivityParams {
  userId: string;
  action: string;
  module: ActivityModule;
  recordId?: string;
  details?: Record<string, any>;
}

/**
 * Log an activity event for the Owner dashboard feed
 */
export async function logActivity({ userId, action, module, recordId, details }: LogActivityParams) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        module,
        recordId: recordId || null,
        details: details || {},
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}