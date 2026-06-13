import { apiClient } from "@/lib/axios";
import { isRecord } from "@/features/customer/api/customerApiUtils";
import type {
  CreateOutfitPayload,
  OutfitPagedResult,
  OutfitSummary,
} from "@/features/customer/types/catalog";

export class OutfitApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "OutfitApiError";
  }
}

function normalizePagedOutfits(payload: unknown): OutfitPagedResult {
  let inner: unknown = payload;

  if (isRecord(inner) && "data" in inner) {
    inner = inner.data;
  }
  if (isRecord(inner) && "data" in inner) {
    inner = inner.data;
  }

  if (isRecord(inner) && "items" in inner && Array.isArray(inner.items)) {
    return {
      items: inner.items as OutfitSummary[],
      pageNumber: typeof inner.pageNumber === "number" ? inner.pageNumber : 1,
      pageSize: typeof inner.pageSize === "number" ? inner.pageSize : 10,
      totalCount: typeof inner.totalCount === "number" ? inner.totalCount : 0,
      totalPages: typeof inner.totalPages === "number" ? inner.totalPages : 0,
      hasPreviousPage:
        typeof inner.hasPreviousPage === "boolean"
          ? inner.hasPreviousPage
          : false,
      hasNextPage:
        typeof inner.hasNextPage === "boolean" ? inner.hasNextPage : false,
    };
  }

  return {
    items: [],
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  };
}

export const outfitsApi = {
  listOutfits: async (
    customerId: string,
    pageNumber = 1,
    pageSize = 10,
  ): Promise<OutfitPagedResult> => {
    const response = await apiClient.get(
      `/api/customers/${customerId}/outfits`,
      { params: { pageNumber, pageSize } },
    );
    return normalizePagedOutfits(response.data);
  },

  createOutfit: async (
    customerId: string,
    payload: CreateOutfitPayload,
  ): Promise<string> => {
    try {
      const response = await apiClient.post(
        `/api/customers/${customerId}/outfits`,
        payload,
      );
      const raw = response.data;
      if (isRecord(raw) && typeof raw.data === "string") {
        return raw.data;
      }
      if (typeof raw === "string") {
        return raw;
      }
      return String(raw);
    } catch (err: unknown) {
      if (
        isRecord(err) &&
        isRecord(err.response) &&
        isRecord(err.response.data)
      ) {
        const code =
          typeof err.response.data.code === "string"
            ? err.response.data.code
            : undefined;
        const message =
          typeof err.response.data.message === "string"
            ? err.response.data.message
            : "Outfit creation failed";
        if (code) {
          throw new OutfitApiError(code, message);
        }
      }
      throw err;
    }
  },

  deleteOutfit: async (
    customerId: string,
    outfitId: string,
  ): Promise<void> => {
    await apiClient.delete(
      `/api/customers/${customerId}/outfits/${outfitId}`,
    );
  },
};
