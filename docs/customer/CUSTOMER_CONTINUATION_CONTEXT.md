# Customer Continuation Context

## Purpose

Low-token context for Customer frontend continuation. Read this file first, then the named command and endpoint sections.

## Approved baseline

- Repository: `abdelrhmanSobhy/weAR`
- Required base: latest `customer/final-qa`
- Final PR to `main`: PR #13 remains intentionally open
- Latest verified baseline before this documentation refresh:
  - `npm ci` passed
  - `npm run lint` passed
  - `npm run build` passed
  - `npm test`: 43 files, 238 tests passed
  - `git diff --check` passed

## Completed Customer scope

- Login, two-step signup and protected routing
- Role-aware refresh and backend logout attempt
- Forgot/reset password
- Responsive Customer layout
- Home, Shop, Product Details and response normalization
- Favorites
- Product Comparison
- Account and Addresses
- Avatar overview/manual/photo/history UI
- 2D Try-on, lazy 3D Avatar view and Try-on History
- Saved Outfits supported scope: list/create/delete/Favorites recovery
- Local Cart and frontend-only Checkout
- About, Shipping & Returns and Blog
- Route/regression audit

## Source precedence

1. Verified deployed behavior in QA notes
2. Current Swagger/OpenAPI
3. Backend integration guide
4. Older repository documentation

## Non-negotiable rules

1. Do not work on `main`.
2. Use latest approved continuation base.
3. Do not invent endpoints, fields, IDs, payment/order success or persistence.
4. Customer identity comes from authenticated state.
5. Reuse `apiClient`.
6. Preserve Retailer/Admin behavior.
7. Keep 2D Try-on fallback.
8. Keep `@google/model-viewer` lazy.
9. Do not run `npm audit fix` automatically.
10. Record documented contract and runtime defect separately.

## Current priority

**Command 18 — Avatar and Try-on Swagger contract alignment.**

## Known backend defects and blockers

- Existing Outfit detail GET returns 500.
- Existing Outfit update PUT returns 500.
- Deleted/missing Outfit detail correctly returns 404.
- Full product-driven Try-on remains pending real end-to-end backend verification.
- Google login remains configuration/contract gated.
- Fit Feedback is blocked until real order IDs exist.
- Persistent Customer cart, checkout submission, orders, payment and tracking are not confirmed.
- Vite main and 3D chunks remain large.
- Dependency audit reports 17 vulnerabilities: 4 moderate, 12 high, 1 critical.
