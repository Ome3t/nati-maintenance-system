import type { User, BusinessProfile } from "../domain/types/settings"

const mockUsers: User[] = [
  {
    id: "1",
    fullName: "Abebe Kebede",
    phone: "+251 911 123 456",
    email: "abebe@nati.com",
    role: "OWNER",
    status: "ACTIVE",
    joinedDate: "2024-01-15"
  },
  {
    id: "2",
    fullName: "Meron Tadesse",
    phone: "+251 922 234 567",
    email: "meron@nati.com",
    role: "CASHIER",
    status: "ACTIVE",
    joinedDate: "2024-02-20"
  },
  {
    id: "3",
    fullName: "Dawit Solomon",
    phone: "+251 933 345 678",
    email: "dawit@nati.com",
    role: "TECHNICIAN",
    status: "ACTIVE",
    joinedDate: "2024-03-10"
  },
  {
    id: "4",
    fullName: "Sara Hailu",
    phone: "+251 944 456 789",
    email: "sara@nati.com",
    role: "TECHNICIAN",
    status: "INACTIVE",
    joinedDate: "2024-01-05"
  }
]

const mockProfile: BusinessProfile = {
  businessName: "Nati Mobile Maintenance",
  phone: "+251 911 000 000",
  email: "info@nati.com",
  taxId: "TIN-123456789",
  address: "Bole Road, Addis Ababa, Ethiopia"
}

export async function getUsers(): Promise<User[]> {
  return mockUsers
}

export async function getBusinessProfile(): Promise<BusinessProfile> {
  return mockProfile
}