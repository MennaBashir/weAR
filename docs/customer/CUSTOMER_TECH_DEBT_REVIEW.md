# Customer Technical Debt Review

## Baseline

- **Branch**: `claude/sweet-goodall-8gio6o` (tracking `origin/customer/final-qa`)
- **Starting commit**: `678abcd9507b6b9a8707467a58c80bc7d75911dc`
- **HEAD at audit time**: `678abcd9507b6b9a8707467a58c80bc7d75911dc`
- **npm ci**: passed (17 vulnerabilities flagged — 4 moderate, 12 high, 1 critical)
- **lint**: FAIL — `npm run lint` fails with `Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@eslint/js'`. ESLint 10.1.0 references `@eslint/js` in `eslint.config.js` but it is absent from `node_modules` after a clean `npm ci`. This is a pre-existing condition not introduced by this branch. No lint gate is currently operational.
- **build**: `vite build` succeeds; 2 chunks exceed 500 kB warning threshold: `TryOn3DViewer-*.js` (1,039 kB gzip 297 kB) and `index-*.js` (1,362 kB gzip 387 kB)
- **tests (full suite)**: 56 test files run; **1 file failed** (`RequireRole.test.tsx` — unhandled rejection from react-router navigation in guard tests, pre-existing and unrelated to customer feature code); 437/438 tests pass
- **tests (customer only)**: **40 files / 403 tests, all pass**
- **git diff --check**: clean (no whitespace errors)
- **npm audit summary**: 17 vulnerabilities total
  - 1 critical: `vitest >=4.0.0 <4.1.0` — arbitrary file read/execute via Vitest UI (dev-only, no production exposure)
  - 12 high: `react-router` (RCE via turbo-stream, open redirect, XSS, DoS), `hono` (multiple cookie/path/routing issues), `esbuild` (file read on Windows dev server), `undici` (WebSocket/HTTP smuggling), `@hono/node-server` (auth bypass), `fast-uri` (path traversal), `flatted` (ReDoS/prototype pollution), `path-to-regexp` (ReDoS), `picomatch` (glob injection/ReDoS)
  - 4 moderate: `brace-expansion` (DoS), `ip-address` (XSS), `postcss` (XSS), `qs` (DoS)
  - All fixable via `npm audit fix`

---

## Executive Summary

The Customer frontend is substantially complete and functionally sound. Build succeeds, 437/438 tests pass, and the API layer is well-structured with a shared utility module (`customerApiUtils.ts`). The primary technical debts are:

1. **Bundle size**: two large uncode-split chunks will affect initial load time in production
2. **Route imports**: all 25+ customer routes are statically imported into the router, precluding lazy loading
3. **Repeated loading/error/empty UI**: 92 occurrences of inline loading/error/empty guards spread across page components rather than shared atoms
4. **npm audit vulnerabilities**: 17 total including 1 critical (vitest, dev-only) and multiple high-severity production dependencies (react-router, hono, undici)
5. **ESLint config gap**: `jsx-a11y` and `react-hooks` plugins referenced in a worktree `.vite/deps` cache file but not registered in `eslint.config.js` — does not affect src/ lint
6. **Test helper duplication**: no shared `renderWithProviders` or `createQueryClient` wrapper; each test file constructs its own `QueryClient` or `MemoryRouter` wrapper inline
7. **Query key namespacing**: try-on keys live in `src/features/customer/try-on/hooks/tryOn.queries.ts` rather than the `src/features/customer/queries/` directory, breaking colocation convention
8. **Backend contract drift risk**: `normalizeSuggestion` and `normalizeProduct` each handle 3+ field-name variants silently; no automated contract regression harness exists

No finding categorically blocks merging `customer/final-qa` into `main`, but TD-002 (bundle size) and TD-009 (npm audit) should be addressed before a public release.

---

## Priority Matrix

| Priority | Meaning |
|---|---|
| **P0** | Must fix before main merge/release — blocks ship or introduces security regression |
| **P1** | Should fix before broader QA — risk of test noise or runtime breakage |
| **P2** | Good cleanup after feature completion — reduces maintenance surface |
| **P3** | Optional/refactor later — quality-of-life only |

