/**
 * CustomerWardrobeCollectionsPage tests — Command 20
 *
 * Tests 31–55
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CustomerWardrobeCollectionsPage } from "@/features/customer/pages/CustomerWardrobeCollectionsPage";
import type {
  WardrobeCollectionsResult,
  WardrobeCollectionItemsResult,
} from "@/features/customer/types/wardrobeCollections.types";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const collectionHooks = vi.hoisted(() => ({
  useWardrobeCollections: vi.fn(),
  useCreateWardrobeCollection: vi.fn(),
  useDeleteWardrobeCollection: vi.fn(),
  useWardrobeCollectionItems: vi.fn(),
  useAddWardrobeCollectionItem: vi.fn(),
  useRemoveWardrobeCollectionItem: vi.fn(),
}));

vi.mock(
  "@/features/customer/queries/wardrobeCollections.queries",
  () => collectionHooks,
);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const EMPTY_COLLECTIONS: WardrobeCollectionsResult = {
  items: [],
  pageNumber: 1,
  pageSize: 12,
  totalCount: 0,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
};

const SAMPLE_COLLECTIONS: WardrobeCollectionsResult = {
  items: [
    {
      id: "col-1",
      name: "Summer Wardrobe",
      description: "Light pieces for warm days",
      itemCount: 5,
      coverImageUrl: null,
      createdAt: null,
      updatedAt: null,
    },
    {
      id: "col-2",
      name: "Work Attire",
      description: null,
      itemCount: 3,
      coverImageUrl: null,
      createdAt: null,
      updatedAt: null,
    },
  ],
  pageNumber: 1,
  pageSize: 12,
  totalCount: 2,
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
      primaryImageUrl: "https://example.com/jeans.jpg",
      price: 59.99,
      addedAt: null,
    },
  ],
  pageNumber: 1,
  pageSize: 12,
  totalCount: 1,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};

const EMPTY_ITEMS: WardrobeCollectionItemsResult = {
  items: [],
  pageNumber: 1,
  pageSize: 12,
  totalCount: 0,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
};

const idleMutation = (overrides = {}) => ({
  mutateAsync: vi.fn(),
  isPending: false,
  isError: false,
  error: null,
  ...overrides,
});

const idleItemsQuery = () => ({
  isLoading: false,
  isError: false,
  data: EMPTY_ITEMS,
  refetch: vi.fn(),
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/customer/wardrobe/collections"]}>
      <CustomerWardrobeCollectionsPage />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  collectionHooks.useWardrobeCollections.mockReturnValue({
    isLoading: false,
    isError: false,
    data: EMPTY_COLLECTIONS,
    refetch: vi.fn(),
  });
  collectionHooks.useCreateWardrobeCollection.mockReturnValue(idleMutation());
  collectionHooks.useDeleteWardrobeCollection.mockReturnValue(idleMutation());
  collectionHooks.useWardrobeCollectionItems.mockReturnValue(idleItemsQuery());
  collectionHooks.useAddWardrobeCollectionItem.mockReturnValue(idleMutation());
  collectionHooks.useRemoveWardrobeCollectionItem.mockReturnValue(idleMutation());
});

// ---------------------------------------------------------------------------
// Test 31 — loading state
// ---------------------------------------------------------------------------

describe("loading state", () => {
  it("31. renders loading message while fetching", () => {
    collectionHooks.useWardrobeCollections.mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
      refetch: vi.fn(),
    });

    renderPage();
    expect(screen.getByText(/loading your collections/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tests 32–33 — error state
// ---------------------------------------------------------------------------

describe("error state", () => {
  it("32. renders error message with retry button", () => {
    const refetch = vi.fn();
    collectionHooks.useWardrobeCollections.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      refetch,
    });

    renderPage();
    expect(screen.getByText(/could not load collections/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("33. retry button calls refetch", () => {
    const refetch = vi.fn();
    collectionHooks.useWardrobeCollections.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      refetch,
    });

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(refetch).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Tests 34–35 — empty state
// ---------------------------------------------------------------------------

describe("empty state", () => {
  it("34. renders empty state heading and CTA", () => {
    renderPage();
    expect(screen.getByText(/no collections yet/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create your first collection/i }),
    ).toBeInTheDocument();
  });

  it("35. shows total count of 0 in empty state area", () => {
    collectionHooks.useWardrobeCollections.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { ...EMPTY_COLLECTIONS, totalCount: 0 },
      refetch: vi.fn(),
    });
    renderPage();
    expect(screen.getByText(/0 collections/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tests 36–40 — populated list
// ---------------------------------------------------------------------------

describe("populated list", () => {
  beforeEach(() => {
    collectionHooks.useWardrobeCollections.mockReturnValue({
      isLoading: false,
      isError: false,
      data: SAMPLE_COLLECTIONS,
      refetch: vi.fn(),
    });
  });

  it("36. renders collection names in the list", () => {
    renderPage();
    expect(screen.getByText("Summer Wardrobe")).toBeInTheDocument();
    expect(screen.getByText("Work Attire")).toBeInTheDocument();
  });

  it("37. renders description when present", () => {
    renderPage();
    expect(screen.getByText("Light pieces for warm days")).toBeInTheDocument();
  });

  it("38. renders item count", () => {
    renderPage();
    expect(screen.getByText(/5 items/i)).toBeInTheDocument();
    expect(screen.getByText(/3 items/i)).toBeInTheDocument();
  });

  it("39. shows pagination when totalPages > 1", () => {
    collectionHooks.useWardrobeCollections.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { ...SAMPLE_COLLECTIONS, totalPages: 3, hasNextPage: true },
      refetch: vi.fn(),
    });
    renderPage();
    expect(
      screen.getByRole("navigation", { name: /collections pagination/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next page/i })).not.toBeDisabled();
  });

  it("40. disables previous page button on first page", () => {
    collectionHooks.useWardrobeCollections.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { ...SAMPLE_COLLECTIONS, totalPages: 3, hasNextPage: true },
      refetch: vi.fn(),
    });
    renderPage();
    expect(screen.getByRole("button", { name: /previous page/i })).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Tests 41–44 — create collection form
// ---------------------------------------------------------------------------

describe("create collection form", () => {
  it("41. opens create form when New Collection button is clicked", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /new collection/i }));
    expect(
      screen.getByRole("dialog", { name: /create collection/i }),
    ).toBeInTheDocument();
  });

  it("42. closes form when Cancel is clicked", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /new collection/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(
      screen.queryByRole("dialog", { name: /create collection/i }),
    ).toBeNull();
  });

  it("43. shows validation error when name is empty and form is submitted", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /new collection/i }));
    const form = screen
      .getByRole("dialog", { name: /create collection/i })
      .querySelector("form");
    fireEvent.submit(form!);
    await waitFor(() =>
      expect(
        screen.getByText(/collection name is required/i),
      ).toBeInTheDocument(),
    );
  });

  it("44. calls createCollection with trimmed name and optional description", async () => {
    const createAsync = vi.fn().mockResolvedValueOnce("new-id");
    collectionHooks.useCreateWardrobeCollection.mockReturnValue(
      idleMutation({ mutateAsync: createAsync }),
    );

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /new collection/i }));

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "My Collection" },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "A test description" },
    });

    const form = screen
      .getByRole("dialog", { name: /create collection/i })
      .querySelector("form");
    fireEvent.submit(form!);

    await waitFor(() => expect(createAsync).toHaveBeenCalled());
    expect(createAsync).toHaveBeenCalledWith({
      name: "My Collection",
      description: "A test description",
    });
  });
});

// ---------------------------------------------------------------------------
// Tests 45–48 — delete confirmation
// ---------------------------------------------------------------------------

describe("delete confirmation", () => {
  beforeEach(() => {
    collectionHooks.useWardrobeCollections.mockReturnValue({
      isLoading: false,
      isError: false,
      data: SAMPLE_COLLECTIONS,
      refetch: vi.fn(),
    });
  });

  it("45. shows delete confirmation dialog when delete button is clicked", () => {
    renderPage();
    const deleteBtn = screen.getAllByRole("button", {
      name: /delete collection/i,
    })[0];
    fireEvent.click(deleteBtn);
    expect(
      screen.getByRole("dialog", { name: /confirm collection deletion/i }),
    ).toBeInTheDocument();
  });

  it("46. does not call mutation when Cancel is clicked in dialog", () => {
    const deleteAsync = vi.fn();
    collectionHooks.useDeleteWardrobeCollection.mockReturnValue(
      idleMutation({ mutateAsync: deleteAsync }),
    );

    renderPage();
    fireEvent.click(
      screen.getAllByRole("button", { name: /delete collection/i })[0],
    );
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(deleteAsync).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("dialog", { name: /confirm collection deletion/i }),
    ).toBeNull();
  });

  it("47. calls delete mutation and shows success message", async () => {
    const deleteAsync = vi.fn().mockResolvedValueOnce(undefined);
    collectionHooks.useDeleteWardrobeCollection.mockReturnValue(
      idleMutation({ mutateAsync: deleteAsync }),
    );

    renderPage();
    fireEvent.click(
      screen.getAllByRole("button", { name: /delete collection/i })[0],
    );
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toBeInTheDocument(),
    );
    expect(deleteAsync).toHaveBeenCalledWith("col-1");
  });

  it("48. shows error message when delete fails", async () => {
    const deleteAsync = vi.fn().mockRejectedValueOnce(new Error("Network error"));
    collectionHooks.useDeleteWardrobeCollection.mockReturnValue(
      idleMutation({ mutateAsync: deleteAsync }),
    );

    renderPage();
    fireEvent.click(
      screen.getAllByRole("button", { name: /delete collection/i })[0],
    );
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toBeInTheDocument(),
    );
    expect(screen.getByText(/could not delete the collection/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tests 49–52 — selected collection items view
// ---------------------------------------------------------------------------

describe("selected collection items view", () => {
  beforeEach(() => {
    collectionHooks.useWardrobeCollections.mockReturnValue({
      isLoading: false,
      isError: false,
      data: SAMPLE_COLLECTIONS,
      refetch: vi.fn(),
    });
  });

  it("49. clicking a collection card opens items panel with collection name", () => {
    collectionHooks.useWardrobeCollectionItems.mockReturnValue({
      isLoading: false,
      isError: false,
      data: EMPTY_ITEMS,
      refetch: vi.fn(),
    });

    renderPage();
    fireEvent.click(screen.getByRole("article", { name: /summer wardrobe/i }));

    expect(
      screen.getByRole("region", { name: /items in summer wardrobe/i }),
    ).toBeInTheDocument();
  });

  it("50. items panel shows loading state", () => {
    collectionHooks.useWardrobeCollectionItems.mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
      refetch: vi.fn(),
    });

    renderPage();
    fireEvent.click(screen.getByRole("article", { name: /summer wardrobe/i }));

    expect(screen.getByText(/loading items/i)).toBeInTheDocument();
  });

  it("51. items panel shows error state with retry button", () => {
    const refetch = vi.fn();
    collectionHooks.useWardrobeCollectionItems.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      refetch,
    });

    renderPage();
    fireEvent.click(screen.getByRole("article", { name: /summer wardrobe/i }));

    expect(
      screen.getByText(/could not load collection items/i),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it("52. items panel shows empty state when no items", () => {
    collectionHooks.useWardrobeCollectionItems.mockReturnValue({
      isLoading: false,
      isError: false,
      data: EMPTY_ITEMS,
      refetch: vi.fn(),
    });

    renderPage();
    fireEvent.click(screen.getByRole("article", { name: /summer wardrobe/i }));

    expect(
      screen.getByText(/no items in this collection/i),
    ).toBeInTheDocument();
  });

  it("53. items panel shows product name and price", () => {
    collectionHooks.useWardrobeCollectionItems.mockReturnValue({
      isLoading: false,
      isError: false,
      data: SAMPLE_ITEMS,
      refetch: vi.fn(),
    });

    renderPage();
    fireEvent.click(screen.getByRole("article", { name: /summer wardrobe/i }));

    expect(screen.getByText("Blue Jeans")).toBeInTheDocument();
    expect(screen.getByText(/\$59\.99/i)).toBeInTheDocument();
  });

  it("54. close button in items panel hides the panel", () => {
    collectionHooks.useWardrobeCollectionItems.mockReturnValue({
      isLoading: false,
      isError: false,
      data: EMPTY_ITEMS,
      refetch: vi.fn(),
    });

    renderPage();
    fireEvent.click(screen.getByRole("article", { name: /summer wardrobe/i }));
    expect(
      screen.getByRole("region", { name: /items in summer wardrobe/i }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /close collection items view/i }),
    );
    expect(
      screen.queryByRole("region", { name: /items in summer wardrobe/i }),
    ).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Test 55 — clicking same collection twice deselects it
// ---------------------------------------------------------------------------

describe("collection toggle selection", () => {
  it("55. clicking same collection twice deselects it", () => {
    collectionHooks.useWardrobeCollections.mockReturnValue({
      isLoading: false,
      isError: false,
      data: SAMPLE_COLLECTIONS,
      refetch: vi.fn(),
    });
    collectionHooks.useWardrobeCollectionItems.mockReturnValue({
      isLoading: false,
      isError: false,
      data: EMPTY_ITEMS,
      refetch: vi.fn(),
    });

    renderPage();
    const card = screen.getByRole("article", { name: /summer wardrobe/i });

    fireEvent.click(card);
    expect(
      screen.getByRole("region", { name: /items in summer wardrobe/i }),
    ).toBeInTheDocument();

    fireEvent.click(card);
    expect(
      screen.queryByRole("region", { name: /items in summer wardrobe/i }),
    ).toBeNull();
  });
});
