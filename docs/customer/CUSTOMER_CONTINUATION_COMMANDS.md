# Low-Token Customer Continuation Commands

Use one command per agent conversation. The agent must read:

1. `docs/customer/CUSTOMER_CONTINUATION_CONTEXT.md`
2. The named stage in `CUSTOMER_CONTINUATION_ROADMAP.md`
3. The relevant rows in `CUSTOMER_ENDPOINT_COVERAGE.md`
4. `docs/customer/CUSTOMER_BACKEND_CONTRACT_SNAPSHOT.md`
5. Only the source files required for that command

## Source precedence

1. Verified deployed behavior recorded in QA notes
2. Current Swagger/OpenAPI
3. Backend integration guide
4. Older repository documentation

When runtime behavior and Swagger differ, document both. Do not invent a reconciliation.

## ~~Command 12 — Customer auth/session completion~~ ✅ Complete

Implemented role-aware Customer refresh, backend logout attempt with guaranteed local cleanup, forgot/reset password flows, routes and tests. Google login remains blocked until runtime configuration and deployed response handling are confirmed.

## ~~Command 13 — Catalog and backend contract audit~~ ✅ Complete as audit

The audit command completed. The agent environment could not reach Render, so the real product-driven Try-on journey was not manually verified there. Later local API tests and the updated Swagger supersede parts of that audit.

## ~~Command 14 — Try-on History~~ ✅ Complete

Implemented `/customer/try-on/history`. Pagination and response-field alignment remain part of Command 18.

## ~~Command 15 — Product Comparison~~ ✅ Complete

Implemented local 2–4 product selection, `/customer/compare`, compare API usage and Shop/Product Details integration.

## ~~Command 16 — Saved Outfits~~ ✅ Complete — supported backend scope

Implemented `/customer/outfits`, paginated list, create, delete, explicit Favorites prerequisite recovery, UI states, authenticated identity and cache invalidation.

Backend-blocked:

- existing Outfit detail GET returns `500 INTERNAL_ERROR`
- existing Outfit update PUT returns `500 INTERNAL_ERROR`
- missing/deleted Outfit detail correctly returns `404 NOT_FOUND`

No fake detail or edit UI was added.

## ~~Command 17 — Static Pages~~ ✅ Complete

Implemented `/customer/about`, `/customer/shipping-returns` and `/customer/blog`.

## Command 18 — Avatar and Try-on Swagger contract alignment — P0

```text
Work in abdelrhmanSobhy/weAR.

Required base:
latest customer/final-qa after the documentation refresh PR.

Required branch:
customer/avatar-tryon-contract-alignment

Read:
- docs/customer/CUSTOMER_CONTINUATION_CONTEXT.md
- Stage 18 in docs/customer/CUSTOMER_CONTINUATION_ROADMAP.md
- Avatar and Try-on rows in docs/customer/CUSTOMER_ENDPOINT_COVERAGE.md
- docs/customer/CUSTOMER_BACKEND_CONTRACT_SNAPSHOT.md
- docs/customer/CUSTOMER_QA_NOTES.md
- docs/customer/TRY_ON_FLOW.md
- current profileAvatar and try-on adapters, hooks, pages and tests

Goal:
Align existing Avatar and Try-on UI with current Swagger without redesigning stable flows.

Avatar:

1. POST /api/customers/{customerId}/avatar
   - root measurement fields
   - documented source field
   - no { measurements } wrapper
   - response.data is Avatar UUID string
   - invalidate/refetch active Avatar

2. PATCH /api/customers/{customerId}/avatar/measurements
   - include avatarId
   - root measurement fields
   - source when required
   - HTTP 204, no JSON parsing

3. DELETE /api/customers/{customerId}/avatar
   - send { avatarId } using Axios config.data
   - HTTP 204, no JSON parsing

4. POST /api/customers/{customerId}/avatar/extract-from-image
   - multipart names: ImageFile and HeightCm
   - preserve request-specific "Content-Type": undefined
   - do not manually set the boundary
   - preserve flat-response and shoulderWidthCm normalization

5. GET /api/customers/{customerId}/avatar/history
   - paginated envelope
   - preserve pagination metadata
   - safely parse measurementDataJson
   - malformed JSON must not crash UI

6. Size recommendation:
   normalize recommendedSize, confidenceScore and justification in the adapter.

Try-on:

1. Customer ID comes from auth and appears in URL only.
2. POST /api/customers/{customerId}/try-on body:
   {
     productId: UUID,
     sessionType: numeric enum,
     avatarId?: UUID | null
   }
3. Do not invent customerId or retailerId in the body.
4. Replace stale string session types where Swagger requires numeric enums.
5. Normalize status, resultImageUrl, recommendedSize, confidenceScore and durationSeconds.
6. Keep 2D as mandatory fallback.
7. Normalize paginated session history and documented fields.
8. Use active Avatar GLB unless a distinct Try-on model is explicitly returned.
9. Do not claim the Avatar GLB contains the garment without backend confirmation.
10. Preserve lazy model-viewer, URL validation and error boundary.

Required tests:
- manual root payload
- create UUID response
- update avatarId and 204
- DELETE config.data and 204
- multipart field names
- history pagination and safe JSON parsing
- size recommendation mapping
- numeric session type and optional avatarId
- no invented customerId/retailerId in body
- result normalization
- session pagination
- active Avatar GLB source
- 2D fallback and no-product state

Run:
npm ci
npm run lint
npm run build
npm test
git diff --check

Create a PR to customer/final-qa and stop after the report.
```

