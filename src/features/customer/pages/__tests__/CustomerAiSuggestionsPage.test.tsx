import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CustomerAiSuggestionsPage } from "@/features/customer/pages/CustomerAiSuggestionsPage";
import type { AiSuggestion } from "@/features/customer/types/catalog";

const suggestionHooks = vi.hoisted(() => ({
  useGenerateSuggestions: vi.fn(),
  useSaveSuggestion: vi.fn(),
}));

vi.mock("@/features/customer/queries/suggestions.queries", () => suggestionHooks);

// SuggestionApiError used to test INVALID_OUTFIT_ITEMS guidance
vi.mock("@/features/customer/api/suggestions.api", () => ({
  SuggestionApiError: class SuggestionApiError extends Error {
    constructor(
      public readonly code: string,
      message: string,
    ) {
      super(message);
      this.name = "SuggestionApiError";
    }
  },
}));

const idleMutation = (overrides = {}) => ({
  mutateAsync: vi.fn(),
  isPending: false,
  isError: false,
  error: null,
  isSuccess: false,
  reset: vi.fn(),
  ...overrides,
});

// Suggestion with all products fully resolved and with valid slotType
const FULLY_RESOLVED_SUGGESTION: AiSuggestion = {
  suggestionId: "s1",
  name: "Summer Casual",
  styleNotes: "Light layers",
  styleCategory: "Casual",
  occasion: "Beach",
  products: [
    {
      productId: "p1",
      modelId: null,
      slotType: 0,
      displayOrder: 0,
      reasoning: "Great for summer",
      resolvedProduct: {
        id: "p1",
        name: "Linen Shirt",
        price: 49.99,
        currency: "$",
        imageUrl: null,
        primaryImageUrl: null,
      },
    },
    {
      productId: "p2",
      modelId: null,
      slotType: 1,
      displayOrder: 1,
      reasoning: null,
      resolvedProduct: {
        id: "p2",
        name: "White Trousers",
        price: 79.99,
        currency: "$",
        imageUrl: null,
        primaryImageUrl: null,
      },
    },
  ],
};

// Suggestion with an unresolved product (no productId)
const UNRESOLVED_PRODUCT_SUGGESTION: AiSuggestion = {
  suggestionId: "s2",
  name: "Partially Resolved",
  styleNotes: null,
  styleCategory: null,
  occasion: null,
  products: [
    { productId: "p1", modelId: null, slotType: 0, displayOrder: 0, reasoning: null, resolvedProduct: null },
    { productId: null, modelId: "m1", slotType: 1, displayOrder: 1, reasoning: null, resolvedProduct: null },
  ],
};

// Suggestion with no suggestionId (verified deployed response shape — first test, empty items)
const NULL_ID_SUGGESTION: AiSuggestion = {
  suggestionId: null,
  name: "Casual Chic",
  styleNotes: "Perfect for a clear day.",
  styleCategory: null,
  occasion: null,
  matchPercentage: 95,
  styleTags: ["Comfortable", "Versatile", "Timeless"],
  products: [],
};

// Suggestion with deployed item fields (second runtime test, 2026-06-14)
const DEPLOYED_ITEM_SUGGESTION: AiSuggestion = {
  suggestionId: null,
  name: "Casual Chic",
  styleNotes: "Perfect for a clear day.",
  styleCategory: null,
  occasion: null,
  matchPercentage: 95,
  styleTags: ["Comfortable", "Versatile", "Timeless"],
  products: [
    {
      id: "25e38c13-76ad-44a6-9b5d-edfe2d23c91d",
      productId: "cccccccc-cccc-cccc-cccc-cccc00000002",
      modelId: null,
      slotType: null,
      slot: "Top",
      displayOrder: 0,
      reasoning: null,
      description: null,
      name: "002 - women's short-sleeve, boat-neck blouse",
      price: 49.99,
      primaryImageUrl: "https://res.cloudinary.com/example.jpg",
      stockStatus: "In Stock",
      resolvedProduct: null,
    },
  ],
};

