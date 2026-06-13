import { useQuery } from "@tanstack/react-query";
import { catalogApi } from "@/features/customer/api/catalog.api";
import type { CustomerCatalogParams } from "@/features/customer/types/catalog";
import { COMPARE_MIN } from "@/features/customer/compare/useCompareStore";

export const customerCatalogKeys = {
  all: ["customer", "catalog"] as const,
  compare: (productIds: string[]) =>
    [...["customer", "catalog"], "compare", [...productIds].sort()] as const,
  products: () => [...customerCatalogKeys.all, "products"] as const,
  productsList: (params: CustomerCatalogParams = {}) =>
    [...customerCatalogKeys.products(), "list", params] as const,
  productDetail: (productId: string) =>
    [...customerCatalogKeys.products(), "detail", productId] as const,
  similarProducts: (productId: string) =>
    [...customerCatalogKeys.products(), "similar", productId] as const,
  categories: () => [...customerCatalogKeys.all, "categories"] as const,
  offers: () => [...customerCatalogKeys.all, "offers"] as const,
};

export const useCustomerProducts = (params: CustomerCatalogParams = {}) =>
  useQuery({
    queryKey: customerCatalogKeys.productsList(params),
    queryFn: () => catalogApi.getProducts(params),
  });

export const useCustomerProduct = (productId: string | null | undefined) =>
  useQuery({
    queryKey: customerCatalogKeys.productDetail(productId ?? ""),
    queryFn: () => catalogApi.getProduct(productId ?? ""),
    enabled: !!productId,
  });

export const useSimilarCustomerProducts = (
  productId: string | null | undefined,
) =>
  useQuery({
    queryKey: customerCatalogKeys.similarProducts(productId ?? ""),
    queryFn: () => catalogApi.getSimilarProducts(productId ?? ""),
    enabled: !!productId,
  });

export const useCustomerCategories = () =>
  useQuery({
    queryKey: customerCatalogKeys.categories(),
    queryFn: catalogApi.getCategories,
  });

export const useCustomerOffers = () =>
  useQuery({
    queryKey: customerCatalogKeys.offers(),
    queryFn: catalogApi.getOffers,
  });

export const useCompareProducts = (productIds: string[]) =>
  useQuery({
    queryKey: customerCatalogKeys.compare(productIds),
    queryFn: () => catalogApi.compareProducts({ productIds }),
    enabled: productIds.length >= COMPARE_MIN,
  });
