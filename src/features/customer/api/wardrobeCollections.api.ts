/**
 * Wardrobe Collections API adapter — Command 20
 *
 * All endpoints are Swagger-only (not deployed-verified).
 * CONNECT tunnel to vfr-backend.onrender.com returns 403 Forbidden.
 *
 * Update (PUT /collections/{id}): method and success status unconfirmed.
 * Using PUT; 204 assumed. Documented as blocked pending confirmation.
 *
 * customerId MUST come from authenticated Customer state, not request body.
 */
import { apiClient } from "@/lib/axios";
import { isRecord } from "@/features/customer/api/customerApiUtils";
import type {
  WardrobeCollectionsResult,
  WardrobeCollectionItemsResult,
  WardrobeCollectionSummary,
  WardrobeCollectionItem,
  CreateWardrobeCollectionPayload,
  UpdateWardrobeCollectionPayload,
  AddWardrobeCollectionItemPayload,
  ListCollectionsParams,
} from "@/features/customer/types/wardrobeCollections.types";

export class WardrobeCollectionApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "WardrobeCollectionApiError";
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeCollectionItem(raw: unknown): WardrobeCollectionItem {
  if (!isRecord(raw)) {
    return { id: "", productId: "" };
  }
  return {
    id: typeof raw.id === "string" ? raw.id : "",
    collectionId: typeof raw.collectionId === "string" ? raw.collectionId : null,
    productId: typeof raw.productId === "string" ? raw.productId : "",
    productName: typeof raw.productName === "string" ? raw.productName : null,
    // Swagger uses productImageUrl; normalise either field name
    primaryImageUrl:
      typeof raw.productImageUrl === "string"
        ? raw.productImageUrl
        : typeof raw.primaryImageUrl === "string"
          ? raw.primaryImageUrl
          : null,
    price: typeof raw.price === "number" ? raw.price : null,
    addedAt: typeof raw.addedAt === "string" ? raw.addedAt : null,
  };
}

function normalizeCollectionSummary(raw: unknown): WardrobeCollectionSummary {
  if (!isRecord(raw)) {
    return { id: "", name: "" };
  }
  return {
    id: typeof raw.id === "string" ? raw.id : "",
    name: typeof raw.name === "string" ? raw.name : "",
    description: typeof raw.description === "string" ? raw.description : null,
    itemCount: typeof raw.itemCount === "number" ? raw.itemCount : null,
    coverImageUrl: typeof raw.coverImageUrl === "string" ? raw.coverImageUrl : null,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : null,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : null,
  };
}

