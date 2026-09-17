"use server"

import { getUsers as getMockUsers, getBusinessProfile as getMockProfile } from "../lib/mock-settings-data"
import type { User, BusinessProfile } from "../../domain/types/settings"

export async function getUsers(): Promise<User[]> {
  return getMockUsers()
}

export async function getBusinessProfile(): Promise<BusinessProfile> {
  return getMockProfile()
}