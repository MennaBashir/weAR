// Wardrobe Collections types — Command 20, runtime-aligned (2026-06-14)
// Runtime-verified: List returns direct array; Create returns UUID string (201);
// Rename uses PATCH { newName } → 204; Add item → 204 void; List items empty → paginated envelope;
// List items after add → 500 backend defect documented.

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
 * Rename payload — runtime-verified (2026-06-14).
 * PATCH /collections/{id} with { newName } → HTTP 204.
 * PUT returns 405 Method Not Allowed.
 */
export interface RenameWardrobeCollectionPayload {
  newName: string;
}

export interface AddWardrobeCollectionItemPayload {
  productId: string;
}

export interface ListCollectionsParams {
  pageNumber?: number;
  pageSize?: number;
}
