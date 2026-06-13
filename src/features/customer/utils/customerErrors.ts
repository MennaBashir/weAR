import axios from "axios";
import type { CustomerApiError } from "@/features/customer/types/customer";

const DEFAULT_CUSTOMER_ERROR = "Something went wrong. Please try again.";

const asStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string") return [value];
  return [];
};

export const normalizeCustomerApiError = (
  error: unknown,
  fallback = DEFAULT_CUSTOMER_ERROR,
): CustomerApiError => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    const errors = asStringArray(data?.errors);
    const message =
      (typeof data?.message === "string" && data.message) ||
      errors[0] ||
      error.message ||
      fallback;

    return {
      message,
      errors,
      status: error.response?.status,
    };
  }

  if (error instanceof Error) {
    return { message: error.message || fallback, errors: [] };
  }

  return { message: fallback, errors: [] };
};
