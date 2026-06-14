import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  BookmarkPlus,
  ExternalLink,
  Heart,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import {
  useGenerateSuggestions,
  useSaveSuggestion,
} from "@/features/customer/queries/suggestions.queries";
import { SuggestionApiError } from "@/features/customer/api/suggestions.api";
import type { AiSuggestion, AiSuggestionProduct, OutfitItem } from "@/features/customer/types/catalog";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Save eligibility
// ---------------------------------------------------------------------------

interface SaveEligibility {
  canSave: boolean;
  items: OutfitItem[] | null;
  reason: string | null;
}

function getSaveEligibility(
  suggestionId: string | null,
  products: AiSuggestionProduct[],
): SaveEligibility {
  if (!suggestionId) {
    return { canSave: false, items: null, reason: "This suggestion can be viewed, but the backend did not return a saveable suggestion ID or product items." };
  }
  if (products.length === 0) {
    return { canSave: false, items: null, reason: "No products in this suggestion — saving is unavailable." };
  }
  // All products must have a resolved productId
  const unresolvedProduct = products.find((p) => !p.productId);
  if (unresolvedProduct) {
    return { canSave: false, items: null, reason: "Not all products could be resolved — saving is disabled." };
  }
  // All products must have a numeric slotType
  const missingSlotType = products.find((p) => typeof p.slotType !== "number");
  if (missingSlotType) {
    return { canSave: false, items: null, reason: "Slot type is missing for some products — saving is disabled." };
  }
  // Build items from ALL products in original order
  const items: OutfitItem[] = products.map((p, i) => ({
    productId: p.productId as string,
    slotType: p.slotType as number,
    displayOrder: typeof p.displayOrder === "number" ? p.displayOrder : i,
  }));
  return { canSave: true, items, reason: null };
}

// ---------------------------------------------------------------------------
// Product chip within a suggestion
// ---------------------------------------------------------------------------

