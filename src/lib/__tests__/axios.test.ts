import { describe, expect, it } from "vitest";
import { getLoginPathForRole, getProfileFromRefreshData, getRefreshEndpointForRole } from "@/lib/axios";
import type { RetailerProfile } from "@/features/auth/useAuthStore";

const retailerProfile: RetailerProfile = {
  id: "retailer-1",
  fullName: "Retailer User",
  email: "retailer@example.com",
  brandName: "Retail Brand",
  businessType: "fashion",
};

const customerProfile: RetailerProfile = {
  id: "customer-1",
  fullName: "Customer User",
  email: "customer@example.com",
  brandName: "",
  businessType: "customer",
};

describe("getProfileFromRefreshData", () => {
  it("uses retailerProfile for retailer refresh responses", () => {
    expect(
      getProfileFromRefreshData(
        {
          accessToken: "new-access",
          refreshToken: "new-refresh",
          retailerProfile,
          customerProfile,
        },
        "retailer",
        null,
      ),
    ).toBe(retailerProfile);
  });

  it("uses customerProfile for customer refresh responses", () => {
    expect(
      getProfileFromRefreshData(
        {
          accessToken: "new-access",
          refreshToken: "new-refresh",
          retailerProfile,
          customerProfile,
        },
        "customer",
        null,
      ),
    ).toBe(customerProfile);
  });

  it("falls back to the current profile when role-specific profile is absent", () => {
    expect(
      getProfileFromRefreshData(
        {
          accessToken: "new-access",
          refreshToken: "new-refresh",
        },
        "customer",
        customerProfile,
      ),
    ).toBe(customerProfile);
  });
});


describe("role-aware refresh routing", () => {
  it("routes customer refresh to the Customer endpoint without changing retailer refresh", () => {
    expect(getRefreshEndpointForRole("customer")).toBe("/api/customer/auth/refresh");
    expect(getRefreshEndpointForRole("retailer")).toBe("/api/auth/refresh-token");
    expect(getLoginPathForRole("customer")).toBe("/login/customer");
    expect(getLoginPathForRole("retailer")).toBe("/login/retailer");
  });
});
