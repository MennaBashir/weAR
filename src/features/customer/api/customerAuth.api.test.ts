import { describe, expect, it, vi, beforeEach } from "vitest";
import { customerAuthApi } from "@/features/customer/api/customerAuth.api";
import { apiClient } from "@/lib/axios";

vi.mock("@/lib/axios", () => ({
  apiClient: { post: vi.fn() },
}));

const post = vi.mocked(apiClient.post);

describe("customerAuthApi", () => {
  beforeEach(() => post.mockReset());

  it("uses customer auth endpoints and conservative OTP payloads", async () => {
    post.mockResolvedValue({ data: { success: true } });

    await customerAuthApi.forgotPassword("customer@example.com");
    await customerAuthApi.resetPassword({ email: "customer@example.com", otpCode: "123456", newPassword: "secret1" });
    await customerAuthApi.logout();

    expect(post).toHaveBeenNthCalledWith(1, "/api/customer/auth/forgot-password", { email: "customer@example.com" });
    expect(post).toHaveBeenNthCalledWith(2, "/api/customer/auth/reset-password", { email: "customer@example.com", otpCode: "123456", newPassword: "secret1" });
    expect(post).toHaveBeenNthCalledWith(3, "/api/customer/auth/logout");
  });
});
