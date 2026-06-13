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

  it("normalizes flat avatar GET responses and maps shoulderWidthCm to shoulderCm", async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: {
        data: {
          id: "av-flat",
          heightCm: 171,
          shoulderWidthCm: 42,
          avatar3dModelUrl: null,
          lastMeasuredAt: "2026-06-01T12:00:00.000Z",
        },
      },
    });

    await expect(avatarApi.getAvatar("c1")).resolves.toMatchObject({
      id: "av-flat",
      customerId: "c1",
      avatar3dModelUrl: null,
      updatedAt: "2026-06-01T12:00:00.000Z",
      measurements: {
        heightCm: 171,
        shoulderCm: 42,
        weightKg: null,
      },
    });
  });


  it("creates manual avatars with root measurements, source, and UUID response", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: { data: "avatar-uuid-1" } });
    await expect(avatarApi.createAvatar("c1", { heightCm: 170, chestCm: null })).resolves.toBe("avatar-uuid-1");
    expect(mockedApiClient.post).toHaveBeenCalledWith("/api/customers/c1/avatar", { heightCm: 170, chestCm: null, source: "manual" });
  });

  it("updates measurements with avatarId, root fields, source, and accepts 204 empty responses", async () => {
    mockedApiClient.patch.mockResolvedValueOnce({ status: 204, data: undefined });
    await expect(avatarApi.updateMeasurements("c1", "av1", { heightCm: 171, waistCm: null })).resolves.toBeUndefined();
    expect(mockedApiClient.patch).toHaveBeenCalledWith("/api/customers/c1/avatar/measurements", { avatarId: "av1", heightCm: 171, waistCm: null, source: "manual" });
  });

  it("deletes avatars with Axios config.data and accepts 204 empty responses", async () => {
    mockedApiClient.delete.mockResolvedValueOnce({ status: 204, data: undefined });
    await expect(avatarApi.deleteAvatar("c1", "av1")).resolves.toBeUndefined();
    expect(mockedApiClient.delete).toHaveBeenCalledWith("/api/customers/c1/avatar", { data: { avatarId: "av1" } });
  });

  it("normalizes paginated avatar history and degrades malformed measurementDataJson", async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: {
        data: {
          items: [
            {
              id: "hist-1",
              source: "image",
              recordedAt: "2026-06-02T12:00:00.000Z",
              measurementDataJson: JSON.stringify({
                HeightCm: 172,
                ShoulderWidthCm: 43,
              }),
            },
            {
              id: "hist-2",
              source: "manual",
              recordedAt: "2026-06-03T12:00:00.000Z",
              measurementDataJson: "{not-json",
            },
          ],
        },
      },
    });

    await expect(avatarApi.getHistory("c1")).resolves.toMatchObject({
      pageNumber: undefined,
      items: [
      expect.objectContaining({
        id: "hist-1",
        source: "image",
        createdAt: "2026-06-02T12:00:00.000Z",
        measurements: expect.objectContaining({
          heightCm: 172,
          shoulderCm: 43,
          chestCm: null,
        }),
      }),
      expect.objectContaining({
        id: "hist-2",
        source: "manual",
        measurements: expect.objectContaining({
          heightCm: null,
          shoulderCm: null,
        }),
      }),
      ],
    });
  });

  it("normalizes flat extraction responses and leaves multipart boundary generation to the browser", async () => {
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    mockedApiClient.post.mockResolvedValueOnce({
      data: {
        data: {
          id: "extracted-1",
          heightCm: 168,
          shoulderWidthCm: 40,
          avatar3dModelUrl: null,
        },
      },
    });

    await expect(avatarApi.extractFromImage("c1", { imageFile: file, heightCm: 168 })).resolves.toMatchObject({
      id: "extracted-1",
      avatar3dModelUrl: null,
      measurements: {
        heightCm: 168,
        shoulderCm: 40,
      },
    });

    expect(mockedApiClient.post).toHaveBeenCalledWith(
      "/api/customers/c1/avatar/extract-from-image",
      expect.any(FormData),
      { headers: { "Content-Type": undefined } },
    );
    const sentFormData = mockedApiClient.post.mock.calls[0][1] as FormData;
    expect(sentFormData.get("ImageFile")).toBe(file);
    expect(sentFormData.get("HeightCm")).toBe("168");
  });
});
