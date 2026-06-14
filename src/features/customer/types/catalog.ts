export interface CustomerProductImage {
  id?: string;
  url: string;
  imageUrl?: string | null;
  altText?: string | null;
  isPrimary?: boolean;
  displayOrder?: number | null;
}

export interface CustomerProductCategory {
  id?: string | null;
  name?: string | null;
  description?: string | null;
}

export interface CustomerProduct {
  id: string;
  name: string;
  brand?: string | null;
  description?: string | null;
  price: number;
  discountedPrice?: number | null;
  currency?: string | null;
  imageUrl?: string | null;
  primaryImageUrl?: string | null;
  images?: CustomerProductImage[];
  categoryId?: string | null;
  categoryName?: string | null;
  category?: CustomerProductCategory | null;
  modelId?: string | null;
  isFavorite?: boolean;
  colors?: string[];
  sizes?: string[];
  fabricMaterial?: string | null;
  material?: string | null;
  pattern?: string | null;
  bodyShape?: string | null;
  features?: string[];
  careInstructions?: string | string[] | null;
  stockStatus?: string | null;
  stockQuantity?: number | null;
  views?: number | null;
  viewsCount?: number | null;
  reviewCount?: number | null;
  subcategoryName?: string | null;
  attributes?: Record<string, unknown> | null;
}

export interface CustomerCategory {
  id: string;
  name: string;
  slug?: string | null;
  imageUrl?: string | null;
  productCount?: number;
}

export interface CustomerOffer {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  discountPercentage?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface CustomerCatalogParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  subcategoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  offerId?: string;
  colors?: string[];
  sizes?: string[];
  fabricMaterials?: string[];
  bodyShapes?: string[];
  fabricPatterns?: string[];
  brands?: string[];
}

export interface CustomerPaginatedResult<T> {
  items: T[];
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
  totalPages?: number;
}

export interface CompareProductsPayload {
  productIds: string[];
}

export interface ProductsByModelIdsPayload {
  modelIds: string[];
}

export interface FavoriteTogglePayload {
  productId: string;
}

export interface FavoriteCheckPayload {
  productIds: string[];
}

export interface FavoriteCheckResult {
  productId: string;
  isFavorite: boolean;
}


export interface SizeRecommendation {
  recommendedSize?: string | null;
  size?: string | null;
  confidence?: number | string | null;
  explanation?: string | null;
  reason?: string | null;
}

// Saved Outfits

export interface OutfitItem {
  productId: string;
  slotType: number;
  displayOrder: number;
}

export interface OutfitSummary {
  id: string;
  name: string | null;
  style: string | null;
  itemCount: number;
  slotPreviews: Record<string, string | null> | null;
}

export interface OutfitPagedResult {
  items: OutfitSummary[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CreateOutfitPayload {
  name?: string | null;
  styleCategory?: string | null;
  items?: OutfitItem[] | null;
}

// AI Outfit Suggestions (Command 19)

export interface AiSuggestionProduct {
  id?: string | null;
  productId?: string | null;
  modelId?: string | null;
  slotType?: number | null;
  slot?: string | null;
  displayOrder?: number | null;
  reasoning?: string | null;
  description?: string | null;
  name?: string | null;
  price?: number | null;
  primaryImageUrl?: string | null;
  stockStatus?: string | null;
  resolvedProduct?: CustomerProduct | null;
}

export interface AiSuggestion {
  suggestionId: string | null;
  name?: string | null;
  styleNotes?: string | null;
  styleCategory?: string | null;
  occasion?: string | null;
  matchPercentage?: number | null;
  styleTags?: string[] | null;
  products: AiSuggestionProduct[];
}

export interface GenerateSuggestionsPayload {
  weatherCondition: string;
  occasion?: string | null;
  stylePreferences?: string[] | null;
  favoriteProductIds?: string[] | null;
  modelIds?: string[] | null;
  productIds?: string[] | null;
}

export interface SaveSuggestionPayload {
  suggestionId: string;
  name?: string | null;
  styleCategory?: string | null;
  items: OutfitItem[];
}