---

## Findings

### TD-001 — Bundle Size Warning

**Priority**: P1
**Area**: Build / Performance
**Evidence**: `vite build` output:
- `dist/assets/TryOn3DViewer-BpT4CJWc.js` — 1,039 kB raw / 297 kB gzip
- `dist/assets/index-Cwg1vRMB.js` — 1,362 kB raw / 387 kB gzip

Both exceed Vite's default 500 kB threshold. The `index` chunk aggregates all statically-imported customer, retailer, auth, and common page components.

**Risk**: Degraded First Contentful Paint / Largest Contentful Paint on mobile or slow connections. The 3D viewer chunk is unavoidable in size but should only load on the try-on route.

**Recommended action**: Apply route-level dynamic `import()` for heavy customer pages (TryOn 3D viewer, WardrobeCollections, AiSuggestions, Compare). Use Vite `manualChunks` to extract the 3D viewer into its own async chunk.

**Suggested command**: Command 23A — Route-level lazy loading

**Dependencies**: TD-002 (router must be updated first)

**Should be done before main merge?** Recommended yes for the 3D viewer chunk; index chunk can follow in a subsequent PR.

---

### TD-002 — Route-Level Lazy Loading Opportunity

**Priority**: P1
**Area**: Router / Performance
**Evidence**: `src/app/routes/router.tsx` contains 25+ static imports of all customer page components at the top level, including the large `CustomerTryOnPage` (which pulls in the 3D viewer), `CustomerWardrobeCollectionsPage` (largest page file at ~1000 lines), and `CustomerAiSuggestionsPage`. None use `React.lazy`.

**Risk**: Every user visiting any route pays the full parse/evaluate cost for all customer pages. The 3D viewer library alone adds ~297 kB gzip to the initial bundle.

**Recommended action**: Replace customer page imports in `router.tsx` with `React.lazy(() => import(...))` wrapped in `<Suspense>`. Start with `CustomerTryOnPage` / `CustomerWardrobeCollectionsPage` / `CustomerAiSuggestionsPage` for maximum impact.

**Suggested command**: Command 23A — Route-level lazy loading

**Dependencies**: None

**Should be done before main merge?** Strongly recommended for 3D viewer route; other pages can follow.

---

### TD-003 — API Normalization Duplication

**Priority**: P2
**Area**: API Layer
**Evidence**: Each API module (catalog, suggestions, outfits, wardrobeCollections) implements its own field-alias normalization in private functions:
- `catalog.api.ts`: `normalizeProduct`, `normalizeProductImage` — handles `imageUrl`/`url`, `viewsCount`/`views`, `category.name`/`categoryName`
- `suggestions.api.ts`: `normalizeSuggestionProduct`, `normalizeSuggestion` — handles `productName`/`name`/`title`, `id`/`suggestionId` and 15+ field aliases
- `outfits.api.ts` and `wardrobeCollections.api.ts`: additional inline normalization

The `customerApiUtils.ts` module exists but only covers envelope unwrapping (`unwrapCustomerApiData`, `unwrapCustomerApiList`), not field normalization.

**Risk**: If the backend stabilizes field names, normalization code in multiple files must be hunted down and removed independently. Risk of one file being missed.

**Recommended action**: Extract common product-field normalization into `customerApiUtils.ts` (or a new `customerNormalizers.ts`). Apply via Command 23B.

**Suggested command**: Command 23B — Customer API normalization utilities

**Dependencies**: None

**Should be done before main merge?** No — cosmetic, does not affect runtime correctness.

---

### TD-004 — Query Key / Invalidation Consistency Review

**Priority**: P2
**Area**: Data Layer / React Query
**Evidence**:
- Try-on query keys (`customerTryOnKeys`) are defined in `src/features/customer/try-on/hooks/tryOn.queries.ts`, not in the `src/features/customer/queries/` directory, breaking the colocation convention used by all other domains.
- Mutation `onSettled` in `favorites.queries.ts` fires 4 separate `invalidateQueries` calls (favorites list, catalog products, product detail, favorites checks) — broad but functional.
- `outfits.queries.ts` invalidates on every mutation but does not cascade to catalog (products may show stale `outfitIds`).

