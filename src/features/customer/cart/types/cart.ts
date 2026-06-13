// CartItem identity is productId + selectedColor + selectedSize
export interface CartItem {
  productId: string;
  productName: string;
  productImage: string | null;
  brand: string | null;
  unitPrice: number;
  discountedPrice: number | null;
  selectedSize: string | null;
  selectedColor: string | null;
  quantity: number;
  productRoute: string;
  tryOnResultImage?: string | null;
}

export interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (
    productId: string,
    selectedSize: string | null,
    selectedColor: string | null,
  ) => void;
  updateQuantity: (
    productId: string,
    selectedSize: string | null,
    selectedColor: string | null,
    quantity: number,
  ) => void;
  clearCart: () => void;
}

export function cartItemKey(
  productId: string,
  selectedSize: string | null,
  selectedColor: string | null,
): string {
  return `${productId}::${selectedSize ?? ""}::${selectedColor ?? ""}`;
}

export function computeSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    const price = item.discountedPrice ?? item.unitPrice;
    return sum + price * item.quantity;
  }, 0);
}

export function computeItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
