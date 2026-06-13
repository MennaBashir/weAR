import { apiClient } from "@/lib/axios";
import {
  stripEmptyParams,
  unwrapCustomerApiData,
  unwrapCustomerApiList,
} from "@/features/customer/api/customerApiUtils";
import type {
  CompareProductsPayload,
  CustomerCatalogParams,
  CustomerCategory,
  CustomerOffer,
  CustomerPaginatedResult,
  CustomerProduct,
  CustomerProductImage,
  ProductsByModelIdsPayload,
} from "@/features/customer/types/catalog";

function normalizeProductImage(img: CustomerProductImage): CustomerProductImage {
  return {
    ...img,
    url: img.url || img.imageUrl || "",
  };
}

function normalizeProduct(product: CustomerProduct): CustomerProduct {
  return {
    ...product,
    views: product.views ?? product.viewsCount ?? null,
    categoryName: product.categoryName ?? product.category?.name ?? null,
    categoryId: product.categoryId ?? product.category?.id ?? null,
    images: product.images?.map(normalizeProductImage),
  };
}

export const catalogApi = {
  getProducts: async (
    params: CustomerCatalogParams = {},
  ): Promise<CustomerPaginatedResult<CustomerProduct>> => {
    const response = await apiClient.get("/api/catalog/products", {
      params: stripEmptyParams({
        pageNumber: 1,
        pageSize: 20,
        ...params,
      }),
    });

    const result = unwrapCustomerApiData<CustomerPaginatedResult<CustomerProduct>>(response.data);
    return { ...result, items: result.items?.map(normalizeProduct) ?? [] };
  },

  getProduct: async (
    productId: string,
  ): Promise<CustomerProduct> => {
    const response = await apiClient.get(
      `/api/catalog/products/${productId}`,
    );

    return normalizeProduct(unwrapCustomerApiData<CustomerProduct>(response.data));
  },

  getSimilarProducts: async (
    productId: string,
  ): Promise<CustomerProduct[]> => {
    const response = await apiClient.get(
      `/api/catalog/products/${productId}/similar`,
      {
        params: {
          limit: 8,
        },
      },
    );

    return unwrapCustomerApiList<CustomerProduct>(response.data).map(normalizeProduct);
  },

  compareProducts: async (
    payload: CompareProductsPayload,
  ): Promise<CustomerProduct[]> => {
    const response = await apiClient.post(
      "/api/catalog/products/compare",
      payload,
    );

    return unwrapCustomerApiList<CustomerProduct>(response.data).map(normalizeProduct);
  },

  getProductsByModelIds: async (
    payload: ProductsByModelIdsPayload,
  ): Promise<CustomerProduct[]> => {
    const response = await apiClient.post(
      "/api/catalog/products/by-model-ids",
      payload,
    );

    return unwrapCustomerApiList<CustomerProduct>(response.data).map(normalizeProduct);
  },

  getCategories: async (): Promise<CustomerCategory[]> => {
    const response = await apiClient.get(
      "/api/catalog/categories",
    );

    return unwrapCustomerApiList<CustomerCategory>(response.data);
  },

  getOffers: async (): Promise<CustomerOffer[]> => {
    const response = await apiClient.get("/api/catalog/offers");

    return unwrapCustomerApiList<CustomerOffer>(response.data);
  },
};