function ProductChip({ product }: { product: AiSuggestionProduct }) {
  // Prefer embedded deployed fields; fall back to resolvedProduct from model-ID lookup
  const imageUrl =
    product.primaryImageUrl ??
    product.resolvedProduct?.primaryImageUrl ??
    product.resolvedProduct?.imageUrl ??
    product.resolvedProduct?.images?.[0]?.url ??
    null;
  const name =
    product.name ??
    product.resolvedProduct?.name ??
    product.productId ??
    product.modelId ??
    "Product";
  const price = product.price ?? product.resolvedProduct?.price ?? null;
  const currency = product.resolvedProduct?.currency ?? "$";

  return (
    <div className="flex items-center gap-2 rounded-lg border border-[#E4DCD1] bg-[#FAF7F5] px-3 py-2">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="h-8 w-8 rounded object-cover"
          aria-hidden="true"
        />
      ) : (
        <div
          className="flex h-8 w-8 items-center justify-center rounded bg-[#F4EDE7] text-[#C4A99A]"
          aria-hidden="true"
        >
          <Sparkles className="h-4 w-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm text-[#2F2925]">{name}</span>
        {product.slot && (
          <span className="text-xs text-[#A37E6B]">{product.slot}</span>
        )}
      </div>
      <div className="ml-auto shrink-0 text-right">
        {price !== null && (
          <span className="block text-xs text-[#6F625B]">
            {currency}{price.toFixed(2)}
          </span>
        )}
        {product.stockStatus && (
          <span className="block text-xs text-[#A37E6B]">{product.stockStatus}</span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single suggestion card
// ---------------------------------------------------------------------------

interface SuggestionCardProps {
  suggestion: AiSuggestion;
  index: number;
}

function SuggestionCard({ suggestion, index }: SuggestionCardProps) {
  const saveMutation = useSaveSuggestion();
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isInvalidItems, setIsInvalidItems] = useState(false);

  const { canSave, items, reason } = getSaveEligibility(suggestion.suggestionId, suggestion.products);

  const handleSave = async () => {
    if (!items) return;
    setSaveError(null);
    setIsInvalidItems(false);

    try {
      await saveMutation.mutateAsync({
        suggestionId: suggestion.suggestionId as string,
        name: suggestion.name ?? null,
        styleCategory: suggestion.styleCategory ?? null,
        items,
      });
      setSaved(true);
    } catch (err) {
      if (err instanceof SuggestionApiError && err.code === "INVALID_OUTFIT_ITEMS") {
        setIsInvalidItems(true);
        setSaveError(
          err.message || "All products in this outfit must be saved to your Favorites first.",
        );
        return;
      }
      setSaveError(
        err instanceof Error ? err.message : "Could not save suggestion. Please try again.",
      );
    }
  };

  return (
    <article
      className={cn(customerTheme.card, "flex flex-col gap-4 p-5")}
      aria-label={suggestion.name ?? `AI suggestion ${index + 1}`}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A37E6B]">
          Suggestion {index + 1}
        </p>
        {suggestion.name && (
          <h2 className="mt-1 text-base font-semibold text-[#2F2925]">
            {suggestion.name}
          </h2>
        )}
        {suggestion.styleCategory && (
          <p className="text-sm text-[#6F625B]">{suggestion.styleCategory}</p>
        )}
        {suggestion.occasion && (
          <p className="mt-0.5 text-xs text-[#A37E6B]">{suggestion.occasion}</p>
        )}
        {suggestion.styleNotes && (
          <p className="mt-1 text-xs italic text-[#6F625B]">{suggestion.styleNotes}</p>
        )}
        {suggestion.matchPercentage !== null && suggestion.matchPercentage !== undefined && (
          <p className="mt-1 text-xs font-medium text-[#A37E6B]">
            {suggestion.matchPercentage}% match
          </p>
        )}
        {suggestion.styleTags && suggestion.styleTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {suggestion.styleTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#F4EDE7] px-2 py-0.5 text-xs text-[#6F625B]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {suggestion.products.length > 0 ? (
        <ul className="space-y-2" aria-label="Suggested products">
          {suggestion.products.map((p, i) => (
            <li key={p.productId ?? p.modelId ?? i}>
              <ProductChip product={p} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[#6F625B]">No products in this suggestion.</p>
      )}

      {/* Save error — INVALID_OUTFIT_ITEMS: explicit guidance, link to Favorites, no auto-mutation */}
      {saveError && isInvalidItems && (
        <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          <div className="flex items-start gap-2">
            <Heart className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
            <div>
              <p className="font-medium text-amber-800">Products must be in Favorites first</p>
              <p className="mt-1 text-amber-700">
                Add the products in this suggestion to your Favorites, then try saving again. This
                must be done manually — no automatic changes are made to your Favorites.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-2 rounded-full">
                <Link to={CUSTOMER_ROUTES.favorites}>
                  <Heart className="mr-2 h-3 w-3" aria-hidden="true" />
                  Go to Favorites
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Save error — generic */}
      {saveError && !isInvalidItems && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {saveError}
        </p>
      )}

      {/* Save success */}
      {saved ? (
        <div
          role="status"
          className="rounded-lg bg-green-50 p-3 text-center text-sm"
        >
          <p className="text-green-800">Saved to your outfits.</p>
          <Button asChild variant="ghost" size="sm" className="mt-1 rounded-full text-[#A37E6B]">
            <Link to={CUSTOMER_ROUTES.outfits}>
              <ExternalLink className="mr-1 h-3 w-3" aria-hidden="true" />
              View Outfits
            </Link>
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-full"
          onClick={() => void handleSave()}
          disabled={!canSave || saveMutation.isPending}
          aria-label={`Save suggestion ${index + 1} to outfits`}
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            <>
              <BookmarkPlus className="mr-2 h-4 w-4" aria-hidden="true" />
              Save to Outfits
            </>
          )}
        </Button>
      )}

      {/* Ineligibility reason (not invalid-items — that has its own block above) */}
      {!canSave && !saved && reason && !isInvalidItems && (
        <p className="text-center text-xs text-[#6F625B]">{reason}</p>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Generate form
// ---------------------------------------------------------------------------

interface GenerateFormValues {
  weatherCondition: string;
  occasion: string;
  stylePreferences: string;
  productIds: string;
}

const INITIAL_FORM: GenerateFormValues = {
  weatherCondition: "",
  occasion: "",
  stylePreferences: "",
  productIds: "",
};

interface GenerateFormProps {
  onGenerate: (values: GenerateFormValues) => void;
  isPending: boolean;
}

function isFormEmpty(form: GenerateFormValues): boolean {
  // weatherCondition is required; at least that field must be non-empty
  return !form.weatherCondition.trim();
}

function GenerateForm({ onGenerate, isPending }: GenerateFormProps) {
  const [form, setForm] = useState<GenerateFormValues>(INITIAL_FORM);

  const handleChange = (field: keyof GenerateFormValues, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormEmpty(form)) return;
    onGenerate(form);
  };

  const empty = isFormEmpty(form);

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(customerTheme.card, "space-y-4 p-6")}
      aria-label="Generate AI outfit suggestions"
    >
      <div>
        <label
          htmlFor="suggestion-weather"
          className="mb-1 block text-sm font-medium text-[#2F2925]"
        >
          Weather condition <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <Input
          id="suggestion-weather"
          value={form.weatherCondition}
          onChange={(e) => handleChange("weatherCondition", e.target.value)}
          placeholder="e.g. Clear, Sunny, Cloudy, Rainy, Cold, Hot"
          required
          aria-required="true"
        />
        <p className="mt-1 text-xs text-[#6F625B]">
          Required — describes the expected weather for outfit suggestions.
        </p>
      </div>

      <div>
        <label
          htmlFor="suggestion-occasion"
          className="mb-1 block text-sm font-medium text-[#2F2925]"
        >
          Occasion (optional)
        </label>
        <Input
          id="suggestion-occasion"
          value={form.occasion}
          onChange={(e) => handleChange("occasion", e.target.value)}
          placeholder="e.g. Casual Friday, Wedding, Date night"
        />
      </div>

      <div>
        <label
          htmlFor="suggestion-styles"
          className="mb-1 block text-sm font-medium text-[#2F2925]"
        >
          Style preferences (comma-separated, optional)
        </label>
        <Input
          id="suggestion-styles"
          value={form.stylePreferences}
          onChange={(e) => handleChange("stylePreferences", e.target.value)}
          placeholder="e.g. Minimalist, Boho, Classic"
        />
      </div>

      <div>
        <label
          htmlFor="suggestion-products"
          className="mb-1 block text-sm font-medium text-[#2F2925]"
        >
          Product IDs to include (comma-separated, optional)
        </label>
        <Input
          id="suggestion-products"
          value={form.productIds}
          onChange={(e) => handleChange("productIds", e.target.value)}
          placeholder="product-id-1, product-id-2"
        />
      </div>

      <Button
        type="submit"
        className="w-full rounded-full"
        disabled={isPending || empty}
        aria-disabled={empty}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Generating suggestions…
          </>
        ) : (
          <>
            <Wand2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Get AI Suggestions
          </>
        )}
      </Button>

      {empty && (
        <p className="text-center text-xs text-[#6F625B]">
          Weather condition is required to generate suggestions.
        </p>
      )}
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

function parseCsvField(raw: string): string[] | null {
  const values = [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))];
  return values.length > 0 ? values : null;
}

export function CustomerAiSuggestionsPage() {
  const generateMutation = useGenerateSuggestions();
  const [suggestions, setSuggestions] = useState<AiSuggestion[] | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const handleGenerate = async (values: GenerateFormValues) => {
    setGenerateError(null);
    setSuggestions(null);

    try {
      const result = await generateMutation.mutateAsync({
        weatherCondition: values.weatherCondition.trim(),
        occasion: values.occasion.trim() || null,
        stylePreferences: parseCsvField(values.stylePreferences),
        productIds: parseCsvField(values.productIds),
      });
      setSuggestions(result);
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : "Could not generate suggestions. Please try again.",
      );
    }
  };

  return (
    <section className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A37E6B]">
          AI Styling
        </p>
        <h1 className="mt-2 text-4xl font-semibold text-[#2F2925]">
          AI Outfit Suggestions
        </h1>
        <p className="mt-2 max-w-2xl text-[#6F625B]">
          Describe your occasion and style preferences, and our AI will curate
          outfit combinations for you. Save any suggestion directly to your Outfits.
        </p>
      </div>

      {/* Generate form */}
      <GenerateForm
        onGenerate={(values) => void handleGenerate(values)}
        isPending={generateMutation.isPending}
      />

      {/* Error state */}
      {generateError && (
        <div
          role="alert"
          className={cn(customerTheme.card, "flex items-start gap-3 p-5")}
        >
          <AlertCircle
            className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
            aria-hidden="true"
          />
          <div>
            <p className="font-medium text-[#2F2925]">Could not generate suggestions</p>
            <p className="mt-1 text-sm text-[#6F625B]">{generateError}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 rounded-full"
              onClick={() => setGenerateError(null)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {generateMutation.isPending && (
        <div
          className={cn(customerTheme.card, "p-8 text-center")}
          aria-busy="true"
          aria-label="Generating AI outfit suggestions"
        >
          <Loader2
            className="mx-auto h-10 w-10 animate-spin text-[#A37E6B]"
            aria-hidden="true"
          />
          <p className="mt-4 text-[#6F625B]">Our AI is crafting outfit suggestions for you…</p>
        </div>
      )}

      {/* Empty state — request completed but no suggestions returned */}
      {suggestions !== null && suggestions.length === 0 && (
        <div
          className={cn(customerTheme.card, "p-10 text-center")}
          role="status"
          aria-label="No suggestions returned"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F4EDE7] text-[#A37E6B]">
            <Sparkles className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-[#2F2925]">
            No suggestions found
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[#6F625B]">
            Try adjusting your occasion or style preferences and generate again.
          </p>
        </div>
      )}

      {/* Success state — render suggestion cards */}
      {suggestions !== null && suggestions.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-[#6F625B]">
            {suggestions.length} {suggestions.length === 1 ? "suggestion" : "suggestions"} generated
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.map((suggestion, i) => (
              <SuggestionCard key={suggestion.suggestionId ?? `suggestion-${i}`} suggestion={suggestion} index={i} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
