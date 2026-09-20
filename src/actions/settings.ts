"use server"

import { getUsers as getMockUsers, getBusinessProfile as getMockProfile } from "../lib/mock-settings-data"
import type { User, BusinessProfile } from "../domain/types/settings"

export async function getUsers(): Promise<User[]> {
  try {
    const users = await getMockUsers()
    return users || []
  } catch (error) {
    console.error("Error fetching users:", error)
    return []
  }
}

export async function getBusinessProfile(): Promise<BusinessProfile> {
  try {
    const profile = await getMockProfile()
    return profile || {
      businessName: "Nati Mobile Maintenance",
      phone: "+251 911 000 000",
      email: "info@nati.com",
      taxId: "",
      address: "Addis Ababa, Ethiopia"
    }
  } catch (error) {
    console.error("Error fetching business profile:", error)
    return {
      businessName: "Nati Mobile Maintenance",
      phone: "+251 911 000 000",
      email: "info@nati.com",
      taxId: "",
      address: "Addis Ababa, Ethiopia"
    }
  }
}