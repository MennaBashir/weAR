import { BarChart2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ApiErrorState } from "@/features/customer/components/product/ApiErrorState";
import { PriceDisplay } from "@/features/customer/components/product/PriceDisplay";
import { useCompareStore, COMPARE_MIN, COMPARE_MAX } from "@/features/customer/compare/useCompareStore";
import { useCompareProducts } from "@/features/customer/queries/catalog.queries";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import type { CustomerProduct } from "@/features/customer/types/catalog";
import { cn } from "@/lib/utils";

const getImage = (product: CustomerProduct) =>
  product.primaryImageUrl ??
  product.imageUrl ??
  product.images?.find((i) => i.isPrimary)?.url ??
  product.images?.[0]?.url ??
  null;

const asList = (value?: string | string[] | null) =>
  Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];

const ROW_LABELS: Array<{ label: string; render: (p: CustomerProduct) => string | null }> = [
  { label: "Brand", render: (p) => p.brand ?? null },
  { label: "Category", render: (p) => [p.categoryName, p.subcategoryName].filter(Boolean).join(" / ") || null },
  { label: "Material", render: (p) => p.fabricMaterial ?? p.material ?? null },
  { label: "Pattern", render: (p) => p.pattern ?? null },
  { label: "Body shape", render: (p) => p.bodyShape ?? null },
  { label: "Colors", render: (p) => p.colors?.join(", ") ?? null },
  { label: "Sizes", render: (p) => p.sizes?.join(", ") ?? null },
  { label: "Stock", render: (p) => p.stockStatus ?? (typeof p.stockQuantity === "number" ? `${p.stockQuantity} available` : null) },
];

function CompareToolbar() {
  const productIds = useCompareStore((s) => s.productIds);
  const clear = useCompareStore((s) => s.clear);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <BarChart2 className="h-5 w-5 shrink-0 text-[#A37E6B]" aria-hidden="true" />
      <span className="font-semibold text-[#2F2925]">
        Comparing {productIds.length} product{productIds.length === 1 ? "" : "s"}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="ml-auto text-[#6F625B]"
        onClick={clear}
      >
        Clear all
      </Button>
    </div>
  );
}

