import { FormEvent, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiErrorState, ProductGrid } from "@/features/customer/components/product";
import { useCustomerCategories, useCustomerProducts } from "@/features/customer/queries/catalog.queries";
import { useToggleCustomerFavorite } from "@/features/customer/queries/favorites.queries";
import { parseShopQueryParams, updateShopQueryParams } from "@/features/customer/routes/shopQueryParams";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";

export function CustomerShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const catalogParams = useMemo(() => parseShopQueryParams(searchParams), [searchParams]);
  const [searchDraft, setSearchDraft] = useState(catalogParams.search ?? "");
  const productsQuery = useCustomerProducts(catalogParams);
  const categoriesQuery = useCustomerCategories();
  const toggleFavorite = useToggleCustomerFavorite();
  const products = productsQuery.data?.items ?? [];
  const totalCount = productsQuery.data?.totalCount;

  const updateFilters = (updates: Record<string, string | number | null | undefined>) => {
    setSearchParams(updateShopQueryParams(searchParams, { page: 1, ...updates }));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateFilters({ search: searchDraft });
  };

  return (
    <div className="space-y-8">
      <section className={`${customerTheme.card} grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-end`}>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A37E6B]">Shop</p>
          <h1 className="mt-2 text-3xl font-bold text-[#2F2925] sm:text-4xl">Find your next favorite fit</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F625B]">Search and filter the live customer catalog, then open any product for details and recommendations.</p>
        </div>
        <form onSubmit={onSubmit} className="flex w-full gap-2 lg:w-96" role="search">
          <Input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Search products" aria-label="Search products" className="rounded-full" />
          <Button type="submit" className={cn("rounded-full bg-[#A37E6B] text-white hover:bg-[#8F6E5D]", customerTheme.focusRing)}><Search className="mr-2 h-4 w-4" />Search</Button>
        </form>
      </section>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className={`${customerTheme.softCard} h-fit space-y-5 p-5`} aria-label="Shop filters">
          <div className="flex items-center gap-2 font-semibold text-[#2F2925]"><SlidersHorizontal className="h-4 w-4" /> Filters</div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[#2F2925]">Categories</p>
            <div className="grid gap-2">
              <Button type="button" variant={!catalogParams.categoryId ? "default" : "outline"} className="justify-start rounded-full" onClick={() => updateFilters({ categoryId: null })}>All products</Button>
              {(categoriesQuery.data ?? []).map((category) => (
                <Button key={category.id} type="button" variant={catalogParams.categoryId === category.id ? "default" : "outline"} className="justify-start rounded-full" onClick={() => updateFilters({ categoryId: category.id })}>{category.name}{typeof category.productCount === "number" ? ` (${category.productCount})` : ""}</Button>
              ))}
            </div>
          </div>
          <label className="grid gap-2 text-sm font-semibold text-[#2F2925]">Sort
            <select className="rounded-full border border-[#E4DCD1] bg-white px-3 py-2 text-sm text-[#4D433D]" value={`${catalogParams.sortBy ?? ""}:${catalogParams.sortDirection ?? ""}`} onChange={(event) => {
              const [sortBy, sortDirection] = event.target.value.split(":");
              updateFilters({ sortBy: sortBy || null, sortDirection: sortDirection || null });
            }}>
              <option value=":">Featured</option>
              <option value="price:asc">Price: Low to High</option>
              <option value="price:desc">Price: High to Low</option>
              <option value="name:asc">Name: A to Z</option>
            </select>
          </label>
        </aside>

        <section className="space-y-4" aria-label="Product results">
          <div className="flex items-center justify-between gap-3 text-sm text-[#6F625B]">
            <span>{typeof totalCount === "number" ? `${totalCount} products` : "Catalog results"}</span>
            {catalogParams.search && <Button type="button" variant="ghost" className="rounded-full" onClick={() => { setSearchDraft(""); updateFilters({ search: null }); }}>Clear search</Button>}
          </div>
          {productsQuery.isError ? <ApiErrorState title="Unable to load products" onRetry={() => productsQuery.refetch()} /> : <ProductGrid products={products} isLoading={productsQuery.isLoading} onToggleFavorite={(id) => toggleFavorite.mutate(id)} />}
        </section>
      </div>
    </div>
  );
}
