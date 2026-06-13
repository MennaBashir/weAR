import type { ApiEnvelope, CustomerAuthData, CustomerProfile } from "@/features/customer/types/customer";

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
