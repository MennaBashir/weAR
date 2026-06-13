import type { AuthState } from "@/features/auth/useAuthStore";
import type { CustomerProfile } from "@/features/customer/types/customer";

export const selectIsCustomer = (state: AuthState): boolean =>
  state.isAuthenticated && state.role === "customer";

export const selectCustomerProfile = (
  state: AuthState,
): CustomerProfile | null => {
  if (state.role !== "customer") return null;
  return state.user as CustomerProfile | null;
};

export const selectCustomerDisplayName = (state: AuthState): string =>
  selectCustomerProfile(state)?.fullName ?? "Customer";
