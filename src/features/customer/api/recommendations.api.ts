import { apiClient } from "@/lib/axios";
import { stripEmptyParams, unwrapCustomerApiData } from "@/features/customer/api/customerApiUtils";
import type { CustomerProduct, SizeRecommendation } from "@/features/customer/types/catalog";

export const recommendationsApi = {
  getSizeRecommendation: async (customerId: string, productId: string) => {
    const response = await apiClient.get(
      `/api/customers/${customerId}/avatar/size-recommendation/${productId}`,
    );
    return unwrapCustomerApiData<SizeRecommendation>(response.data);
  },

  getComplementaryProducts: async (customerId: string, productId: string) => {
    const response = await apiClient.get(
      `/api/customers/${customerId}/outfits/complementary`,
      { params: stripEmptyParams({ productId, topK: 4 }) },
    );
    return unwrapCustomerApiData<CustomerProduct[]>(response.data);
  },
};
