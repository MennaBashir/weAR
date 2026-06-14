import { beforeEach, describe, expect, it, vi } from "vitest";
import { suggestionsApi } from "@/features/customer/api/suggestions.api";
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

const SUGGESTION_RAW = {
  suggestionId: "s1",
  name: "Summer Casual",
  styleCategory: "Casual",
  occasion: "Beach",
  products: [
    { productId: "p1", slotType: 0, displayOrder: 0 },
    { productId: "p2", slotType: 1, displayOrder: 1 },
  ],
};

describe("suggestionsApi.generateSuggestions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("normalizes a successful suggestion response", async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: { success: true, data: [SUGGESTION_RAW] },
    });

    const result = await suggestionsApi.generateSuggestions({ occasion: "Beach" });

    expect(result).toHaveLength(1);
    expect(result[0].suggestionId).toBe("s1");
    expect(result[0].name).toBe("Summer Casual");
    expect(result[0].products).toHaveLength(2);
    expect(mockedApiClient.post).toHaveBeenCalledWith(
      "/api/customer/wardrobe/suggestions",
      { occasion: "Beach" },
    );
  });

  it("returns empty array when response contains no suggestions", async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: { success: true, data: [] },
    });

    const result = await suggestionsApi.generateSuggestions({});
    expect(result).toHaveLength(0);
  });

  it("skips suggestions with no suggestionId", async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: { success: true, data: [{ name: "no id" }, SUGGESTION_RAW] },
    });

    const result = await suggestionsApi.generateSuggestions({});
    expect(result).toHaveLength(1);
    expect(result[0].suggestionId).toBe("s1");
  });

  it("resolves modelIds via catalog when productId is absent", async () => {
    const withModelId = {
      suggestionId: "s2",
      name: "Model-only",
      products: [{ modelId: "m1", slotType: 0, displayOrder: 0 }],
    };
    mockedApiClient.post.mockResolvedValueOnce({
      data: { success: true, data: [withModelId] },
    });
    mockedCatalogApi.getProductsByModelIds.mockResolvedValueOnce([
      {
        id: "p-resolved",
        name: "Resolved Product",
        price: 49.99,
        modelId: "m1",
      } as Parameters<typeof mockedCatalogApi.getProductsByModelIds>[0] extends never
        ? never
        : Awaited<ReturnType<typeof mockedCatalogApi.getProductsByModelIds>>[0],
    ]);

    const result = await suggestionsApi.generateSuggestions({});

    expect(mockedCatalogApi.getProductsByModelIds).toHaveBeenCalledWith({
      modelIds: ["m1"],
    });
    expect(result[0].products[0].productId).toBe("p-resolved");
    expect(result[0].products[0].resolvedProduct?.name).toBe("Resolved Product");
  });

  it("does not call catalog when all products already have productIds", async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: { success: true, data: [SUGGESTION_RAW] },
    });

    await suggestionsApi.generateSuggestions({});
    expect(mockedCatalogApi.getProductsByModelIds).not.toHaveBeenCalled();
  });

  it("returns empty array when response data is not an array", async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: { success: true, data: null },
    });

    const result = await suggestionsApi.generateSuggestions({});
    expect(result).toHaveLength(0);
  });
});

describe("suggestionsApi.saveSuggestion", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns UUID string from response data", async () => {
    const uuid = "saved-outfit-uuid";
    mockedApiClient.post.mockResolvedValueOnce({
      data: { success: true, data: uuid },
    });

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

  it("handles raw string response", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: "direct-uuid" });
    const result = await suggestionsApi.saveSuggestion({
      suggestionId: "s2",
      items: [],
    });
    expect(result).toBe("direct-uuid");
  });
});
