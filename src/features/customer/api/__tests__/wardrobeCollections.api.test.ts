/**
 * Wardrobe Collections API adapter tests — Command 20
 * All endpoints are Swagger-only (not deployed-verified).
 *
 * Tests 1–19
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  wardrobeCollectionsApi,
  WardrobeCollectionApiError,
} from "@/features/customer/api/wardrobeCollections.api";
import { apiClient } from "@/lib/axios";

vi.mock("@/lib/axios", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedApiClient = vi.mocked(apiClient);

const BASE = (customerId: string) =>
  `/api/customers/${customerId}/wardrobe/collections`;

describe("wardrobeCollectionsApi", () => {
  beforeEach(() => vi.clearAllMocks());

  // ---- test 1: listCollections normalizes paginated response ----
  describe("listCollections", () => {
    it("1. normalizes paginated collection list response", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            items: [
              {
                id: "col-1",
                name: "Summer Wardrobe",
                description: "Light pieces",
                itemCount: 5,
                coverImageUrl: "https://example.com/cover.jpg",
                createdAt: "2026-06-01T00:00:00Z",
                updatedAt: null,
              },
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

      const result = await wardrobeCollectionsApi.listCollections("c1", {
        pageNumber: 1,
        pageSize: 10,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe("col-1");
      expect(result.items[0].name).toBe("Summer Wardrobe");
      expect(result.items[0].itemCount).toBe(5);
      expect(result.totalCount).toBe(1);
      expect(result.hasPreviousPage).toBe(false);
      expect(mockedApiClient.get).toHaveBeenCalledWith(BASE("c1"), {
        params: { pageNumber: 1, pageSize: 10 },
      });
    });

    it("2. returns empty result when data is malformed", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { success: true, data: null },
      });

      const result = await wardrobeCollectionsApi.listCollections("c1");
      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it("3. handles nullable optional collection fields gracefully", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            items: [
              { id: "col-2", name: "My Collection" },
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

      const result = await wardrobeCollectionsApi.listCollections("c1");
      expect(result.items[0].description).toBeNull();
      expect(result.items[0].coverImageUrl).toBeNull();
      expect(result.items[0].itemCount).toBeNull();
    });

    it("4. handles double-wrapped envelope shape", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          data: {
            items: [{ id: "col-3", name: "Layered" }],
            pageNumber: 1,
            pageSize: 10,
            totalCount: 1,
            totalPages: 1,
            hasPreviousPage: false,
            hasNextPage: false,
          },
        },
      });

      const result = await wardrobeCollectionsApi.listCollections("c1");
      expect(result.items[0].id).toBe("col-3");
    });
  });

  // ---- test 5–8: createCollection ----
  describe("createCollection", () => {
    it("5. returns UUID string from response.data", async () => {
      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      mockedApiClient.post.mockResolvedValueOnce({
        data: { success: true, data: uuid },
      });

      const result = await wardrobeCollectionsApi.createCollection("c1", {
        name: "  Summer  ",
        description: "Light pieces",
      });

      expect(result).toBe(uuid);
    });

    it("6. trims the name before sending", async () => {
      mockedApiClient.post.mockResolvedValueOnce({
        data: { success: true, data: "new-id" },
      });

      await wardrobeCollectionsApi.createCollection("c1", {
        name: "  Trimmed Name  ",
      });

      const callArgs = mockedApiClient.post.mock.calls[0];
      expect(callArgs[1]).toEqual({ name: "Trimmed Name", description: null });
    });

    it("7. does not include customerId in request body", async () => {
      mockedApiClient.post.mockResolvedValueOnce({
        data: { success: true, data: "new-id" },
      });

      await wardrobeCollectionsApi.createCollection("c1", { name: "Test" });

      const callArgs = mockedApiClient.post.mock.calls[0];
      expect(callArgs[1]).not.toHaveProperty("customerId");
    });

    it("8. throws WardrobeCollectionApiError on 409 CONFLICT", async () => {
      const axiosError = {
        response: {
          status: 409,
          data: { code: "CONFLICT", message: "Name already exists" },
        },
      };
      mockedApiClient.post.mockRejectedValueOnce(axiosError);

      let caught: unknown;
      try {
        await wardrobeCollectionsApi.createCollection("c1", { name: "Dup" });
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(WardrobeCollectionApiError);
      expect((caught as WardrobeCollectionApiError).code).toBe("CONFLICT");
    });

    it("9. throws WardrobeCollectionApiError with INVALID_CREATE_RESPONSE for unexpected response", async () => {
      mockedApiClient.post.mockResolvedValueOnce({
        data: { success: true, data: null },
      });

      let caught: unknown;
      try {
        await wardrobeCollectionsApi.createCollection("c1", { name: "Test" });
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(WardrobeCollectionApiError);
      expect((caught as WardrobeCollectionApiError).code).toBe(
        "INVALID_CREATE_RESPONSE",
      );
    });
  });

  // ---- test 10–11: updateCollection ----
  describe("updateCollection", () => {
    it("10. sends PUT to correct URL with trimmed name and does not parse body", async () => {
      mockedApiClient.put.mockResolvedValueOnce({ status: 204, data: "" });

      await expect(
        wardrobeCollectionsApi.updateCollection("c1", "col-1", {
          name: "  Renamed  ",
          description: "Updated description",
        }),
      ).resolves.toBeUndefined();

      const callArgs = mockedApiClient.put.mock.calls[0];
      expect(callArgs[0]).toBe(`${BASE("c1")}/col-1`);
      expect(callArgs[1]).toEqual({
        name: "Renamed",
        description: "Updated description",
      });
    });

    it("11. throws WardrobeCollectionApiError on update failure", async () => {
      const axiosError = {
        response: {
          status: 404,
          data: { code: "NOT_FOUND", message: "Collection not found" },
        },
      };
      mockedApiClient.put.mockRejectedValueOnce(axiosError);

      let caught: unknown;
      try {
        await wardrobeCollectionsApi.updateCollection("c1", "col-1", {
          name: "New Name",
        });
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(WardrobeCollectionApiError);
      expect((caught as WardrobeCollectionApiError).code).toBe("NOT_FOUND");
    });
  });

  // ---- test 12–13: deleteCollection ----
  describe("deleteCollection", () => {
    it("12. accepts HTTP 204 without parsing body", async () => {
      mockedApiClient.delete.mockResolvedValueOnce({ status: 204, data: "" });

      await expect(
        wardrobeCollectionsApi.deleteCollection("c1", "col-1"),
      ).resolves.toBeUndefined();

      expect(mockedApiClient.delete).toHaveBeenCalledWith(`${BASE("c1")}/col-1`);
    });

    it("13. throws WardrobeCollectionApiError on delete failure", async () => {
      const axiosError = {
        response: {
          status: 404,
          data: { code: "NOT_FOUND", message: "Collection not found" },
        },
      };
      mockedApiClient.delete.mockRejectedValueOnce(axiosError);

      let caught: unknown;
      try {
        await wardrobeCollectionsApi.deleteCollection("c1", "col-1");
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(WardrobeCollectionApiError);
    });
  });

  // ---- test 14–16: listCollectionItems ----
  describe("listCollectionItems", () => {
    it("14. normalizes paginated item list response", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            items: [
              {
                id: "item-1",
                collectionId: "col-1",
                productId: "prod-1",
                productName: "Blue Jeans",
                productImageUrl: "https://example.com/jeans.jpg",
                price: 59.99,
                addedAt: "2026-06-01T00:00:00Z",
              },
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

      const result = await wardrobeCollectionsApi.listCollectionItems(
        "c1",
        "col-1",
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe("item-1");
      expect(result.items[0].productId).toBe("prod-1");
      expect(result.items[0].productName).toBe("Blue Jeans");
      // productImageUrl from Swagger maps to primaryImageUrl
      expect(result.items[0].primaryImageUrl).toBe(
        "https://example.com/jeans.jpg",
      );
      expect(result.items[0].price).toBe(59.99);
    });

    it("15. falls back to primaryImageUrl when productImageUrl is absent", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            items: [
              {
                id: "item-2",
                productId: "prod-2",
                primaryImageUrl: "https://example.com/alt.jpg",
              },
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

      const result = await wardrobeCollectionsApi.listCollectionItems(
        "c1",
        "col-1",
      );

      expect(result.items[0].primaryImageUrl).toBe(
        "https://example.com/alt.jpg",
      );
    });

    it("16. returns empty result for malformed items response", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { success: true, data: null },
      });

      const result = await wardrobeCollectionsApi.listCollectionItems(
        "c1",
        "col-1",
      );
      expect(result.items).toHaveLength(0);
    });
  });

  // ---- test 17: addCollectionItem ----
  describe("addCollectionItem", () => {
    it("17. sends productId and returns item UUID", async () => {
      const itemId = "item-uuid-123";
      mockedApiClient.post.mockResolvedValueOnce({
        data: { success: true, data: itemId },
      });

      const result = await wardrobeCollectionsApi.addCollectionItem(
        "c1",
        "col-1",
        { productId: "prod-1" },
      );

      expect(result).toBe(itemId);
      const callArgs = mockedApiClient.post.mock.calls[0];
      expect(callArgs[0]).toBe(`${BASE("c1")}/col-1/items`);
      expect(callArgs[1]).toEqual({ productId: "prod-1" });
      // Should NOT include customerId in body
      expect(callArgs[1]).not.toHaveProperty("customerId");
    });

    it("18. throws WardrobeCollectionApiError on add item failure", async () => {
      const axiosError = {
        response: {
          status: 409,
          data: { code: "CONFLICT", message: "Item already in collection" },
        },
      };
      mockedApiClient.post.mockRejectedValueOnce(axiosError);

      let caught: unknown;
      try {
        await wardrobeCollectionsApi.addCollectionItem("c1", "col-1", {
          productId: "prod-1",
        });
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(WardrobeCollectionApiError);
      expect((caught as WardrobeCollectionApiError).code).toBe("CONFLICT");
    });
  });

  // ---- test 19: removeCollectionItem ----
  describe("removeCollectionItem", () => {
    it("19. sends DELETE to correct URL and accepts 204 without body parsing", async () => {
      mockedApiClient.delete.mockResolvedValueOnce({ status: 204, data: "" });

      await expect(
        wardrobeCollectionsApi.removeCollectionItem("c1", "col-1", "item-1"),
      ).resolves.toBeUndefined();

      expect(mockedApiClient.delete).toHaveBeenCalledWith(
        `${BASE("c1")}/col-1/items/item-1`,
      );
    });
  });
});
