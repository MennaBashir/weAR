import axios from "axios";
import { apiClient } from "@/lib/axios";
import { unwrapCustomerApiData } from "@/features/customer/api/customerApiUtils";
import { buildAvatarImageExtractionFormData, normalizeNullableMeasurements } from "@/features/customer/types/profileAvatar";
import type { BodyMeasurements, ChangeCustomerPasswordPayload, CustomerAccountProfile, CustomerAddress, CustomerAddressPayload, CustomerAvatar, DeleteCustomerAccountPayload, ExtractAvatarFromImageInput, MeasurementHistoryEntry, SizeRecommendation, UpdateCustomerProfilePayload } from "@/features/customer/types/profileAvatar";

export const profileApi = {
  getProfile: async (signal?: AbortSignal) => {
    const response = await apiClient.get("/api/customer/profile", { signal });
    return unwrapCustomerApiData<CustomerAccountProfile>(response.data);
  },
  updateProfile: async (payload: UpdateCustomerProfilePayload) => {
    const response = await apiClient.put("/api/customer/profile", payload);
    return unwrapCustomerApiData<CustomerAccountProfile>(response.data);
  },
  changePassword: async (payload: ChangeCustomerPasswordPayload) => {
    const response = await apiClient.post("/api/customer/profile/change-password", payload);
    return unwrapCustomerApiData<{ message?: string }>(response.data);
  },
  deleteAccount: async (payload: DeleteCustomerAccountPayload) => {
    const response = await apiClient.post("/api/customer/profile/delete-account", payload);
    return unwrapCustomerApiData<{ message?: string }>(response.data);
  },
};

export const addressesApi = {
  list: async (signal?: AbortSignal) => {
    const response = await apiClient.get("/api/customer/addresses", { signal });
    return unwrapCustomerApiData<CustomerAddress[]>(response.data);
  },
  create: async (payload: CustomerAddressPayload) => {
    const response = await apiClient.post("/api/customer/addresses", payload);
    return unwrapCustomerApiData<CustomerAddress>(response.data);
  },
  get: async (id: string, signal?: AbortSignal) => {
    const response = await apiClient.get(`/api/customer/addresses/${id}`, { signal });
    return unwrapCustomerApiData<CustomerAddress>(response.data);
  },
  update: async (id: string, payload: CustomerAddressPayload) => {
    const response = await apiClient.put(`/api/customer/addresses/${id}`, payload);
    return unwrapCustomerApiData<CustomerAddress>(response.data);
  },
  delete: async (id: string) => {
    const response = await apiClient.delete(`/api/customer/addresses/${id}`);
    return unwrapCustomerApiData<{ message?: string }>(response.data);
  },
  setDefault: async (id: string) => {
    const response = await apiClient.patch(`/api/customer/addresses/${id}/default`);
    return unwrapCustomerApiData<CustomerAddress>(response.data);
  },
};

type FlatAvatarResponse = {
  id: string;
  customerId?: string;
  heightCm?: number | null;
  weightKg?: number | null;
  chestCm?: number | null;
  waistCm?: number | null;
  hipsCm?: number | null;
  shoulderWidthCm?: number | null;
  shoulderCm?: number | null;
  inseamCm?: number | null;
  neckCm?: number | null;
  armLengthCm?: number | null;
  shoeSizeEu?: number | null;
  bodyShape?: string | null;
  avatar3dModelUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  lastMeasuredAt?: string;
  measurements?: BodyMeasurements;
};

type AvatarHistoryResponse = {
  items?: Array<{
    id: string;
    measurementDataJson?: string | null;
    source?: string;
    recordedAt?: string;
    measurements?: BodyMeasurements;
    createdAt?: string;
  }>;
};

const mapFlatAvatarToCustomerAvatar = (
  avatar: FlatAvatarResponse,
  customerId: string,
): CustomerAvatar => ({
  id: avatar.id,
  customerId: avatar.customerId ?? customerId,
  measurements: normalizeNullableMeasurements(
    avatar.measurements ?? {
      heightCm: avatar.heightCm ?? null,
      weightKg: avatar.weightKg ?? null,
      chestCm: avatar.chestCm ?? null,
      waistCm: avatar.waistCm ?? null,
      hipsCm: avatar.hipsCm ?? null,
      shoulderCm:
        avatar.shoulderCm ??
        avatar.shoulderWidthCm ??
        null,
      inseamCm: avatar.inseamCm ?? null,
    },
  ),
  avatar3dModelUrl: avatar.avatar3dModelUrl ?? null,
  createdAt: avatar.createdAt,
  updatedAt: avatar.updatedAt ?? avatar.lastMeasuredAt,
});

