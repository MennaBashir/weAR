export interface CustomerProductImage {
  id?: string;
  url: string;
  altText?: string | null;
  isPrimary?: boolean;
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
  images?: CustomerProductImage[];
  categoryId?: string | null;
  categoryName?: string | null;
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
  subcategoryName?: string | null;
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
