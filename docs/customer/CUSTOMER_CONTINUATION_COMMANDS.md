# Low-Token Customer Continuation Commands

Use one command per agent conversation. Do not resend PDFs or Swagger. The agent must read:

1. `docs/customer/CUSTOMER_CONTINUATION_CONTEXT.md`
2. The named stage in `CUSTOMER_CONTINUATION_ROADMAP.md`
3. The relevant section in `CUSTOMER_ENDPOINT_COVERAGE.md`
4. Only the existing source files needed for that stage

## Command 12 — auth/session completion

```text
Work in abdelrhmanSobhy/weAR.

Required base: customer/final-qa.
Create or use branch customer/auth-completion.
Do not work on main.

Read:
- docs/customer/CUSTOMER_CONTINUATION_CONTEXT.md
- Stage 12 in CUSTOMER_CONTINUATION_ROADMAP.md
- Authentication in CUSTOMER_ENDPOINT_COVERAGE.md
- current customerAuth.api.ts, axios.ts, auth store, auth routes/pages/tests

First audit deployed/Swagger contracts for:
- POST /api/customer/auth/refresh
- POST /api/customer/auth/logout
- POST /api/customer/auth/forgot-password
- POST /api/customer/auth/reset-password
- POST /api/customer/auth/login/google

Implement in this order:
1. Correct role-aware Customer refresh behavior without breaking Retailer refresh.
2. Backend logout revocation with guaranteed local cleanup.
3. Customer forgot-password OTP request.
4. Customer reset-password OTP flow.
5. Google login only if runtime config and deployed response contract are confirmed; otherwise document as blocked.

Do not invent fields or reuse Retailer-only payloads without tests.
Add endpoint, adapter, route, form validation, redirect and refresh-concurrency tests.
Run npm ci, lint, build, tests and git diff --check.
Create a PR targeting customer/final-qa.
Stop after the report.
```

## Command 13 — deployed catalog and real Try-on contract validation

```text
Continue from the approved auth-completion branch, or branch customer/backend-contract-validation from the latest approved continuation head.

Read:
- CUSTOMER_CONTINUATION_CONTEXT.md
- Stage 13 in CUSTOMER_CONTINUATION_ROADMAP.md
- Catalog, Avatar and Try-on rows in CUSTOMER_ENDPOINT_COVERAGE.md
- CUSTOMER_QA_NOTES.md

This is contract-validation work, not a redesign.

Audit deployed responses for:
- products list/detail
- categories/offers
- similar/complementary products
- size recommendation
- Try-on session creation/result

Use authenticated test data and at least one real product ID when available.
Fix only confirmed response/payload mismatches in adapters/types.
Do not add production fixtures to conceal missing backend data.
Preserve the no-product Try-on state.

Add regression tests from captured response shapes.
Update CUSTOMER_QA_NOTES.md with:
- manually verified flows
- blocked flows
- exact backend mismatches
- valid test product prerequisites

Run full checks.
Create a PR targeting the latest approved continuation branch.
Stop after the report.
```

## Command 14 — Try-on history

```text
Create branch customer/try-on-history from the latest approved continuation branch.

Read:
- CUSTOMER_CONTINUATION_CONTEXT.md
- Stage 14 in CUSTOMER_CONTINUATION_ROADMAP.md
- Try-on section in CUSTOMER_ENDPOINT_COVERAGE.md
- existing tryOn.api.ts and tryOn.queries.ts

Consume the existing endpoints:
- GET /api/customers/{customerId}/try-on/sessions
- GET /api/customers/{customerId}/try-on/sessions/{sessionId}
- GET /api/customers/{customerId}/products/{productId}/sessions

Implement /customer/try-on/history.
Add session detail/reopen only if response fields are verified.
Support loading, empty, processing, completed and failed states.
Use authenticated customer ID only.
Do not alter the stable 2D/3D creation flow.
Add routes, navigation and focused tests.
Run full checks and create a PR to the latest approved continuation branch.
```

## Command 15 — product comparison

```text
Create branch customer/product-comparison from the latest approved continuation branch.

Read:
- CUSTOMER_CONTINUATION_CONTEXT.md
- Stage 15 in CUSTOMER_CONTINUATION_ROADMAP.md
- Catalog section in CUSTOMER_ENDPOINT_COVERAGE.md
- existing catalog adapter/types/product primitives

Implement local comparison selection for 2–4 products and /customer/compare.
Consume the existing POST /api/catalog/products/compare adapter.
Expose consistent add/remove compare controls on supported product cards/details.
Do not create a comparison backend or persist unverified server state.
Handle missing values and unavailable products.
Add selection, limit, request, empty/error and responsive route tests.
Run full checks and create a PR.
```

## Command 16 — saved outfits

```text
Create branch customer/saved-outfits from the latest approved continuation branch after backend contract validation.

Read:
- CUSTOMER_CONTINUATION_CONTEXT.md
- Stage 16 in CUSTOMER_CONTINUATION_ROADMAP.md
- Outfits section in CUSTOMER_ENDPOINT_COVERAGE.md
- current recommendations adapter and product primitives

Implement typed adapters/hooks for documented Outfits CRUD:
- list/create
- detail/update/delete

Implement /customer/outfits and any stable detail route.
Use products-by-model-ids only when the verified outfit response requires it.
Add save-from-Try-on only if the create payload is confirmed.
Do not guess payload fields.
Add adapter, cache invalidation, CRUD, empty/error and auth-ID tests.
Run full checks and create a PR.
```

## Command 17 — static pages and blocked experiences

```text
Create branch customer/static-pages from the latest approved continuation branch.

Read:
- CUSTOMER_CONTINUATION_CONTEXT.md
- Stage 17 in CUSTOMER_CONTINUATION_ROADMAP.md
- approved design reference sections

Implement:
- /customer/about
- /customer/shipping-returns
- /customer/blog with isolated fixtures/static content

Add local payment-result states only if required by the approved design.
Orders/tracking must remain explicitly blocked or fixture-only because no Customer backend contract is confirmed.
Never fabricate order IDs, payment success, shipment events or API calls.
Add route/accessibility tests and run full checks.
```

## Command 18 — final visual/accessibility polish

```text
Create branch customer/release-polish from the latest approved continuation branch.

Read:
- CUSTOMER_CONTINUATION_CONTEXT.md
- Stage 18 in CUSTOMER_CONTINUATION_ROADMAP.md
- CUSTOMER_DESIGN_REFERENCE.md
- CUSTOMER_QA_NOTES.md

Perform a route-by-route desktop/mobile visual and accessibility audit.
Capture screenshots where tooling permits.
Fix only proven consistency/accessibility defects.
Standardize loading, empty, error, dialogs and focus behavior.
Remove dead placeholders only after repository-wide reference checks.
Run route smoke tests and full checks.
Update:
- CUSTOMER_FEATURE_MATRIX.md
- CUSTOMER_QA_NOTES.md
- CUSTOMER_ENDPOINT_COVERAGE.md

Report completed, partial, blocked and deferred items.
Create a PR to the latest approved continuation branch.
```

## Compact continuation prompt

```text
Continue the approved Customer continuation plan on the current branch.
Read docs/customer/CUSTOMER_CONTINUATION_CONTEXT.md and only the stage/endpoint sections named in Command NN of CUSTOMER_CONTINUATION_COMMANDS.md.
Review the previous approved commit and report, implement only this command, run all required checks, create the correctly based PR, and stop with changed-files/tests/blockers.
```
