import { describe, expect, it } from "vitest";
import { getProfileFromRefreshData } from "@/lib/axios";
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
