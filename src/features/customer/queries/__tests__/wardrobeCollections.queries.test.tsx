/**
 * Wardrobe Collections query hooks tests — Command 20, runtime-aligned (2026-06-14)
 *
 * Tests 20–30
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { wardrobeCollectionsApi } from "@/features/customer/api/wardrobeCollections.api";
import {
  wardrobeCollectionKeys,
  useWardrobeCollections,
  useCreateWardrobeCollection,
  useRenameWardrobeCollection,
  useDeleteWardrobeCollection,
  useWardrobeCollectionItems,
  useAddWardrobeCollectionItem,
  useRemoveWardrobeCollectionItem,
} from "@/features/customer/queries/wardrobeCollections.queries";
import { useAuthStore } from "@/features/auth/useAuthStore";
import type {
  WardrobeCollectionsResult,
  WardrobeCollectionItemsResult,
} from "@/features/customer/types/wardrobeCollections.types";

vi.mock("@/features/customer/api/wardrobeCollections.api", () => ({
  wardrobeCollectionsApi: {
    listCollections: vi.fn(),
    createCollection: vi.fn(),
    renameCollection: vi.fn(),
    deleteCollection: vi.fn(),
    listCollectionItems: vi.fn(),
    addCollectionItem: vi.fn(),
    removeCollectionItem: vi.fn(),
  },
  WardrobeCollectionApiError: class WardrobeCollectionApiError extends Error {
    constructor(
      public readonly code: string,
      message: string,
    ) {
      super(message);
      this.name = "WardrobeCollectionApiError";
    }
  },
}));

const mockedApi = vi.mocked(wardrobeCollectionsApi);

const createWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const AUTH_USER = {
  user: {
    id: "customer-1",
    fullName: "Test User",
    email: "test@example.com",
    brandName: "",
    businessType: "customer" as const,
  },
  role: "customer" as const,
  isAuthenticated: true,
  hasHydrated: true,
};

const SAMPLE_COLLECTIONS: WardrobeCollectionsResult = {
  items: [
    {
      id: "col-1",
      name: "Summer",
      description: null,
      itemCount: 3,
      coverImageUrl: null,
      createdAt: null,
      updatedAt: null,
    },
  ],
  pageNumber: 1,
  pageSize: 10,
  totalCount: 1,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};

const SAMPLE_ITEMS: WardrobeCollectionItemsResult = {
  items: [
    {
      id: "item-1",
      collectionId: "col-1",
      productId: "prod-1",
      productName: "Blue Jeans",
      primaryImageUrl: null,
      price: 59.99,
      addedAt: null,
    },
  ],
  pageNumber: 1,
  pageSize: 10,
  totalCount: 1,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState(AUTH_USER);
});

describe("wardrobeCollectionKeys", () => {
  it("20. produces stable query key shapes", () => {
    expect(wardrobeCollectionKeys.all).toEqual(["customer", "wardrobeCollections"]);
    expect(wardrobeCollectionKeys.lists("c1")).toContain("c1");
    expect(wardrobeCollectionKeys.list("c1", 1, 10)).toContain("c1");
    expect(wardrobeCollectionKeys.itemLists("c1", "col-1")).toContain("col-1");
  });
});

describe("useWardrobeCollections", () => {
  it("21. fetches and returns collection list using authenticated customerId", async () => {
    mockedApi.listCollections.mockResolvedValueOnce(SAMPLE_COLLECTIONS);
    const queryClient = makeQueryClient();

    const { result } = renderHook(() => useWardrobeCollections(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.items).toHaveLength(1);
    expect(mockedApi.listCollections).toHaveBeenCalledWith("customer-1", {
      pageNumber: 1,
      pageSize: 10,
    });
  });

  it("22. query is disabled when customerId is null (unauthenticated)", () => {
    useAuthStore.setState({ ...AUTH_USER, isAuthenticated: false, user: null, role: null });
    mockedApi.listCollections.mockResolvedValueOnce(SAMPLE_COLLECTIONS);

    const queryClient = makeQueryClient();
    const { result } = renderHook(() => useWardrobeCollections(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockedApi.listCollections).not.toHaveBeenCalled();
  });
});

describe("useCreateWardrobeCollection", () => {
  it("23. calls createCollection with customerId and invalidates list on success", async () => {
    mockedApi.createCollection.mockResolvedValueOnce("new-collection-id");
    mockedApi.listCollections.mockResolvedValueOnce(SAMPLE_COLLECTIONS);

    const queryClient = makeQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateWardrobeCollection(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ name: "New Collection" });
    });

    expect(mockedApi.createCollection).toHaveBeenCalledWith("customer-1", {
      name: "New Collection",
    });
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(["customer", "wardrobeCollections"]),
      }),
    );
  });

  it("24. throws when customerId is missing", async () => {
    useAuthStore.setState({ ...AUTH_USER, isAuthenticated: false, user: null, role: null });

    const queryClient = makeQueryClient();
    const { result } = renderHook(() => useCreateWardrobeCollection(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ name: "Fail" });
      }),
    ).rejects.toThrow("Customer session is required");
  });
});

describe("useDeleteWardrobeCollection", () => {
  it("25. calls deleteCollection with customerId and collectionId and invalidates list", async () => {
    mockedApi.deleteCollection.mockResolvedValueOnce(undefined);
    const queryClient = makeQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDeleteWardrobeCollection(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync("col-1");
    });

    expect(mockedApi.deleteCollection).toHaveBeenCalledWith("customer-1", "col-1");
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(["customer", "wardrobeCollections"]),
      }),
    );
  });
});

describe("useWardrobeCollectionItems", () => {
  it("26. fetches items for specified collectionId using authenticated customerId", async () => {
    mockedApi.listCollectionItems.mockResolvedValueOnce(SAMPLE_ITEMS);
    const queryClient = makeQueryClient();

    const { result } = renderHook(
      () => useWardrobeCollectionItems("col-1"),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.items).toHaveLength(1);
    expect(mockedApi.listCollectionItems).toHaveBeenCalledWith(
      "customer-1",
      "col-1",
      { pageNumber: 1, pageSize: 10 },
    );
  });

  it("27. query is disabled when collectionId is empty", () => {
    mockedApi.listCollectionItems.mockResolvedValueOnce(SAMPLE_ITEMS);
    const queryClient = makeQueryClient();

    const { result } = renderHook(
      () => useWardrobeCollectionItems(""),
      { wrapper: createWrapper(queryClient) },
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockedApi.listCollectionItems).not.toHaveBeenCalled();
  });
});

describe("useRenameWardrobeCollection", () => {
  it("28a. calls renameCollection with PATCH { newName } and invalidates list and items", async () => {
    mockedApi.renameCollection.mockResolvedValueOnce(undefined);
    const queryClient = makeQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useRenameWardrobeCollection(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        collectionId: "col-1",
        payload: { newName: "Renamed" },
      });
    });

    expect(mockedApi.renameCollection).toHaveBeenCalledWith(
      "customer-1",
      "col-1",
      { newName: "Renamed" },
    );

    // Should invalidate collection list
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(["customer", "wardrobeCollections"]),
      }),
    );
  });

  it("28b. throws when customerId is missing", async () => {
    useAuthStore.setState({ ...AUTH_USER, isAuthenticated: false, user: null, role: null });

    const queryClient = makeQueryClient();
    const { result } = renderHook(() => useRenameWardrobeCollection(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          collectionId: "col-1",
          payload: { newName: "Fail" },
        });
      }),
    ).rejects.toThrow("Customer session is required");
  });
});

describe("useAddWardrobeCollectionItem", () => {
  it("28. calls addCollectionItem (void/204) and invalidates both item list and collection list", async () => {
    mockedApi.addCollectionItem.mockResolvedValueOnce(undefined);
    const queryClient = makeQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useAddWardrobeCollectionItem(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        collectionId: "col-1",
        payload: { productId: "prod-1" },
      });
    });

    expect(mockedApi.addCollectionItem).toHaveBeenCalledWith(
      "customer-1",
      "col-1",
      { productId: "prod-1" },
    );

    // Should invalidate item list
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(["customer", "wardrobeCollections", "customer-1", "col-1"]),
      }),
    );
    // Should also refresh collection list (for itemCount update)
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(["customer", "wardrobeCollections"]),
      }),
    );
  });
});

describe("useRemoveWardrobeCollectionItem", () => {
  it("29. calls removeCollectionItem and invalidates item list and collection list", async () => {
    mockedApi.removeCollectionItem.mockResolvedValueOnce(undefined);
    const queryClient = makeQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useRemoveWardrobeCollectionItem(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        collectionId: "col-1",
        itemId: "item-1",
      });
    });

    expect(mockedApi.removeCollectionItem).toHaveBeenCalledWith(
      "customer-1",
      "col-1",
      "item-1",
    );

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(["customer", "wardrobeCollections", "customer-1", "col-1"]),
      }),
    );
  });

  it("30. does NOT invalidate Favorites or Saved Outfits caches", async () => {
    mockedApi.removeCollectionItem.mockResolvedValueOnce(undefined);
    const queryClient = makeQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useRemoveWardrobeCollectionItem(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        collectionId: "col-1",
        itemId: "item-1",
      });
    });

    const allCalls = invalidateSpy.mock.calls;
    const invalidatedKeys = allCalls.map((call) =>
      JSON.stringify(call[0]),
    );

    // Should not invalidate favorites
    expect(
      invalidatedKeys.some((k) => k.includes("favorites")),
    ).toBe(false);

    // Should not invalidate outfits
    expect(
      invalidatedKeys.some((k) => k.includes("outfits")),
    ).toBe(false);
  });
});
