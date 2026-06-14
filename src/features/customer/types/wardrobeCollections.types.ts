// Wardrobe Collections types — Swagger-only (Command 20)
// All fields are Swagger-derived unless explicitly marked runtime-verified.
// Update (rename) method/status unconfirmed: blocked pending Swagger clarification.

export interface WardrobeCollectionSummary {
  id: string;
  name: string;
  description?: string | null;
  itemCount?: number | null;
  coverImageUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface WardrobeCollectionItem {
  id: string;
  collectionId?: string | null;
  productId: string;
  productName?: string | null;
  /** Swagger field: productImageUrl. Mapped from either productImageUrl or primaryImageUrl. */
  primaryImageUrl?: string | null;
  price?: number | null;
  addedAt?: string | null;
}

export interface WardrobeCollectionsResult {
  items: WardrobeCollectionSummary[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
}

export interface WardrobeCollectionItemsResult {
  items: WardrobeCollectionItem[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
}

export interface CreateWardrobeCollectionPayload {
  name: string;
  description?: string | null;
}

/**
 * Update payload — Swagger-derived fields only.
 * HTTP method (PUT vs PATCH) and success status (200 vs 204) are unconfirmed.
 * This type documents the intended fields; implementation uses PUT pending clarification.
 */
export interface UpdateWardrobeCollectionPayload {
  name: string;
  description?: string | null;
}

export interface AddWardrobeCollectionItemPayload {
  productId: string;
}

export interface ListCollectionsParams {
  pageNumber?: number;
  pageSize?: number;
}
