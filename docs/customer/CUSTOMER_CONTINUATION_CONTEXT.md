# Customer Continuation Context

## Purpose

This file is the low-token continuation context for all Customer frontend work after the completed `customer/final-qa` branch.

Agents should read this file first, then only the specific command section named in `CUSTOMER_CONTINUATION_COMMANDS.md`.

## Approved baseline

- Repository: `abdelrhmanSobhy/weAR`
- Required base branch: `customer/final-qa`
- Approved baseline commit at planning time: `1bc790d405e0f0ce83468d918fedfd4e0e986bfb`
- Final PR to `main`: PR #13, intentionally left open and not merged.
- Existing verification:
  - `npm ci` passed
  - `npm run lint` passed
  - `npm run build` passed
  - `npm test`: 34 files, 143 tests passed
  - `git diff --check` passed

## Completed Customer scope

- Customer login and two-step signup
- Customer role guards and nested storefront routing
- Responsive Customer layout, header, navigation and footer
- Home, Shop and Product Details
- Favorites
- Account and Addresses
- Avatar overview, manual measurements, photo extraction and history
- Flat Avatar/API response normalization
- Try-on 2D state flow
- Progressive lazy-loaded 3D viewer with 2D fallback
- Local persisted Cart
- Frontend-only Checkout boundary
- Final route and regression audit

## Non-negotiable rules

1. Do not work on `main`.
2. Build every new branch from the latest approved `customer/final-qa` or its latest approved continuation branch.
3. Do not invent backend endpoints, payload fields, order IDs, payment success, or server persistence.
4. Customer identity must come from authenticated state, never from form input or URL parameters.
5. Reuse `apiClient`; do not duplicate authorization injection.
6. Preserve retailer/admin/auth behavior.
7. Keep 2D Try-on as the mandatory fallback.
8. Keep `@google/model-viewer` lazy-loaded.
9. Do not run `npm audit fix` automatically.
10. Do not claim manual verification for flows blocked by missing backend data.

## Known live-testing limitation

The real journey:

`Product Details -> Try On -> generated 2D/3D result -> Add to Cart`

has not been manually verified because reliable Customer catalog products and backend-compatible product IDs are not currently available.

Opening `/customer/try-on` without a product and seeing `No product selected` is expected behavior.

## Current technical debt

- Customer auth refresh path may not match the documented Customer refresh endpoint.
- Customer forgot/reset password, Google login and backend logout are not integrated.
- Compare and products-by-model-IDs adapters exist but are not used by UI.
- Try-on history adapters exist but are not used by a page.
- Saved Outfits CRUD is not implemented.
- Static About, Shipping/Returns and Blog pages are not implemented.
- Orders/payment remain blocked by missing Customer backend contracts.
- Main and 3D chunks still trigger Vite size warnings.
- Existing dependency audit reports 17 vulnerabilities: 4 moderate, 12 high, 1 critical.