// Suggestion where a product has no slotType
const MISSING_SLOTTYPE_SUGGESTION: AiSuggestion = {
  suggestionId: "s3",
  name: "Missing Slot",
  styleNotes: null,
  styleCategory: null,
  occasion: null,
  products: [
    { productId: "p1", modelId: null, slotType: null, displayOrder: 0, reasoning: null, resolvedProduct: null },
  ],
};

function renderPage() {
  return render(
    <MemoryRouter>
      <CustomerAiSuggestionsPage />
    </MemoryRouter>,
  );
}

// Helper: fill weatherCondition (required) so the button is enabled
function fillWeather(value = "Sunny") {
  fireEvent.change(screen.getByLabelText(/Weather condition/i), { target: { value } });
}

beforeEach(() => {
  vi.clearAllMocks();
  suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation());
  suggestionHooks.useSaveSuggestion.mockReturnValue(idleMutation());
});

// ---------------------------------------------------------------------------
// Initial render
// ---------------------------------------------------------------------------

describe("initial render", () => {
  it("renders page heading", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /AI Outfit Suggestions/i })).toBeInTheDocument();
  });

  it("renders the generate form", () => {
    renderPage();
    expect(screen.getByRole("form", { name: /Generate AI outfit suggestions/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Occasion/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Style preferences/i)).toBeInTheDocument();
  });

  it("does not show suggestions before generating", () => {
    renderPage();
    expect(screen.queryByText(/suggestion generated/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No suggestions found/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Form validation — empty guard
// ---------------------------------------------------------------------------

describe("form validation", () => {
  it("submit button is disabled when weatherCondition is empty", () => {
    renderPage();
    expect(screen.getByRole("button", { name: /Get AI Suggestions/i })).toBeDisabled();
  });

  it("submit button is enabled when weatherCondition is filled", () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/Weather condition/i), { target: { value: "Sunny" } });
    expect(screen.getByRole("button", { name: /Get AI Suggestions/i })).not.toBeDisabled();
  });

  it("submit button remains disabled when only occasion is filled (weatherCondition required)", () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/Occasion/i), { target: { value: "Wedding" } });
    expect(screen.getByRole("button", { name: /Get AI Suggestions/i })).toBeDisabled();
  });

  it("submit button remains disabled when only style preferences are filled", () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/Style preferences/i), { target: { value: "Boho" } });
    expect(screen.getByRole("button", { name: /Get AI Suggestions/i })).toBeDisabled();
  });

  it("submit button remains disabled for whitespace-only weatherCondition", () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/Weather condition/i), { target: { value: "   " } });
    expect(screen.getByRole("button", { name: /Get AI Suggestions/i })).toBeDisabled();
  });

  it("includes weatherCondition in the exact request body", async () => {
    const mutateAsync = vi.fn().mockResolvedValue([]);
    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync }));
    renderPage();

    fireEvent.change(screen.getByLabelText(/Weather condition/i), { target: { value: "Clear" } });
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ weatherCondition: "Clear" }),
    ));
  });

  it("trims whitespace from weatherCondition before submitting", async () => {
    const mutateAsync = vi.fn().mockResolvedValue([]);
    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync }));
    renderPage();

    fireEvent.change(screen.getByLabelText(/Weather condition/i), { target: { value: "  Rainy  " } });
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ weatherCondition: "Rainy" }),
    ));
  });

  it("trims whitespace from occasion before submitting", async () => {
    const mutateAsync = vi.fn().mockResolvedValue([]);
    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync }));
    renderPage();

    fillWeather("Sunny");
    fireEvent.change(screen.getByLabelText(/Occasion/i), { target: { value: "  Beach  " } });
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ occasion: "Beach" }),
    ));
  });

  it("deduplicates style preferences before submitting", async () => {
    const mutateAsync = vi.fn().mockResolvedValue([]);
    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync }));
    renderPage();

    fillWeather("Sunny");
    fireEvent.change(screen.getByLabelText(/Style preferences/i), {
      target: { value: "Casual, Boho, Casual" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ stylePreferences: ["Casual", "Boho"] }),
    ));
  });

  it("passes style preferences as trimmed unique array", async () => {
    const mutateAsync = vi.fn().mockResolvedValue([]);
    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync }));
    renderPage();

    fillWeather("Sunny");
    fireEvent.change(screen.getByLabelText(/Style preferences/i), {
      target: { value: "Casual, Boho" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ stylePreferences: ["Casual", "Boho"] }),
    ));
  });

  it("sends null for optional fields when only weatherCondition is set", async () => {
    const mutateAsync = vi.fn().mockResolvedValue([]);
    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync }));
    renderPage();

    fillWeather("Cold");
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ weatherCondition: "Cold", occasion: null, stylePreferences: null, productIds: null }),
    ));
  });

  it("preserves weatherCondition in form after API error", async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error("API error"));
    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync }));
    renderPage();

    fireEvent.change(screen.getByLabelText(/Weather condition/i), { target: { value: "Hot" } });
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

    await waitFor(() => expect(screen.getByText(/API error/i)).toBeInTheDocument());

    // Form input value must be preserved
    expect(screen.getByLabelText(/Weather condition/i)).toHaveValue("Hot");
  });
});

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

