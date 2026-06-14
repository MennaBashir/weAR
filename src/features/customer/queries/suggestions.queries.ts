import { useMutation, useQueryClient } from "@tanstack/react-query";
import { suggestionsApi } from "@/features/customer/api/suggestions.api";
import { customerOutfitKeys } from "@/features/customer/queries/outfits.queries";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { selectCustomerId } from "@/features/customer/utils/customerSelectors";
import type {
  GenerateSuggestionsPayload,
  SaveSuggestionPayload,
} from "@/features/customer/types/catalog";

export const useGenerateSuggestions = () =>
  useMutation({
    mutationFn: (payload: GenerateSuggestionsPayload) =>
      suggestionsApi.generateSuggestions(payload),
  });

export const useSaveSuggestion = () => {
  const customerId = useAuthStore(selectCustomerId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveSuggestionPayload) => {
      if (!customerId) throw new Error("Customer session is required");
      return suggestionsApi.saveSuggestion(payload);
    },
    onSuccess: () => {
      if (!customerId) return;
      queryClient.invalidateQueries({
        queryKey: customerOutfitKeys.lists(customerId),
      });
    },
  });
};
