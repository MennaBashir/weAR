/**
 * Wardrobe Collections API adapter — Command 20, runtime-aligned (2026-06-14)
 *
 * Runtime-verified facts (2026-06-14):
 * - List (GET): HTTP 200, response.data is a direct array. itemCount and coverImageUrl present.
 * - Create (POST): HTTP 201, response.data is UUID string. Duplicate name → HTTP 409 code:CONFLICT.
 * - Rename (PATCH): { newName } → HTTP 204. PUT → 405. Blank newName → HTTP 422 code:InvalidName.
 * - Delete (DELETE): HTTP 204, no body. Subsequent GET confirmed removal.
 * - List items (GET): HTTP 200, paginated data.items envelope (empty collection verified).
 * - Add item (POST): HTTP 204, empty body. Add persisted; list after add shows itemCount:1 and coverImageUrl.
 * - Duplicate add: HTTP 204, idempotent — itemCount unchanged; no client-side duplicate created.
 * - List items after add: HTTP 500 INTERNAL_ERROR (backend defect; add itself succeeded).
 * - Remove item (DELETE): Swagger-only, runtime-blocked (itemId unavailable due to GET items 500).
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
  RenameWardrobeCollectionPayload,
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

function normalizeCollectionItem(raw: unknown): WardrobeCollectionItem | null {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === "string" ? raw.id : "";
  const productId = typeof raw.productId === "string" ? raw.productId : "";
  if (!id || !productId) return null;
  return {
    id,
    collectionId: typeof raw.collectionId === "string" ? raw.collectionId : null,
    productId,
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

  // Primary runtime path: direct array (runtime-verified 2026-06-14)
  if (Array.isArray(inner)) {
    const items = inner
      .map(normalizeCollectionSummary)
      .filter((c) => c.id !== "" && c.name !== "");
    return {
      items,
      pageNumber: 1,
      pageSize: items.length,
      totalCount: items.length,
      totalPages: items.length > 0 ? 1 : 0,
      hasPreviousPage: false,
      hasNextPage: false,
    };
  }

  // Paginated envelope path (Swagger-described, kept for compatibility)
  if (isRecord(inner) && "items" in inner && Array.isArray(inner.items)) {
    const items = inner.items
      .map(normalizeCollectionSummary)
      .filter((c) => c.id !== "" && c.name !== "");
    return {
      items,
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

  throw new WardrobeCollectionApiError(
    "INVALID_LIST_RESPONSE",
    "Server returned an unexpected response for collection list.",
  );
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
      items: inner.items
        .map(normalizeCollectionItem)
        .filter((item): item is WardrobeCollectionItem => item !== null),
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

  throw new WardrobeCollectionApiError(
    "INVALID_ITEMS_RESPONSE",
    "Server returned an unexpected response for collection items.",
  );
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
   * Runtime-verified: HTTP 200, direct data array. Refreshed list after add shows itemCount and coverImageUrl.
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
   * Runtime-verified: HTTP 201, UUID string in data. Duplicate name → HTTP 409 CONFLICT.
   * Trims name; does not send customerId in body.
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
   * PATCH /api/customers/{customerId}/wardrobe/collections/{collectionId}
   * Runtime-verified (2026-06-14): PATCH { newName } → HTTP 204. PUT returns 405.
   * No body parsing on success.
   */
  renameCollection: async (
    customerId: string,
    collectionId: string,
    payload: RenameWardrobeCollectionPayload,
  ): Promise<void> => {
    const body: RenameWardrobeCollectionPayload = {
      newName: payload.newName.trim(),
    };
    try {
      await apiClient.patch(`${BASE(customerId)}/${collectionId}`, body);
    } catch (err: unknown) {
      rethrowApiError(err, "Collection rename failed.");
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
   * Runtime-verified (empty case): HTTP 200, paginated data.items envelope.
   * After add: HTTP 500 INTERNAL_ERROR (backend read defect; add itself succeeded).
   * Malformed items (missing id or productId) are filtered. Unknown shapes throw INVALID_ITEMS_RESPONSE.
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
   * Runtime-verified: HTTP 204, empty body. Add persisted (itemCount updated in list).
   * Duplicate productId → HTTP 204 (idempotent in tested deployment; itemCount unchanged).
   * Subsequent GET items → HTTP 500 backend defect (add itself succeeded).
   */
  addCollectionItem: async (
    customerId: string,
    collectionId: string,
    payload: AddWardrobeCollectionItemPayload,
  ): Promise<void> => {
    try {
      await apiClient.post(
        ITEM_BASE(customerId, collectionId),
        { productId: payload.productId },
      );
    } catch (err: unknown) {
      rethrowApiError(err, "Failed to add item to collection.");
    }
  },

  /**
   * DELETE /api/customers/{customerId}/wardrobe/collections/{collectionId}/items/{itemId}
   * Swagger-only (Swagger-confirmed path: .../items/{itemId}, NOT .../items/products/{productId}).
   * 204 No Content; no body parsing. Runtime-blocked (itemId unavailable due to GET items 500).
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