**Risk**: Query key inconsistency makes it harder to audit stale data on cross-feature invalidation. Not a runtime bug today.

**Recommended action**: Move `tryOn.queries.ts` (or at minimum re-export query keys) from `src/features/customer/try-on/hooks/` into `src/features/customer/queries/`. Review outfit mutation invalidation for `customerCatalogKeys.products()`.

**Dependencies**: None

**Should be done before main merge?** No.

---

### TD-005 — Repeated Loading / Error / Empty UI

**Priority**: P2
**Area**: UI Components
**Evidence**: 92 occurrences of inline `isLoading` / `isError` / empty-state JSX spread across page components. For example:
- `CustomerWardrobeCollectionsPage.tsx`: separate loading spinner, error message, and empty state blocks for `favoritesQuery` and `itemsQuery`
- `CustomerOutfitsPage.tsx`: inline empty state comment block at line 645
- `CustomerProductDetailsPage.tsx`: repeated `<EmptyState>` calls with inline title/description props

`src/features/customer/components/product` exports `ApiErrorState` and `EmptyState` but they are not used consistently across all page files.

**Risk**: Inconsistent user experience between pages; copy/style changes require multi-file edits.

**Recommended action**: Audit page components for inline loading/error/empty patterns and replace with the existing `ApiErrorState` / `EmptyState` atoms. If those components are insufficient, extend them. Apply via Command 23C.

**Suggested command**: Command 23C — Customer UI state components

**Dependencies**: None

**Should be done before main merge?** No — UX polish, not a correctness issue.

---

### TD-006 — Backend Contract Drift Risk

**Priority**: P1
**Area**: API / Backend Contract
**Evidence**:
- `suggestions.api.ts` silently handles 15+ field aliases (`productName`/`name`/`title`, `id`/`suggestionId`, etc.) because the deployed API diverges from Swagger and from legacy field names.
- `CUSTOMER_BACKEND_CONTRACT_SNAPSHOT.md` documents known backend defects (Saved Outfit detail/update return 500).
- No automated regression test validates the shape of live API responses against the normalization logic.
- `recommendations.api.ts` is the smallest API file (20 lines) — the endpoint may be incomplete or placeholder.

**Risk**: If the backend changes a field name (e.g., stabilizes `productName` → `name`), the frontend silent alias will mask the breakage in unit tests. Only E2E or contract tests against a real API would catch it.

**Recommended action**: Add a contract regression harness (e.g., Zod schemas or MSW fixtures derived from the backend contract snapshot) to validate normalization logic against documented response shapes. Apply via Command 23E.

**Suggested command**: Command 23E — Backend contract regression harness

**Dependencies**: None

**Should be done before main merge?** Recommended — reduces regression risk significantly.

---

### TD-007 — Documentation Drift Risk

**Priority**: P3
**Area**: Documentation
**Evidence**: `docs/customer/` contains 14 markdown files including `CUSTOMER_BACKEND_CONTRACT_SNAPSHOT.md`, `CUSTOMER_CONTINUATION_ROADMAP.md`, `CUSTOMER_QA_NOTES.md`, `CUSTOMER_FEATURE_MATRIX.md`, and others. Several reference "phase-3" or "final-qa" states that are moving targets. The most recent commit message (`docs(customer): update wardrobe collections docs for phase-3 final (423 tests)`) references 423 tests but the current run shows 437 passing — the docs were not updated with the latest test count.

**Risk**: Stale docs mislead new contributors about API contracts and feature completeness.

**Recommended action**: After `customer/final-qa` merges to `main`, do a documentation pass: remove phase/command references, update test counts, archive superseded `.md` files into a `docs/customer/archive/` subdirectory.

**Dependencies**: None

**Should be done before main merge?** No — merge-blocking would be disproportionate for doc drift. Fix after merge.

---

### TD-008 — Test Helper Duplication

