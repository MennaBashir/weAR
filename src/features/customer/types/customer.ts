import type { RetailerProfile } from "@/features/auth/useAuthStore";

export type CustomerGender = "Male" | "Female";

export interface CustomerProfile extends RetailerProfile {
  phoneNumber?: string | null;
  age?: number | null;
  gender?: CustomerGender | null;
  createAvatar?: boolean;
}

export interface CustomerAuthData {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  customerProfile?: CustomerProfile;
  retailerProfile?: CustomerProfile;
  profile?: CustomerProfile;
  user?: CustomerProfile;
}

export interface ApiEnvelope<T> {
  success?: boolean;
  isSuccess?: boolean;
  message?: string;
  errors?: string[];
  data?: T;
}

export interface CustomerApiError {
  message: string;
  errors: string[];
  status?: number;
}
