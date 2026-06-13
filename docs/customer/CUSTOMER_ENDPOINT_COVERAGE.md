# Customer Endpoint Coverage

This document tracks Customer backend endpoints against frontend implementation status.

Status values:

- **UI used**: called by an active Customer screen or workflow.
- **Adapter only**: typed adapter exists, but no active UI consumes it.
- **Not integrated**: documented endpoint has no Customer frontend integration.
- **Blocked**: should not be implemented until the backend contract is confirmed.

## Authentication

| Endpoint | Status | Priority | Next action |
|---|---|---:|---|
| `POST /api/customer/auth/register` | UI used | Complete | Keep regression coverage. |
| `POST /api/customer/auth/complete-profile` | UI used | Complete | Verify deployed payload/header contract when backend changes. |
| `POST /api/customer/auth/login` | UI used | Complete | Keep response normalization tests. |
| `POST /api/customer/auth/login/google` | Not integrated | P2 | Integrate only after client ID/config and deployed response contract are confirmed. |
| `POST /api/customer/auth/refresh` | Not integrated / mismatch | **P0** | Audit against the current `/api/auth/refresh-token` interceptor call; fix with role-aware tests. |
| `POST /api/customer/auth/logout` | Not integrated | **P0** | Revoke backend session before clearing local auth; degrade safely if request fails. |
| `POST /api/customer/auth/forgot-password` | Not integrated | **P0** | Implement Customer-compatible OTP request flow. |
| `POST /api/customer/auth/reset-password` | Not integrated | **P0** | Implement OTP/password reset flow and validation. |

## Profile and Addresses

| Endpoint | Status | Notes |
|---|---|---|
| `GET /api/customer/profile` | UI used | Account page. |
| `PUT /api/customer/profile` | UI used | Profile update. |
| `POST /api/customer/profile/change-password` | UI used | Account page. |
| `POST /api/customer/profile/delete-account` | UI used | Confirmation flow. |
| `GET /api/customer/addresses` | UI used | Addresses and Checkout. |
| `POST /api/customer/addresses` | UI used | Create address. |
| `GET /api/customer/addresses/{id}` | Adapter only | Current UI can edit from list data; retain for future detail/deep link. |
| `PUT /api/customer/addresses/{id}` | UI used | Edit address. |
| `DELETE /api/customer/addresses/{id}` | UI used | Delete address. |
| `PATCH /api/customer/addresses/{id}/default` | UI used | Default selection. |

## Catalog

| Endpoint | Status | Priority | Next action |
|---|---|---:|---|
| `GET /api/catalog/products` | UI used but live data unverified | **P1** | Validate deployed filters, pagination and usable products. |
| `GET /api/catalog/products/{productId}` | UI used but live data unverified | **P1** | Validate product shape, images, variants and IDs. |
| `GET /api/catalog/products/{productId}/similar` | UI used | P1 | Verify response envelope with real product. |
| `POST /api/catalog/products/compare` | Adapter only | P2 | Build local comparison selection and `/customer/compare`. |
| `POST /api/catalog/products/by-model-ids` | Adapter only | P2/P3 | Use only in a confirmed AI/outfit flow. |
| `GET /api/catalog/categories` | UI used | P1 | Verify counts and nested categories. |
| `GET /api/catalog/offers` | UI used | P1 | Verify active offer shape. |

## Favorites

| Endpoint | Status |
|---|---|
| `POST /api/customers/{customerId}/favorites/toggle` | UI used |
| `GET /api/customers/{customerId}/favorites` | UI used |
| `POST /api/customers/{customerId}/favorites/check` | UI used through hooks/check state |

## Avatar

All documented Avatar endpoints are integrated:

- `GET /avatar`
- `POST /avatar`
- `DELETE /avatar`
- `GET /avatar/history`
- `PATCH /avatar/measurements`
- `GET /avatar/size-recommendation/{productId}`
- `POST /avatar/extract-from-image`

Remaining work is live contract verification with real products for size recommendation and full Try-on.

## Outfits and Recommendations

| Endpoint | Status | Priority |
|---|---|---:|
| `GET /outfits` | Not integrated | P2 |
| `POST /outfits` | Not integrated | P2 |
| `GET /outfits/{outfitId}` | Not integrated | P2 |
| `PUT /outfits/{outfitId}` | Not integrated | P2 |
| `DELETE /outfits/{outfitId}` | Not integrated | P2 |
| `GET /outfits/complementary` | UI used in Product Details | P1 live verification |

## Try-on

| Endpoint / capability | Status | Priority |
|---|---|---:|
| `POST /try-on` with `Overlay2D` | UI used | P1 live verification |
| `POST /try-on` with `Model3D` | Not used | P3; only if backend requires a separate 3D session |
| `POST /try-on` with `ARLiveView` | Not used | P4 / out of current scope |
| `GET /try-on/sessions` | Adapter only | P2 |
| `GET /try-on/sessions/{sessionId}` | Adapter only | P2 |
| `GET /products/{productId}/sessions` | Adapter only | P2 |
| 3D model URL display | UI used when returned | Complete with fallback |

## Backend-blocked areas

No confirmed Customer endpoints currently exist for:

- Persistent server cart
- Checkout submission
- Order creation
- Customer payment
- Order tracking
- Shipping/tax/coupon calculation

Keep these frontend-only or explicitly blocked until Swagger/deployed backend confirms contracts.

## Stage 12 auth audit note

On 2026-06-13, attempted to fetch the deployed Swagger/OpenAPI documents from `https://vfr-backend.onrender.com` at `/swagger/v1/swagger.json`, `/swagger/index.html`, `/openapi.json`, `/api-docs`, and `/swagger.json`. Each request returned HTTP 403 from the CONNECT tunnel, so the deployed response schema could not be confirmed from this environment. Customer refresh, logout, forgot-password, and reset-password use the documented `CUSTOMER_API_REFERENCE.md` endpoints with conservative payloads. Customer Google login remains blocked in the UI unless/until both `VITE_GOOGLE_CLIENT_ID` and the deployed `/api/customer/auth/login/google` response contract are confirmed.
