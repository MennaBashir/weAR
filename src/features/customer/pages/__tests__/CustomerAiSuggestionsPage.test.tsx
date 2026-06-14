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

const idleMutation = (overrides = {}) => ({
  mutateAsync: vi.fn(),
  isPending: false,
  isError: false,
  error: null,
  isSuccess: false,
  reset: vi.fn(),
  ...overrides,
});

const SAMPLE_SUGGESTIONS: AiSuggestion[] = [
  {
    suggestionId: "s1",
    name: "Summer Casual",
    styleCategory: "Casual",
    occasion: "Beach",
    products: [
      {
        productId: "p1",
        modelId: null,
        slotType: 0,
        displayOrder: 0,
        resolvedProduct: {
          id: "p1",
          name: "Linen Shirt",
          price: 49.99,
          currency: "$",
          imageUrl: null,
          primaryImageUrl: null,
        },
      },
    ],
  },
  {
    suggestionId: "s2",
    name: null,
    styleCategory: null,
    occasion: null,
    products: [],
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <CustomerAiSuggestionsPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  suggestionHooks.useGenerateSuggestions.mockReturnValue(idleMutation());
  suggestionHooks.useSaveSuggestion.mockReturnValue(idleMutation());
});

describe("CustomerAiSuggestionsPage", () => {
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
      expect(screen.getByRole("button", { name: /Get AI Suggestions/i })).toBeInTheDocument();
    });

    it("does not show suggestions before generating", () => {
      renderPage();
      expect(screen.queryByText(/suggestion generated/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/No suggestions found/i)).not.toBeInTheDocument();
    });
  });

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

  describe("empty state", () => {
    it("shows empty state message after generating with no results", async () => {
      const mutateAsync = vi.fn().mockResolvedValue([]);
      suggestionHooks.useGenerateSuggestions.mockReturnValue(
        idleMutation({ mutateAsync }),
      );
      renderPage();

      fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

      await waitFor(() =>
        expect(screen.getByText(/No suggestions found/i)).toBeInTheDocument(),
      );
    });
  });

  describe("success state", () => {
    it("renders suggestion cards after successful generation", async () => {
      const mutateAsync = vi.fn().mockResolvedValue(SAMPLE_SUGGESTIONS);
      suggestionHooks.useGenerateSuggestions.mockReturnValue(
        idleMutation({ mutateAsync }),
      );
      renderPage();

      fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

      await waitFor(() =>
        expect(screen.getByText(/2 suggestions generated/i)).toBeInTheDocument(),
      );

      expect(screen.getByText("Summer Casual")).toBeInTheDocument();
      expect(screen.getByText("Linen Shirt")).toBeInTheDocument();
    });

    it("shows save button for suggestions with resolvable products", async () => {
      const mutateAsync = vi.fn().mockResolvedValue([SAMPLE_SUGGESTIONS[0]]);
      suggestionHooks.useGenerateSuggestions.mockReturnValue(
        idleMutation({ mutateAsync }),
      );
      renderPage();

      fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

      await waitFor(() =>
        expect(screen.getByRole("button", { name: /Save suggestion 1/i })).toBeInTheDocument(),
      );
    });

    it("saves a suggestion and shows confirmation", async () => {
      const generateMutateAsync = vi.fn().mockResolvedValue([SAMPLE_SUGGESTIONS[0]]);
      const saveMutateAsync = vi.fn().mockResolvedValue("saved-uuid");

      suggestionHooks.useGenerateSuggestions.mockReturnValue(
        idleMutation({ mutateAsync: generateMutateAsync }),
      );
      suggestionHooks.useSaveSuggestion.mockReturnValue(
        idleMutation({ mutateAsync: saveMutateAsync }),
      );

      renderPage();

      fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));
      await waitFor(() =>
        expect(screen.getByRole("button", { name: /Save suggestion 1/i })).toBeInTheDocument(),
      );

      fireEvent.click(screen.getByRole("button", { name: /Save suggestion 1/i }));

      await waitFor(() =>
        expect(screen.getByText(/Saved to your outfits/i)).toBeInTheDocument(),
      );
    });

    it("does not fabricate — only shows what the API returned", async () => {
      const emptySuggestion: AiSuggestion = {
        suggestionId: "s-empty",
        name: null,
        styleCategory: null,
        occasion: null,
        products: [],
      };
      const mutateAsync = vi.fn().mockResolvedValue([emptySuggestion]);
      suggestionHooks.useGenerateSuggestions.mockReturnValue(
        idleMutation({ mutateAsync }),
      );
      renderPage();

      fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

      await waitFor(() =>
        expect(screen.getByText(/1 suggestion generated/i)).toBeInTheDocument(),
      );

      expect(screen.getByText(/No products in this suggestion/i)).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("shows error message when generation fails", async () => {
      const mutateAsync = vi.fn().mockRejectedValue(new Error("API unavailable"));
      suggestionHooks.useGenerateSuggestions.mockReturnValue(
        idleMutation({ mutateAsync }),
      );
      renderPage();

      fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

      await waitFor(() =>
        expect(screen.getByText("API unavailable")).toBeInTheDocument(),
      );
    });

    it("shows save error when save fails", async () => {
      const generateMutateAsync = vi.fn().mockResolvedValue([SAMPLE_SUGGESTIONS[0]]);
      const saveMutateAsync = vi.fn().mockRejectedValue(new Error("Save failed"));

      suggestionHooks.useGenerateSuggestions.mockReturnValue(
        idleMutation({ mutateAsync: generateMutateAsync }),
      );
      suggestionHooks.useSaveSuggestion.mockReturnValue(
        idleMutation({ mutateAsync: saveMutateAsync }),
      );

      renderPage();

      fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));
      await waitFor(() =>
        expect(screen.getByRole("button", { name: /Save suggestion 1/i })).toBeInTheDocument(),
      );

      fireEvent.click(screen.getByRole("button", { name: /Save suggestion 1/i }));

      await waitFor(() =>
        expect(screen.getByText("Save failed")).toBeInTheDocument(),
      );
    });

    it("allows dismissing the generation error", async () => {
      const mutateAsync = vi.fn().mockRejectedValue(new Error("Oops"));
      suggestionHooks.useGenerateSuggestions.mockReturnValue(
        idleMutation({ mutateAsync }),
      );
      renderPage();

      fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));
      await waitFor(() => expect(screen.getByText("Oops")).toBeInTheDocument());

      fireEvent.click(screen.getByRole("button", { name: /Dismiss/i }));
      expect(screen.queryByText("Oops")).not.toBeInTheDocument();
    });
  });

  describe("form input handling", () => {
    it("passes occasion value to generate mutation", async () => {
      const mutateAsync = vi.fn().mockResolvedValue([]);
      suggestionHooks.useGenerateSuggestions.mockReturnValue(
        idleMutation({ mutateAsync }),
      );
      renderPage();

      fireEvent.change(screen.getByLabelText(/Occasion/i), {
        target: { value: "Wedding" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

      await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ occasion: "Wedding" }),
      ));
    });

    it("passes style preferences as array to generate mutation", async () => {
      const mutateAsync = vi.fn().mockResolvedValue([]);
      suggestionHooks.useGenerateSuggestions.mockReturnValue(
        idleMutation({ mutateAsync }),
      );
      renderPage();

      fireEvent.change(screen.getByLabelText(/Style preferences/i), {
        target: { value: "Casual, Boho" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

      await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ stylePreferences: ["Casual", "Boho"] }),
      ));
    });

    it("sends null for empty optional fields", async () => {
      const mutateAsync = vi.fn().mockResolvedValue([]);
      suggestionHooks.useGenerateSuggestions.mockReturnValue(
        idleMutation({ mutateAsync }),
      );
      renderPage();

      fireEvent.click(screen.getByRole("button", { name: /Get AI Suggestions/i }));

      await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ occasion: null, stylePreferences: null }),
      ));
    });
  });
});
