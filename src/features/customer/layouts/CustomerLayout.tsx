import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FolderOpen,
  Heart,
  Home,
  Layers,
  Menu,
  Search,
  Shirt,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  User,
  Wand2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { useCartStore } from "@/features/customer/cart/useCartStore";
import { computeItemCount } from "@/features/customer/cart/types/cart";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import { customerAuthApi } from "@/features/customer/api/customerAuth.api";
import { cn } from "@/lib/utils";

const CUSTOMER_NAV_ITEMS = [
  { label: "Home", to: CUSTOMER_ROUTES.home, icon: Home },
  { label: "Shop", to: CUSTOMER_ROUTES.shop, icon: Store },
  { label: "Try On", to: CUSTOMER_ROUTES.tryOn, icon: Shirt },
  { label: "History", to: CUSTOMER_ROUTES.tryOnHistory, icon: Sparkles },
  { label: "Outfits", to: CUSTOMER_ROUTES.outfits, icon: Layers },
  { label: "AI Style", to: CUSTOMER_ROUTES.aiSuggestions, icon: Wand2 },
  { label: "Wardrobe", to: CUSTOMER_ROUTES.wardrobeCollections, icon: FolderOpen },
  { label: "Favorites", to: CUSTOMER_ROUTES.favorites, icon: Heart },
  { label: "Account", to: CUSTOMER_ROUTES.account, icon: User },
] as const;

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors",
    customerTheme.focusRing,
    isActive
      ? "bg-[#F4EDE7] text-[#A37E6B]"
      : "text-[#4D433D] hover:bg-[#F4EDE7] hover:text-[#A37E6B]",
  );

export function CustomerLayout() {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const cartItems = useCartStore((s) => s.items);
  const cartCount = computeItemCount(cartItems);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const signOut = async () => {
    try {
      await customerAuthApi.logout();
    } catch {
      // Local cleanup is required even when backend revocation is unavailable.
    } finally {
      logout();
      navigate(CUSTOMER_ROUTES.login, { replace: true });
    }
  };

  return (
    <div className={`min-h-screen ${customerTheme.page}`}>
      <div className="bg-[#A37E6B] px-4 py-2 text-center text-sm font-medium text-white">
        <Truck className="mr-2 inline h-4 w-4" aria-hidden="true" />
        Free shipping on curated wardrobe staples this week
      </div>

      <header className="sticky top-0 z-40 border-b border-[#E4DCD1] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className={`${customerTheme.container} flex h-20 items-center justify-between gap-4`}>
          <Link
            to={CUSTOMER_ROUTES.home}
            className={cn("flex items-center gap-3 rounded-full", customerTheme.focusRing)}
            onClick={closeMobileMenu}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F4EDE7] text-[#A37E6B]">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-xl font-bold tracking-tight text-[#2F2925]">
                weAR
              </span>
              <span className="block text-xs font-medium uppercase tracking-[0.18em] text-[#A37E6B]">
                Storefront
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Customer navigation">
            {CUSTOMER_NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("hidden rounded-full text-[#4D433D] hover:bg-[#F4EDE7] hover:text-[#A37E6B] sm:inline-flex", customerTheme.focusRing)}
              aria-label="Search products"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              className={cn("relative rounded-full border-[#E4DCD1] bg-white text-[#4D433D] hover:bg-[#F4EDE7] hover:text-[#A37E6B]", customerTheme.focusRing)}
              aria-label={cartCount > 0 ? `Open cart, ${cartCount} item${cartCount === 1 ? "" : "s"}` : "Open cart"}
              onClick={() => navigate(CUSTOMER_ROUTES.cart)}
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#A37E6B] text-[10px] font-bold text-white"
                  aria-hidden="true"
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={cn("hidden rounded-full text-[#4D433D] hover:bg-[#F4EDE7] hover:text-[#A37E6B] xl:inline-flex", customerTheme.focusRing)}
              onClick={signOut}
            >
              Sign out
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("rounded-full text-[#4D433D] hover:bg-[#F4EDE7] hover:text-[#A37E6B] lg:hidden", customerTheme.focusRing)}
              aria-label={isMobileMenuOpen ? "Close customer menu" : "Open customer menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="customer-mobile-menu"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div id="customer-mobile-menu" className="border-t border-[#E4DCD1] bg-white lg:hidden">
            <nav className={`${customerTheme.container} flex flex-col gap-2 py-4`} aria-label="Mobile customer navigation">
              {CUSTOMER_NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={navLinkClass}
                  onClick={closeMobileMenu}
                >
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </NavLink>
              ))}
              <Button
                type="button"
                variant="ghost"
                className={cn("justify-start rounded-full text-[#4D433D] hover:bg-[#F4EDE7] hover:text-[#A37E6B]", customerTheme.focusRing)}
                onClick={() => {
                  void signOut();
                  closeMobileMenu();
                }}
              >
                <User className="h-4 w-4" aria-hidden="true" />
                Sign out
              </Button>
            </nav>
          </div>
        )}
      </header>

      <main className={`${customerTheme.container} ${customerTheme.sectionY}`}>
        <Outlet />
      </main>

      <footer className="border-t border-[#E4DCD1] bg-white" aria-label="Customer footer">
        <div className={`${customerTheme.container} grid gap-6 py-8 md:grid-cols-[1.5fr_1fr_1fr]`}>
          <div>
            <p className="text-lg font-bold text-[#2F2925]">weAR Customer</p>
            <p className="mt-2 max-w-md text-sm text-[#6F625B]">
              A reusable storefront shell for upcoming catalog, try-on, and account experiences.
            </p>
          </div>
          <nav aria-label="Customer footer navigation" className="grid gap-2 text-sm">
            {CUSTOMER_NAV_ITEMS.slice(0, 3).map((item) => (
              <Link key={item.to} to={item.to} className={cn("text-[#6F625B] hover:text-[#A37E6B]", customerTheme.focusRing)}>
                {item.label}
              </Link>
            ))}
          </nav>
          <nav aria-label="Customer footer support links" className="grid gap-2 text-sm">
            <p className="font-medium text-[#2F2925]">Support</p>
            <Link to={CUSTOMER_ROUTES.about} className={cn("text-[#6F625B] hover:text-[#A37E6B]", customerTheme.focusRing)}>About</Link>
            <Link to={CUSTOMER_ROUTES.shippingReturns} className={cn("text-[#6F625B] hover:text-[#A37E6B]", customerTheme.focusRing)}>Shipping &amp; Returns</Link>
            <Link to={CUSTOMER_ROUTES.blog} className={cn("text-[#6F625B] hover:text-[#A37E6B]", customerTheme.focusRing)}>Blog</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