const parseHistoryMeasurements = (
  value?: string | null,
): BodyMeasurements => {
  if (!value) {
    return normalizeNullableMeasurements({});
  }

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;

    return normalizeNullableMeasurements({
      heightCm:
        typeof parsed.HeightCm === "number"
          ? parsed.HeightCm
          : null,
      weightKg:
        typeof parsed.WeightKg === "number"
          ? parsed.WeightKg
          : null,
      chestCm:
        typeof parsed.ChestCm === "number"
          ? parsed.ChestCm
          : null,
      waistCm:
        typeof parsed.WaistCm === "number"
          ? parsed.WaistCm
          : null,
      hipsCm:
        typeof parsed.HipsCm === "number"
          ? parsed.HipsCm
          : null,
      shoulderCm:
        typeof parsed.ShoulderWidthCm === "number"
          ? parsed.ShoulderWidthCm
          : null,
      inseamCm:
        typeof parsed.InseamCm === "number"
          ? parsed.InseamCm
          : null,
    });
  } catch {
    return normalizeNullableMeasurements({});
  }
};

const normalizeAvatar = (
  avatar: CustomerAvatar,
): CustomerAvatar => ({
  ...avatar,
  avatar3dModelUrl: avatar.avatar3dModelUrl ?? null,
  measurements: normalizeNullableMeasurements(
    avatar.measurements ?? {},
  ),
});

export const avatarApi = {
  getAvatar: async (customerId: string, signal?: AbortSignal): Promise<CustomerAvatar | null> => {
    try {
      const response = await apiClient.get(
        `/api/customers/${customerId}/avatar`,
        { signal },
      );

      const avatar = unwrapCustomerApiData<FlatAvatarResponse>(
        response.data,
      );

      return mapFlatAvatarToCustomerAvatar(avatar, customerId);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) return null;
      throw error;
    }
  },
  createAvatar: async (customerId: string, measurements: BodyMeasurements) => {
    const response = await apiClient.post(`/api/customers/${customerId}/avatar`, { measurements });
    return normalizeAvatar(unwrapCustomerApiData<CustomerAvatar>(response.data));
  },
  deleteAvatar: async (customerId: string) => {
    const response = await apiClient.delete(`/api/customers/${customerId}/avatar`);
    return unwrapCustomerApiData<{ message?: string }>(response.data);
  },
  getHistory: async (
    customerId: string,
    signal?: AbortSignal,
  ) => {
    const response = await apiClient.get(
      `/api/customers/${customerId}/avatar/history`,
      { signal },
    );

    const history = unwrapCustomerApiData<
      AvatarHistoryResponse | MeasurementHistoryEntry[]
    >(response.data);

    const items = Array.isArray(history)
      ? history
      : history.items ?? [];

    return items.map((entry) => {
      if ("measurements" in entry && entry.measurements) {
        return {
          ...entry,
          measurements: normalizeNullableMeasurements(
            entry.measurements,
          ),
        } as MeasurementHistoryEntry;
      }

      return {
        id: entry.id,
        measurements: parseHistoryMeasurements(
          entry.measurementDataJson,
        ),
        source: entry.source ?? "unknown",
        createdAt:
          entry.recordedAt ??
          entry.createdAt ??
          new Date(0).toISOString(),
      } satisfies MeasurementHistoryEntry;
    });
  },
  updateMeasurements: async (customerId: string, measurements: BodyMeasurements) => {
    const response = await apiClient.patch(`/api/customers/${customerId}/avatar/measurements`, { measurements });
    return normalizeAvatar(unwrapCustomerApiData<CustomerAvatar>(response.data));
  },
  getSizeRecommendation: async (customerId: string, productId: string, signal?: AbortSignal) => {
    const response = await apiClient.get(`/api/customers/${customerId}/avatar/size-recommendation/${productId}`, { signal });
    return unwrapCustomerApiData<SizeRecommendation>(response.data);
  },
  extractFromImage: async (customerId: string, input: ExtractAvatarFromImageInput) => {
    const formData = buildAvatarImageExtractionFormData(input);

    const response = await apiClient.post(
      `/api/customers/${customerId}/avatar/extract-from-image`,
      formData,
      {
        headers: {
          "Content-Type": undefined,
        },
      },
    );

    const extracted = unwrapCustomerApiData<{
      id: string;
      heightCm?: number | null;
      weightKg?: number | null;
      chestCm?: number | null;
      waistCm?: number | null;
      hipsCm?: number | null;
      shoulderWidthCm?: number | null;
      shoulderCm?: number | null;
      inseamCm?: number | null;
      avatar3dModelUrl?: string | null;
      lastMeasuredAt?: string;
    }>(response.data);

    return mapFlatAvatarToCustomerAvatar(
      extracted,
      customerId,
    );
  },
};
