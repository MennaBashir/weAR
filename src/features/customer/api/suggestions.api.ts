import { apiClient } from "@/lib/axios";
import { isRecord, unwrapCustomerApiData } from "@/features/customer/api/customerApiUtils";
import { catalogApi } from "@/features/customer/api/catalog.api";
import type {
  AiSuggestion,
  AiSuggestionProduct,
  GenerateSuggestionsPayload,
  SaveSuggestionPayload,
} from "@/features/customer/types/catalog";

export class SuggestionApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "SuggestionApiError";
  }
}

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------

function normalizeSuggestionProduct(raw: unknown): AiSuggestionProduct {
  if (!isRecord(raw)) {
    return { productId: null, modelId: null, slotType: null, displayOrder: null, reasoning: null, resolvedProduct: null };
  }
  return {
    productId: typeof raw.productId === "string" ? raw.productId : null,
    modelId: typeof raw.modelId === "string" ? raw.modelId : null,
    slotType: typeof raw.slotType === "number" ? raw.slotType : null,
    displayOrder: typeof raw.displayOrder === "number" ? raw.displayOrder : null,
    reasoning: typeof raw.reasoning === "string" ? raw.reasoning : null,
    resolvedProduct: null,
  };
}

function normalizeSuggestion(raw: unknown): AiSuggestion | null {
  if (!isRecord(raw)) return null;

  // Accept `id` (Swagger-documented) or `suggestionId` (legacy/compatibility)
  const id =
    typeof raw.id === "string" ? raw.id
    : typeof raw.suggestionId === "string" ? raw.suggestionId
    : null;
  if (!id) return null;

  const rawProducts = Array.isArray(raw.products) ? raw.products : [];

  return {
    suggestionId: id,
    // Accept `outfitName` (Swagger-documented) or `name` (legacy/compatibility)
    name:
      typeof raw.outfitName === "string" ? raw.outfitName
      : typeof raw.name === "string" ? raw.name
      : null,
    styleNotes: typeof raw.styleNotes === "string" ? raw.styleNotes : null,
    styleCategory: typeof raw.styleCategory === "string" ? raw.styleCategory : null,
    occasion: typeof raw.occasion === "string" ? raw.occasion : null,
    products: rawProducts.map(normalizeSuggestionProduct),
  };
}

/**
 * Extracts the suggestion array from the response envelope.
 *
 * A. Documented Swagger shape: data.suggestions
 * B. Legacy/direct shape: data as a plain array
 *
 * Returns empty only when neither shape matches.
 */
function extractSuggestionArray(raw: unknown): unknown[] {
  // A. Documented: { suggestions: [...] }
  if (isRecord(raw) && Array.isArray(raw.suggestions)) {
    return raw.suggestions;
  }
  // B. Legacy: direct array
  if (Array.isArray(raw)) {
    return raw;
  }
  return [];
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const suggestionsApi = {
  generateSuggestions: async (
    payload: GenerateSuggestionsPayload,
  ): Promise<AiSuggestion[]> => {
    const response = await apiClient.post(
      "/api/customer/wardrobe/suggestions",
      payload,
    );

    const raw = unwrapCustomerApiData<unknown>(response.data);
    const rawArray = extractSuggestionArray(raw);

    const suggestions = rawArray
      .map(normalizeSuggestion)
      .filter((s): s is AiSuggestion => s !== null);

    return resolveModelIds(suggestions);
  },

  saveSuggestion: async (payload: SaveSuggestionPayload): Promise<string> => {
    try {
      const response = await apiClient.post(
        "/api/customer/wardrobe/suggestions/save",
        payload,
      );
      const raw = response.data;

      // Expected: { success: true, data: "uuid" } or bare "uuid" string
      const id: string | null =
        isRecord(raw) && typeof raw.data === "string" ? raw.data
        : typeof raw === "string" ? raw
        : null;

      if (id === null || id === "") {
        throw new SuggestionApiError(
          "INVALID_SAVE_RESPONSE",
          "Save suggestion: response did not contain a valid outfit ID",
        );
      }

      return id;
    } catch (err: unknown) {
      // Re-throw SuggestionApiError instances directly
      if (err instanceof SuggestionApiError) throw err;

      // Extract error code from Axios error responses
      if (isRecord(err) && isRecord(err.response) && isRecord(err.response.data)) {
        const code =
          typeof err.response.data.code === "string" ? err.response.data.code : undefined;
        const message =
          typeof err.response.data.message === "string"
            ? err.response.data.message
            : "Save suggestion failed";
        if (code) {
          throw new SuggestionApiError(code, message);
        }
      }
      throw err;
    }
  },
};
