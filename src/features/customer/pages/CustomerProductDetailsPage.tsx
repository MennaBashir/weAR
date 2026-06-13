import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Heart, ImageIcon, Ruler, Scale, Shirt, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiErrorState, EmptyState, PriceDisplay, ProductRail } from "@/features/customer/components/product";
import { useCustomerProduct, useSimilarCustomerProducts } from "@/features/customer/queries/catalog.queries";
import { useToggleCustomerFavorite } from "@/features/customer/queries/favorites.queries";
import { useComplementaryCustomerProducts, useCustomerSizeRecommendation } from "@/features/customer/queries/recommendations.queries";
import { useCartStore } from "@/features/customer/cart/useCartStore";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import type { CustomerProduct, CustomerProductImage } from "@/features/customer/types/catalog";
import { cn } from "@/lib/utils";

const asList = (value?: string | string[] | null) => Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
const productImages = (product: CustomerProduct): CustomerProductImage[] => {
  const images = [...(product.images ?? [])];
  if (product.imageUrl && !images.some((image) => image.url === product.imageUrl)) {
    images.unshift({ url: product.imageUrl, altText: product.name, isPrimary: true });
  }
  return images.filter((image) => image.url);
};
const isMissingAvatarError = (error: unknown) => {
  const status = (error as { response?: { status?: number }; status?: number })?.response?.status ?? (error as { status?: number })?.status;
  return status === 404;
};

