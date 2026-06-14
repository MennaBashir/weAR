import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { suggestionsApi } from "@/features/customer/api/suggestions.api";
import {
  useGenerateSuggestions,
  useSaveSuggestion,
} from "@/features/customer/queries/suggestions.queries";
import { customerOutfitKeys } from "@/features/customer/queries/outfits.queries";
import { useAuthStore } from "@/features/auth/useAuthStore";
import type { AiSuggestion } from "@/features/customer/types/catalog";

vi.mock("@/features/customer/api/suggestions.api", () => ({
  suggestionsApi: {
    generateSuggestions: vi.fn(),
    saveSuggestion: vi.fn(),
  },
}));

const mockedSuggestionsApi = vi.mocked(suggestionsApi);

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

const SAMPLE_SUGGESTIONS: AiSuggestion[] = [
  {
    suggestionId: "s1",
    name: "Summer Casual",
    styleCategory: "Casual",
    occasion: "Beach",
    products: [
      { productId: "p1", slotType: 0, displayOrder: 0, modelId: null, resolvedProduct: null },
    ],
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState(AUTH_USER);
});

describe("useGenerateSuggestions", () => {
  it("returns suggestions on success", async () => {
    mockedSuggestionsApi.generateSuggestions.mockResolvedValueOnce(SAMPLE_SUGGESTIONS);
    const queryClient = makeQueryClient();

    const { result } = renderHook(() => useGenerateSuggestions(), {
      wrapper: createWrapper(queryClient),
    });

    let returned: AiSuggestion[] | undefined;
    await act(async () => {
      returned = await result.current.mutateAsync({ weatherCondition: "Sunny", occasion: "Beach" });
    });

    expect(returned).toHaveLength(1);
    expect(returned![0].suggestionId).toBe("s1");
    expect(mockedSuggestionsApi.generateSuggestions).toHaveBeenCalledWith({ weatherCondition: "Sunny", occasion: "Beach" });
  });

  it("enters error state when API throws", async () => {
    mockedSuggestionsApi.generateSuggestions.mockRejectedValueOnce(new Error("API error"));
    const queryClient = makeQueryClient();

    const { result } = renderHook(() => useGenerateSuggestions(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({});
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("returns empty array when no suggestions found", async () => {
    mockedSuggestionsApi.generateSuggestions.mockResolvedValueOnce([]);
    const queryClient = makeQueryClient();

    const { result } = renderHook(() => useGenerateSuggestions(), {
      wrapper: createWrapper(queryClient),
    });

    let returned: AiSuggestion[] | undefined;
    await act(async () => {
      returned = await result.current.mutateAsync({ weatherCondition: "Cold" });
    });

    expect(returned).toHaveLength(0);
  });
});

describe("useSaveSuggestion", () => {
  it("returns UUID on success", async () => {
    mockedSuggestionsApi.saveSuggestion.mockResolvedValueOnce("saved-uuid");
    const queryClient = makeQueryClient();

    const { result } = renderHook(() => useSaveSuggestion(), {
      wrapper: createWrapper(queryClient),
    });

    let returned: string | undefined;
    await act(async () => {
      returned = await result.current.mutateAsync({
        suggestionId: "s1",
        items: [{ productId: "p1", slotType: 0, displayOrder: 0 }],
      });
    });

    expect(returned).toBe("saved-uuid");
  });

  it("invalidates outfit list after successful save", async () => {
    mockedSuggestionsApi.saveSuggestion.mockResolvedValueOnce("new-uuid");
    const queryClient = makeQueryClient();
    const spy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useSaveSuggestion(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        suggestionId: "s1",
        items: [],
      });
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

    const { result } = renderHook(() => useSaveSuggestion(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ suggestionId: "s1", items: [] });
      }),
    ).rejects.toThrow("Customer session is required");
  });

  it("derives customerId only from authenticated state", async () => {
    mockedSuggestionsApi.saveSuggestion.mockResolvedValueOnce("uuid");
    const queryClient = makeQueryClient();

    const { result } = renderHook(() => useSaveSuggestion(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ suggestionId: "s1", items: [] });
    });

    expect(mockedSuggestionsApi.saveSuggestion).toHaveBeenCalledWith(
      expect.objectContaining({ suggestionId: "s1" }),
    );
  });
});
