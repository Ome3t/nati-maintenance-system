"use server"

import type { ManagerDashboardData } from "../../domain/types/dashboard"
import { getManagerDashboardData as getMockDashboardData } from "../lib/mock-dashboard-data"

/**
 * Fetches the manager dashboard data.
 * 
 * TODO: Backend developer should replace the mock implementation below 
 * with real Prisma/database queries once the schema is ready.
 */
export async function getManagerDashboardData(): Promise<ManagerDashboardData> {
  // TEMPORARY: Using mock data adapter until backend endpoints are ready
  return getMockDashboardData()
  
  // FUTURE IMPLEMENTATION EXAMPLE:
  // const summary = await db.payment.aggregate({ ... })
  // const recentJobs = await db.job.findMany({ ... })
  // return { summary, recentJobs, ... }
}