import { SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ApiErrorState,
  ProductGrid,
} from "@/features/customer/components/product";
import {
  useCustomerCategories,
  useCustomerProducts,
} from "@/features/customer/queries/catalog.queries";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import {
  parseShopQuery,
  serializeShopQuery,
  toCatalogParams,
  type ShopQueryState,
} from "./shopQueryParams";

const filterGroups = [
  ["colors", "Colors", ["Black", "White", "Blue", "Beige", "Green"]],
  ["sizes", "Sizes", ["XS", "S", "M", "L", "XL"]],
  ["fabricMaterials", "Materials", ["Cotton", "Linen", "Denim", "Silk"]],
  ["bodyShapes", "Body shapes", ["Pear", "Hourglass", "Rectangle", "Apple"]],
  ["fabricPatterns", "Patterns", ["Solid", "Striped", "Floral", "Checked"]],
  ["brands", "Brands", ["weAR", "Luna", "Atelier", "North"]],
] as const;

const sortOptions = [
  ["featured", "Featured"],
  ["price:asc", "Price: low to high"],
  ["price:desc", "Price: high to low"],
  ["name:asc", "Name: A-Z"],
] as const;

type MultiKey = (typeof filterGroups)[number][0];

export function CustomerShopPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const queryState = useMemo(
    () => parseShopQuery(location.search),
    [location.search],
  );
  const [draftSearch, setDraftSearch] = useState(queryState.search);
  const catalogParams = useMemo(
    () => toCatalogParams(queryState),
    [queryState],
  );
  const productsQuery = useCustomerProducts(catalogParams);
  const categoriesQuery = useCustomerCategories();

  const updateQuery = (patch: Partial<ShopQueryState>, resetPage = true) => {
    const next = {
      ...queryState,
      ...patch,
      page: resetPage ? 1 : (patch.page ?? queryState.page),
    };
    const serialized = serializeShopQuery(next);
    navigate({
      pathname: location.pathname,
      search: serialized ? `?${serialized}` : "",
    });
  };

  const toggleMulti = (key: MultiKey, value: string) => {
    const current = queryState[key];
    updateQuery({
      [key]: current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    } as Partial<ShopQueryState>);
  };

  const products = productsQuery.data?.items ?? [];
  const total = productsQuery.data?.totalCount ?? products.length;
  const totalPages =
    productsQuery.data?.totalPages ??
    Math.max(1, Math.ceil(total / (productsQuery.data?.pageSize ?? 12)));

  const categories = Array.isArray(categoriesQuery.data)
    ? categoriesQuery.data
    : [];

  const filters = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#2F2925]">Filters</h2>
        <Button
          variant="ghost"
          type="button"
          onClick={() =>
            updateQuery({
              colors: [],
              sizes: [],
              fabricMaterials: [],
              bodyShapes: [],
              fabricPatterns: [],
              brands: [],
              categoryId: "",
              subcategoryId: "",
              minPrice: "",
              maxPrice: "",
            })
          }
        >
          Clear filters
        </Button>
      </div>
      <label className="grid gap-2 text-sm font-semibold text-[#2F2925]">
        Category
        <select
          className="rounded-md border border-[#E4DCD1] bg-white px-3 py-2"
          value={queryState.categoryId}
          onChange={(event) => updateQuery({ categoryId: event.target.value })}
        >
          <option value="">All categories</option>
          {(categories ?? []).map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-semibold text-[#2F2925]">
        Subcategory
        <Input
          value={queryState.subcategoryId}
          onChange={(e) => updateQuery({ subcategoryId: e.target.value })}
          placeholder="e.g. Dresses"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-2 text-sm font-semibold text-[#2F2925]">
          Min
          <Input
            type="number"
            value={queryState.minPrice}
            onChange={(e) => updateQuery({ minPrice: e.target.value })}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-[#2F2925]">
          Max
          <Input
            type="number"
            value={queryState.maxPrice}
            onChange={(e) => updateQuery({ maxPrice: e.target.value })}
          />
        </label>
      </div>
      {filterGroups.map(([key, label, values]) => (
        <fieldset key={key} className="space-y-2">
          <legend className="text-sm font-bold text-[#2F2925]">{label}</legend>
          {values.map((value) => (
            <label
              key={value}
              className="flex items-center gap-2 text-sm text-[#6F625B]"
            >
              <input
                type="checkbox"
                checked={queryState[key].includes(value)}
                onChange={() => toggleMulti(key, value)}
              />
              {value}
            </label>
          ))}
        </fieldset>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      <section className={`${customerTheme.card} p-6 sm:p-8`}>
        <p
          className={`text-sm font-semibold uppercase tracking-[0.18em] ${customerTheme.primaryText}`}
        >
          Shop catalog
        </p>
        <h1 className="mt-3 text-3xl font-bold text-[#2F2925]">
          Find pieces that fit your style and shape.
        </h1>
      </section>
      <form
        className="flex gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          updateQuery({ search: draftSearch });
        }}
      >
        <Input
          aria-label="Search products"
          value={draftSearch}
          onChange={(event) => setDraftSearch(event.target.value)}
          placeholder="Search products, brands, fabrics"
        />
        <Button className="bg-[#A37E6B] text-white hover:bg-[#8F6E5D]">
          Search
        </Button>
        <Button
          className="lg:hidden"
          type="button"
          variant="outline"
          onClick={() => setDrawerOpen(true)}
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </form>
      {drawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Product filters"
          className="fixed inset-0 z-50 bg-black/30 lg:hidden"
        >
          <div className="ml-auto h-full w-[86vw] overflow-y-auto bg-[#FAF7F4] p-5">
            <Button
              aria-label="Close filters"
              variant="ghost"
              onClick={() => setDrawerOpen(false)}
            >
              <X />
            </Button>
            {filters}
          </div>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <aside className={`${customerTheme.softCard} hidden p-5 lg:block`}>
          {filters}
        </aside>
        <main className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-semibold text-[#2F2925]">
              {productsQuery.isLoading
                ? "Loading results"
                : `${total} result${total === 1 ? "" : "s"}`}
            </p>
            <select
              aria-label="Sort products"
              className="rounded-md border border-[#E4DCD1] bg-white px-3 py-2"
              value={queryState.sort}
              onChange={(event) => updateQuery({ sort: event.target.value })}
            >
              {sortOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {productsQuery.isError ? (
            <ApiErrorState
              title="Catalog unavailable"
              message="We couldn't load products."
              onRetry={() => productsQuery.refetch()}
            />
          ) : (
            <ProductGrid
              products={products}
              isLoading={productsQuery.isLoading}
            />
          )}
          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              disabled={queryState.page <= 1}
              onClick={() => updateQuery({ page: queryState.page - 1 }, false)}
            >
              Previous
            </Button>
            <span className="py-2 text-sm text-[#6F625B]">
              Page {queryState.page} of {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={queryState.page >= totalPages}
              onClick={() => updateQuery({ page: queryState.page + 1 }, false)}
            >
              Next
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
