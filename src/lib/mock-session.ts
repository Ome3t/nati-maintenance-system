// TEMPORARY — delete this file once real login (Better Auth) is wired up.
// getCurrentUser() below has the exact shape the real one will have, so
// swapping it out later is a one-line import change, not a rewrite.

export type CurrentUser = {
    id: string
    fullName: string
    role: "MANAGER" | "CASHIER" | "TECHNICIAN"
  }
  
  export async function getCurrentUser(): Promise<CurrentUser | null> {
    return {
      id: "mock-user-2",
      fullName: "Abebe Tesfaye",
      role: "CASHIER",
    }
  }