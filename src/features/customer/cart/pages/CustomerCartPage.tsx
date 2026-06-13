import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ImageIcon, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriceDisplay } from "@/features/customer/components/product";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/features/customer/cart/useCartStore";
import { computeSubtotal, computeItemCount } from "@/features/customer/cart/types/cart";

export function CustomerCartPage() {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const navigate = useNavigate();
  const [liveMessage, setLiveMessage] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const subtotal = computeSubtotal(items);
  const itemCount = computeItemCount(items);

  const handleRemove = (productId: string, selectedSize: string | null, selectedColor: string | null, name: string) => {
    removeItem(productId, selectedSize, selectedColor);
    setLiveMessage(`${name} removed from cart.`);
  };

  const handleUpdateQty = (productId: string, selectedSize: string | null, selectedColor: string | null, qty: number) => {
    updateQuantity(productId, selectedSize, selectedColor, qty);
  };

  const handleClearCart = () => {
    if (confirmClear) {
      clearCart();
      setConfirmClear(false);
      setLiveMessage("Cart cleared.");
    } else {
      setConfirmClear(true);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
        <div aria-live="polite" aria-atomic="true" className="sr-only">{liveMessage}</div>
        <ShoppingBag className="h-16 w-16 text-[#A37E6B]" aria-hidden="true" />
        <h1 className="text-3xl font-bold text-[#2F2925]">Your cart is empty</h1>
        <p className="text-[#6F625B]">Browse our catalogue and add items you love.</p>
        <Button asChild className={cn("rounded-full bg-[#A37E6B] text-white hover:bg-[#8F6E5D]", customerTheme.focusRing)}>
          <Link to={CUSTOMER_ROUTES.shop}>Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div aria-live="polite" aria-atomic="true" className="sr-only">{liveMessage}</div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-[#2F2925]">
          Cart
          <span className="ml-2 text-lg font-normal text-[#6F625B]" aria-label={`${itemCount} ${itemCount === 1 ? "item" : "items"} in cart`}>({itemCount} {itemCount === 1 ? "item" : "items"})</span>
        </h1>
        {confirmClear ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#6F625B]">Clear all items?</span>
            <Button type="button" variant="destructive" size="sm" className="rounded-full" onClick={handleClearCart}>Yes, clear</Button>
            <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setConfirmClear(false)}>Cancel</Button>
          </div>
        ) : (
          <Button type="button" variant="ghost" className={cn("rounded-full text-[#6F625B]", customerTheme.focusRing)} onClick={handleClearCart}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear cart
          </Button>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <ul role="list" className="space-y-4">
          {items.map((item) => {
            const effectivePrice = item.discountedPrice ?? item.unitPrice;
            return (
              <li key={`${item.productId}::${item.selectedSize ?? ""}::${item.selectedColor ?? ""}`} className={`${customerTheme.card} flex gap-4 p-4 sm:p-5`}>
                <Link to={item.productRoute} className={cn("shrink-0 rounded-2xl", customerTheme.focusRing)} tabIndex={0} aria-label={`View ${item.productName}`}>
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="h-24 w-20 rounded-2xl object-cover bg-[#F4EDE7]"
                    />
                  ) : (
                    <div className="flex h-24 w-20 items-center justify-center rounded-2xl bg-[#F4EDE7] text-[#A37E6B]">
                      <ImageIcon className="h-8 w-8" aria-hidden="true" />
                    </div>
                  )}
                </Link>

                <div className="flex flex-1 flex-col gap-2 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      {item.brand && <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#A37E6B]">{item.brand}</p>}
                      <Link to={item.productRoute} className={cn("font-semibold text-[#2F2925] hover:text-[#A37E6B]", customerTheme.focusRing)}>
                        {item.productName}
                      </Link>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.productId, item.selectedSize, item.selectedColor, item.productName)}
                      className={cn("shrink-0 text-[#6F625B] hover:text-red-600", customerTheme.focusRing)}
                      aria-label={`Remove ${item.productName} from cart`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-[#6F625B]">
                    {item.selectedColor && <span>Color: <span className="font-medium text-[#4D433D]">{item.selectedColor}</span></span>}
                    {item.selectedSize && <span>Size: <span className="font-medium text-[#4D433D]">{item.selectedSize}</span></span>}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 mt-auto">
                    <div className="flex items-center gap-1 rounded-full border border-[#E4DCD1] bg-[#FAF7F4]">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.productId, item.selectedSize, item.selectedColor, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className={cn("flex h-8 w-8 items-center justify-center rounded-full disabled:opacity-40", customerTheme.focusRing)}
                        aria-label={`Decrease quantity of ${item.productName}`}
                      >
                        <Minus className="h-3 w-3" aria-hidden="true" />
                      </button>
                      <span className="min-w-[2rem] text-center text-sm font-semibold" aria-label={`Quantity: ${item.quantity}`}>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.productId, item.selectedSize, item.selectedColor, item.quantity + 1)}
                        disabled={item.quantity >= 99}
                        className={cn("flex h-8 w-8 items-center justify-center rounded-full disabled:opacity-40", customerTheme.focusRing)}
                        aria-label={`Increase quantity of ${item.productName}`}
                      >
                        <Plus className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="text-lg">
                      <PriceDisplay price={effectivePrice * item.quantity} discountedPrice={null} currency="USD" />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className={`${customerTheme.card} h-fit space-y-5 p-6`} aria-label="Cart summary">
          <h2 className="text-xl font-bold text-[#2F2925]">Order summary</h2>

          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-[#6F625B]">Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})</dt>
              <dd className="font-semibold text-[#2F2925]">
                <PriceDisplay price={subtotal} discountedPrice={null} currency="USD" />
              </dd>
            </div>
            <div className="flex justify-between border-t border-[#E4DCD1] pt-3">
              <dt className="font-bold text-[#2F2925]">Total</dt>
              <dd className="text-lg font-bold text-[#2F2925]">
                <PriceDisplay price={subtotal} discountedPrice={null} currency="USD" />
              </dd>
            </div>
          </dl>

          <Button
            type="button"
            className={cn("w-full rounded-full bg-[#A37E6B] text-white hover:bg-[#8F6E5D]", customerTheme.focusRing)}
            onClick={() => navigate(CUSTOMER_ROUTES.checkout)}
          >
            Proceed to Checkout
          </Button>

          <Button asChild variant="outline" className={cn("w-full rounded-full", customerTheme.focusRing)}>
            <Link to={CUSTOMER_ROUTES.shop}>Continue Shopping</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
