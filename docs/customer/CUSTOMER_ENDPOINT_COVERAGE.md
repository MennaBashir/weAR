# Customer Endpoint Coverage

Status values:

- **Verified UI used**
- **UI used — contract alignment required**
- **Adapter only**
- **Complete supported scope**
- **Not integrated**
- **Backend defect**
- **Deferred/blocked**

## Authentication

| Endpoint | Status | Notes |
|---|---|---|
| `POST /api/customer/auth/register` | Verified UI used | Signup. |
| `POST /api/customer/auth/complete-profile` | Verified UI used | Two-step completion; re-audit exact Swagger fields during auth regression work. |
| `POST /api/customer/auth/login` | Verified UI used | Customer login. |
| `POST /api/customer/auth/refresh` | Verified UI used | Role-aware Customer refresh. |
| `POST /api/customer/auth/logout` | Verified UI used | Backend attempt plus guaranteed local cleanup. |
| `POST /api/customer/auth/forgot-password` | Verified UI used | OTP request. |
| `POST /api/customer/auth/reset-password` | Verified UI used | OTP reset. |
| `POST /api/customer/auth/login/google` | Deferred/blocked | Requires runtime client ID and deployed response confirmation. |

## Profile and Addresses

All current profile/address list, create, update, delete and default-selection flows are **Verified UI used**. Address detail remains **Adapter only**.

## Catalog

| Endpoint | Status | Notes |
|---|---|---|
| `GET /api/catalog/products` | Verified UI used | Home/Shop; normalized envelopes and `primaryImageUrl`. |
| `GET /api/catalog/products/{productId}` | Verified UI used | Product Details normalization fixed. |
| `GET /api/catalog/products/{productId}/similar` | Verified UI used | Recommendation rail. |
| `POST /api/catalog/products/compare` | Verified UI used | `/customer/compare`. |
| `POST /api/catalog/products/by-model-ids` | Adapter only | Planned for AI suggestions when required. |
| `GET /api/catalog/categories` | Verified UI used | Home/Shop. |
| `GET /api/catalog/offers` | Verified UI used | Home. |

## Favorites

Toggle, list and check endpoints are **Verified UI used**. Saved Outfits uses explicit user-triggered favorite recovery.

## Avatar

| Endpoint | Status | Next action |
|---|---|---|
| `GET /api/customers/{customerId}/avatar` | Verified UI used | Preserve 404 → no Avatar. |
| `POST /api/customers/{customerId}/avatar` | UI used — contract alignment required | Root fields, source, UUID response. |
| `PATCH /api/customers/{customerId}/avatar/measurements` | UI used — contract alignment required | Include avatarId; 204. |
| `DELETE /api/customers/{customerId}/avatar` | UI used — contract alignment required | Body `{ avatarId }`; 204. |
| `GET /api/customers/{customerId}/avatar/history` | UI used — contract alignment required | Paginated; parse measurementDataJson safely. |
| `GET /api/customers/{customerId}/avatar/size-recommendation/{productId}` | UI used — contract alignment required | Map confidenceScore and justification. |
| `POST /api/customers/{customerId}/avatar/extract-from-image` | Verified UI used | Multipart `ImageFile`/`HeightCm`; preserve Content-Type override and flat normalization. |

## Saved Outfits

| Endpoint | Status | Verified behavior |
|---|---|---|
| `GET /api/customers/{customerId}/outfits` | Complete supported scope | 200 paginated list. |
| `POST /api/customers/{customerId}/outfits` | Complete supported scope | 201; `data` UUID string. |
| create without Favorites | Complete supported scope | 422 `INVALID_OUTFIT_ITEMS`; explicit recovery action. |
| `DELETE /api/customers/{customerId}/outfits/{outfitId}` | Complete supported scope | 204 empty body. |
| missing/deleted detail | Complete supported scope | 404 `NOT_FOUND`. |
| existing detail GET | Backend defect | 500 `INTERNAL_ERROR`; no detail UI. |
| existing update PUT | Backend defect | 500 `INTERNAL_ERROR`; no edit UI. |
| `GET /api/customers/{customerId}/outfits/complementary` | Verified UI used | Product Details; adapter tolerates direct arrays/envelopes. |

## Try-on

| Capability | Status | Next action |
|---|---|---|
| create session | UI used — contract alignment required | Body: productId, numeric sessionType, optional avatarId; customerId in URL. |
| 2D result | Verified UI used | `resultImageUrl` fallback. |
| sessions/history | UI used — contract alignment required | Paginated response and documented fields. |
| session detail/product sessions | Adapter only | Use only when stable UI needs them. |
| 3D Avatar display | Verified UI used | Lazy viewer; garment semantics unconfirmed. |
| AR live view | Deferred/blocked | Outside current scope unless explicitly approved. |

## AI Outfit Suggestions

| Endpoint | Status | Notes |
|---|---|---|
| `POST /api/customer/wardrobe/suggestions` | Not integrated | Command 19. Swagger-only. Request fields all optional/nullable; confirm whether empty body is valid. |
| `POST /api/customer/wardrobe/suggestions/save` | Not integrated | Command 19. Swagger-only. `suggestionId` required; Favorites prerequisite unconfirmed. |
| `POST /api/catalog/products/by-model-ids` | Adapter only | Adapter implemented. Use only when suggestion response contains `modelId` without `productId`. |

## Wardrobe Collections

| Endpoint | Status | Notes |
|---|---|---|
| `GET /api/customers/{customerId}/wardrobe/collections` | Not integrated | Command 20. Swagger-only. Standard paginated envelope expected. |
| `POST /api/customers/{customerId}/wardrobe/collections` | Not integrated | Command 20. Swagger-only. `name` required; returns UUID string. |
| `PUT/PATCH /api/customers/{customerId}/wardrobe/collections/{collectionId}` | Not integrated | Command 20. Swagger-only. Method (PUT vs PATCH) and success status (200 vs 204) unconfirmed. |
| `DELETE /api/customers/{customerId}/wardrobe/collections/{collectionId}` | Not integrated | Command 20. Swagger-only. 204 expected; cascade delete behavior unconfirmed. |
| `GET /api/customers/{customerId}/wardrobe/collections/{collectionId}/items` | Not integrated | Command 20. Swagger-only. Paginated; exact item shape unconfirmed. |
| `POST /api/customers/{customerId}/wardrobe/collections/{collectionId}/items` | Not integrated | Command 20. Swagger-only. `productId` required; duplicate behavior unconfirmed. |
| `DELETE /api/customers/{customerId}/wardrobe/collections/{collectionId}/items/{itemId}` | Not integrated | Command 20. Swagger-only. 204 expected. |

## Fit Feedback

| Endpoint | Status | Notes |
|---|---|---|
| `POST /api/customers/{customerId}/feedback` | Deferred/blocked | Command 21. Requires real completed `orderId` and `orderItemId`. Never use fake IDs. |
| `GET /api/customers/{customerId}/feedback/orders/{orderId}` | Deferred/blocked | Command 21. Requires real `orderId`. |
| `GET /api/catalog/products/{productId}/fit-statistics` | Not integrated | Command 21. Path unconfirmed. May be safe to implement without order data. |

## Backend-blocked commerce

Persistent cart, checkout submission, order creation, Customer payment, tracking and server shipping/tax/coupon calculation remain unconfirmed.
