/**
 * Wardrobe Collections API adapter tests — Command 20, runtime-aligned (2026-06-14)
 *
 * Runtime-verified facts:
 * - List (GET): HTTP 200, response.data is a direct array (NOT paginated envelope).
 * - Create (POST): HTTP 201, response.data is UUID string.
 * - Rename (PATCH): { newName } → HTTP 204. PUT returns 405 Method Not Allowed.
 * - Delete (DELETE): HTTP 204, no body.
 * - List items (GET): HTTP 200 with paginated data.items envelope (empty collection case verified).
 * - Add item (POST): HTTP 204, empty body (no UUID returned).
 * - List items after add: HTTP 500 INTERNAL_ERROR (backend defect — documented, not a frontend error).
 * - Remove item (DELETE): Swagger-only, runtime-blocked (itemId unavailable without working list-items).
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
    patch: vi.fn(),
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
    it("1. normalizes paginated collection list response (Swagger envelope)", async () => {
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

    it("2. normalizes direct-array response (runtime-verified primary path)", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: [
            {
              id: "col-10",
              name: "Direct Array Collection",
              itemCount: 2,
            },
          ],
        },
      });

      const result = await wardrobeCollectionsApi.listCollections("c1");
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe("col-10");
      expect(result.items[0].name).toBe("Direct Array Collection");
      expect(result.pageNumber).toBe(1);
      expect(result.totalCount).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.hasPreviousPage).toBe(false);
      expect(result.hasNextPage).toBe(false);
    });

    it("2b. empty direct array returns synthesized pagination with zero counts", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { success: true, data: [] },
      });

      const result = await wardrobeCollectionsApi.listCollections("c1");
      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it("2c. throws INVALID_LIST_RESPONSE when data is malformed (not array, no items)", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { success: true, data: null },
      });

      await expect(
        wardrobeCollectionsApi.listCollections("c1"),
      ).rejects.toBeInstanceOf(WardrobeCollectionApiError);

      let caught: unknown;
      try {
        mockedApiClient.get.mockResolvedValueOnce({
          data: { success: true, data: null },
        });
        await wardrobeCollectionsApi.listCollections("c1");
      } catch (err) {
        caught = err;
      }
      expect((caught as WardrobeCollectionApiError).code).toBe("INVALID_LIST_RESPONSE");
    });

    it("2d. filters out collections with empty id or empty name", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: [
            { id: "col-good", name: "Good" },
            { id: "", name: "No ID" },
            { id: "col-noname", name: "" },
            { id: "col-also-good", name: "Also Good" },
          ],
        },
      });

      const result = await wardrobeCollectionsApi.listCollections("c1");
      expect(result.items).toHaveLength(2);
      expect(result.items.map((c) => c.id)).toEqual(["col-good", "col-also-good"]);
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

  // ---- test 5–9: createCollection ----
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

  // ---- test 10–11: renameCollection (PATCH with { newName }, not PUT) ----
  describe("renameCollection", () => {
    it("10. sends PATCH (not PUT) to correct URL with exact { newName } body only", async () => {
      mockedApiClient.patch.mockResolvedValueOnce({ status: 204, data: "" });

      await expect(
        wardrobeCollectionsApi.renameCollection("c1", "col-1", {
          newName: "  Renamed  ",
        }),
      ).resolves.toBeUndefined();

      const callArgs = mockedApiClient.patch.mock.calls[0];
      expect(callArgs[0]).toBe(`${BASE("c1")}/col-1`);
      // Body must be exactly { newName: "Renamed" } — no description, no name field
      expect(callArgs[1]).toEqual({ newName: "Renamed" });
      expect(callArgs[1]).not.toHaveProperty("description");
      expect(callArgs[1]).not.toHaveProperty("name");
      // PUT must NOT be called
      expect(mockedApiClient.put).not.toHaveBeenCalled();
    });

    it("11. trims newName before sending", async () => {
      mockedApiClient.patch.mockResolvedValueOnce({ status: 204, data: "" });

      await wardrobeCollectionsApi.renameCollection("c1", "col-1", {
        newName: "   My Trimmed Name   ",
      });

      const callArgs = mockedApiClient.patch.mock.calls[0];
      expect(callArgs[1]).toEqual({ newName: "My Trimmed Name" });
    });

    it("11b. accepts 204 without parsing response body", async () => {
      // Verify void return — should not throw even if data is empty string
      mockedApiClient.patch.mockResolvedValueOnce({ status: 204, data: "" });

      const result = await wardrobeCollectionsApi.renameCollection("c1", "col-1", {
        newName: "Valid Name",
      });

      expect(result).toBeUndefined();
    });

    it("11c. throws WardrobeCollectionApiError on rename failure", async () => {
      const axiosError = {
        response: {
          status: 404,
          data: { code: "NOT_FOUND", message: "Collection not found" },
        },
      };
      mockedApiClient.patch.mockRejectedValueOnce(axiosError);

      let caught: unknown;
      try {
        await wardrobeCollectionsApi.renameCollection("c1", "col-1", {
          newName: "New Name",
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

    it("15b. returns empty paginated result for empty collection (runtime-verified: 200 with data.items [])", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            items: [],
            pageNumber: 1,
            pageSize: 10,
            totalCount: 0,
            totalPages: 0,
            hasPreviousPage: false,
            hasNextPage: false,
          },
        },
      });

      const result = await wardrobeCollectionsApi.listCollectionItems("c1", "col-1");
      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it("16. throws INVALID_ITEMS_RESPONSE for malformed response (not a paginated envelope)", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { success: true, data: null },
      });

      let caught: unknown;
      try {
        await wardrobeCollectionsApi.listCollectionItems("c1", "col-1");
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(WardrobeCollectionApiError);
      expect((caught as WardrobeCollectionApiError).code).toBe("INVALID_ITEMS_RESPONSE");
    });
  });

  // ---- test 17–18: addCollectionItem ----
  describe("addCollectionItem", () => {
    it("17. sends productId and returns void (HTTP 204 — no UUID returned, runtime-verified)", async () => {
      // Runtime-verified: POST to /items returns 204 with empty body; no UUID string in response
      mockedApiClient.post.mockResolvedValueOnce({
        status: 204,
        data: "",
      });

      const result = await wardrobeCollectionsApi.addCollectionItem(
        "c1",
        "col-1",
        { productId: "prod-1" },
      );

      // Must return undefined, NOT a UUID string
      expect(result).toBeUndefined();
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
    it("19. sends DELETE with itemId (not productId) in URL and accepts 204 without body parsing", async () => {
      mockedApiClient.delete.mockResolvedValueOnce({ status: 204, data: "" });

      await expect(
        wardrobeCollectionsApi.removeCollectionItem("c1", "col-1", "item-1"),
      ).resolves.toBeUndefined();

      // Path uses itemId, not productId
      expect(mockedApiClient.delete).toHaveBeenCalledWith(
        `${BASE("c1")}/col-1/items/item-1`,
      );
    });
  });

  // ---- runtime-verified additional tests ----

  describe("createCollection — runtime-verified errors", () => {
    it("20. duplicate name returns CONFLICT code/message (409 runtime-verified)", async () => {
      const axiosError = {
        response: {
          status: 409,
          data: {
            code: "CONFLICT",
            message: "A collection with this name already exists.",
          },
        },
      };
      mockedApiClient.post.mockRejectedValueOnce(axiosError);

      let caught: unknown;
      try {
        await wardrobeCollectionsApi.createCollection("c1", { name: "My Collection" });
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(WardrobeCollectionApiError);
      expect((caught as WardrobeCollectionApiError).code).toBe("CONFLICT");
      expect((caught as WardrobeCollectionApiError).message).toBe(
        "A collection with this name already exists.",
      );
    });
  });

  describe("renameCollection — runtime-verified errors", () => {
    it("21. blank newName returns InvalidName code/message (422 runtime-verified)", async () => {
      const axiosError = {
        response: {
          status: 422,
          data: {
            code: "InvalidName",
            message: "Collection name must not be empty.",
          },
        },
      };
      mockedApiClient.patch.mockRejectedValueOnce(axiosError);

      let caught: unknown;
      try {
        await wardrobeCollectionsApi.renameCollection("c1", "col-1", {
          newName: "  ",
        });
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(WardrobeCollectionApiError);
      expect((caught as WardrobeCollectionApiError).code).toBe("InvalidName");
      expect((caught as WardrobeCollectionApiError).message).toBe(
        "Collection name must not be empty.",
      );
    });

    it("22. trimmed blank newName is still sent (server validates; client also blocks)", async () => {
      mockedApiClient.patch.mockRejectedValueOnce({
        response: {
          data: { code: "InvalidName", message: "Collection name must not be empty." },
        },
      });

      let caught: unknown;
      try {
        await wardrobeCollectionsApi.renameCollection("c1", "col-1", { newName: "Valid" });
      } catch (err) {
        caught = err;
      }
      expect((caught as WardrobeCollectionApiError).code).toBe("InvalidName");
    });
  });

  describe("addCollectionItem — idempotent duplicate (runtime-verified)", () => {
    it("23. duplicate productId returns 204 void — not an error", async () => {
      mockedApiClient.post.mockResolvedValueOnce({ status: 204, data: "" });

      await expect(
        wardrobeCollectionsApi.addCollectionItem("c1", "col-1", {
          productId: "prod-already-added",
        }),
      ).resolves.toBeUndefined();
    });

    it("24. add void result has no data property — no UUID fabricated", async () => {
      mockedApiClient.post.mockResolvedValueOnce({ status: 204, data: "" });

      const result = await wardrobeCollectionsApi.addCollectionItem("c1", "col-1", {
        productId: "p1",
      });

      expect(result).toBeUndefined();
    });
  });

  describe("listCollections — coverImageUrl runtime-verified", () => {
    it("25. normalizes coverImageUrl from refreshed collection list after add", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: [
            {
              id: "col-1",
              name: "My Collection",
              itemCount: 1,
              coverImageUrl: "https://example.com/cover.jpg",
            },
          ],
        },
      });

      const result = await wardrobeCollectionsApi.listCollections("c1");
      expect(result.items[0].itemCount).toBe(1);
      expect(result.items[0].coverImageUrl).toBe("https://example.com/cover.jpg");
    });
  });
});

  // ---- malformed item filtering and INVALID_ITEMS_RESPONSE ----

  describe("listCollectionItems — malformed item filtering", () => {
    it("26. filters out items with empty id", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            items: [
              { id: "", productId: "prod-1" },
              { id: "item-good", productId: "prod-2" },
            ],
            pageNumber: 1, pageSize: 10, totalCount: 2, totalPages: 1,
            hasPreviousPage: false, hasNextPage: false,
          },
        },
      });

      const result = await wardrobeCollectionsApi.listCollectionItems("c1", "col-1");
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe("item-good");
    });

    it("27. filters out items with empty productId", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            items: [
              { id: "item-1", productId: "" },
              { id: "item-2", productId: "prod-ok" },
            ],
            pageNumber: 1, pageSize: 10, totalCount: 2, totalPages: 1,
            hasPreviousPage: false, hasNextPage: false,
          },
        },
      });

      const result = await wardrobeCollectionsApi.listCollectionItems("c1", "col-1");
      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe("prod-ok");
    });

    it("28. preserves valid items", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            items: [
              { id: "item-1", productId: "prod-1", productName: "Shirt", price: 29.99 },
            ],
            pageNumber: 1, pageSize: 10, totalCount: 1, totalPages: 1,
            hasPreviousPage: false, hasNextPage: false,
          },
        },
      });

      const result = await wardrobeCollectionsApi.listCollectionItems("c1", "col-1");
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe("item-1");
      expect(result.items[0].productId).toBe("prod-1");
      expect(result.items[0].productName).toBe("Shirt");
      expect(result.items[0].price).toBe(29.99);
    });

    it("29. throws INVALID_ITEMS_RESPONSE when data is not a paginated envelope", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { success: true, data: null },
      });

      let caught: unknown;
      try {
        await wardrobeCollectionsApi.listCollectionItems("c1", "col-1");
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(WardrobeCollectionApiError);
      expect((caught as WardrobeCollectionApiError).code).toBe("INVALID_ITEMS_RESPONSE");
    });

    it("30. throws INVALID_ITEMS_RESPONSE when data is a direct array (not items envelope)", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { success: true, data: [{ id: "item-1", productId: "p1" }] },
      });

      let caught: unknown;
      try {
        await wardrobeCollectionsApi.listCollectionItems("c1", "col-1");
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(WardrobeCollectionApiError);
      expect((caught as WardrobeCollectionApiError).code).toBe("INVALID_ITEMS_RESPONSE");
    });

    it("31. empty items array is valid (runtime-verified empty collection)", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            items: [],
            pageNumber: 1, pageSize: 10, totalCount: 0, totalPages: 0,
            hasPreviousPage: false, hasNextPage: false,
          },
        },
      });

      const result = await wardrobeCollectionsApi.listCollectionItems("c1", "col-1");
      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });
  });
