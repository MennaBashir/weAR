import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/axios";
import { addressesApi, avatarApi, profileApi } from "@/features/customer/api/profileAvatar.api";

vi.mock("@/lib/axios", () => ({
  apiClient: { get: vi.fn(), put: vi.fn(), post: vi.fn(), delete: vi.fn(), patch: vi.fn() },
}));

const mockedApiClient = vi.mocked(apiClient);

describe("profile, addresses and avatar API adapters", () => {
  beforeEach(() => vi.clearAllMocks());

  it("normalizes profile envelopes", async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: { data: { data: { id: "c1", fullName: "Ada", email: "a@example.com" } } } });
    await expect(profileApi.getProfile()).resolves.toMatchObject({ id: "c1", fullName: "Ada" });
  });

  it("sends the update-profile request shape", async () => {
    const payload = { fullName: "Ada Lovelace", phoneNumber: "123", age: 29, gender: "Female" };
    mockedApiClient.put.mockResolvedValueOnce({ data: { data: { id: "c1", ...payload } } });
    await profileApi.updateProfile(payload);
    expect(mockedApiClient.put).toHaveBeenCalledWith("/api/customer/profile", payload);
  });

  it("sends change-password and delete-account requests", async () => {
    mockedApiClient.post.mockResolvedValue({ data: { data: { message: "ok" } } });
    const passwordPayload = { currentPassword: "oldpass", newPassword: "newpass", confirmPassword: "newpass" };
    const deletePayload = { password: "oldpass", reason: "privacy" };
    await profileApi.changePassword(passwordPayload);
    await profileApi.deleteAccount(deletePayload);
    expect(mockedApiClient.post).toHaveBeenNthCalledWith(1, "/api/customer/profile/change-password", passwordPayload);
    expect(mockedApiClient.post).toHaveBeenNthCalledWith(2, "/api/customer/profile/delete-account", deletePayload);
  });

  it("sends address create/update/delete/default request shapes", async () => {
    const payload = { fullName: "Ada", phoneNumber: "123", line1: "1 Main", city: "Cairo", postalCode: "12345", country: "EG", isDefault: true };
    mockedApiClient.post.mockResolvedValueOnce({ data: { data: { id: "a1", ...payload } } });
    mockedApiClient.put.mockResolvedValueOnce({ data: { data: { id: "a1", ...payload } } });
    mockedApiClient.delete.mockResolvedValueOnce({ data: { data: { message: "ok" } } });
    mockedApiClient.patch.mockResolvedValueOnce({ data: { data: { id: "a1", ...payload } } });
    await addressesApi.create(payload);
    await addressesApi.update("a1", payload);
    await addressesApi.delete("a1");
    await addressesApi.setDefault("a1");
    expect(mockedApiClient.post).toHaveBeenCalledWith("/api/customer/addresses", payload);
    expect(mockedApiClient.put).toHaveBeenCalledWith("/api/customer/addresses/a1", payload);
    expect(mockedApiClient.delete).toHaveBeenCalledWith("/api/customer/addresses/a1");
    expect(mockedApiClient.patch).toHaveBeenCalledWith("/api/customer/addresses/a1/default");
  });

  it("treats avatar GET 404 as no-avatar state", async () => {
    mockedApiClient.get.mockRejectedValueOnce({ isAxiosError: true, response: { status: 404 } });
    await expect(avatarApi.getAvatar("c1")).resolves.toBeNull();
  });

  it("supports successful avatar response with avatar3dModelUrl null", async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: { data: { id: "av1", customerId: "c1", avatar3dModelUrl: null, measurements: { heightCm: 170 } } } });
    await expect(avatarApi.getAvatar("c1")).resolves.toMatchObject({ avatar3dModelUrl: null, measurements: { heightCm: 170, chestCm: null } });
  });
});
