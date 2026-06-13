import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ApiErrorState,
  ProductGrid,
  ProductRail,
} from "@/features/customer/components/product";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import {
  useCustomerCategories,
  useCustomerOffers,
  useCustomerProducts,
} from "@/features/customer/queries/catalog.queries";
import { customerTheme } from "@/features/customer/styles/customerTheme";

const features = [
  "Fit-aware recommendations",
  "Curated storefront edits",
  "Fast favorite saving",
];
const testimonials = [
  {
    name: "Mona",
    quote: "The catalog feels boutique, but the filters make it practical.",
  },
  {
    name: "Leila",
    quote: "I can move from inspiration to a short list in minutes.",
  },
];

export function CustomerHomePage() {
  const categoriesQuery = useCustomerCategories();
  const offersQuery = useCustomerOffers();
  const bestSellersQuery = useCustomerProducts({
    pageNumber: 1,
    pageSize: 8,
    sortBy: "sales",
    sortDirection: "desc",
  });
  const newArrivalsQuery = useCustomerProducts({
    pageNumber: 1,
    pageSize: 8,
    sortBy: "createdAt",
    sortDirection: "desc",
  });
  const allProductsQuery = useCustomerProducts({ pageNumber: 1, pageSize: 8 });

  const categories = Array.isArray(categoriesQuery.data)
    ? categoriesQuery.data
    : [];

  const offers = Array.isArray(offersQuery.data) ? offersQuery.data : [];

  return (
    <div className="space-y-10">
      <section
        className={`${customerTheme.card} grid gap-8 overflow-hidden p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center`}
      >
        <div>
          <p
            className={`text-sm font-semibold uppercase tracking-[0.18em] ${customerTheme.primaryText}`}
          >
            Customer storefront
          </p>
          <h1 className="mt-4 text-4xl font-bold text-[#2F2925] sm:text-5xl">
            Discover fashion selected for real wardrobes.
          </h1>
          <p className="mt-4 max-w-2xl text-[#6F625B]">
            Browse live catalog products, explore category edits, and save
            pieces for your upcoming virtual try-on flow.
          </p>
          <Button
            asChild
            className="mt-6 rounded-full bg-[#A37E6B] text-white hover:bg-[#8F6E5D]"
          >
            <Link to={CUSTOMER_ROUTES.shop}>Shop now</Link>
          </Button>
        </div>
        <div className="rounded-[2rem] bg-[#F4EDE7] p-6">
          <p className="text-sm font-bold text-[#A37E6B]">Featured offer</p>
          <h2 className="mt-3 text-2xl font-bold text-[#2F2925]">
            {offers?.[0]?.title ?? "Style made personal"}
          </h2>
          <p className="mt-2 text-sm text-[#6F625B]">
            {offers?.[0]?.description ??
              "Try curated edits for work, weekends, and special occasions."}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#2F2925]">
          Product categories
        </h2>
        {categoriesQuery.isError ? (
          <ApiErrorState
            title="Categories unavailable"
            onRetry={() => categoriesQuery.refetch()}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categoriesQuery.isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-32 animate-pulse rounded-2xl bg-[#E4DCD1]"
                  />
                ))
              : (categories ?? []).slice(0, 8).map((category) => (
                  <Link
                    key={category.id}
                    to={`${CUSTOMER_ROUTES.shop}?category=${category.id}`}
                    className={`${customerTheme.softCard} p-5 transition hover:-translate-y-0.5`}
                  >
                    <h3 className="font-bold text-[#2F2925]">
                      {category.name}
                    </h3>
                    <p className="mt-2 text-sm text-[#6F625B]">
                      {category.productCount ?? 0} products
                    </p>
                  </Link>
                ))}
          </div>
        )}
      </section>

      <section className="grid gap-5 rounded-3xl bg-[#2F2925] p-6 text-white lg:grid-cols-[1fr_auto]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#E4DCD1]">
            Virtual try-on
          </p>
          <h2 className="mt-3 text-3xl font-bold">
            Preview the fit before you commit.
          </h2>
          <p className="mt-2 text-sm text-[#E4DCD1]">
            Avatar try-on is coming next; start by building a favorites rack
            from the live catalog.
          </p>
        </div>
        <Button
          asChild
          variant="secondary"
          className="self-center rounded-full"
        >
          <Link to={CUSTOMER_ROUTES.shop}>Build favorites</Link>
        </Button>
      </section>

      {bestSellersQuery.isError ? (
        <ApiErrorState
          title="Best sellers unavailable"
          onRetry={() => bestSellersQuery.refetch()}
        />
      ) : (
        <ProductRail
          title="Best Seller"
          products={bestSellersQuery.data?.items}
          isLoading={bestSellersQuery.isLoading}
        />
      )}
      {newArrivalsQuery.isError ? (
        <ApiErrorState
          title="New arrivals unavailable"
          onRetry={() => newArrivalsQuery.refetch()}
        />
      ) : (
        <ProductRail
          title="New Arrival"
          products={newArrivalsQuery.data?.items}
          isLoading={newArrivalsQuery.isLoading}
        />
      )}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#2F2925]">All Products</h2>
          <Link
            className="text-sm font-semibold text-[#A37E6B]"
            to={CUSTOMER_ROUTES.shop}
          >
            View all
          </Link>
        </div>
        {allProductsQuery.isError ? (
          <ApiErrorState
            title="Products unavailable"
            onRetry={() => allProductsQuery.refetch()}
          />
        ) : (
          <ProductGrid
            products={allProductsQuery.data?.items}
            isLoading={allProductsQuery.isLoading}
          />
        )}
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {features.map((feature) => (
          <div key={feature} className={`${customerTheme.softCard} p-5`}>
            <h3 className="font-bold text-[#2F2925]">{feature}</h3>
            <p className="mt-2 text-sm text-[#6F625B]">
              Designed to make every shopping session simpler and more
              confident.
            </p>
          </div>
        ))}
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        {testimonials.map((item) => (
          <figure key={item.name} className={`${customerTheme.softCard} p-5`}>
            <blockquote className="text-[#2F2925]">“{item.quote}”</blockquote>
            <figcaption className="mt-3 text-sm font-semibold text-[#A37E6B]">
              {item.name}
            </figcaption>
          </figure>
        ))}
      </section>
    </div>
  );
}
