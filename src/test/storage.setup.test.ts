import { describe, expect, it } from "vitest";
import { useAuthStore } from "@/features/auth/useAuthStore";

describe("test storage setup", () => {
  it("provides localStorage and supports persisted auth store resets", () => {
    expect(typeof localStorage.setItem).toBe("function");

    useAuthStore.setState({
      user: {
        id: "customer-1",
        fullName: "Customer User",
        email: "customer@example.com",
        brandName: "",
        businessType: "customer",
      },
      role: "customer",
      isAuthenticated: true,
      accessToken: "access-token",
      refreshToken: "refresh-token",
      hasHydrated: true,
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    useAuthStore.setState({
      user: null,
      role: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      hasHydrated: true,
    });
    localStorage.clear();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(localStorage.length).toBe(0);
  });
});
