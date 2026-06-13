import { EmptyState } from "@/features/customer/components/product/EmptyState";
import { ProductCard } from "@/features/customer/components/product/ProductCard";
import { ProductCardSkeleton } from "@/features/customer/components/product/ProductCardSkeleton";
import type { CustomerProduct } from "@/features/customer/types/catalog";

interface ProductGridProps {
  products?: CustomerProduct[];
  isLoading?: boolean;
  onToggleFavorite?: (productId: string) => void;
  onToggleCompare?: (productId: string) => void;
  compareSelectedIds?: string[];
  isCompareFull?: boolean;
}

export function ProductGrid({
  products = [],
  isLoading = false,
  onToggleFavorite,
  onToggleCompare,
  compareSelectedIds = [],
  isCompareFull = false,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title="No products yet"
        description="Customer catalog products will appear here when the backend returns them."
      />
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onToggleFavorite={onToggleFavorite}
          onToggleCompare={onToggleCompare}
          isCompareSelected={compareSelectedIds.includes(product.id)}
          isCompareFull={isCompareFull}
        />
      ))}
    </div>
  );
}
