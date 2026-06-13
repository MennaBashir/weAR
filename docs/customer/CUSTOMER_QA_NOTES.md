# Customer Frontend QA Notes

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
