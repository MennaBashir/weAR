import { BarChart2, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PriceDisplay } from "@/features/customer/components/product/PriceDisplay";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import type { CustomerProduct } from "@/features/customer/types/catalog";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: CustomerProduct;
  onToggleFavorite?: (productId: string) => void;
  isFavoriteLoading?: boolean;
  onToggleCompare?: (productId: string) => void;
  isCompareSelected?: boolean;
  isCompareFull?: boolean;
}

const getProductImage = (product: CustomerProduct): string | null =>
  product.primaryImageUrl ?? product.imageUrl ?? product.images?.find((image) => image.isPrimary)?.url ?? product.images?.[0]?.url ?? null;

const getDiscountPercentage = (product: CustomerProduct): number | null => {
  if (
    typeof product.discountedPrice !== "number" ||
    product.discountedPrice <= 0 ||
    product.discountedPrice >= product.price
  ) {
    return null;
  }

  return Math.round(((product.price - product.discountedPrice) / product.price) * 100);
};

export function ProductCard({
  product,
  onToggleFavorite,
  isFavoriteLoading = false,
  onToggleCompare,
  isCompareSelected = false,
  isCompareFull = false,
}: ProductCardProps) {
  const imageSrc = getProductImage(product);
  const discountPercentage = getDiscountPercentage(product);
  const productPath = CUSTOMER_ROUTES.productDetails(product.id);

  return (
    <article className={`${customerTheme.card} group overflow-hidden transition-transform hover:-translate-y-0.5`}>
      <div className="relative aspect-[4/5] overflow-hidden bg-[#F4EDE7]">
        <Link
          to={productPath}
          className={cn("block h-full w-full", customerTheme.focusRing)}
          aria-label={`View ${product.name}`}
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm font-medium text-[#A37E6B]">
              Image coming soon
            </div>
          )}
        </Link>

        {discountPercentage && (
          <span className="absolute left-3 top-3 rounded-full bg-[#A37E6B] px-3 py-1 text-xs font-semibold text-white">
            {discountPercentage}% off
          </span>
        )}

        <div className="absolute right-3 top-3 flex flex-col gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("rounded-full bg-white/90 text-[#A37E6B] shadow-sm hover:bg-white", customerTheme.focusRing)}
            aria-label={product.isFavorite ? `Remove ${product.name} from favorites` : `Add ${product.name} to favorites`}
            disabled={isFavoriteLoading || !onToggleFavorite}
            onClick={() => onToggleFavorite?.(product.id)}
          >
            <Heart
              className={cn("h-5 w-5", product.isFavorite && "fill-current")}
              aria-hidden="true"
            />
          </Button>
          {onToggleCompare && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-full bg-white/90 shadow-sm hover:bg-white",
                isCompareSelected ? "text-[#A37E6B]" : "text-[#6F625B]",
                customerTheme.focusRing,
              )}
              aria-label={isCompareSelected ? `Remove ${product.name} from comparison` : `Add ${product.name} to comparison`}
              aria-pressed={isCompareSelected}
              disabled={!isCompareSelected && isCompareFull}
              onClick={() => onToggleCompare(product.id)}
              title={!isCompareSelected && isCompareFull ? "Comparison is full (max 4)" : undefined}
            >
              <BarChart2 className={cn("h-5 w-5", isCompareSelected && "fill-current")} aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2 p-4">
        {product.brand && (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A37E6B]">
            {product.brand}
          </p>
        )}
        <Link
          to={productPath}
          className={cn("block text-base font-semibold text-[#2F2925] hover:text-[#A37E6B]", customerTheme.focusRing)}
        >
          {product.name}
        </Link>
        <PriceDisplay
          price={product.price}
          discountedPrice={product.discountedPrice}
          currency={product.currency}
        />
      </div>
    </article>
  );
}
