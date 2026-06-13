import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { tryOnApi } from "@/features/customer/try-on/api/tryOn.api";
import { useCreateTryOnSession } from "@/features/customer/try-on/hooks/tryOn.queries";

vi.mock("@/features/customer/try-on/api/tryOn.api", () => ({
  tryOnApi: { createSession: vi.fn(), listSessions: vi.fn(), getSession: vi.fn(), getProductSessions: vi.fn() },
}));

const mockedTryOnApi = vi.mocked(tryOnApi);

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe("try-on hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: { id: "customer-auth-1", fullName: "Customer", email: "c@example.com" }, role: "customer", isAuthenticated: true, accessToken: "token", refreshToken: "refresh" });
  });

  it("creates sessions with the customer ID from auth state and Overlay2D payload only", async () => {
    mockedTryOnApi.createSession.mockResolvedValue({ id: "session-1", productId: "product-1", sessionType: "Overlay2D" });
    const { result } = renderHook(() => useCreateTryOnSession(), { wrapper });
    result.current.mutate({ productId: "product-1", sessionType: "Overlay2D" });
    await waitFor(() => expect(mockedTryOnApi.createSession).toHaveBeenCalledTimes(1));
    expect(mockedTryOnApi.createSession).toHaveBeenCalledWith("customer-auth-1", { productId: "product-1", sessionType: "Overlay2D" });
  });
});