describe("loading state", () => {
  it("shows loading indicator while generating", () => {
    suggestionHooks.useGenerateSuggestions.mockReturnValue(
      idleMutation({ isPending: true }),
    );
    renderPage();
    expect(screen.getByLabelText(/Generating AI outfit suggestions/i)).toBeInTheDocument();
  });

  it("disables submit button while pending", () => {
    suggestionHooks.useGenerateSuggestions.mockReturnValue(
      idleMutation({ isPending: true }),
    );
    renderPage();
    expect(screen.getByRole("button", { name: /Generating suggestions/i })).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe("empty state", () => {
  it("shows empty state message after generating with no results", async () => {
    const mutateAsync = vi.fn().mockResolvedValue([]);
    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync }));
    renderPage();

    fillWeather("Sunny");
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

    await waitFor(() =>
      expect(screen.getByText(/No suggestions found/i)).toBeInTheDocument(),
    );
  });
});

// ---------------------------------------------------------------------------
// Success state
// ---------------------------------------------------------------------------

describe("success state", () => {
  it("renders suggestion cards after successful generation", async () => {
    const mutateAsync = vi.fn().mockResolvedValue([FULLY_RESOLVED_SUGGESTION]);
    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync }));
    renderPage();

    fillWeather("Sunny");
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

    await waitFor(() =>
      expect(screen.getByText(/1 suggestion generated/i)).toBeInTheDocument(),
    );
    expect(screen.getByText("Summer Casual")).toBeInTheDocument();
    expect(screen.getByText("Linen Shirt")).toBeInTheDocument();
  });

  it("does not fabricate — only shows what the API returned", async () => {
    const emptySuggestion: AiSuggestion = {
      suggestionId: "s-empty",
      name: null,
      styleNotes: null,
      styleCategory: null,
      occasion: null,
      products: [],
    };
    const mutateAsync = vi.fn().mockResolvedValue([emptySuggestion]);
    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync }));
    renderPage();

    fillWeather("Sunny");
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

    await waitFor(() =>
      expect(screen.getByText(/1 suggestion generated/i)).toBeInTheDocument(),
    );
    // "No products in this suggestion." appears in the product list; the reason may also appear
    expect(screen.getAllByText(/No products in this suggestion/i).length).toBeGreaterThanOrEqual(1);
  });

  it("saves a suggestion and shows confirmation with link to outfits", async () => {
    const generateMutateAsync = vi.fn().mockResolvedValue([FULLY_RESOLVED_SUGGESTION]);
    const saveMutateAsync = vi.fn().mockResolvedValue("saved-uuid");

    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync: generateMutateAsync }));
    suggestionHooks.useSaveSuggestion.mockReturnValue(idleMutation({ mutateAsync: saveMutateAsync }));

    renderPage();

    fillWeather("Sunny");
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Save suggestion 1/i })).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: /Save suggestion 1/i }));

    await waitFor(() =>
      expect(screen.getByText(/Saved to your outfits/i)).toBeInTheDocument(),
    );

    // Link to outfits must be present
    expect(screen.getByRole("link", { name: /View Outfits/i })).toBeInTheDocument();
  });

  it("save sends all products in original order", async () => {
    const generateMutateAsync = vi.fn().mockResolvedValue([FULLY_RESOLVED_SUGGESTION]);
    const saveMutateAsync = vi.fn().mockResolvedValue("saved-uuid");

    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync: generateMutateAsync }));
    suggestionHooks.useSaveSuggestion.mockReturnValue(idleMutation({ mutateAsync: saveMutateAsync }));

    renderPage();

    fillWeather("Sunny");
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Save suggestion 1/i })).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: /Save suggestion 1/i }));

    await waitFor(() => expect(saveMutateAsync).toHaveBeenCalled());
    const payload = saveMutateAsync.mock.calls[0][0];
    // Must include ALL products in original order
    expect(payload.items).toHaveLength(2);
    expect(payload.items[0].productId).toBe("p1");
    expect(payload.items[1].productId).toBe("p2");
  });

  it("save uses displayOrder from backend when valid", async () => {
    const generateMutateAsync = vi.fn().mockResolvedValue([FULLY_RESOLVED_SUGGESTION]);
    const saveMutateAsync = vi.fn().mockResolvedValue("saved-uuid");

    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync: generateMutateAsync }));
    suggestionHooks.useSaveSuggestion.mockReturnValue(idleMutation({ mutateAsync: saveMutateAsync }));

    renderPage();

    fillWeather("Sunny");
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Save suggestion 1/i })).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: /Save suggestion 1/i }));

    await waitFor(() => expect(saveMutateAsync).toHaveBeenCalled());
    const payload = saveMutateAsync.mock.calls[0][0];
    // displayOrder 0 and 1 come from the suggestion products
    expect(payload.items[0].displayOrder).toBe(0);
    expect(payload.items[1].displayOrder).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Verified deployed response rendering
