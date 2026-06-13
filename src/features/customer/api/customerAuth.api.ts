import { apiClient } from "@/lib/axios";
import type { CustomerAuthResponse, CustomerRegisterResponse } from "@/features/customer/utils/customerProfile";
import type { CustomerGender } from "@/features/customer/types/customer";

export type { CustomerGender } from "@/features/customer/types/customer";
export type {
  ApiEnvelope,
  CustomerApiError,
  CustomerAuthData,
  CustomerProfile,
} from "@/features/customer/types/customer";
export type {
  CustomerAuthResponse,
  CustomerRegisterResponse,
} from "@/features/customer/utils/customerProfile";
export {
  extractCustomerAuthData,
  extractTempStepToken,
  getCustomerProfile,
  isSuccessfulResponse,
} from "@/features/customer/utils/customerProfile";

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

export interface CustomerResetPasswordPayload {
  email: string;
  otpCode: string;
  newPassword: string;
}

const CUSTOMER_AUTH_BASE = "/api/customer/auth";

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

  logout: async () => {
    const response = await apiClient.post(`${CUSTOMER_AUTH_BASE}/logout`);
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await apiClient.post(`${CUSTOMER_AUTH_BASE}/forgot-password`, {
      email,
    });
    return response.data;
  },

  resetPassword: async (payload: CustomerResetPasswordPayload) => {
    const response = await apiClient.post(
      `${CUSTOMER_AUTH_BASE}/reset-password`,
      payload,
    );
    return response.data;
  },
};
