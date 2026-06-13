# Customer Frontend QA Notes

## Updated Swagger and local deployed verification (2026-06-14)

### Baseline

- `npm ci`, lint, build and diff check passed.
- `npm test`: 43 files, 238 tests passed.

### Saved Outfits local deployed verification

- list: HTTP 200 paginated
- create without Favorites: HTTP 422 `INVALID_OUTFIT_ITEMS`
- create after Favorites: HTTP 201 with UUID string in `data`
- existing detail: HTTP 500 `INTERNAL_ERROR`
- existing update: HTTP 500 `INTERNAL_ERROR`
- delete: HTTP 204 empty body
- list after delete: `totalCount: 0`
- deleted ID detail: HTTP 404 `NOT_FOUND`

### Updated Swagger conclusions

- Manual Avatar create/update fields are root-level.
- Avatar update and delete require `avatarId`; successful responses are 204.
- Photo extraction uses `ImageFile` and `HeightCm`.
- Avatar history is paginated and contains `measurementDataJson`.
- Size recommendation uses `confidenceScore` and `justification`.
- Try-on create uses auth-derived customerId in the URL and a body containing productId, numeric sessionType and optional avatarId.
- Try-on sessions are paginated.
- 2D result uses resultImageUrl.
- Avatar GLB must not be described as garment-rendered without backend confirmation.

The earlier Command 13 CONNECT-tunnel report remains historical evidence and is not deleted.

## Known limitation: Product-driven Try-on testing

The Customer Try-on flow is implemented, but the complete manual journey from
Product Details to Try-on cannot currently be verified with real backend data.

Current limitations:

- Customer product pages do not yet provide reliable product data for end-to-end testing.
- Valid backend product IDs, images, colors, sizes, and Try-on-compatible models are not currently available.
- Opening `/customer/try-on` directly without a product correctly displays:
  `No product selected`.
- The intended flow is:
  `/customer/products/{productId}` → Try On → `/customer/try-on/{productId}`.
- This journey must be retested when valid customer catalog products are available.
- The product-to-Try-on flow must not be classified as manually verified yet.

## Currently verified

- Customer authentication and protected routes.
- Avatar photo upload uses multipart FormData.
- Avatar measurements can be extracted and saved.
- Flat avatar responses are normalized.
- Avatar history responses are normalized.
- Manual and photo measurement pages load.
- Try-on 2D state flow has automated tests.
- Try-on 3D is progressively loaded and keeps 2D as fallback.
- Cart and checkout frontend boundaries have automated tests.

## Command 16 Saved Outfits (2026-06-13)

### Verified backend contracts

| Endpoint | Verified behavior |
|---|---|
| `GET /api/customers/{customerId}/outfits` | HTTP 200. Shape: `{ success: true, data: { items: OutfitSummary[], pageNumber, pageSize, totalCount, totalPages, hasPreviousPage, hasNextPage } }`. |
| `POST /api/customers/{customerId}/outfits` | HTTP 201. `response.data` is the created outfit UUID string. |
| `DELETE /api/customers/{customerId}/outfits/{outfitId}` | HTTP 204 empty body. No JSON parsing attempted. |
| `GET /api/customers/{customerId}/outfits/complementary` | Documented but not live-verified from this environment (same CONNECT tunnel restriction as Command 13). |
| `POST` 422 INVALID_OUTFIT_ITEMS | Create fails with `code: INVALID_OUTFIT_ITEMS` when any item is not a customer Favorite. |
| `GET /api/customers/{customerId}/outfits/{outfitId}` | **Backend defect**: returns HTTP 500 INTERNAL_ERROR for existing outfits. Not exposed in UI. |
| `PUT /api/customers/{customerId}/outfits/{outfitId}` | **Backend defect**: returns HTTP 500 INTERNAL_ERROR for existing outfits. Not exposed in UI. |

### Verified OutfitSummary shape

```
{ id: string, name: string | null, style: string | null, itemCount: number, slotPreviews: Record<string, string | null> | null }
```

### Implementation notes

- Outfit detail and edit UI is intentionally blocked with "Outfit details and editing are temporarily unavailable."
- 422 `INVALID_OUTFIT_ITEMS` surfaces an explicit "Add missing products to Favorites" action; no silent favorite mutation occurs.
- DELETE response body is not JSON-parsed (void adapter).
- `customerId` is derived exclusively from authenticated Customer state.
- Outfits list is invalidated after create and after delete.
- Favorites queries are invalidated when favorite toggle is performed from within the outfits flow.
- All 42 new outfit tests pass (8 API adapter, 16 query hook, 18 page UI).

## Wardrobe Contract Audit (2026-06-13)

This is a Swagger-only audit. The CONNECT tunnel to `https://vfr-backend.onrender.com` returns `403 Forbidden` from this execution environment; no deployed endpoints were reachable.

### Endpoints audited (Swagger-only)

- `POST /api/customer/wardrobe/suggestions` — AI suggestion generation
- `POST /api/customer/wardrobe/suggestions/save` — save AI suggestion as outfit
- `POST /api/catalog/products/by-model-ids` — resolve model IDs (adapter already exists)
- `GET/POST /api/customers/{customerId}/wardrobe/collections` — list/create collections
- `PUT/PATCH /api/customers/{customerId}/wardrobe/collections/{id}` — update collection
- `DELETE /api/customers/{customerId}/wardrobe/collections/{id}` — delete collection
- `GET/POST /api/customers/{customerId}/wardrobe/collections/{id}/items` — list/add items
- `DELETE /api/customers/{customerId}/wardrobe/collections/{id}/items/{itemId}` — remove item
- `POST /api/customers/{customerId}/feedback` — submit fit feedback (**blocked**)
- `GET /api/customers/{customerId}/feedback/orders/{orderId}` — feedback by order (**blocked**)
- `GET /api/catalog/products/{productId}/fit-statistics` — product fit stats

