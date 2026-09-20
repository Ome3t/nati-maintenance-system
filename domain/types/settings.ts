export interface User {
  id: string;
  name?: string;
  fullName?: string;
  email: string;
  phone?: string | null;
  role: string;
  status?: string;
  isActive?: boolean;
  [key: string]: any;
}

export interface BusinessProfile {
  [key: string]: any;
}