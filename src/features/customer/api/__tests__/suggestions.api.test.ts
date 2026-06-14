import { beforeEach, describe, expect, it, vi } from "vitest";
import { suggestionsApi, SuggestionApiError } from "@/features/customer/api/suggestions.api";
import { catalogApi } from "@/features/customer/api/catalog.api";
import { apiClient } from "@/lib/axios";

vi.mock("@/lib/axios", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

vi.mock("@/features/customer/api/catalog.api", () => ({
  catalogApi: {
    getProductsByModelIds: vi.fn(),
  },
}));

const mockedApiClient = vi.mocked(apiClient);
const mockedCatalogApi = vi.mocked(catalogApi);

// ---------------------------------------------------------------------------
// Documented Swagger shape (data.suggestions envelope)
// ---------------------------------------------------------------------------

const DOCUMENTED_RESPONSE = {
  success: true,
  data: {
    suggestions: [
      {
        id: "s1",
        outfitName: "Summer Casual",
        occasion: "Beach",
        styleNotes: "Light and breezy",
        styleCategory: "Casual",
        products: [
          { productId: "p1", slotType: 0, displayOrder: 0, reasoning: "Goes with anything" },
          { productId: "p2", slotType: 1, displayOrder: 1 },
        ],
      },
    ],
  },
};

// Legacy/compatibility shape (data as direct array)
const LEGACY_RAW = {
  suggestionId: "s-legacy",
  name: "Legacy Shape",
  styleCategory: "Formal",
  occasion: "Gala",
  products: [{ productId: "p3", slotType: 0, displayOrder: 0 }],
};

describe("suggestionsApi.generateSuggestions", () => {
  beforeEach(() => vi.clearAllMocks());

  // ---- documented envelope ----

  it("normalizes data.suggestions documented envelope", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: DOCUMENTED_RESPONSE });

    const result = await suggestionsApi.generateSuggestions({ weatherCondition: "Sunny", occasion: "Beach" });

    expect(result).toHaveLength(1);
    expect(result[0].suggestionId).toBe("s1");
    expect(result[0].name).toBe("Summer Casual");
    expect(result[0].styleNotes).toBe("Light and breezy");
    expect(result[0].styleCategory).toBe("Casual");
    expect(result[0].occasion).toBe("Beach");
    expect(result[0].products).toHaveLength(2);
    expect(mockedApiClient.post).toHaveBeenCalledWith(
      "/api/customer/wardrobe/suggestions",
      { weatherCondition: "Sunny", occasion: "Beach" },
    );
  });

  it("includes weatherCondition in the exact request body (runtime-verified required field)", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: DOCUMENTED_RESPONSE });

    await suggestionsApi.generateSuggestions({ weatherCondition: "Clear" });

    expect(mockedApiClient.post).toHaveBeenCalledWith(
      "/api/customer/wardrobe/suggestions",
      expect.objectContaining({ weatherCondition: "Clear" }),
    );
  });

  it("maps id -> suggestionId from documented shape", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: DOCUMENTED_RESPONSE });
    const result = await suggestionsApi.generateSuggestions({ weatherCondition: "Sunny" });
    expect(result[0].suggestionId).toBe("s1");
  });

  it("maps outfitName -> name from documented shape", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: DOCUMENTED_RESPONSE });
    const result = await suggestionsApi.generateSuggestions({ weatherCondition: "Sunny" });
    expect(result[0].name).toBe("Summer Casual");
  });

  it("preserves styleNotes from documented shape", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: DOCUMENTED_RESPONSE });
    const result = await suggestionsApi.generateSuggestions({ weatherCondition: "Sunny" });
    expect(result[0].styleNotes).toBe("Light and breezy");
  });

  it("preserves product reasoning from documented shape", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: DOCUMENTED_RESPONSE });
    const result = await suggestionsApi.generateSuggestions({ weatherCondition: "Sunny" });
    expect(result[0].products[0].reasoning).toBe("Goes with anything");
    expect(result[0].products[1].reasoning).toBeNull();
  });

  it("returns empty suggestions array from data.suggestions when array is empty", async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: { success: true, data: { suggestions: [] } },
    });
    const result = await suggestionsApi.generateSuggestions({ weatherCondition: "Sunny" });
    expect(result).toHaveLength(0);
  });

  // ---- legacy/direct-array compatibility ----

  it("supports direct-array compatibility shape", async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: { success: true, data: [LEGACY_RAW] },
    });
    const result = await suggestionsApi.generateSuggestions({ weatherCondition: "Cloudy" });
    expect(result).toHaveLength(1);
    expect(result[0].suggestionId).toBe("s-legacy");
    expect(result[0].name).toBe("Legacy Shape");
  });

  it("maps suggestionId -> suggestionId in legacy shape", async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: { success: true, data: [LEGACY_RAW] },
    });
    const result = await suggestionsApi.generateSuggestions({ weatherCondition: "Cloudy" });
    expect(result[0].suggestionId).toBe("s-legacy");
  });

  it("maps name -> name in legacy shape", async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: { success: true, data: [LEGACY_RAW] },
    });
    const result = await suggestionsApi.generateSuggestions({ weatherCondition: "Cloudy" });
    expect(result[0].name).toBe("Legacy Shape");
  });

  it("returns empty array when response data is not an array or documented envelope", async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: { success: true, data: null },
    });
    const result = await suggestionsApi.generateSuggestions({ weatherCondition: "Sunny" });
    expect(result).toHaveLength(0);
  });

  it("preserves suggestions with no id or suggestionId (null, not dropped)", async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: { success: true, data: [{ title: "Casual Chic", description: "Perfect for a clear day.", matchPercentage: 95, styleTags: ["Comfortable"], items: [] }] },
    });
    const result = await suggestionsApi.generateSuggestions({ weatherCondition: "Clear" });
    expect(result).toHaveLength(1);
    expect(result[0].suggestionId).toBeNull();
  });

  // ---- verified deployed response shape (2026-06-14) ----

  const DEPLOYED_RESPONSE = {
    success: true,
    data: [
      {
        title: "Casual Chic",
        description: "Perfect for a clear day.",
        matchPercentage: 95,
        styleTags: ["Comfortable", "Versatile", "Timeless"],
        items: [],
      },
    ],
  };

  it("normalizes verified deployed response: direct data array after unwrap", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: DEPLOYED_RESPONSE });
    const result = await suggestionsApi.generateSuggestions({ weatherCondition: "Clear" });
    expect(result).toHaveLength(1);
  });

  it("maps title -> name in verified deployed shape", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: DEPLOYED_RESPONSE });
    const result = await suggestionsApi.generateSuggestions({ weatherCondition: "Clear" });
    expect(result[0].name).toBe("Casual Chic");
  });

  it("maps description -> styleNotes in verified deployed shape", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: DEPLOYED_RESPONSE });
    const result = await suggestionsApi.generateSuggestions({ weatherCondition: "Clear" });
    expect(result[0].styleNotes).toBe("Perfect for a clear day.");
  });

  it("preserves matchPercentage in verified deployed shape", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: DEPLOYED_RESPONSE });
    const result = await suggestionsApi.generateSuggestions({ weatherCondition: "Clear" });
    expect(result[0].matchPercentage).toBe(95);
  });

  it("preserves styleTags in verified deployed shape", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: DEPLOYED_RESPONSE });
    const result = await suggestionsApi.generateSuggestions({ weatherCondition: "Clear" });
    expect(result[0].styleTags).toEqual(["Comfortable", "Versatile", "Timeless"]);
  });

  it("maps items -> products in verified deployed shape", async () => {
    const withItems = {
      success: true,
      data: [{ title: "Look", items: [{ productId: "p1", slotType: 0 }] }],
    };
    mockedApiClient.post.mockResolvedValueOnce({ data: withItems });
    const result = await suggestionsApi.generateSuggestions({ weatherCondition: "Clear" });
    expect(result[0].products).toHaveLength(1);
    expect(result[0].products[0].productId).toBe("p1");
  });

  it("has null suggestionId when backend omits id in deployed shape", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: DEPLOYED_RESPONSE });
    const result = await suggestionsApi.generateSuggestions({ weatherCondition: "Clear" });
    expect(result[0].suggestionId).toBeNull();
  });

  it("does not invent a synthetic suggestionId", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: DEPLOYED_RESPONSE });
    const result = await suggestionsApi.generateSuggestions({ weatherCondition: "Clear" });
    expect(result[0].suggestionId).toBeNull();
  });

  // ---- verified deployed item fields (second runtime test, 2026-06-14) ----

  const DEPLOYED_ITEM_RESPONSE = {
    success: true,
    data: [
      {
        title: "Casual Chic",
        description: "Perfect for a clear day.",
        matchPercentage: 95,
        styleTags: ["Comfortable", "Versatile", "Timeless"],
        items: [
          {
            id: "25e38c13-76ad-44a6-9b5d-edfe2d23c91d",
            productId: "cccccccc-cccc-cccc-cccc-cccc00000002",
            slot: "Top",
            displayOrder: 0,
            productName: "002 - women's short-sleeve, boat-neck blouse",
            price: 49.99,
            primaryImageUrl: "https://res.cloudinary.com/example.jpg",
            stockStatus: "In Stock",
          },
        ],
      },
    ],
  };

  it("maps productName -> name in deployed item", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: DEPLOYED_ITEM_RESPONSE });
    const result = await suggestionsApi.generateSuggestions({ weatherCondition: "Clear", productIds: ["cccccccc-cccc-cccc-cccc-cccc00000002"] });
    expect(result[0].products[0].name).toBe("002 - women's short-sleeve, boat-neck blouse");
  });

  it("preserves primaryImageUrl in deployed item", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: DEPLOYED_ITEM_RESPONSE });
    const result = await suggestionsApi.generateSuggestions({ weatherCondition: "Clear" });
    expect(result[0].products[0].primaryImageUrl).toBe("https://res.cloudinary.com/example.jpg");
  });

  it("preserves price in deployed item", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: DEPLOYED_ITEM_RESPONSE });
    const result = await suggestionsApi.generateSuggestions({ weatherCondition: "Clear" });
    expect(result[0].products[0].price).toBe(49.99);
  });

  it("preserves stockStatus in deployed item", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: DEPLOYED_ITEM_RESPONSE });
    const result = await suggestionsApi.generateSuggestions({ weatherCondition: "Clear" });
    expect(result[0].products[0].stockStatus).toBe("In Stock");
  });

  it("preserves slot string in deployed item", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: DEPLOYED_ITEM_RESPONSE });
    const result = await suggestionsApi.generateSuggestions({ weatherCondition: "Clear" });
    expect(result[0].products[0].slot).toBe("Top");
  });

  it("does not convert slot string to numeric slotType", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: DEPLOYED_ITEM_RESPONSE });
    const result = await suggestionsApi.generateSuggestions({ weatherCondition: "Clear" });
    expect(result[0].products[0].slotType).toBeNull();
  });

  it("preserves item id in deployed item", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: DEPLOYED_ITEM_RESPONSE });
    const result = await suggestionsApi.generateSuggestions({ weatherCondition: "Clear" });
    expect(result[0].products[0].id).toBe("25e38c13-76ad-44a6-9b5d-edfe2d23c91d");
  });

  it("preserves productId in deployed item", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: DEPLOYED_ITEM_RESPONSE });
    const result = await suggestionsApi.generateSuggestions({ weatherCondition: "Clear" });
    expect(result[0].products[0].productId).toBe("cccccccc-cccc-cccc-cccc-cccc00000002");
  });

  it("renders only the returned items — does not error when backend returns a subset of requested productIds", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: DEPLOYED_ITEM_RESPONSE });
    const result = await suggestionsApi.generateSuggestions({
      weatherCondition: "Clear",
      productIds: ["cccccccc-cccc-cccc-cccc-cccc00000002", "another-id-not-returned"],
    });
    expect(result[0].products).toHaveLength(1);
  });

  // ---- model-ID resolution ----

  it("resolves modelIds via catalog when productId is absent", async () => {
    const withModelId = {
      id: "s-model",
      outfitName: "Model-only",
      products: [{ modelId: "m1", slotType: 0, displayOrder: 0 }],
    };
    mockedApiClient.post.mockResolvedValueOnce({
      data: { success: true, data: { suggestions: [withModelId] } },
    });
    mockedCatalogApi.getProductsByModelIds.mockResolvedValueOnce([
      { id: "p-resolved", name: "Resolved Product", price: 49.99, modelId: "m1" } as Awaited<ReturnType<typeof mockedCatalogApi.getProductsByModelIds>>[0],
    ]);

    const result = await suggestionsApi.generateSuggestions({ weatherCondition: "Hot" });

    expect(mockedCatalogApi.getProductsByModelIds).toHaveBeenCalledWith({ modelIds: ["m1"] });
    expect(result[0].products[0].productId).toBe("p-resolved");
    expect(result[0].products[0].resolvedProduct?.name).toBe("Resolved Product");
  });

  it("does not call catalog when all products already have productIds", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: DOCUMENTED_RESPONSE });
    await suggestionsApi.generateSuggestions({ weatherCondition: "Sunny" });
    expect(mockedCatalogApi.getProductsByModelIds).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// saveSuggestion
