import { describe, expect, it } from "vitest";
import type { AuthState } from "@/features/auth/useAuthStore";
import {
  selectCustomerDisplayName,
  selectCustomerProfile,
  selectIsCustomer,
} from "@/features/customer/utils/customerSelectors";

const baseState: AuthState = {
  user: null,
  role: null,
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  hasHydrated: true,
  setHasHydrated: () => undefined,
  login: () => undefined,
  updateUser: () => undefined,
  logout: () => undefined,
};

describe("customer selectors", () => {
  it("returns customer profile and display name only for customer sessions", () => {
    const customerState: AuthState = {
      ...baseState,
      isAuthenticated: true,
      role: "customer",
      user: {
        id: "customer-1",
        fullName: "Mona Customer",
        email: "mona@example.com",
        brandName: "",
        businessType: "customer",
      },
    };

    expect(selectIsCustomer(customerState)).toBe(true);
    expect(selectCustomerProfile(customerState)?.email).toBe("mona@example.com");
    expect(selectCustomerDisplayName(customerState)).toBe("Mona Customer");
  });

  it("does not expose retailer sessions as customer sessions", () => {
    const retailerState: AuthState = {
      ...baseState,
      isAuthenticated: true,
      role: "retailer",
      user: {
        id: "retailer-1",
        fullName: "Retailer User",
        email: "retailer@example.com",
        brandName: "Retail Brand",
        businessType: "fashion",
      },
    };

    expect(selectIsCustomer(retailerState)).toBe(false);
    expect(selectCustomerProfile(retailerState)).toBeNull();
    expect(selectCustomerDisplayName(retailerState)).toBe("Customer");
  });
});
