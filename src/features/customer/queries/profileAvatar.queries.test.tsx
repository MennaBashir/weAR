import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/axios";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { useCustomerAvatar } from "@/features/customer/queries/profileAvatar.queries";

vi.mock("@/lib/axios", () => ({
  apiClient: { get: vi.fn(), put: vi.fn(), post: vi.fn(), delete: vi.fn(), patch: vi.fn() },
}));

const mockedApiClient = vi.mocked(apiClient);

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
);

describe("profile/avatar query hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: { id: "auth-customer", fullName: "Ada", email: "a@example.com", brandName: "", businessType: "" }, role: "customer", isAuthenticated: true });
  });

  it("uses the authenticated customer ID for avatar requests", async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: { data: { id: "av1", customerId: "auth-customer", avatar3dModelUrl: null, measurements: { heightCm: 170 } } } });
    const { result } = renderHook(() => useCustomerAvatar(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApiClient.get).toHaveBeenCalledWith("/api/customers/auth-customer/avatar", expect.any(Object));
  });
});
