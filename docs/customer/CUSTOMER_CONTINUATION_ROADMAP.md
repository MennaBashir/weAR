# Customer Continuation Roadmap

Base continuation work on the latest approved `customer/final-qa`.

## Priority model

- **P0** — contract correctness for active critical flows
- **P1** — high-value backend-supported Customer features
- **P2** — approved functional completion
- **P3** — release polish and conditionally blocked features
- **P4** — deferred technical improvements

## ~~Stage 12 — Customer auth completion~~ ✅ Complete

Role-aware refresh, backend logout attempt, forgot/reset password flows and tests are implemented. Google login remains configuration-gated.

## ~~Stage 13 — Backend contract audit~~ ✅ Complete as audit

The execution environment was blocked from Render. Preserve the historical result, but use later local API tests and current Swagger as newer evidence.

## ~~Stage 14 — Try-on History~~ ✅ Complete

History UI is implemented. Pagination/field alignment is included in Stage 18.

## ~~Stage 15 — Product Comparison~~ ✅ Complete

Local selection, compare route, API use and product controls are implemented.

## ~~Stage 16 — Saved Outfits~~ ✅ Complete — supported scope

Implemented list/create/delete and Favorites recovery. Existing detail and update remain backend defects and are intentionally not exposed as functional UI.

## ~~Stage 17 — Static Pages~~ ✅ Complete

About, Shipping & Returns and Blog are implemented.

## Stage 18 — Avatar and Try-on Swagger contract alignment (P0)

Align manual Avatar create/update/delete payloads, 204 handling, history pagination/JSON parsing, recommendation fields, numeric Try-on session type, optional avatarId, result/session normalization and 3D model semantics.

### Exit criteria

- Active Avatar/Try-on requests match Swagger.
- Auth-derived identity only.
- Existing 2D fallback and no-product state remain.
- Regression tests cover each changed contract.

## Stage 19 — AI Outfit Suggestions and saving (P1/P2)

Integrate Swagger-confirmed suggestion and save endpoints. Resolve model IDs through catalog only when required.

### Exit criteria

- No fabricated suggestion or save state.
- Exact request/response contracts are tested.
- Ambiguous contracts remain blocked.

## Stage 20 — Wardrobe Collections (P2)

Implement collections and item membership operations from Swagger.

### Exit criteria

- Typed adapters, UI states, confirmations and cache invalidation.
- Existing Favorites/Outfits logic is reused.

## Stage 21 — Fit Feedback (P2/P3)

Blocked until real order/order-item identifiers exist.

### Exit criteria

- No fake IDs.
- Submit, order lookup and product statistics use verified contracts.

## Stage 22 — Final visual/accessibility/release polish (P3)

Audit every Customer route on desktop/mobile, keyboard/focus, dialogs and state consistency. Capture screenshots and run route smoke tests.

## Stage 23 — Technical debt (P4)

Bundle analysis, route splitting, dependency vulnerabilities, dead code/adapters, duplicated tests, legacy type coupling, test-harness warning and visual-regression tooling.

## Recommended branch order

```text
customer/final-qa
  -> customer/avatar-tryon-contract-alignment
  -> customer/ai-outfit-suggestions
  -> customer/wardrobe-collections
  -> customer/fit-feedback
  -> customer/release-polish
  -> customer/technical-debt
```
