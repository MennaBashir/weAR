import { describe, expect, it, vi, beforeEach } from "vitest";
import { catalogApi } from "@/features/customer/api/catalog.api";
import { apiClient } from "@/lib/axios";

vi.mock("@/lib/axios", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedApiClient = vi.mocked(apiClient);

describe("catalogApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("unwraps nested API envelopes", async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { success: true, data: { data: { items: [{ id: "p1" }] } } },
    });

    await expect(catalogApi.getProducts()).resolves.toEqual({
      items: [
        {
          id: "p1",
          categoryId: null,
          categoryName: null,
          images: undefined,
          views: null,
        },
      ],
    });
  });

  it("serializes product query parameters without empty values", async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: { data: { items: [] } } });

    await catalogApi.getProducts({
      pageNumber: 2,
      pageSize: 12,
      search: "linen",
      categoryId: "",
      minPrice: undefined,
      sortDirection: "asc",
    });

    expect(mockedApiClient.get).toHaveBeenCalledWith("/api/catalog/products", {
      params: {
        pageNumber: 2,
        pageSize: 12,
        search: "linen",
        sortDirection: "asc",
      },
    });
  });

  it("gets product detail by product id", async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { data: { id: "p1", name: "Jacket", price: 120 } },
    });

    await expect(catalogApi.getProduct("p1")).resolves.toMatchObject({
      id: "p1",
      name: "Jacket",
    });
    expect(mockedApiClient.get).toHaveBeenCalledWith(
      "/api/catalog/products/p1",
    );
  });
});
