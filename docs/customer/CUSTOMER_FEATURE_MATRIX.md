# Customer Feature Matrix

Status is based on the current repository audit, supplied Figma PDF, Swagger and try-on integration notes.

| Domain / screen | Current repo | Backend support | Priority | Planned treatment |
|---|---|---|---:|---|
| Customer login | Implemented | Yes | Must | Audit response parsing, validation, redirects and errors. |
| Customer sign-up steps | Implemented | Yes | Must | Keep two-step flow; test token/profile handling. |
| Customer forgot/reset password | Shared retailer pages only | Yes | Must | Confirm customer contract and create/reuse customer-compatible flow. |
| Customer onboarding page | Exists | Not required by current design | Remove | Remove from normal customer entry routing; retain only if still referenced during migration. |
| Authenticated customer route | `ComingSoonPage` | N/A | Must | Replace with nested `CustomerLayout` and real routes. |
| Store placeholder | Minimal placeholder | N/A | Remove/replace | Replace with real home page. |
| Storefront header/footer | Missing | N/A | Must | Reusable responsive layout. |
| Home | Missing | Catalog/categories/offers | Must | Build Figma page 6 with real catalog data and safe static sections. |
| Shop/catalog | Missing | Yes | Must | Search, sort, filter, pagination, responsive drawer/sidebar. |
| Product card | Missing | Yes | Must | Shared card for home, shop, favorites and recommendations. |
| Product details | Missing | Yes | Must | Details, variants, size recommendation, similar and complementary sections. |
| Product comparison | Missing | Yes | Nice | Compare 2–4 products, local selection state. |
| Favorites/wishlist | Missing | Yes | Must | List, toggle, check state and optimistic rollback. |
| Customer profile | Missing | Yes | Must | Read/update profile, password and delete-account dialogs. |
| Addresses | Missing | Yes | Must | CRUD and default address. |
| Manual avatar creation | Missing | Yes | Must | Shared form for onboarding and account pages. |
| Photo avatar extraction | Missing | Yes | Must | One image + required height, review extracted values and null handling. |
| Avatar detail/history | Missing | Yes | Must | Active avatar, update/delete and measurement history. |
| Size recommendation | Missing | Yes | Must | Product details integration with clear confidence/fallback states. |
| Try-on entry/product/processing | Missing | Yes | Must | Implement reference-image state machine. |
| Try-on 2D result | Missing | Yes | Must, phase 1 | Default stable result path. |
| Try-on 3D GLB viewer | Missing | Yes | Nice, phase 2 | Explicit opt-in lazy load, dynamic import and fallback. |
| GLB local caching | Missing | Client concern | Nice, phase 2 | IndexedDB or service-worker cache keyed by URL after viewer works. |
| Try-on history | Missing | Yes | Nice | Customer session list and session detail. |
| Saved outfits | Missing | Yes | Nice | CRUD after core try-on is stable. |
| Cart | Missing | No confirmed customer cart API | Nice | Typed Zustand/local persistence; label frontend-only. |
| Checkout steps | Missing | Addresses only | Nice | Presentational flow with local cart/address data; no invented payment/order calls. |
| Payment failed state | Missing | No confirmed flow | Nice | Static/local route only. |
| Customer orders/tracking | Missing | No confirmed customer order API | Blocked/Nice | Fixture-backed UI only after must-have work; document backend dependency. |
| Shipping & Returns | Missing | Static | Nice | Static content from design. |
| About | Missing | Static | Nice | Static content from design. |
| Blog | Missing/incomplete | No confirmed API | Nice | Static/fixture-backed cards only. |

## Critical technical findings
1. `router.tsx` currently redirects `/customer` to `/customer/dashboard`, which renders `ComingSoonPage`.
2. `StorePage.tsx` is a centered placeholder and is not wired as the customer storefront.
3. Customer auth stores profile data in a shared retailer-shaped `RetailerProfile`. This is workable temporarily but should be narrowed with customer selectors/types instead of spreading retailer-specific assumptions.
4. `customerAuth.api.ts` has envelope/profile fallbacks including `retailerProfile`; preserve compatibility until backend responses are verified, then simplify with tests.
5. No customer domain query layer or reusable storefront component set exists yet.

## Recommended route map
```text
/customer
  /home
  /shop
  /products/:productId
  /compare
  /favorites
  /avatar
  /avatar/manual
  /avatar/photo
  /try-on
  /try-on/:productId
  /try-on/history
  /outfits
  /account
  /account/addresses
  /cart                 # frontend-only initially
  /checkout             # frontend-only initially
  /orders               # blocked/fixture only
  /orders/:orderId      # blocked/fixture only
  /shipping-returns
  /about
  /blog
```

`/customer` and legacy `/customer/dashboard` should redirect to `/customer/home` after migration.

## Continuation status refresh (2026-06-14)

- Commands 12–17: complete.
- Saved Outfits: list/create/delete complete; detail/update blocked by backend 500.
- Next P0: Avatar and Try-on contract alignment.
- AI Outfit Suggestions: planned Command 19.
- Wardrobe Collections: planned Command 20.
- Fit Feedback: blocked/planned Command 21.
- Final release polish: Command 22.
