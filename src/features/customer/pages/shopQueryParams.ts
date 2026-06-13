import type { CustomerCatalogParams } from "@/features/customer/types/catalog";

export const SHOP_PAGE_SIZE = 12;

export interface ShopQueryState {
  search: string;
  categoryId: string;
  subcategoryId: string;
  minPrice: string;
  maxPrice: string;
  colors: string[];
  sizes: string[];
  fabricMaterials: string[];
  bodyShapes: string[];
  fabricPatterns: string[];
  brands: string[];
  sort: string;
  page: number;
}

const multiKeys = [
  "colors",
  "sizes",
  "fabricMaterials",
  "bodyShapes",
  "fabricPatterns",
  "brands",
] as const;

export const defaultShopQueryState: ShopQueryState = {
  search: "",
  categoryId: "",
  subcategoryId: "",
  minPrice: "",
  maxPrice: "",
  colors: [],
  sizes: [],
  fabricMaterials: [],
  bodyShapes: [],
  fabricPatterns: [],
  brands: [],
  sort: "featured",
  page: 1,
};

const readMulti = (params: URLSearchParams, key: string) =>
  params
    .getAll(key)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);

export function parseShopQuery(search: string): ShopQueryState {
  const params = new URLSearchParams(search);
  const page = Number(params.get("page") ?? "1");

  return {
    ...defaultShopQueryState,
    search: params.get("search") ?? "",
    categoryId: params.get("category") ?? "",
    subcategoryId: params.get("subcategory") ?? "",
    minPrice: params.get("minPrice") ?? "",
    maxPrice: params.get("maxPrice") ?? "",
    colors: readMulti(params, "colors"),
    sizes: readMulti(params, "sizes"),
    fabricMaterials: readMulti(params, "fabricMaterials"),
    bodyShapes: readMulti(params, "bodyShapes"),
    fabricPatterns: readMulti(params, "fabricPatterns"),
    brands: readMulti(params, "brands"),
    sort: params.get("sort") ?? defaultShopQueryState.sort,
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
  };
}

export function serializeShopQuery(state: ShopQueryState): string {
  const params = new URLSearchParams();
  if (state.search.trim()) params.set("search", state.search.trim());
  if (state.categoryId) params.set("category", state.categoryId);
  if (state.subcategoryId) params.set("subcategory", state.subcategoryId);
  if (state.minPrice) params.set("minPrice", state.minPrice);
  if (state.maxPrice) params.set("maxPrice", state.maxPrice);
  for (const key of multiKeys) {
    for (const value of state[key]) params.append(key, value);
  }
  if (state.sort !== defaultShopQueryState.sort) params.set("sort", state.sort);
  if (state.page > 1) params.set("page", String(state.page));
  return params.toString();
}

export function toCatalogParams(state: ShopQueryState): CustomerCatalogParams {
  const [sortBy, sortDirection] = state.sort.split(":") as [string, "asc" | "desc" | undefined];
  return {
    pageNumber: state.page,
    pageSize: SHOP_PAGE_SIZE,
    search: state.search.trim() || undefined,
    categoryId: state.categoryId || undefined,
    subcategoryId: state.subcategoryId || undefined,
    minPrice: state.minPrice ? Number(state.minPrice) : undefined,
    maxPrice: state.maxPrice ? Number(state.maxPrice) : undefined,
    colors: state.colors,
    sizes: state.sizes,
    fabricMaterials: state.fabricMaterials,
    bodyShapes: state.bodyShapes,
    fabricPatterns: state.fabricPatterns,
    brands: state.brands,
    sortBy: sortBy === "featured" ? undefined : sortBy,
    sortDirection: sortBy === "featured" ? undefined : sortDirection ?? "asc",
  };
}

export function resetShopFilters(state: ShopQueryState): ShopQueryState {
  return { ...defaultShopQueryState, search: state.search, sort: state.sort, page: 1 };
}