## Command 19 — AI Outfit Suggestions and saving — P1/P2 — COMPLETE

```text
Implemented on branch claude/tender-goodall-hv68c3, PR #24, base customer/ai-outfit-suggestions.

Endpoints integrated (Swagger-only — not deployed-verified):
- POST /api/customer/wardrobe/suggestions
- POST /api/customer/wardrobe/suggestions/save
- POST /api/catalog/products/by-model-ids (conditional — only when modelId present without productId)

Response normalization:
- Supports documented data.suggestions envelope and legacy direct-array shape.
- Aliases: id/suggestionId → suggestionId; outfitName/name → name.
- styleNotes and products[].reasoning preserved.

Save constraints enforced:
- All products must have resolved productId and numeric slotType.
- Partial-outfit save not permitted.
- INVALID_OUTFIT_ITEMS handled with explicit guidance and link to Favorites; no auto-mutation.
- Strict save response: only non-empty string accepted; throws SuggestionApiError otherwise.

UI:
- Generate disabled when all inputs empty; trim and deduplicate inputs.
- Loading, error, empty, success states.
- Link to /customer/outfits after save success.
- Form values preserved on generation failure.

Tests: 46 files, 294 tests after Command 19 (before Command 19 baseline: 43 files, 241 tests).

Unconfirmed (runtime-unconfirmed, documented as blockers):
- Whether any generate field is required.
- Whether Favorites prerequisite applies to save.
```

## Command 20 — Wardrobe Collections — P2

```text
Create customer/wardrobe-collections from the latest approved continuation base.

Implement only Swagger-confirmed list/create/rename/delete collection operations and list/add/remove collection items. Use authenticated Customer identity, typed adapters/query keys, loading/error/empty states, destructive confirmation and cache invalidation tests. Reuse product/Favorites/Outfits logic. Do not invent fields.
```

## Command 21 — Fit Feedback — P2/P3, blocked by real order data

```text
Do not implement production UI until real Customer order or order-item IDs exist. Audit Swagger-confirmed feedback submission, order feedback lookup and product fit statistics. Record the completed-order prerequisite. Never use fake order IDs.
```

## Command 22 — Final visual, accessibility and release polish — P3

```text
Create customer/release-polish. Audit desktop/mobile, keyboard, focus, dialogs, loading, empty and error states across all Customer routes including Compare, Outfits and Try-on History. Capture screenshots where possible, fix proven defects only, keep stable flows, run route smoke tests and full checks, and update Feature Matrix, QA Notes and Endpoint Coverage.
```

## Command 23 — Technical debt and dependency review — P4

```text
Review bundle sizes, route-level splitting, npm vulnerabilities, stale files/adapters, duplicated tests, legacy Customer/Retailer type coupling, the "/login/customer" test warning and visual-regression tooling. Do not run npm audit fix automatically and do not mix feature delivery into this command.
```

## Compact continuation prompt

```text
Read CUSTOMER_CONTINUATION_CONTEXT.md, CUSTOMER_BACKEND_CONTRACT_SNAPSHOT.md and only the stage/endpoint sections named in Command NN. Implement only that command, preserve verified runtime behavior, run required checks, create the correctly based PR, and stop with changed files, tests and blockers.
```
