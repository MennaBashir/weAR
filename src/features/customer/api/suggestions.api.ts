import { apiClient } from "@/lib/axios";
import { isRecord, unwrapCustomerApiData } from "@/features/customer/api/customerApiUtils";
import { catalogApi } from "@/features/customer/api/catalog.api";
import type {
  AiSuggestion,
  AiSuggestionProduct,
  GenerateSuggestionsPayload,
  SaveSuggestionPayload,
} from "@/features/customer/types/catalog";

function normalizeSuggestionProduct(raw: unknown): AiSuggestionProduct {
  if (!isRecord(raw)) return { productId: null, modelId: null };
  return {
    productId: typeof raw.productId === "string" ? raw.productId : null,
    modelId: typeof raw.modelId === "string" ? raw.modelId : null,
    slotType: typeof raw.slotType === "number" ? raw.slotType : null,
    displayOrder: typeof raw.displayOrder === "number" ? raw.displayOrder : null,
    resolvedProduct: null,
  };
}

function normalizeSuggestion(raw: unknown): AiSuggestion | null {
  if (!isRecord(raw)) return null;
  const id = typeof raw.suggestionId === "string" ? raw.suggestionId : null;
  if (!id) return null;

  const rawProducts = Array.isArray(raw.products) ? raw.products : [];

  return {
    suggestionId: id,
    name: typeof raw.name === "string" ? raw.name : null,
    styleCategory: typeof raw.styleCategory === "string" ? raw.styleCategory : null,
    occasion: typeof raw.occasion === "string" ? raw.occasion : null,
    products: rawProducts.map(normalizeSuggestionProduct),
  };
}

async function resolveModelIds(suggestions: AiSuggestion[]): Promise<AiSuggestion[]> {
  const unresolved = suggestions.flatMap((s) =>
    s.products.filter((p) => !p.productId && p.modelId).map((p) => p.modelId as string),
  );
  const uniqueModelIds = [...new Set(unresolved)];

  if (uniqueModelIds.length === 0) return suggestions;

  const resolved = await catalogApi.getProductsByModelIds({ modelIds: uniqueModelIds });
  const byModelId = new Map(resolved.map((p) => [p.modelId ?? "", p]));

  return suggestions.map((s) => ({
    ...s,
    products: s.products.map((p) => {
      if (!p.productId && p.modelId) {
        const product = byModelId.get(p.modelId);
        return product
          ? { ...p, productId: product.id, resolvedProduct: product }
          : p;
      }
      return p;
    }),
  }));
}

export const suggestionsApi = {
  generateSuggestions: async (
    payload: GenerateSuggestionsPayload,
  ): Promise<AiSuggestion[]> => {
    const response = await apiClient.post(
      "/api/customer/wardrobe/suggestions",
      payload,
    );

    const raw = unwrapCustomerApiData<unknown>(response.data);
    const rawArray = Array.isArray(raw) ? raw : [];

    const suggestions = rawArray
      .map(normalizeSuggestion)
      .filter((s): s is AiSuggestion => s !== null);

    return resolveModelIds(suggestions);
  },

  saveSuggestion: async (payload: SaveSuggestionPayload): Promise<string> => {
    const response = await apiClient.post(
      "/api/customer/wardrobe/suggestions/save",
      payload,
    );
    const raw = response.data;
    if (isRecord(raw) && typeof raw.data === "string") return raw.data;
    if (typeof raw === "string") return raw;
    return String(raw);
  },
};
