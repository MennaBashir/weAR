import { apiClient } from "@/lib/axios";
import type { RetailerProfile } from "@/features/auth/useAuthStore";

export type CustomerGender = "Male" | "Female";

export interface CustomerRegisterPayload {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
}

export interface CustomerCompleteProfilePayload {
  tempStepToken: string;
  age: number;
  gender: CustomerGender;
  createAvatar: boolean;
}

export interface CustomerLoginPayload {
  email: string;
  password: string;
  rememberMe: boolean;
}

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

export type CustomerRegisterResponse = ApiEnvelope<
  | string
  | {
      data?: string;
      tempStepToken?: string;
      TempStepToken?: string;
      isSuccess?: boolean;
      message?: string;
    }
>;

export type CustomerAuthResponse = ApiEnvelope<
  CustomerAuthData | ApiEnvelope<CustomerAuthData>
>;

const CUSTOMER_AUTH_BASE = "/api/customer/auth";

export const extractTempStepToken = (
  response: CustomerRegisterResponse,
): string | null => {
  const payload = response.data;

  if (typeof payload === "string") return payload;

  return (
    payload?.data ?? payload?.tempStepToken ?? payload?.TempStepToken ?? null
  );
};

export const isSuccessfulResponse = <T>(response: ApiEnvelope<T>): boolean =>
  response.success === true || response.isSuccess === true;

export const extractCustomerAuthData = (
  response: CustomerAuthResponse,
): CustomerAuthData | null => {
  const payload = response.data;

  if (!payload) return null;

  if ("accessToken" in payload) return payload;

  return payload.data ?? null;
};

export const getCustomerProfile = (
  authData: CustomerAuthData,
  fallback: Partial<CustomerProfile>,
): CustomerProfile => {
  const profile =
    authData.customerProfile ??
    authData.profile ??
    authData.user ??
    authData.retailerProfile ??
    fallback;

  return {
    id: profile.id ?? fallback.id ?? "customer",
    fullName: profile.fullName ?? fallback.fullName ?? "Customer User",
    email: profile.email ?? fallback.email ?? "",
    phoneNumber: profile.phoneNumber ?? fallback.phoneNumber ?? null,
    brandName: profile.brandName ?? "",
    businessType: profile.businessType ?? "customer",
    has3DModels: profile.has3DModels ?? false,
    accountStatus: profile.accountStatus ?? "active",
    isEmailVerified: profile.isEmailVerified ?? false,
    age: profile.age ?? fallback.age ?? null,
    gender: profile.gender ?? fallback.gender ?? null,
    createAvatar: profile.createAvatar ?? fallback.createAvatar ?? false,
  };
};

export const customerAuthApi = {
  register: async (payload: CustomerRegisterPayload) => {
    const response = await apiClient.post<CustomerRegisterResponse>(
      `${CUSTOMER_AUTH_BASE}/register`,
      payload,
    );
    return response.data;
  },

  completeProfile: async (payload: CustomerCompleteProfilePayload) => {
    const { tempStepToken, ...profilePayload } = payload;

    const response = await apiClient.post<CustomerAuthResponse>(
      `${CUSTOMER_AUTH_BASE}/complete-profile`,
      {
        ...profilePayload,
        TempStepToken: tempStepToken,
      },
      {
        headers: {
          TempStepToken: tempStepToken,
          Authorization: `Bearer ${tempStepToken}`,
        },
      },
    );
    return response.data;
  },

  login: async (payload: CustomerLoginPayload) => {
    const response = await apiClient.post<CustomerAuthResponse>(
      `${CUSTOMER_AUTH_BASE}/login`,
      payload,
    );
    return response.data;
  },
};
