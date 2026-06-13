import { beforeEach, describe, expect, it, vi } from "vitest";
import { outfitsApi, OutfitApiError } from "@/features/customer/api/outfits.api";
import { apiClient } from "@/lib/axios";

vi.mock("@/lib/axios", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

const mockedApiClient = vi.mocked(apiClient);

describe("outfitsApi", () => {
  beforeEach(() => vi.clearAllMocks());

  // ---- list ----

  describe("listOutfits", () => {
    it("normalizes paginated outfit list response", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            items: [
              { id: "o1", name: "Summer look", style: "Casual", itemCount: 3, slotPreviews: null },
            ],
            pageNumber: 1,
            pageSize: 10,
            totalCount: 1,
            totalPages: 1,
            hasPreviousPage: false,
            hasNextPage: false,
          },
        },
      });

      const result = await outfitsApi.listOutfits("c1", 1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe("o1");
      expect(result.totalCount).toBe(1);
      expect(result.hasPreviousPage).toBe(false);
      expect(result.hasNextPage).toBe(false);
      expect(mockedApiClient.get).toHaveBeenCalledWith(
        "/api/customers/c1/outfits",
        { params: { pageNumber: 1, pageSize: 10 } },
      );
    });

    it("handles nullable summary fields gracefully", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            items: [
              { id: "o2", name: null, style: null, itemCount: 0, slotPreviews: null },
            ],
            pageNumber: 1,
            pageSize: 10,
            totalCount: 1,
            totalPages: 1,
            hasPreviousPage: false,
            hasNextPage: false,
          },
        },
      });

      const result = await outfitsApi.listOutfits("c1");
      expect(result.items[0].name).toBeNull();
      expect(result.items[0].style).toBeNull();
      expect(result.items[0].slotPreviews).toBeNull();
    });

    it("returns empty result when data is malformed", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { success: true, data: null } });
      const result = await outfitsApi.listOutfits("c1");
      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });
  });

  // ---- create ----

  describe("createOutfit", () => {
    it("returns UUID string from response.data", async () => {
      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      mockedApiClient.post.mockResolvedValueOnce({
        data: { success: true, data: uuid },
      });

      const result = await outfitsApi.createOutfit("c1", { name: "My outfit" });
      expect(result).toBe(uuid);
    });

    it("throws OutfitApiError with INVALID_OUTFIT_ITEMS code on 422", async () => {
      const axiosError = {
        response: {
          status: 422,
          data: { code: "INVALID_OUTFIT_ITEMS", message: "Items must be favorites" },
        },
      };
      mockedApiClient.post.mockRejectedValueOnce(axiosError);

      let caught: unknown;
      try {
        await outfitsApi.createOutfit("c1", {
          items: [{ productId: "p1", slotType: 0, displayOrder: 0 }],
        });
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(OutfitApiError);
      expect((caught as OutfitApiError).code).toBe("INVALID_OUTFIT_ITEMS");
    });

    it("does not invent a detail object — returns only the UUID string", async () => {
      const uuid = "uuid-123";
      mockedApiClient.post.mockResolvedValueOnce({
        data: { success: true, data: uuid },
      });

      const result = await outfitsApi.createOutfit("c1", {});
      expect(typeof result).toBe("string");
      expect(result).toBe(uuid);
    });
  });

  // ---- delete ----

  describe("deleteOutfit", () => {
    it("accepts HTTP 204 without attempting to parse response body", async () => {
      mockedApiClient.delete.mockResolvedValueOnce({ status: 204, data: "" });

      await expect(outfitsApi.deleteOutfit("c1", "o1")).resolves.toBeUndefined();
      expect(mockedApiClient.delete).toHaveBeenCalledWith(
        "/api/customers/c1/outfits/o1",
      );
    });

    it("does not throw when delete response body is empty", async () => {
      mockedApiClient.delete.mockResolvedValueOnce({ status: 204, data: null });
      await expect(outfitsApi.deleteOutfit("c1", "o1")).resolves.toBeUndefined();
    });
  });
});