export function CustomerComparePage() {
  const productIds = useCompareStore((s) => s.productIds);
  const remove = useCompareStore((s) => s.remove);
  const compareQuery = useCompareProducts(productIds);

  if (productIds.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[#2F2925]">Compare products</h1>
        <div className={`${customerTheme.card} flex flex-col items-center gap-4 p-12 text-center`}>
          <BarChart2 className="h-12 w-12 text-[#E4DCD1]" aria-hidden="true" />
          <p className="text-lg font-semibold text-[#2F2925]">No products selected</p>
          <p className="text-sm text-[#6F625B]">
            Select {COMPARE_MIN}–{COMPARE_MAX} products from the shop to compare them side by side.
          </p>
          <Link
            to={CUSTOMER_ROUTES.shop}
            className={cn(
              "rounded-full bg-[#A37E6B] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#8F6E5D]",
              customerTheme.focusRing,
            )}
          >
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  if (productIds.length < COMPARE_MIN) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[#2F2925]">Compare products</h1>
        <CompareToolbar />
        <div className={`${customerTheme.card} flex flex-col items-center gap-4 p-12 text-center`}>
          <BarChart2 className="h-12 w-12 text-[#E4DCD1]" aria-hidden="true" />
          <p className="text-lg font-semibold text-[#2F2925]">
            Add {COMPARE_MIN - productIds.length} more product{COMPARE_MIN - productIds.length === 1 ? "" : "s"}
          </p>
          <p className="text-sm text-[#6F625B]">
            You need at least {COMPARE_MIN} products to compare.
          </p>
          <Link
            to={CUSTOMER_ROUTES.shop}
            className={cn(
              "rounded-full bg-[#A37E6B] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#8F6E5D]",
              customerTheme.focusRing,
            )}
          >
            Add more products
          </Link>
        </div>
      </div>
    );
  }

  if (compareQuery.isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[#2F2925]">Compare products</h1>
        <CompareToolbar />
        <div
          className={`${customerTheme.card} min-h-[360px] animate-pulse p-8`}
          aria-label="Loading comparison"
        />
      </div>
    );
  }

  if (compareQuery.isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[#2F2925]">Compare products</h1>
        <CompareToolbar />
        <ApiErrorState
          title="Comparison unavailable"
          message="We couldn't load the comparison right now."
          onRetry={() => compareQuery.refetch()}
        />
      </div>
    );
  }

  const products = compareQuery.data ?? [];

  if (products.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[#2F2925]">Compare products</h1>
        <CompareToolbar />
        <div className={`${customerTheme.card} flex flex-col items-center gap-4 p-12 text-center`}>
          <p className="text-lg font-semibold text-[#2F2925]">No products returned</p>
          <p className="text-sm text-[#6F625B]">
            The selected products are no longer available from the catalog.
          </p>
          <Link
            to={CUSTOMER_ROUTES.shop}
            className={cn(
              "rounded-full bg-[#A37E6B] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#8F6E5D]",
              customerTheme.focusRing,
            )}
          >
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  const visibleRows = ROW_LABELS.filter(({ render }) =>
    products.some((p) => render(p) !== null),
  );

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-[#2F2925]">Compare products</h1>

      <div className={`${customerTheme.card} p-4`}>
        <CompareToolbar />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-32 border-b border-[#E4DCD1] py-3 pr-4 text-left font-semibold text-[#6F625B] sm:w-44" scope="col">
                &nbsp;
              </th>
              {products.map((product) => {
                const image = getImage(product);
                return (
                  <th
                    key={product.id}
                    className="border-b border-[#E4DCD1] px-3 py-3 text-center font-medium"
                    scope="col"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative">
                        <div className="mx-auto h-24 w-20 overflow-hidden rounded-2xl bg-[#F4EDE7]">
                          {image ? (
                            <img
                              src={image}
                              alt={product.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-[#A37E6B]">
                              No image
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white shadow-sm hover:bg-[#F4EDE7]",
                            customerTheme.focusRing,
                          )}
                          aria-label={`Remove ${product.name} from comparison`}
                          onClick={() => remove(product.id)}
                        >
                          <X className="h-3 w-3 text-[#6F625B]" aria-hidden="true" />
                        </Button>
                      </div>
                      <Link
                        to={CUSTOMER_ROUTES.productDetails(product.id)}
                        className={cn(
                          "block max-w-[120px] font-semibold text-[#2F2925] hover:text-[#A37E6B]",
                          customerTheme.focusRing,
                        )}
                      >
                        {product.name}
                      </Link>
                      <PriceDisplay
                        price={product.price}
                        discountedPrice={product.discountedPrice}
                        currency={product.currency}
                      />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(({ label, render }) => (
              <tr key={label} className="border-b border-[#E4DCD1] last:border-0">
                <td className="py-3 pr-4 font-semibold text-[#6F625B]">{label}</td>
                {products.map((product) => {
                  const value = render(product);
                  return (
                    <td key={product.id} className="px-3 py-3 text-center text-[#2F2925]">
                      {value ?? <span className="text-[#C4B9B1]">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td className="py-3 pr-4 font-semibold text-[#6F625B]">Care</td>
              {products.map((product) => {
                const care = asList(product.careInstructions);
                return (
                  <td key={product.id} className="px-3 py-3 text-center text-[#2F2925]">
                    {care.length > 0 ? (
                      <ul className="space-y-1 text-left">
                        {care.map((item) => (
                          <li key={item} className="text-xs">
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-[#C4B9B1]">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="py-4 pr-4" />
              {products.map((product) => (
                <td key={product.id} className="px-3 py-4 text-center">
                  <Link
                    to={CUSTOMER_ROUTES.productDetails(product.id)}
                    className={cn(
                      "rounded-full bg-[#A37E6B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#8F6E5D]",
                      customerTheme.focusRing,
                    )}
                  >
                    View product
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
