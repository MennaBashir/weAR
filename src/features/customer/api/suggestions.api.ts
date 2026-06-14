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
    return { id: null, productId: null, modelId: null, slotType: null, slot: null, displayOrder: null, reasoning: null, description: null, name: null, price: null, primaryImageUrl: null, stockStatus: null, resolvedProduct: null };
  }
  return {
    id: typeof raw.id === "string" ? raw.id : null,
    productId: typeof raw.productId === "string" ? raw.productId : null,
    modelId: typeof raw.modelId === "string" ? raw.modelId : null,
    // slotType only when numeric — string slot values are display-only and must not be coerced
    slotType: typeof raw.slotType === "number" ? raw.slotType : null,
    slot: typeof raw.slot === "string" ? raw.slot : null,
    displayOrder: typeof raw.displayOrder === "number" ? raw.displayOrder : null,
    reasoning: typeof raw.reasoning === "string" ? raw.reasoning : null,
    description: typeof raw.description === "string" ? raw.description : null,
    // productName (deployed) → name/title (Swagger/legacy)
    name:
      typeof raw.productName === "string" ? raw.productName
      : typeof raw.name === "string" ? raw.name
      : typeof raw.title === "string" ? raw.title
      : null,
    price: typeof raw.price === "number" ? raw.price : null,
    primaryImageUrl: typeof raw.primaryImageUrl === "string" ? raw.primaryImageUrl : null,
    stockStatus: typeof raw.stockStatus === "string" ? raw.stockStatus : null,
    resolvedProduct: null,
  };
}

function normalizeSuggestion(raw: unknown): AiSuggestion | null {
  if (!isRecord(raw)) return null;

  // Accept `id` (Swagger) or `suggestionId` (legacy); null when absent (verified deployed response)
  const id =
    typeof raw.id === "string" ? raw.id
    : typeof raw.suggestionId === "string" ? raw.suggestionId
    : null;

  // Accept `items` (verified deployed) or `products` (Swagger/legacy)
  const rawProducts = Array.isArray(raw.items) ? raw.items : Array.isArray(raw.products) ? raw.products : [];

  return {
    suggestionId: id,
    // `title` (verified deployed) → `outfitName` (Swagger) → `name` (legacy)
    name:
      typeof raw.title === "string" ? raw.title
      : typeof raw.outfitName === "string" ? raw.outfitName
      : typeof raw.name === "string" ? raw.name
      : null,
    // `description` (verified deployed) → `styleNotes` (Swagger)
    styleNotes:
      typeof raw.description === "string" ? raw.description
      : typeof raw.styleNotes === "string" ? raw.styleNotes
      : null,
    styleCategory: typeof raw.styleCategory === "string" ? raw.styleCategory : null,
    occasion: typeof raw.occasion === "string" ? raw.occasion : null,
    matchPercentage: typeof raw.matchPercentage === "number" ? raw.matchPercentage : null,
    styleTags: Array.isArray(raw.styleTags) ? raw.styleTags.filter((t): t is string => typeof t === "string") : null,
    products: rawProducts.map(normalizeSuggestionProduct),
  };
}

/**
 * Extracts the suggestion array from the response envelope.
 *
 * A. Verified deployed shape: data is a plain array (after unwrapCustomerApiData)
 * B. Swagger shape: data.suggestions array
 *
 * Returns empty only when neither shape matches.
 */
function extractSuggestionArray(raw: unknown): unknown[] {
  // A. Direct array (verified deployed: { success:true, data:[{title,...}] } unwraps to array)
  if (Array.isArray(raw)) {
    return raw;
  }
  // B. Swagger: { suggestions: [...] }
  if (isRecord(raw) && Array.isArray(raw.suggestions)) {
    return raw.suggestions;
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
