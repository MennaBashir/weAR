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
  ProductsByModelIdsPayload,
} from "@/features/customer/types/catalog";

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

    return unwrapCustomerApiData<
      CustomerPaginatedResult<CustomerProduct>
    >(response.data);
  },

  getProduct: async (
    productId: string,
  ): Promise<CustomerProduct> => {
    const response = await apiClient.get(
      `/api/catalog/products/${productId}`,
    );

    return unwrapCustomerApiData<CustomerProduct>(response.data);
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

    return unwrapCustomerApiList<CustomerProduct>(response.data);
  },

  compareProducts: async (
    payload: CompareProductsPayload,
  ): Promise<CustomerProduct[]> => {
    const response = await apiClient.post(
      "/api/catalog/products/compare",
      payload,
    );

    return unwrapCustomerApiList<CustomerProduct>(response.data);
  },

  getProductsByModelIds: async (
    payload: ProductsByModelIdsPayload,
  ): Promise<CustomerProduct[]> => {
    const response = await apiClient.post(
      "/api/catalog/products/by-model-ids",
      payload,
    );

    return unwrapCustomerApiList<CustomerProduct>(response.data);
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
