import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { outfitsApi } from "@/features/customer/api/outfits.api";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { selectCustomerId } from "@/features/customer/utils/customerSelectors";
import { customerFavoriteKeys } from "@/features/customer/queries/favorites.queries";
import type { CreateOutfitPayload } from "@/features/customer/types/catalog";

export const customerOutfitKeys = {
  all: ["customer", "outfits"] as const,
  lists: (customerId: string | null) =>
    [...customerOutfitKeys.all, customerId, "list"] as const,
  list: (customerId: string | null, pageNumber: number, pageSize: number) =>
    [...customerOutfitKeys.lists(customerId), { pageNumber, pageSize }] as const,
};

export const useCustomerOutfits = (pageNumber = 1, pageSize = 10) => {
  const customerId = useAuthStore(selectCustomerId);

  return useQuery({
    queryKey: customerOutfitKeys.list(customerId, pageNumber, pageSize),
    queryFn: () =>
      outfitsApi.listOutfits(customerId ?? "", pageNumber, pageSize),
    enabled: !!customerId,
  });
};

export const useCreateCustomerOutfit = () => {
  const customerId = useAuthStore(selectCustomerId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOutfitPayload) => {
      if (!customerId) throw new Error("Customer session is required");
      return outfitsApi.createOutfit(customerId, payload);
    },
    onSuccess: () => {
      if (!customerId) return;
      queryClient.invalidateQueries({
        queryKey: customerOutfitKeys.lists(customerId),
      });
    },
  });
};

export const useDeleteCustomerOutfit = () => {
  const customerId = useAuthStore(selectCustomerId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (outfitId: string) => {
      if (!customerId) throw new Error("Customer session is required");
      return outfitsApi.deleteOutfit(customerId, outfitId);
    },
    onSuccess: () => {
      if (!customerId) return;
      queryClient.invalidateQueries({
        queryKey: customerOutfitKeys.lists(customerId),
      });
    },
  });
};

export const useAddToFavoritesThenRetry = () => {
  const customerId = useAuthStore(selectCustomerId);
  const queryClient = useQueryClient();

  return {
    invalidateFavorites: () => {
      if (!customerId) return;
      queryClient.invalidateQueries({
        queryKey: customerFavoriteKeys.lists(customerId),
      });
      queryClient.invalidateQueries({
        queryKey: customerFavoriteKeys.checks(customerId),
      });
    },
  };
};