export function CustomerProductDetailsPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const productQuery = useCustomerProduct(productId);
  const similarQuery = useSimilarCustomerProducts(productId);
  const complementaryQuery = useComplementaryCustomerProducts(productId);
  const sizeRecommendationQuery = useCustomerSizeRecommendation(productId);
  const toggleFavorite = useToggleCustomerFavorite();
  const [localState, setLocalState] = useState<{
    productId: string | null;
    selectedImage: number;
    selectedColor: string | null;
    selectedSize: string | null;
    cartMessage: string | null;
    compareMessage: string | null;
  }>({
    productId: null,
    selectedImage: 0,
    selectedColor: null,
    selectedSize: null,
    cartMessage: null,
    compareMessage: null,
  });

  const addToCart = useCartStore((s) => s.addItem);
  const addToCartCooldown = useRef(false);

  const product = productQuery.data;
  const images = useMemo(() => product ? productImages(product) : [], [product]);
  const colors = useMemo(() => product?.colors ?? [], [product?.colors]);
  const sizes = useMemo(() => product?.sizes ?? [], [product?.sizes]);
  const isCurrentProductState = localState.productId === (productId ?? null);
  const selectedImage = isCurrentProductState ? localState.selectedImage : 0;
  const selectedColor = isCurrentProductState ? localState.selectedColor : colors.length === 1 ? colors[0] : null;
  const selectedSize = isCurrentProductState ? localState.selectedSize : sizes.length === 1 ? sizes[0] : null;
  const cartMessage = isCurrentProductState ? localState.cartMessage : null;
  const compareMessage = isCurrentProductState ? localState.compareMessage : null;
  const updateLocalState = (patch: Partial<typeof localState>) =>
    setLocalState((current) => ({
      productId: productId ?? null,
      selectedImage: isCurrentProductState ? current.selectedImage : 0,
      selectedColor: isCurrentProductState ? current.selectedColor : colors.length === 1 ? colors[0] : null,
      selectedSize: isCurrentProductState ? current.selectedSize : sizes.length === 1 ? sizes[0] : null,
      cartMessage: null,
      compareMessage: null,
      ...patch,
    }));
  const requiresColor = colors.length > 0;
  const requiresSize = sizes.length > 0;
  const variantsReady = (!requiresColor || !!selectedColor) && (!requiresSize || !!selectedSize);

  if (productQuery.isLoading) {
    return <div className={`${customerTheme.card} min-h-[520px] animate-pulse p-8`} aria-label="Loading product details" />;
  }

  if (productQuery.isError) {
    if (isMissingAvatarError(productQuery.error)) return <EmptyState title="Product not found" description="This product is no longer available." />;
    return <ApiErrorState title="Unable to load product" message="We couldn't load this product right now." onRetry={() => productQuery.refetch()} />;
  }

  if (!product) return <EmptyState title="Product not found" description="This product is no longer available." />;

  const activeImage = images[selectedImage];
  const disabledReason = !variantsReady ? `Select ${requiresColor && !selectedColor ? "a color" : ""}${requiresColor && !selectedColor && requiresSize && !selectedSize ? " and " : ""}${requiresSize && !selectedSize ? "a size" : ""} to continue.` : null;
  const featureRows = [
    ["Category", [product.categoryName, product.subcategoryName].filter(Boolean).join(" / ")],
    ["Material", product.fabricMaterial ?? product.material],
    ["Pattern", product.pattern],
    ["Body shape", product.bodyShape],
    ["Stock", product.stockStatus ?? (typeof product.stockQuantity === "number" ? `${product.stockQuantity} available` : null)],
  ].filter(([, value]) => value);
  const care = asList(product.careInstructions);
  const recommendation = sizeRecommendationQuery.data;
  const recommendedSize = recommendation?.recommendedSize ?? recommendation?.size;
  const recommendationExplanation = recommendation?.explanation ?? recommendation?.reason;
  const complementaryProducts = complementaryQuery.data ?? [];
  const showComplementary = complementaryQuery.isSuccess && complementaryProducts.length > 0;
  const similarProducts = similarQuery.data ?? [];

  return (
    <div className="space-y-10">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-[#6F625B]">
        <Link to={CUSTOMER_ROUTES.shop} className={cn("hover:text-[#A37E6B]", customerTheme.focusRing)}>Shop</Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-[#2F2925]">{product.name}</span>
      </nav>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]" aria-labelledby="product-title">
        <div className="space-y-4">
          <div className={`${customerTheme.card} flex aspect-[4/5] items-center justify-center overflow-hidden bg-[#F4EDE7]`}>
            {activeImage ? <img src={activeImage.url} alt={activeImage.altText ?? product.name} className="h-full w-full object-cover" /> : <div className="grid place-items-center gap-3 text-[#A37E6B]"><ImageIcon className="h-12 w-12" aria-hidden="true" /><span>Image coming soon</span></div>}
          </div>
          {images.length > 1 && <div className="flex gap-3 overflow-x-auto pb-2" aria-label="Product images">
            {images.map((image, index) => <button key={`${image.url}-${index}`} type="button" onClick={() => updateLocalState({ selectedImage: index })} className={cn("h-20 w-16 shrink-0 overflow-hidden rounded-2xl border bg-[#F4EDE7]", index === selectedImage ? "border-[#A37E6B] ring-2 ring-[#A37E6B]" : "border-[#E4DCD1]", customerTheme.focusRing)} aria-label={`Show product image ${index + 1}`} aria-pressed={index === selectedImage}><img src={image.url} alt="" className="h-full w-full object-cover" /></button>)}
          </div>}
        </div>

        <div className={`${customerTheme.card} h-fit space-y-6 p-6 sm:p-8`}>
          <Button type="button" variant="ghost" className={cn("rounded-full px-0 text-[#6F625B] hover:text-[#A37E6B]", customerTheme.focusRing)} onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
          {product.brand && <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A37E6B]">{product.brand}</p>}
          <div><h1 id="product-title" className="text-3xl font-bold text-[#2F2925] sm:text-4xl">{product.name}</h1>{typeof product.views === "number" && <p className="mt-2 text-sm text-[#6F625B]">{product.views.toLocaleString()} views</p>}</div>
          <div className="text-2xl"><PriceDisplay price={product.price} discountedPrice={product.discountedPrice} currency={product.currency} /></div>
          {product.description && <p className="leading-7 text-[#6F625B]">{product.description}</p>}

          {colors.length > 0 && <fieldset className="space-y-3"><legend className="font-semibold text-[#2F2925]">Color</legend><div className="flex flex-wrap gap-2">{colors.map((color) => <button type="button" key={color} onClick={() => updateLocalState({ selectedColor: color })} className={cn("rounded-full border px-4 py-2 text-sm", selectedColor === color ? "border-[#A37E6B] bg-[#F4EDE7] text-[#A37E6B]" : "border-[#E4DCD1] text-[#4D433D]", customerTheme.focusRing)} aria-pressed={selectedColor === color}>{color}</button>)}</div></fieldset>}
          {sizes.length > 0 && <fieldset className="space-y-3"><legend className="font-semibold text-[#2F2925]">Size</legend><div className="flex flex-wrap gap-2">{sizes.map((size) => <button type="button" key={size} onClick={() => updateLocalState({ selectedSize: size })} className={cn("min-w-12 rounded-full border px-4 py-2 text-sm font-semibold", selectedSize === size ? "border-[#A37E6B] bg-[#A37E6B] text-white" : "border-[#E4DCD1] text-[#4D433D]", customerTheme.focusRing)} aria-pressed={selectedSize === size}>{size}</button>)}</div></fieldset>}
          {disabledReason && <p className="text-sm text-[#8F6E5D]" role="status">{disabledReason}</p>}

          <div className="grid gap-3 sm:grid-cols-2">
            <Button type="button" disabled={!variantsReady} onClick={() => {
              if (addToCartCooldown.current) return;
              addToCartCooldown.current = true;
              addToCart({
                productId: product.id,
                productName: product.name,
                productImage: images[0]?.url ?? product.imageUrl ?? null,
                brand: product.brand ?? null,
                unitPrice: product.price,
                discountedPrice: product.discountedPrice ?? null,
                selectedSize: selectedSize ?? null,
                selectedColor: selectedColor ?? null,
                productRoute: CUSTOMER_ROUTES.productDetails(product.id),
              });
              updateLocalState({ cartMessage: `Saved locally — ${product.name}${selectedSize ? `, size ${selectedSize}` : ""}${selectedColor ? `, ${selectedColor}` : ""} added to cart.` });
              setTimeout(() => { addToCartCooldown.current = false; }, 1200);
            }} className={cn("rounded-full bg-[#A37E6B] text-white hover:bg-[#8F6E5D]", customerTheme.focusRing)} aria-label={`Add ${product.name} to cart`}><ShoppingBag className="mr-2 h-4 w-4" />Add to Cart</Button>
            <Button type="button" disabled={!variantsReady} onClick={() => navigate(`/customer/try-on/${product.id}`, { state: { productId: product.id, selectedSize, selectedColor } })} className={cn("rounded-full", customerTheme.focusRing)} variant="outline" aria-label={`Try on ${product.name}`}><Shirt className="mr-2 h-4 w-4" />Try On</Button>
            <Button type="button" variant="outline" className={cn("rounded-full", customerTheme.focusRing)} onClick={() => toggleFavorite.mutate(product.id)} disabled={toggleFavorite.isPending} aria-label={product.isFavorite ? `Remove ${product.name} from favorites` : `Add ${product.name} to favorites`}><Heart className={cn("mr-2 h-4 w-4", product.isFavorite && "fill-current")} />{product.isFavorite ? "Favorited" : "Favorite"}</Button>
            <Button type="button" variant="outline" className={cn("rounded-full", customerTheme.focusRing)} onClick={() => updateLocalState({ compareMessage: "Product saved to the local comparison boundary. Add 1–3 more products when comparison is available." })} aria-label={`Add ${product.name} to comparison`}><Scale className="mr-2 h-4 w-4" />Compare</Button>
          </div>
          {cartMessage && <p className="text-sm text-[#4D433D]" role="status">{cartMessage}</p>}
          {compareMessage && <p className="text-sm text-[#4D433D]" role="status">{compareMessage}</p>}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3" aria-label="Product information">
        <InfoPanel title="Description">{product.description ? <p>{product.description}</p> : <p className="text-[#6F625B]">No extended product description is available.</p>}</InfoPanel>
        {(product.features?.length || featureRows.length) ? <InfoPanel title="Features"><dl className="space-y-2">{featureRows.map(([label, value]) => <div key={label} className="flex justify-between gap-4"><dt className="text-[#6F625B]">{label}</dt><dd className="text-right font-medium text-[#2F2925]">{value}</dd></div>)}</dl>{product.features?.length ? <ul className="mt-3 list-disc space-y-1 pl-5">{product.features.map((f) => <li key={f}>{f}</li>)}</ul> : null}</InfoPanel> : null}
        {care.length > 0 && <InfoPanel title="Care / Washing"><ul className="list-disc space-y-1 pl-5">{care.map((item) => <li key={item}>{item}</li>)}</ul></InfoPanel>}
        <InfoPanel title="Size recommendation"><Ruler className="mb-2 h-5 w-5 text-[#A37E6B]" />{sizeRecommendationQuery.isLoading ? <p>Checking your avatar measurements…</p> : recommendedSize ? <p><strong>Recommended size: {recommendedSize}</strong>{recommendation?.confidence ? ` · Confidence ${recommendation.confidence}` : ""}{recommendationExplanation ? <span className="block mt-2 text-[#6F625B]">{recommendationExplanation}</span> : null}</p> : sizeRecommendationQuery.isError && isMissingAvatarError(sizeRecommendationQuery.error) ? <p>No avatar found. <Link className="font-semibold text-[#A37E6B]" to="/customer/avatar">Set up your avatar</Link> for a size recommendation.</p> : sizeRecommendationQuery.isError ? <p>Size recommendation is unavailable right now, but the product details remain available.</p> : <p>Sign in with a customer avatar to receive size guidance.</p>}</InfoPanel>
      </section>

      {showComplementary && <ProductRail title="Complete the Look" products={complementaryProducts} onToggleFavorite={(id) => toggleFavorite.mutate(id)} />}
      {similarQuery.isError ? null : similarProducts.length > 0 && <ProductRail title="Similar products" products={similarProducts} isLoading={similarQuery.isLoading} onToggleFavorite={(id) => toggleFavorite.mutate(id)} />}
    </div>
  );
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className={`${customerTheme.softCard} p-5`}><h2 className="mb-3 text-lg font-bold text-[#2F2925]">{title}</h2><div className="text-sm leading-6 text-[#4D433D]">{children}</div></section>;
}
