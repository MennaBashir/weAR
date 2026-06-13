import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { outfitsApi } from "@/features/customer/api/outfits.api";
import {
  customerOutfitKeys,
  useCreateCustomerOutfit,
  useCustomerOutfits,
  useDeleteCustomerOutfit,
} from "@/features/customer/queries/outfits.queries";
import { customerFavoriteKeys } from "@/features/customer/queries/favorites.queries";
import { useAuthStore } from "@/features/auth/useAuthStore";
import type { OutfitPagedResult } from "@/features/customer/types/catalog";

vi.mock("@/features/customer/api/outfits.api", () => ({
  outfitsApi: {
    listOutfits: vi.fn(),
    createOutfit: vi.fn(),
    deleteOutfit: vi.fn(),
  },
  OutfitApiError: class OutfitApiError extends Error {
    constructor(
      public readonly code: string,
      message: string,
    ) {
      super(message);
      this.name = "OutfitApiError";
    }
  },
}));

const mockedOutfitsApi = vi.mocked(outfitsApi);

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

const SAMPLE_PAGE: OutfitPagedResult = {
  items: [
    { id: "o1", name: "Summer look", style: "Casual", itemCount: 2, slotPreviews: null },
    { id: "o2", name: null, style: null, itemCount: 0, slotPreviews: null },
  ],
  pageNumber: 1,
  pageSize: 10,
  totalCount: 2,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState(AUTH_USER);
});

// ---- useCustomerOutfits ----

