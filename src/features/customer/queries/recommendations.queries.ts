import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { recommendationsApi } from "@/features/customer/api/recommendations.api";
import { selectCustomerId } from "@/features/customer/utils/customerSelectors";

export const customerRecommendationKeys = {
  all: ["customer", "recommendations"] as const,
  sizeRecommendation: (customerId: string | null, productId: string | null) =>
    [...customerRecommendationKeys.all, customerId, "size", productId] as const,
  complementary: (customerId: string | null, productId: string | null) =>
    [...customerRecommendationKeys.all, customerId, "complementary", productId] as const,
};

export const useCustomerSizeRecommendation = (productId: string | null | undefined) => {
  const customerId = useAuthStore(selectCustomerId);

  return useQuery({
    queryKey: customerRecommendationKeys.sizeRecommendation(customerId, productId ?? null),
    queryFn: () => recommendationsApi.getSizeRecommendation(customerId ?? "", productId ?? ""),
    enabled: !!customerId && !!productId,
    retry: false,
  });
};

export const useComplementaryCustomerProducts = (productId: string | null | undefined) => {
  const customerId = useAuthStore(selectCustomerId);

  return useQuery({
    queryKey: customerRecommendationKeys.complementary(customerId, productId ?? null),
    queryFn: () => recommendationsApi.getComplementaryProducts(customerId ?? "", productId ?? ""),
    enabled: !!customerId && !!productId,
    retry: false,
  });
};