// ---------------------------------------------------------------------------

describe("verified deployed response rendering", () => {
  it("renders a suggestion with null suggestionId without dropping it", async () => {
    const mutateAsync = vi.fn().mockResolvedValue([NULL_ID_SUGGESTION]);
    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync }));
    renderPage();

    fillWeather("Clear");
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

    await waitFor(() =>
      expect(screen.getByText(/1 suggestion generated/i)).toBeInTheDocument(),
    );
    expect(screen.getByText("Casual Chic")).toBeInTheDocument();
  });

  it("renders matchPercentage when present", async () => {
    const mutateAsync = vi.fn().mockResolvedValue([NULL_ID_SUGGESTION]);
    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync }));
    renderPage();

    fillWeather("Clear");
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

    await waitFor(() =>
      expect(screen.getByText(/95% match/i)).toBeInTheDocument(),
    );
  });

  it("renders styleTags when present", async () => {
    const mutateAsync = vi.fn().mockResolvedValue([NULL_ID_SUGGESTION]);
    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync }));
    renderPage();

    fillWeather("Clear");
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

    await waitFor(() =>
      expect(screen.getByText("Comfortable")).toBeInTheDocument(),
    );
    expect(screen.getByText("Versatile")).toBeInTheDocument();
    expect(screen.getByText("Timeless")).toBeInTheDocument();
  });

  it("renders styleNotes from description mapping", async () => {
    const mutateAsync = vi.fn().mockResolvedValue([NULL_ID_SUGGESTION]);
    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync }));
    renderPage();

    fillWeather("Clear");
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

    await waitFor(() =>
      expect(screen.getByText("Perfect for a clear day.")).toBeInTheDocument(),
    );
  });

  it("does not use a synthetic suggestion ID — null id suggestion has no synthetic key side-effects", async () => {
    const mutateAsync = vi.fn().mockResolvedValue([NULL_ID_SUGGESTION]);
    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync }));
    renderPage();

    fillWeather("Clear");
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

    await waitFor(() =>
      expect(screen.getByText(/1 suggestion generated/i)).toBeInTheDocument(),
    );
    // Save button is disabled — no synthetic ID was invented to enable it
    expect(screen.getByRole("button", { name: /Save suggestion 1/i })).toBeDisabled();
  });

  it("renders product name from deployed item without a second lookup", async () => {
    const mutateAsync = vi.fn().mockResolvedValue([DEPLOYED_ITEM_SUGGESTION]);
    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync }));
    renderPage();

    fillWeather("Clear");
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

    await waitFor(() =>
      expect(screen.getByText("002 - women's short-sleeve, boat-neck blouse")).toBeInTheDocument(),
    );
  });

  it("renders slot label from deployed item", async () => {
    const mutateAsync = vi.fn().mockResolvedValue([DEPLOYED_ITEM_SUGGESTION]);
    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync }));
    renderPage();

    fillWeather("Clear");
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

    await waitFor(() =>
      expect(screen.getByText("Top")).toBeInTheDocument(),
    );
  });

  it("renders price from deployed item", async () => {
    const mutateAsync = vi.fn().mockResolvedValue([DEPLOYED_ITEM_SUGGESTION]);
    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync }));
    renderPage();

    fillWeather("Clear");
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

    await waitFor(() =>
      expect(screen.getByText(/49\.99/)).toBeInTheDocument(),
    );
  });

  it("renders stockStatus from deployed item", async () => {
    const mutateAsync = vi.fn().mockResolvedValue([DEPLOYED_ITEM_SUGGESTION]);
    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync }));
    renderPage();

    fillWeather("Clear");
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

    await waitFor(() =>
      expect(screen.getByText("In Stock")).toBeInTheDocument(),
    );
  });

  it("save remains disabled for deployed item (no suggestionId, no numeric slotType)", async () => {
    const mutateAsync = vi.fn().mockResolvedValue([DEPLOYED_ITEM_SUGGESTION]);
    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync }));
    renderPage();

    fillWeather("Clear");
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Save suggestion 1/i })).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: /Save suggestion 1/i })).toBeDisabled();
  });

  it("renders only the returned items when backend returns a subset of requested productIds", async () => {
    const mutateAsync = vi.fn().mockResolvedValue([DEPLOYED_ITEM_SUGGESTION]);
    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync }));
    renderPage();

    fillWeather("Clear");
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

    await waitFor(() =>
      expect(screen.getByRole("list", { name: /Suggested products/i })).toBeInTheDocument(),
    );
    // Only 1 item rendered — not an error that a second requested ID was not returned
    expect(screen.getByRole("list", { name: /Suggested products/i }).children).toHaveLength(1);
  });

  it("suggestion remains visible when backend returns a subset of requested productIds", async () => {
    const mutateAsync = vi.fn().mockResolvedValue([DEPLOYED_ITEM_SUGGESTION]);
    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync }));
    renderPage();

    fillWeather("Clear");
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

    await waitFor(() =>
      expect(screen.getByText(/1 suggestion generated/i)).toBeInTheDocument(),
    );
  });
});