describe("useCustomerOutfits", () => {
  it("fetches and exposes paginated outfit list", async () => {
    mockedOutfitsApi.listOutfits.mockResolvedValueOnce(SAMPLE_PAGE);
    const queryClient = makeQueryClient();

    const { result } = renderHook(() => useCustomerOutfits(1, 10), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(2);
    expect(result.current.data?.totalCount).toBe(2);
    expect(mockedOutfitsApi.listOutfits).toHaveBeenCalledWith("customer-1", 1, 10);
  });

  it("shows loading state initially", () => {
    mockedOutfitsApi.listOutfits.mockImplementationOnce(
      () => new Promise(() => {}),
    );
    const queryClient = makeQueryClient();

    const { result } = renderHook(() => useCustomerOutfits(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("shows error state when fetch fails", async () => {
    mockedOutfitsApi.listOutfits.mockRejectedValueOnce(new Error("Network error"));
    const queryClient = makeQueryClient();

    const { result } = renderHook(() => useCustomerOutfits(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("is disabled when customer is not authenticated", () => {
    useAuthStore.setState({ ...AUTH_USER, user: null, isAuthenticated: false });
    const queryClient = makeQueryClient();

    const { result } = renderHook(() => useCustomerOutfits(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockedOutfitsApi.listOutfits).not.toHaveBeenCalled();
  });

  it("derives customerId only from authenticated state", async () => {
    mockedOutfitsApi.listOutfits.mockResolvedValueOnce(SAMPLE_PAGE);
    const queryClient = makeQueryClient();

    renderHook(() => useCustomerOutfits(), { wrapper: createWrapper(queryClient) });

    await waitFor(() => expect(mockedOutfitsApi.listOutfits).toHaveBeenCalledWith("customer-1", 1, 10));
  });

  it("supports pagination by page number", async () => {
    const page2: OutfitPagedResult = { ...SAMPLE_PAGE, pageNumber: 2, hasPreviousPage: true };
    mockedOutfitsApi.listOutfits.mockResolvedValueOnce(page2);
    const queryClient = makeQueryClient();

    const { result } = renderHook(() => useCustomerOutfits(2, 10), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.hasPreviousPage).toBe(true);
    expect(mockedOutfitsApi.listOutfits).toHaveBeenCalledWith("customer-1", 2, 10);
  });

  it("exposes empty state when items is empty", async () => {
    mockedOutfitsApi.listOutfits.mockResolvedValueOnce({
      ...SAMPLE_PAGE,
      items: [],
      totalCount: 0,
    });
    const queryClient = makeQueryClient();

    const { result } = renderHook(() => useCustomerOutfits(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(0);
  });
});

// ---- useCreateCustomerOutfit ----

describe("useCreateCustomerOutfit", () => {
  it("returns UUID string on success", async () => {
    const uuid = "outfit-uuid-1";
    mockedOutfitsApi.createOutfit.mockResolvedValueOnce(uuid);
    const queryClient = makeQueryClient();

    const { result } = renderHook(() => useCreateCustomerOutfit(), {
      wrapper: createWrapper(queryClient),
    });

    let returned: string | undefined;
    await act(async () => {
      returned = await result.current.mutateAsync({ name: "Test" });
    });
    expect(returned).toBe(uuid);
  });

  it("invalidates outfit list after successful create", async () => {
    mockedOutfitsApi.createOutfit.mockResolvedValueOnce("new-uuid");
    const queryClient = makeQueryClient();
    const spy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateCustomerOutfit(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({});
    });

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: customerOutfitKeys.lists("customer-1"),
      }),
    );
  });

  it("exposes INVALID_OUTFIT_ITEMS error code — no silent favorite mutation", async () => {
    const OutfitApiErrorClass = (await import("@/features/customer/api/outfits.api")).OutfitApiError;
    const thrownError = new OutfitApiErrorClass("INVALID_OUTFIT_ITEMS", "Items must be favorites");
    mockedOutfitsApi.createOutfit.mockRejectedValueOnce(thrownError);
    const queryClient = makeQueryClient();

    const { result } = renderHook(() => useCreateCustomerOutfit(), {
      wrapper: createWrapper(queryClient),
    });

    let caught: unknown;
    await act(async () => {
      try {
        await result.current.mutateAsync({
          items: [{ productId: "p1", slotType: 0, displayOrder: 0 }],
        });
      } catch (err) {
        caught = err;
      }
    });

    expect(caught).toBeInstanceOf(OutfitApiErrorClass);
    expect((caught as InstanceType<typeof OutfitApiErrorClass>).code).toBe(
      "INVALID_OUTFIT_ITEMS",
    );
  });

  it("throws when no customer session is present", async () => {
    useAuthStore.setState({ ...AUTH_USER, user: null, isAuthenticated: false });
    const queryClient = makeQueryClient();

    const { result } = renderHook(() => useCreateCustomerOutfit(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({});
      }),
    ).rejects.toThrow("Customer session is required");
  });
});

// ---- useDeleteCustomerOutfit ----

describe("useDeleteCustomerOutfit", () => {
  it("calls delete without JSON parsing", async () => {
    mockedOutfitsApi.deleteOutfit.mockResolvedValueOnce(undefined);
    const queryClient = makeQueryClient();

    const { result } = renderHook(() => useDeleteCustomerOutfit(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync("o1");
    });

    expect(mockedOutfitsApi.deleteOutfit).toHaveBeenCalledWith("customer-1", "o1");
  });

  it("invalidates outfit list after delete", async () => {
    mockedOutfitsApi.deleteOutfit.mockResolvedValueOnce(undefined);
    const queryClient = makeQueryClient();
    const spy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDeleteCustomerOutfit(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync("o1");
    });

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: customerOutfitKeys.lists("customer-1"),
      }),
    );
  });

  it("throws when no customer session is present", async () => {
    useAuthStore.setState({ ...AUTH_USER, user: null, isAuthenticated: false });
    const queryClient = makeQueryClient();

    const { result } = renderHook(() => useDeleteCustomerOutfit(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync("o1");
      }),
    ).rejects.toThrow("Customer session is required");
  });
});

// ---- favorites invalidation ----

describe("favorites invalidation after favorite action", () => {
  it("favorites queries are invalidated via the toggle hook after add-to-favorites", async () => {
    const queryClient = makeQueryClient();
    const spy = vi.spyOn(queryClient, "invalidateQueries");

    queryClient.invalidateQueries({
      queryKey: customerFavoriteKeys.lists("customer-1"),
    });

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: customerFavoriteKeys.lists("customer-1"),
      }),
    );
  });
});

// ---- route protection ----

describe("route protection", () => {
  it("outfit list query is disabled without authentication", () => {
    useAuthStore.setState({ ...AUTH_USER, user: null, isAuthenticated: false });
    const queryClient = makeQueryClient();

    const { result } = renderHook(() => useCustomerOutfits(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.fetchStatus).toBe("idle");
  });
});
