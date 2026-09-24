import { prisma } from "@/lib/prisma";

export type NotificationType =
  | "JOB_ASSIGNED"
  | "JOB_READY"
  | "JOB_WAITING_PARTS"
  | "JOB_TRANSFERRED"
  | "PAYMENT_RECEIVED"
  | "LOW_STOCK"
  | "SYSTEM";

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
}

/**
 * Create a notification for a specific user
 */
export async function createNotification({ userId, title, message, type, link }: CreateNotificationParams) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link: link ?? null,
        read: false,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

/**
 * Create notifications for multiple users
 */
export async function createNotificationsForUsers(
  userIds: string[],
  title: string,
  message: string,
  type: NotificationType,
  link?: string | null
) {
  try {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        title,
        message,
        type,
        link: link ?? null,
        read: false,
      })),
    });
  } catch (error) {
    console.error("Failed to create bulk notifications:", error);
  }
}

/**
 * Notify all technicians about a new job assignment
 */
export async function notifyTechniciansAboutJob(jobNumber: string, customerName: string, deviceType: string) {
  try {
    const technicians = await prisma.user.findMany({
      where: { role: { in: ["TECHNICIAN", "OWNER"] }, isActive: true },
      select: { id: true },
    });

    if (technicians.length > 0) {
      await createNotificationsForUsers(
        technicians.map((t) => t.id),
        "New Job Assigned",
        `Job #${jobNumber} (${deviceType}) for ${customerName} is ready for work`,
        "JOB_ASSIGNED",
        "/my-jobs"
      );
    }
  } catch (error) {
    console.error("Failed to notify technicians:", error);
  }
}

/**
 * Notify owner/cashier when a job is ready for pickup
 */
export async function notifyJobReadyForPickup(jobNumber: string, customerName: string, totalAmount: number) {
  try {
    const staff = await prisma.user.findMany({
      where: { role: { in: ["OWNER", "CASHIER"] }, isActive: true },
      select: { id: true },
    });

    if (staff.length > 0) {
      await createNotificationsForUsers(
        staff.map((s) => s.id),
        "Job Ready for Pickup",
        `Job #${jobNumber} for ${customerName} is ready. Total: ${totalAmount.toLocaleString()} ETB`,
        "JOB_READY",
        "/pos"
      );
    }
  } catch (error) {
    console.error("Failed to notify job ready:", error);
  }
}

/**
 * Notify relevant staff when a payment is received — links straight to the receipt
 */
export async function notifyPaymentReceived(jobNumber: string, amount: number, customerName: string, receivedByName: string) {
  try {
    const staff = await prisma.user.findMany({
      where: { role: { in: ["OWNER", "CASHIER"] }, isActive: true },
      select: { id: true },
    });

    if (staff.length > 0) {
      await createNotificationsForUsers(
        staff.map((s) => s.id),
        "Payment Received",
        `${amount.toLocaleString()} ETB collected for Job #${jobNumber} from ${customerName} by ${receivedByName}`,
        "PAYMENT_RECEIVED",
        `/receipts/job/${jobNumber}`
      );
    }
  } catch (error) {
    console.error("Failed to notify payment:", error);
  }
}

/**
 * Notify owner when stock is low
 */
export async function notifyLowStock(productName: string, currentStock: number, minimumStock: number) {
  try {
    const owners = await prisma.user.findMany({
      where: { role: "OWNER", isActive: true },
      select: { id: true },
    });

    if (owners.length > 0) {
      await createNotificationsForUsers(
        owners.map((o) => o.id),
        "Low Stock Alert",
        `${productName} is running low: ${currentStock} remaining (minimum: ${minimumStock})`,
        "LOW_STOCK",
        "/inventory"
      );
    }
  } catch (error) {
    console.error("Failed to notify low stock:", error);
  }
}