### Key findings

- All 13 endpoints are Swagger-documented but none could be verified against the deployed backend.
- AI Outfit Suggestions: request body fields appear optional; `suggestionId` in save request and Favorites prerequisite are unconfirmed.
- Collections: standard paginated envelope expected; collection update HTTP method (PUT vs PATCH) and success status (200 vs 204) are unconfirmed.
- Fit Feedback: blocked hard on real completed order IDs (`orderId`, `orderItemId`). Customer order history API is not yet integrated.
- `POST /api/catalog/products/by-model-ids` adapter already exists; use only when suggestions return `modelId` without `productId`.
- See `CUSTOMER_WARDROBE_CONTRACT_AUDIT.md` for full per-endpoint schemas and blockers.

### No source files changed

No frontend source files, routes, hooks, adapters, pages, tests, or package files were modified. Only documentation files under `docs/customer/` were updated.

## Command 13 backend contract validation (2026-06-13)

### Environment and starting point

- Actual branch used for the audit: `codex/command-13-backend-contract-validation`.
- Starting commit: `4fd5f5591b41b330ad620c4a46fdd616861d864a`.
- Required approved commit ancestor check: `git merge-base --is-ancestor 4fd5f55 HEAD` returned `ancestor_exit=0` before changes.
- Deployed backend base URL attempted: `https://vfr-backend.onrender.com`.

### Endpoints manually verified from this environment

All Command 13 contract-audit requests were attempted against the deployed backend. The environment could not establish a tunnel to the Render host, so no response body or product fixture could be retrieved.

| Endpoint | Request attempted | Result |
|---|---|---|
| `GET /api/catalog/products` | `curl -sS -i --max-time 30 "https://vfr-backend.onrender.com/api/catalog/products?pageNumber=1&pageSize=5"` | Blocked before reaching application: `curl: (56) CONNECT tunnel failed, response 403`; headers included `HTTP/1.1 403 Forbidden`, `server: envoy`. |
| `GET /api/catalog/categories` | `curl -sS -i --max-time 30 "https://vfr-backend.onrender.com/api/catalog/categories"` | Blocked before reaching application: `curl: (56) CONNECT tunnel failed, response 403`; headers included `HTTP/1.1 403 Forbidden`, `server: envoy`. |
| `GET /api/catalog/offers` | `curl -sS -i --max-time 30 "https://vfr-backend.onrender.com/api/catalog/offers"` | Blocked before reaching application: `curl: (56) CONNECT tunnel failed, response 403`; headers included `HTTP/1.1 403 Forbidden`, `server: envoy`. |
| `GET /api/catalog/products/{productId}` | Not safely attempted with a real ID | Blocked because no Customer-visible product ID could be retrieved from the deployed product list. |
| `GET /api/catalog/products/{productId}/similar` | Not safely attempted with a real ID | Blocked because no Customer-visible product ID could be retrieved from the deployed product list. |
| `GET /api/customers/{customerId}/outfits/complementary` | Not safely attempted with a real customer/product pair | Blocked because no non-secret Customer identity and no real product ID were available from the deployed backend in this environment. |
| `GET /api/customers/{customerId}/avatar/size-recommendation/{productId}` | Not safely attempted with a real customer/product pair | Blocked because no non-secret Customer identity and no real product ID were available from the deployed backend in this environment. |
| `POST /api/customers/{customerId}/try-on` | Not safely attempted | Blocked because no non-secret Customer identity, real product ID, and product variants could be confirmed. No fake Try-on success was created. |

### Response shapes recorded

No deployed application response shapes could be recorded for product list envelope, pagination, product detail, `primaryImageUrl`, `images`, colors, sizes, price, discounted price, category, subcategory, categories, offers, similar products, complementary products, size recommendation, or Try-on creation/result. The only exact deployed-edge response confirmed from this environment was the CONNECT tunnel blocker: `curl: (56) CONNECT tunnel failed, response 403` with `HTTP/1.1 403 Forbidden` and `server: envoy`.

### Valid product IDs and prerequisites

- Valid Customer-visible product found: none.
- Exact blocker: the environment cannot reach `https://vfr-backend.onrender.com` due to CONNECT tunnel 403 responses before application responses are returned.
- Backend/environment prerequisite: provide an accessible backend URL from the execution environment or allowlist this environment/proxy for `https://vfr-backend.onrender.com`; then rerun Command 13 to collect sanitized real response shapes and test the product-driven Try-on journey.

### Screens and journey verification

- Product list → Product Details → size/color selection → Try On → 2D result → optional 3D model → Add to Cart: blocked. No real Customer-visible product ID, variants, images, size recommendation response, or Try-on result could be obtained from the deployed backend.
- The existing no-product behavior remains preserved: opening `/customer/try-on` without a selected product should continue to show `No product selected`.

### Frontend/backend mismatches

- Confirmed frontend/backend contract mismatches: none. The backend application response shapes were not reachable, so no adapter/type changes were made.
- `primaryImageUrl` support was reviewed in the current frontend and preserved; no change reverted it.

### Backend actions required

1. Make the deployed Customer catalog endpoints reachable from the validation environment or provide an approved reachable deployment URL.
2. Ensure at least one Customer-visible product exists with non-secret ID, images or `primaryImageUrl`, price, category/subcategory, colors, sizes, and Try-on-compatible data.
3. Provide or confirm a non-secret Customer test account/avatar prerequisite for size recommendation, complementary outfits, and product-driven Try-on validation.