// ---------------------------------------------------------------------------

describe("suggestionsApi.saveSuggestion", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns UUID string from wrapped response data", async () => {
    const uuid = "saved-outfit-uuid";
    mockedApiClient.post.mockResolvedValueOnce({ data: { success: true, data: uuid } });

    const result = await suggestionsApi.saveSuggestion({
      suggestionId: "s1",
      name: "Summer look",
      styleCategory: "Casual",
      items: [{ productId: "p1", slotType: 0, displayOrder: 0 }],
    });

    expect(result).toBe(uuid);
    expect(mockedApiClient.post).toHaveBeenCalledWith(
      "/api/customer/wardrobe/suggestions/save",
      expect.objectContaining({ suggestionId: "s1" }),
    );
  });

  it("returns UUID from bare string response (direct string compatibility)", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: "direct-uuid" });
    const result = await suggestionsApi.saveSuggestion({ suggestionId: "s2", items: [] });
    expect(result).toBe("direct-uuid");
  });

  it("throws SuggestionApiError when response data is missing", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: { success: true } });
    await expect(suggestionsApi.saveSuggestion({ suggestionId: "s1", items: [] }))
      .rejects.toBeInstanceOf(SuggestionApiError);
  });

  it("throws SuggestionApiError when response data is an object (not a string)", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: { success: true, data: { id: "uuid" } } });
    await expect(suggestionsApi.saveSuggestion({ suggestionId: "s1", items: [] }))
      .rejects.toBeInstanceOf(SuggestionApiError);
  });

  it("throws SuggestionApiError when response data is an empty string", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: { success: true, data: "" } });
    await expect(suggestionsApi.saveSuggestion({ suggestionId: "s1", items: [] }))
      .rejects.toBeInstanceOf(SuggestionApiError);
  });

  it("throws SuggestionApiError with INVALID_OUTFIT_ITEMS code on 422", async () => {
    const axiosError = {
      response: {
        status: 422,
        data: { code: "INVALID_OUTFIT_ITEMS", message: "Items must be favorites" },
      },
    };
    mockedApiClient.post.mockRejectedValueOnce(axiosError);

    let caught: unknown;
    try {
      await suggestionsApi.saveSuggestion({ suggestionId: "s1", items: [{ productId: "p1", slotType: 0, displayOrder: 0 }] });
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(SuggestionApiError);
    expect((caught as SuggestionApiError).code).toBe("INVALID_OUTFIT_ITEMS");
  });
});
