import type { CustomerCatalogParams } from "@/features/customer/types/catalog";

export const DEFAULT_SHOP_PAGE_SIZE = 12;

const numberParam = (value: string | null): number | undefined => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const parseShopQueryParams = (searchParams: URLSearchParams): CustomerCatalogParams => ({
  pageNumber: numberParam(searchParams.get("page")) ?? 1,
  pageSize: DEFAULT_SHOP_PAGE_SIZE,
  search: searchParams.get("search") || undefined,
  categoryId: searchParams.get("categoryId") || undefined,
  minPrice: numberParam(searchParams.get("minPrice")),
  maxPrice: numberParam(searchParams.get("maxPrice")),
  sortBy: searchParams.get("sortBy") || undefined,
  sortDirection: searchParams.get("sortDirection") === "desc" ? "desc" : searchParams.get("sortDirection") === "asc" ? "asc" : undefined,
});

export const updateShopQueryParams = (
  current: URLSearchParams,
  updates: Record<string, string | number | null | undefined>,
) => {
  const next = new URLSearchParams(current);
  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") next.delete(key);
    else next.set(key, String(value));
  });
  return next;
};
