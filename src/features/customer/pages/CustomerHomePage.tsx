import { Link } from "react-router-dom";
import { ArrowRight, Ruler, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductRail } from "@/features/customer/components/product";
import { useCustomerCategories, useCustomerOffers, useCustomerProducts } from "@/features/customer/queries/catalog.queries";
import { useToggleCustomerFavorite } from "@/features/customer/queries/favorites.queries";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import { cn } from "@/lib/utils";

export function CustomerHomePage() {
  const featuredProductsQuery = useCustomerProducts({ pageNumber: 1, pageSize: 8 });
  const categoriesQuery = useCustomerCategories();
  const offersQuery = useCustomerOffers();
  const toggleFavorite = useToggleCustomerFavorite();
  const products = featuredProductsQuery.data?.items ?? [];

  return (
    <div className="space-y-10">
      <section className={`${customerTheme.card} overflow-hidden`}>
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#A37E6B]">Customer storefront</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-[#2F2925] sm:text-5xl">Curated outfits that fit your body and your style.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#6F625B]">Browse real catalog products, save favorites, and use avatar-powered recommendations when you open product details.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className={cn("rounded-full bg-[#A37E6B] text-white hover:bg-[#8F6E5D]", customerTheme.focusRing)}><Link to={CUSTOMER_ROUTES.shop}>Shop now <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              <Button asChild variant="outline" className={cn("rounded-full", customerTheme.focusRing)}><Link to={CUSTOMER_ROUTES.tryOn}>Plan a try-on</Link></Button>
            </div>
          </div>
          <div className="rounded-[2rem] bg-[#F4EDE7] p-6">
            <div className="grid gap-4">
              {[Sparkles, Ruler, Wand2].map((Icon, index) => <div key={index} className="flex items-center gap-3 rounded-2xl bg-white/80 p-4 text-[#4D433D]"><Icon className="h-5 w-5 text-[#A37E6B]" /><span className="text-sm font-medium">{["Discover seasonal edits", "Get size guidance", "Style complete looks"][index]}</span></div>)}
            </div>
          </div>
        </div>
      </section>

      {(categoriesQuery.data?.length ?? 0) > 0 && <section className="space-y-4" aria-label="Shop by category"><h2 className="text-2xl font-bold text-[#2F2925]">Shop by category</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{categoriesQuery.data?.slice(0, 4).map((category) => <Link key={category.id} to={`${CUSTOMER_ROUTES.shop}?categoryId=${category.id}`} className={cn(`${customerTheme.softCard} block overflow-hidden p-5 hover:border-[#A37E6B]`, customerTheme.focusRing)}>{category.imageUrl && <img src={category.imageUrl} alt="" className="mb-4 aspect-[4/3] w-full rounded-2xl object-cover" />}<span className="font-semibold text-[#2F2925]">{category.name}</span>{typeof category.productCount === "number" && <span className="mt-1 block text-sm text-[#6F625B]">{category.productCount} products</span>}</Link>)}</div></section>}

      {(offersQuery.data?.length ?? 0) > 0 && <section className={`${customerTheme.softCard} p-6`} aria-label="Current offers"><h2 className="text-2xl font-bold text-[#2F2925]">Current offers</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{offersQuery.data?.slice(0, 2).map((offer) => <article key={offer.id} className="rounded-2xl bg-white p-5"><p className="font-semibold text-[#2F2925]">{offer.title}</p>{offer.description && <p className="mt-2 text-sm text-[#6F625B]">{offer.description}</p>}</article>)}</div></section>}

      <ProductRail title="Featured products" products={products} isLoading={featuredProductsQuery.isLoading} onToggleFavorite={(id) => toggleFavorite.mutate(id)} />
    </div>
  );
}