function normalizePagedCollections(payload: unknown): WardrobeCollectionsResult {
  let inner: unknown = payload;

  if (isRecord(inner) && "data" in inner) {
    inner = inner.data;
  }
  if (isRecord(inner) && "data" in inner) {
    inner = inner.data;
  }

  if (isRecord(inner) && "items" in inner && Array.isArray(inner.items)) {
    return {
      items: inner.items.map(normalizeCollectionSummary),
      pageNumber: typeof inner.pageNumber === "number" ? inner.pageNumber : 1,
      pageSize: typeof inner.pageSize === "number" ? inner.pageSize : 10,
      totalCount: typeof inner.totalCount === "number" ? inner.totalCount : 0,
      totalPages: typeof inner.totalPages === "number" ? inner.totalPages : 0,
      hasPreviousPage:
        typeof inner.hasPreviousPage === "boolean" ? inner.hasPreviousPage : false,
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

function normalizePagedCollectionItems(payload: unknown): WardrobeCollectionItemsResult {
  let inner: unknown = payload;

  if (isRecord(inner) && "data" in inner) {
    inner = inner.data;
  }
  if (isRecord(inner) && "data" in inner) {
    inner = inner.data;
  }

  if (isRecord(inner) && "items" in inner && Array.isArray(inner.items)) {
    return {
      items: inner.items.map(normalizeCollectionItem),
      pageNumber: typeof inner.pageNumber === "number" ? inner.pageNumber : 1,
      pageSize: typeof inner.pageSize === "number" ? inner.pageSize : 10,
      totalCount: typeof inner.totalCount === "number" ? inner.totalCount : 0,
      totalPages: typeof inner.totalPages === "number" ? inner.totalPages : 0,
      hasPreviousPage:
        typeof inner.hasPreviousPage === "boolean" ? inner.hasPreviousPage : false,
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

function extractCreatedId(raw: unknown): string {
  if (isRecord(raw) && typeof raw.data === "string" && raw.data.length > 0) {
    return raw.data;
  }
  if (typeof raw === "string" && raw.length > 0) {
    return raw;
  }
  throw new WardrobeCollectionApiError(
    "INVALID_CREATE_RESPONSE",
    "Server returned an unexpected response for collection creation.",
  );
}

function rethrowApiError(err: unknown, fallback: string): never {
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
        : fallback;
    if (code) {
      throw new WardrobeCollectionApiError(code, message);
    }
  }
  throw err;
}

// ---------------------------------------------------------------------------
// API adapter
// ---------------------------------------------------------------------------

const BASE = (customerId: string) =>
  `/api/customers/${customerId}/wardrobe/collections`;

const ITEM_BASE = (customerId: string, collectionId: string) =>
  `${BASE(customerId)}/${collectionId}/items`;

export const wardrobeCollectionsApi = {
  /**
   * GET /api/customers/{customerId}/wardrobe/collections
   * Swagger-only.
   */
  listCollections: async (
    customerId: string,
    params: ListCollectionsParams = {},
  ): Promise<WardrobeCollectionsResult> => {
    const response = await apiClient.get(BASE(customerId), { params });
    return normalizePagedCollections(response.data);
  },

  /**
   * POST /api/customers/{customerId}/wardrobe/collections
   * Swagger-only. Returns UUID string in data.
   * Trims name before sending; does not send customerId in body.
   */
  createCollection: async (
    customerId: string,
    payload: CreateWardrobeCollectionPayload,
  ): Promise<string> => {
    const body: CreateWardrobeCollectionPayload = {
      name: payload.name.trim(),
      description: payload.description ?? null,
    };
    try {
      const response = await apiClient.post(BASE(customerId), body);
      return extractCreatedId(response.data);
    } catch (err: unknown) {
      rethrowApiError(err, "Collection creation failed.");
    }
  },

  /**
   * PUT /api/customers/{customerId}/wardrobe/collections/{collectionId}
   * Swagger-only. Method (PUT vs PATCH) and success status (200 vs 204) are unconfirmed.
   * Using PUT; treating response as 204 (no JSON parsing).
   *
   * BLOCKED: exact method and success status pending runtime or Swagger clarification.
   */
  updateCollection: async (
    customerId: string,
    collectionId: string,
    payload: UpdateWardrobeCollectionPayload,
  ): Promise<void> => {
    const body: UpdateWardrobeCollectionPayload = {
      name: payload.name.trim(),
      description: payload.description ?? null,
    };
    try {
      await apiClient.put(`${BASE(customerId)}/${collectionId}`, body);
    } catch (err: unknown) {
      rethrowApiError(err, "Collection update failed.");
    }
  },

  /**
   * DELETE /api/customers/{customerId}/wardrobe/collections/{collectionId}
   * Swagger-only. 204 No Content; no body parsing.
   */
  deleteCollection: async (
    customerId: string,
    collectionId: string,
  ): Promise<void> => {
    try {
      await apiClient.delete(`${BASE(customerId)}/${collectionId}`);
    } catch (err: unknown) {
      rethrowApiError(err, "Collection deletion failed.");
    }
  },

  /**
   * GET /api/customers/{customerId}/wardrobe/collections/{collectionId}/items
   * Swagger-only. Exact item shape unconfirmed.
   */
  listCollectionItems: async (
    customerId: string,
    collectionId: string,
    params: ListCollectionsParams = {},
  ): Promise<WardrobeCollectionItemsResult> => {
    const response = await apiClient.get(ITEM_BASE(customerId, collectionId), {
      params,
    });
    return normalizePagedCollectionItems(response.data);
  },

  /**
   * POST /api/customers/{customerId}/wardrobe/collections/{collectionId}/items
   * Swagger-only. productId required. Returns item UUID in data.
   * Duplicate-add behavior unconfirmed (may be 409 or idempotent).
   */
  addCollectionItem: async (
    customerId: string,
    collectionId: string,
    payload: AddWardrobeCollectionItemPayload,
  ): Promise<string> => {
    try {
      const response = await apiClient.post(
        ITEM_BASE(customerId, collectionId),
        { productId: payload.productId },
      );
      const raw = response.data;
      if (isRecord(raw) && typeof raw.data === "string") {
        return raw.data;
      }
      if (typeof raw === "string" && raw.length > 0) {
        return raw;
      }
      return "";
    } catch (err: unknown) {
      rethrowApiError(err, "Failed to add item to collection.");
    }
  },

  /**
   * DELETE /api/customers/{customerId}/wardrobe/collections/{collectionId}/items/{itemId}
   * Swagger-only. 204 No Content; no body parsing.
   */
  removeCollectionItem: async (
    customerId: string,
    collectionId: string,
    itemId: string,
  ): Promise<void> => {
    try {
      await apiClient.delete(`${ITEM_BASE(customerId, collectionId)}/${itemId}`);
    } catch (err: unknown) {
      rethrowApiError(err, "Failed to remove item from collection.");
    }
  },
};
