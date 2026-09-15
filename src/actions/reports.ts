"use server"

import { getReportData as getMockReportData } from "../lib/mock-reports-data"
import type { ReportData, DateRange } from "../../domain/types/reports"

export async function getReportData(range: DateRange): Promise<ReportData> {
  return getMockReportData(range)
}