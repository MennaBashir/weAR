# Customer Continuation Roadmap

Base all continuation work on `customer/final-qa`.

## Priority model

- **P0 — authentication/session correctness**
- **P1 — validate critical shopping and Try-on paths with deployed backend**
- **P2 — approved functional completion**
- **P3 — optional/static/polish**
- **P4 — deferred technical improvements**

## Stage 12 — Customer auth completion (P0)

### Scope

1. Audit the deployed Customer refresh endpoint.
2. Replace or correctly route the current generic `/api/auth/refresh-token` behavior if the Customer contract requires `/api/customer/auth/refresh`.
3. Integrate backend logout/revocation.
4. Implement Customer forgot-password OTP request.
5. Implement Customer reset-password OTP flow.
6. Add Google login only if configuration and deployed contract are available.

### Exit criteria

- Expired Customer token refresh is verified.
- Failed refresh logs out to `/login/customer`.
- Logout attempts backend revocation, then always clears local state.
- Forgot/reset password works with validation and error handling.
- Retailer refresh behavior is unchanged.

## Stage 13 — Backend catalog contract and real-flow verification (P1)

### Scope

1. Compare Swagger/deployed responses with current catalog types.
2. Verify products list, pagination, categories and offers.
3. Obtain at least one valid Customer product ID with images and variants.
4. Verify Product Details.
5. Verify size recommendation.
6. Verify complementary and similar products.
7. Execute the real Try-on flow with a valid product.
8. Record request/response mismatches in QA notes.

### Exit criteria

- At least one product-driven end-to-end path is manually verified.
- No production fixture is introduced to hide missing backend data.
- Product filters and response normalization match deployed behavior.

## Stage 14 — Try-on history (P2)

### Scope

- Add `/customer/try-on/history`.
- Add session detail/reopen support only if the response contract is stable.
- Reuse existing session hooks.
- Handle empty, processing, completed and failed sessions.
- Link products when IDs remain valid.

### Exit criteria

- Existing adapters are consumed by UI.
- No new endpoints are invented.
- 2D/3D fallback remains unchanged.

## Stage 15 — Product comparison (P2)

### Scope

- Local selection of 2–4 products.
- `/customer/compare`.
- Use existing compare adapter.
- Add/remove/clear comparison actions.
- Responsive comparison table/cards.
- Safe handling of unavailable fields/products.

### Exit criteria

- Compare endpoint is consumed by UI.
- Selection persists only if useful; do not add backend storage.
- Shop/Product Cards expose a consistent compare action.

## Stage 16 — Saved outfits (P2)

### Scope

- Add typed Outfits adapters, query keys and hooks.
- Add `/customer/outfits`.
- Implement list/create/detail/update/delete.
- Reuse product cards and `by-model-ids` only if the backend outfit response requires model-ID resolution.
- Integrate saving from completed Try-on only if payload contract is confirmed.

### Exit criteria

- Full documented CRUD has tests.
- Empty complementary response still hides silently.
- No guessed payload fields.

## Stage 17 — Static and blocked UI completion (P3)

### Scope

- `/customer/about`
- `/customer/shipping-returns`
- `/customer/blog` using explicit fixtures/static content
- Local payment-result states only if still required by design
- Orders/tracking only as an explicit blocked/fixture experience, never as fake backend success

### Exit criteria

- Static pages match design structure.
- Fixture content is clearly isolated.
- No fake order, payment or tracking claims.

## Stage 18 — Visual, accessibility and release polish (P3)

### Scope

- Desktop/mobile comparison against approved PDF.
- Keyboard and focus audit.
- Loading, empty and error consistency.
- Replace native confirmations with shared dialogs where practical.
- Route smoke tests.
- Remove dead placeholders only after reference search.
- Update Feature Matrix and QA Notes to current status.

### Exit criteria

- Screenshots captured for all important routes.
- No critical accessibility defects.
- Docs reflect actual implementation.

## Stage 19 — technical debt (P4)

Perform separately from feature delivery:

- Analyze main bundle and 3D chunk splitting.
- Review npm vulnerabilities package-by-package.
- Do not run automatic breaking upgrades.
- Consider GLB caching only after stable real 3D sessions.
- Decouple Customer auth profile types from retailer-shaped legacy types.
- Add visual regression tooling if the project will continue long-term.

## Recommended branch order

```text
customer/final-qa
  -> customer/auth-completion
  -> customer/backend-contract-validation
  -> customer/try-on-history
  -> customer/product-comparison
  -> customer/saved-outfits
  -> customer/static-pages
  -> customer/release-polish
```

Stages 14 and 15 may run in parallel only after Stage 13 is approved. Saved Outfits should follow deployed-contract validation.