**Priority**: P2
**Area**: Tests
**Evidence**: 40 test files in `src/features/customer/` set up their own provider wrappers:
- 8+ files instantiate `new QueryClient(...)` inline
- 8+ files wrap renders with `<MemoryRouter>` directly
- No shared `renderWithProviders` or `createTestQueryClient` utility exists in `src/test/` for the customer feature

Example: `tryOn.queries.test.tsx` line 17 creates a raw `QueryClient`; `CartPage.test.tsx` wraps with `<MemoryRouter>` without a query client, meaning mutations would fail if tested in isolation.

**Risk**: Test setup diverges over time. A change to provider configuration (e.g., adding a new context) requires updating every test file independently.

**Recommended action**: Create `src/features/customer/test-utils/renderWithCustomerProviders.tsx` exporting a shared `renderWithProviders` helper and `createTestQueryClient`. Apply via Command 23D.

**Suggested command**: Command 23D — Test helper consolidation

**Dependencies**: None

**Should be done before main merge?** No — tests pass today, this is maintainability debt.

---

### TD-009 — npm Audit Vulnerabilities

**Priority**: P0 (for production dependencies) / P2 (for dev-only)
**Area**: Security / Dependencies
**Evidence** (from `npm audit` — read-only, no `npm audit fix` run):

**Critical (dev-only)**:
- `vitest >=4.0.0 <4.1.0`: arbitrary file read/execute via Vitest UI server. No production exposure since vitest is a devDependency and the UI server is not run in CI/CD.

**High (production dependencies)**:
- `react-router 7.0.0–7.14.2`: RCE via turbo-stream deserialization, open redirect, XSS, DoS — **in use by the app**
- `hono <=4.12.20`: 20 CVEs (cookie injection, path traversal, prototype pollution, SSE injection, etc.) — if hono is used in a BFF or mock server in this repo
- `undici 7.0.0–7.23.0`: WebSocket overflow/smuggling — if used via Node.js internals or fetch polyfill
- `esbuild 0.17.0–0.28.0`: arbitrary file read on Windows dev server — dev-only exposure
- `fast-uri <=3.1.1`: path traversal, host confusion
- `flatted <=3.4.1`: prototype pollution, ReDoS
- `path-to-regexp 8.0.0–8.3.0`: ReDoS
- `picomatch`: glob injection / ReDoS

**Moderate**:
- `brace-expansion`, `ip-address`, `postcss`, `qs` — DoS / XSS in specific contexts

All 17 are fixable via `npm audit fix` (no breaking changes flagged). `react-router` is the most urgent since it is a core runtime dependency with RCE and XSS CVEs.

**Recommended action**: Run `npm audit fix` in a dedicated PR. Validate that `react-router` upgrades do not break routing behavior (router.tsx, RequireRole guard). Re-run full test suite after.

**Dependencies**: None; should be a standalone dependency-bump PR.

**Should be done before main merge?** **Yes** for `react-router` (production RCE/XSS). Acceptable to batch all others in the same PR.

---

### TD-010 — ESLint completely broken (`@eslint/js` missing)