// ---------------------------------------------------------------------------
// Save eligibility
// ---------------------------------------------------------------------------

describe("save eligibility", () => {
  it("save button is disabled when a product has no productId (unresolved)", async () => {
    const mutateAsync = vi.fn().mockResolvedValue([UNRESOLVED_PRODUCT_SUGGESTION]);
    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync }));
    renderPage();

    fillWeather("Sunny");
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Save suggestion 1/i })).toBeInTheDocument(),
    );

    expect(screen.getByRole("button", { name: /Save suggestion 1/i })).toBeDisabled();
  });

  it("save button is disabled when a product has no slotType", async () => {
    const mutateAsync = vi.fn().mockResolvedValue([MISSING_SLOTTYPE_SUGGESTION]);
    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync }));
    renderPage();

    fillWeather("Sunny");
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Save suggestion 1/i })).toBeInTheDocument(),
    );

    expect(screen.getByRole("button", { name: /Save suggestion 1/i })).toBeDisabled();
  });

  it("save button is enabled when all products are resolved with valid slotType", async () => {
    const mutateAsync = vi.fn().mockResolvedValue([FULLY_RESOLVED_SUGGESTION]);
    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync }));
    renderPage();

    fillWeather("Sunny");
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Save suggestion 1/i })).not.toBeDisabled(),
    );
  });
});

