"use server"

import {
  getPayments as getMockPayments,
  getPaymentSummary as getMockPaymentSummary,
  getPaymentDetail as getMockPaymentDetail,
} from "../lib/mock-payments-data"
import type { Payment, PaymentSummary, PaymentDetail } from "../../domain/types/payment"

export async function getPayments(
  statusFilter?: string,
  searchQuery?: string
): Promise<Payment[]> {
  return getMockPayments(statusFilter, searchQuery)
}

export async function getPaymentSummary(): Promise<PaymentSummary> {
  return getMockPaymentSummary()
}

export async function getPaymentDetail(id: string): Promise<PaymentDetail | null> {
  return getMockPaymentDetail(id)
}

// Future: export async function recordPayment(data: {...}) { ... }