**Priority**: P0
**Area**: Tooling / CI
**Evidence**: `npm run lint` exits with code 2 and the error:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@eslint/js' imported from /home/user/weAR/eslint.config.js
```
`@eslint/js` is referenced in `eslint.config.js` but not present in `node_modules` after a fresh `npm ci`. This is a pre-existing misconfiguration not introduced by this branch.

**Risk**: No automated code quality gate exists. Any CI pipeline that runs `npm run lint` will fail on every PR, making the linter gate a CI no-op or a constant red build.

**Recommended action**: Add `@eslint/js` to `devDependencies` in `package.json` with the version matching ESLint 10.1.0 compatibility (`^9.0.0`). Run `npm install` and verify `eslint .` passes on `src/`.

**Dependencies**: None.

**Should be done before main merge?** **Yes** — a broken lint command means no code quality enforcement in CI.

---

## Recommended Future Commands

### Command 23A — Route-Level Lazy Loading
Convert `src/app/routes/router.tsx` customer imports to `React.lazy(() => import(...))`. Wrap customer route subtree in `<Suspense fallback={<CustomerLoadingSpinner />}>`. Priority order: `CustomerTryOnPage` (3D viewer), `CustomerWardrobeCollectionsPage`, `CustomerAiSuggestionsPage`, remaining pages.

### Command 23B — Customer API Normalization Utilities
Extract field-level normalization logic from `catalog.api.ts` and `suggestions.api.ts` into `src/features/customer/api/customerNormalizers.ts`. Export typed functions `normalizeProduct`, `normalizeSuggestionProduct` for reuse. Update `catalog.api.ts` and `suggestions.api.ts` to import from the shared file.

### Command 23C — Customer UI State Components
Audit all `src/features/customer/pages/*.tsx` for inline loading/error/empty JSX. Replace with `ApiErrorState` and `EmptyState` from `src/features/customer/components/product`. Extend these components if new variants are needed (e.g., a `SkeletonList` variant for paginated data).

### Command 23D — Test Helper Consolidation
Create `src/features/customer/test-utils/renderWithCustomerProviders.tsx` with:
- `createTestQueryClient()` — returns a `QueryClient` with retries disabled
- `renderWithProviders(ui, options?)` — wraps with `QueryClientProvider` + `MemoryRouter` + `AuthStore` stub
Update all 40 customer test files to use the shared helper.

### Command 23E — Backend Contract Regression Harness
For each API module, add a Zod schema (or equivalent) matching the documented `CUSTOMER_BACKEND_CONTRACT_SNAPSHOT.md` response shape. Run schema validation in normalization functions in `NODE_ENV=test` mode. This catches silent field-alias failures when the backend stabilizes its API.

---

## What Not To Change Yet

- **`src/features/customer/api/suggestions.api.ts`** normalization aliases — the deployed API is still returning non-Swagger field names (`productName` instead of `name`). Do not remove aliases until the backend is confirmed stable.
- **Saved Outfit detail/update** — backend returns 500 for these endpoints (documented in `CUSTOMER_BACKEND_CONTRACT_SNAPSHOT.md`). Frontend correctly omits these UI paths. Do not implement them until the backend is fixed.
- **`recommendations.api.ts`** — minimal (20 lines) and possibly placeholder. Do not expand until backend endpoint contract is confirmed.
- **Cart / Checkout flows** — these depend on payment and order backends that are not yet fully documented. Avoid deep refactors until the backend contract stabilizes.
- **`CustomerTryOnPage` 3D viewer** — the model loading logic is tightly coupled to the current 3D library. Lazy-load the chunk boundary but do not refactor internal 3D code until the try-on flow is confirmed stable.

---

## Final Recommendation

**`customer/final-qa` is safe to merge into `main` with one pre-merge condition:**

> **TD-009 (npm audit — react-router RCE/XSS CVEs)** should be resolved in a dependency-bump PR before or immediately after merge. This is a production security concern, not a code quality issue.

All other findings are either P2/P3 (quality, maintainability) or dev-only concerns. No customer feature code has correctness bugs that would block a merge. The test suite is healthy (437/438 passing), the build succeeds, and the API normalization layer handles known backend drift defensively.

**Recommended merge order:**
1. Open a `deps/audit-fix` PR against `main` to resolve `npm audit` vulnerabilities
2. Merge `customer/final-qa` into `main`
3. Follow up with Command 23A (lazy loading) and Command 23B (normalization) as separate PRs

| Finding | Priority | Blocks merge? |
|---|---|---|
| TD-001 Bundle size warning | P1 | Recommended fix — not hard block |
| TD-002 No lazy loading | P1 | Recommended fix — not hard block |
| TD-003 Normalization duplication | P2 | No |
| TD-004 Query key inconsistency | P2 | No |
| TD-005 Repeated UI patterns | P2 | No |
| TD-006 Backend contract drift | P1 | No (risk, not defect) |
| TD-007 Documentation drift | P3 | No |
| TD-008 Test helper duplication | P2 | No |
| TD-009 npm audit vulnerabilities | **P0** | **Yes (react-router CVEs)** |
| TD-010 ESLint broken (`@eslint/js` missing) | **P0** | **Yes (no lint gate in CI)** |