// ---------------------------------------------------------------------------
// Error states
// ---------------------------------------------------------------------------

describe("error state", () => {
  it("shows error message when generation fails", async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error("API unavailable"));
    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync }));
    renderPage();

    fillWeather("Sunny");
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

    await waitFor(() =>
      expect(screen.getByText("API unavailable")).toBeInTheDocument(),
    );
  });

  it("allows dismissing the generation error", async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error("Oops"));
    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync }));
    renderPage();

    fillWeather("Sunny");
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));
    await waitFor(() => expect(screen.getByText("Oops")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /Dismiss/i }));
    expect(screen.queryByText("Oops")).not.toBeInTheDocument();
  });

  it("shows generic save error for non-INVALID_OUTFIT_ITEMS failures", async () => {
    const generateMutateAsync = vi.fn().mockResolvedValue([FULLY_RESOLVED_SUGGESTION]);
    const saveMutateAsync = vi.fn().mockRejectedValue(new Error("Save failed"));

    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync: generateMutateAsync }));
    suggestionHooks.useSaveSuggestion.mockReturnValue(idleMutation({ mutateAsync: saveMutateAsync }));

    renderPage();

    fillWeather("Sunny");
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Save suggestion 1/i })).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: /Save suggestion 1/i }));

    await waitFor(() =>
      expect(screen.getByText("Save failed")).toBeInTheDocument(),
    );
  });

  it("shows INVALID_OUTFIT_ITEMS guidance with link to Favorites", async () => {
    const { SuggestionApiError } = await import("@/features/customer/api/suggestions.api");
    const generateMutateAsync = vi.fn().mockResolvedValue([FULLY_RESOLVED_SUGGESTION]);
    const saveMutateAsync = vi.fn().mockRejectedValue(
      new SuggestionApiError("INVALID_OUTFIT_ITEMS", "Items must be favorites"),
    );

    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync: generateMutateAsync }));
    suggestionHooks.useSaveSuggestion.mockReturnValue(idleMutation({ mutateAsync: saveMutateAsync }));

    renderPage();

    fillWeather("Sunny");
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Save suggestion 1/i })).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: /Save suggestion 1/i }));

    await waitFor(() =>
      expect(screen.getByText(/Products must be in Favorites first/i)).toBeInTheDocument(),
    );

    expect(screen.getByRole("link", { name: /Go to Favorites/i })).toBeInTheDocument();
    // No automatic mutation — save does not call Favorites toggle
  });

  it("save button is disabled when suggestionId is null", async () => {
    const mutateAsync = vi.fn().mockResolvedValue([NULL_ID_SUGGESTION]);
    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync }));
    renderPage();

    fillWeather("Clear");
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Save suggestion 1/i })).toBeInTheDocument(),
    );

    expect(screen.getByRole("button", { name: /Save suggestion 1/i })).toBeDisabled();
  });

  it("does not auto-mutate Favorites on INVALID_OUTFIT_ITEMS", async () => {
    const { SuggestionApiError } = await import("@/features/customer/api/suggestions.api");
    const generateMutateAsync = vi.fn().mockResolvedValue([FULLY_RESOLVED_SUGGESTION]);
    const saveMutateAsync = vi.fn().mockRejectedValue(
      new SuggestionApiError("INVALID_OUTFIT_ITEMS", "Items must be favorites"),
    );

    // If auto-mutation were implemented it would call a favorites toggle hook.
    // The page must not call any such hook on INVALID_OUTFIT_ITEMS.
    suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation({ mutateAsync: generateMutateAsync }));
    suggestionHooks.useSaveSuggestion.mockReturnValue(idleMutation({ mutateAsync: saveMutateAsync }));

    renderPage();

    fillWeather("Sunny");
    fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Save suggestion 1/i })).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: /Save suggestion 1/i }));

    await waitFor(() =>
      expect(screen.getByText(/Products must be in Favorites first/i)).toBeInTheDocument(),
    );

    // Only the save mutation was called — no favorites mutation hook exists in the page
    expect(saveMutateAsync).toHaveBeenCalledTimes(1);
  });
});
