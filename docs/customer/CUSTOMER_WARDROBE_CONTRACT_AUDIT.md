# Customer Wardrobe Contract Audit

## Audit scope and date

**Date:** 2026-06-13 (audit); Command 19 implementation 2026-06-14  
**Source precedence:** Verified deployed behavior → Current Swagger/OpenAPI → Backend integration guide → Repository docs  
**Status of deployed tests:** CONNECT tunnel to `https://vfr-backend.onrender.com` returns 403 Forbidden from this execution environment. All endpoint entries below are **Swagger-only** unless explicitly marked **Verified deployed**.  
**Source documents read:** CUSTOMER_BACKEND_CONTRACT_SNAPSHOT.md, CUSTOMER_CONTINUATION_COMMANDS.md, CUSTOMER_ENDPOINT_COVERAGE.md, CUSTOMER_QA_NOTES.md, CUSTOMER_API_REFERENCE.md, catalog.api.ts, outfits.api.ts, catalog.ts types.

## Command 20 implementation notes (2026-06-14)

Wardrobe Collections — all endpoints **Swagger-only**. CONNECT tunnel still 403 Forbidden; no deployed verification.

**Implemented:**
- `GET /api/customers/{customerId}/wardrobe/collections` — paginated, normalizes `WardrobeCollectionSummary[]`. Double-envelope unwrapping.
- `POST /api/customers/{customerId}/wardrobe/collections` — name trimmed; description nullable; returns UUID string via `extractCreatedId`. `WardrobeCollectionApiError` on error.
- `PUT /api/customers/{customerId}/wardrobe/collections/{id}` — name trimmed; 204 assumed; no body parsing. **BLOCKED: method (PUT vs PATCH) and success status (200 vs 204) unconfirmed.**
- `DELETE /api/customers/{customerId}/wardrobe/collections/{id}` — 204; no body parsing. Cascade delete behavior unconfirmed.
- `GET /api/customers/{customerId}/wardrobe/collections/{id}/items` — paginated, normalizes `WardrobeCollectionItem[]`. Handles `productImageUrl` (Swagger) or `primaryImageUrl` (alternative).
- `POST /api/customers/{customerId}/wardrobe/collections/{id}/items` — `productId` required; returns item UUID or empty string. Duplicate behavior unconfirmed.
- `DELETE /api/customers/{customerId}/wardrobe/collections/{id}/items/{itemId}` — 204; no body parsing.

**customerId:** Always from authenticated Customer state. Never sent in request body.
**Cache invalidation:** Collections list invalidated on create/update/delete. Item list and collection list invalidated on add/remove item. Favorites and Saved Outfits NOT invalidated.
**Error handling:** `rethrowApiError` preserves backend `code` and `message`. Falls back to generic message when no structured error body.

---

## Command 19 implementation notes (updated 2026-06-14)

AI Outfit Suggestions — generate endpoint **runtime-verified** (two deployed tests, 2026-06-14). Save endpoint Swagger-only; save currently blocked by missing `suggestionId` and numeric `slotType` in all verified responses.

**Generate adapter — runtime-verified fields:**
- `weatherCondition` required — HTTP 400 when omitted (runtime-verified).
- Deployed response shape: `{ "success": true, "data": [ { "title", "description", "matchPercentage", "styleTags", "items": [...] } ] }`.
- Suggestion aliases: `title`→`name`, `description`→`styleNotes`.
- Item aliases: `productName`→`name`.
- Item fields confirmed: `id`, `productId`, `slot` (string, display-only), `displayOrder`, `productName`, `price`, `primaryImageUrl`, `stockStatus`.
- No `suggestionId` or numeric `slotType` in any tested response.
- Backend may return a subset of requested `productIds`; not a frontend error.
- Three response shapes supported: deployed direct-array, Swagger `data.suggestions`, legacy direct-array.
- `suggestionId: string | null` — missing ID does not drop suggestion; no synthetic ID invented.
- Embedded item display fields rendered without a second product lookup.

**Generate adapter — Swagger-only fields (not deployed-verified):**
- Swagger envelope `data.suggestions`.
- `id`/`suggestionId` at suggestion level.
- Numeric `slotType` at item level.
- `products[].reasoning`, `modelId`, Swagger product sub-fields.

**Save adapter (`suggestions.api.ts`):**
- Strict response validation: only non-empty string from `data` or bare string accepted.
- Invalid/missing/empty response throws `SuggestionApiError("INVALID_SAVE_RESPONSE", ...)`.
- `INVALID_OUTFIT_ITEMS` 422 extracted and re-thrown as `SuggestionApiError`.
- `String(raw)` not used.
- Not deployed-verified.

**Save eligibility (page/UI):**
- Save disabled when `suggestionId` is null (no synthetic ID invented).
- Save disabled if any product has no `productId` (unresolved).
- Save disabled if any product has no numeric `slotType`.
- `slot` string is display-only; never coerced to numeric `slotType`.
- Does not filter and save a partial outfit — all-or-nothing.
- Items built from ALL products in original array order.
- `displayOrder` from backend used when numeric; array index used as fallback for `displayOrder` only.
- `slotType` always comes from backend — never substituted or invented.

**INVALID_OUTFIT_ITEMS (page/UI):**
- Explicit guidance shown with link to `/customer/favorites`.
- No automatic Favorites mutation performed.

**Unconfirmed (runtime-unconfirmed):**
- Whether `suggestionId` is ever returned by generate (not observed in any runtime test).
- Whether numeric `slotType` is ever returned by generate (not observed; `slot` string is).
- Whether Favorites prerequisite applies to save (INVALID_OUTFIT_ITEMS possible).

---

## A. AI Outfit Suggestions

### A1. Generate AI Outfit Suggestions

| Field | Value |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/customer/wardrobe/suggestions` |
| **Authentication** | Required — Bearer token; `customerId` derived from authenticated token |
| **Path parameters** | None |
| **Query parameters** | None |
| **Request body** | JSON object (see schema below) |
| **Success status** | `200 OK` |
| **Tested status** | **Swagger-only** — not verified against deployed backend |

**Request body schema (Swagger-derived):**

```json
{
  "occasion": "string | null",
  "stylePreferences": ["string"] | null,
  "favoriteProductIds": ["uuid"] | null,
  "modelIds": ["string"] | null,
  "productIds": ["uuid"] | null
}
```

Required fields: none confirmed mandatory from Swagger alone.  
Nullable fields: all fields appear optional/nullable.

**Input resolution notes:**

- `favoriteProductIds` — UUIDs of products the customer has favorited; pulled from authenticated Favorites state.
- `modelIds` — AI model identifiers; when present, products must be resolved via `POST /api/catalog/products/by-model-ids` before display.
- `productIds` — direct catalog product UUIDs.
- `occasion` / `stylePreferences` — free-form occasion/style strings.
- Whether the backend requires at least one of these fields or accepts an empty body is **not confirmed**.

**Success response envelope (Swagger-derived):**

```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "id": "uuid",
        "outfitName": "string | null",
        "occasion": "string | null",
        "styleNotes": "string | null",
        "products": [
          {
            "modelId": "string | null",
            "productId": "uuid | null",
            "slotType": "number",
            "reasoning": "string | null"
          }
        ]
      }
    ]
  }
}
```

**Exact field names and whether `products[].modelId` or `products[].productId` is always populated is not confirmed.**  
**Pagination:** Not expected on generation endpoint; single response.  
**Error responses (Swagger-derived):**

| Status | Code | Condition |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing or invalid token |
| `422` | `VALIDATION_ERROR` | Invalid request body |
| `500` | `INTERNAL_ERROR` | Backend error |

**Frontend prerequisites:**
- Authenticated Customer session.
- Favorites list available (if `favoriteProductIds` used as input).
- `POST /api/catalog/products/by-model-ids` call required when response products contain `modelId` but no `productId`.

**Safe to test:** Yes (read-only generation, no persistent state). Blocked by CONNECT tunnel.

---

### A2. Save AI Suggestion

| Field | Value |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/customer/wardrobe/suggestions/save` |
| **Authentication** | Required — Bearer token |
| **Path parameters** | None |
| **Query parameters** | None |
| **Request body** | JSON object (see schema below) |
| **Success status** | `201 Created` |
| **Tested status** | **Swagger-only** |

**Request body schema (Swagger-derived):**

```json
{
  "suggestionId": "uuid",
  "name": "string | null",
  "styleCategory": "string | null",
  "items": [
    {
      "productId": "uuid",
      "slotType": 0,
      "displayOrder": 0
    }
  ]
}
```

Required fields: `suggestionId` required; `items[].productId` required; `items[].slotType` required (numeric enum, same shape as Saved Outfits).  
Nullable: `name`, `styleCategory`.

**Blocker:** It is not confirmed whether `suggestionId` must reference an ID returned by the generate endpoint, or whether items must already be Customer Favorites (like the Saved Outfits `INVALID_OUTFIT_ITEMS` restriction). This must be clarified before implementation.

**Success response envelope (Swagger-derived):**

```json
{
  "success": true,
  "data": "uuid"
}
```

`data` is expected to be the saved outfit UUID string, consistent with the verified `POST /api/customers/{customerId}/outfits` behavior.

**Error responses:**

| Status | Code | Condition |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing or invalid token |
| `404` | `NOT_FOUND` | suggestionId not found |
| `422` | `INVALID_OUTFIT_ITEMS` | Items not favorited (probable; unconfirmed) |
| `422` | `VALIDATION_ERROR` | Invalid request body |
| `500` | `INTERNAL_ERROR` | Backend error |

**Frontend prerequisites:**
- Authenticated Customer session.
- Suggestion ID from generate response.
- Products in items must be resolved (not just modelIds).
- Favorites prerequisite is likely but not confirmed.

**Safe to test:** Yes (creates a new outfit record, deletable via `DELETE /api/customers/{customerId}/outfits/{outfitId}`). Blocked by CONNECT tunnel.

---

### A3. Resolve Model IDs to Products

| Field | Value |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/catalog/products/by-model-ids` |
| **Authentication** | Required — Bearer token |
| **Path parameters** | None |
| **Query parameters** | None |
| **Request body** | `{ "modelIds": ["string", ...] }` |
| **Success status** | `200 OK` |
| **Tested status** | **Swagger-only** (adapter exists in `catalog.api.ts:87`) |

**Request body schema:**

```json
{
  "modelIds": ["string"]
}
```

Required: `modelIds` non-empty array.

**Success response envelope:**

```json
{
  "success": true,
  "data": [ /* CustomerProduct[] */ ]
}
```

Response shape matches standard catalog product list. Adapter already exists (`getProductsByModelIds` in `catalog.api.ts`). Type definition `ProductsByModelIdsPayload` exists in `catalog.ts:98`.

**When required:** Only when AI suggestion response contains `modelId` without `productId`. If suggestions always include `productId`, this call can be skipped.

**Frontend prerequisites:** None beyond authentication. Adapter already implemented.

**Safe to test:** Yes (read-only). Blocked by CONNECT tunnel.

---

## B. Wardrobe Collections

### B1. List Wardrobe Collections

| Field | Value |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/customers/{customerId}/wardrobe/collections` |
| **Authentication** | Required — Bearer token; customerId from auth |
| **Path parameters** | `customerId: uuid` |
| **Query parameters** | `pageNumber?: number`, `pageSize?: number` |
| **Success status** | `200 OK` |
| **Tested status** | **Swagger-only** |

**Success response envelope (Swagger-derived):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "string",
        "description": "string | null",
        "itemCount": 0,
        "coverImageUrl": "string | null",
        "createdAt": "string (ISO 8601)"
      }
    ],
    "pageNumber": 1,
    "pageSize": 10,
    "totalCount": 0,
    "totalPages": 0,
    "hasPreviousPage": false,
    "hasNextPage": false
  }
}
```

**Pagination shape:** Standard paginated envelope (same shape as Outfits list, verified).  
**Ownership:** customerId in path must match authenticated token.  
**Safe to test:** Yes (read-only). Blocked by CONNECT tunnel.

---

### B2. Create Wardrobe Collection

| Field | Value |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/customers/{customerId}/wardrobe/collections` |
| **Authentication** | Required — Bearer token |
| **Path parameters** | `customerId: uuid` |
| **Query parameters** | None |
| **Request body** | JSON object |
| **Success status** | `201 Created` |
| **Tested status** | **Swagger-only** |

**Request body schema (Swagger-derived):**

```json
{
  "name": "string",
  "description": "string | null"
}
```

Required: `name`.  
Nullable: `description`.

**Success response envelope (Swagger-derived):**

```json
{
  "success": true,
  "data": "uuid"
}
```

`data` is the created collection UUID string (consistent with Outfits create pattern).

**Error responses:**

| Status | Code | Condition |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing or invalid token |
| `409` | `CONFLICT` / `DUPLICATE_NAME` | Collection name already exists for customer (unconfirmed) |
| `422` | `VALIDATION_ERROR` | Missing required fields |
| `500` | `INTERNAL_ERROR` | Backend error |

**Safe to test:** Yes (creates a deletable record). Blocked by CONNECT tunnel.

---

### B3. Update (Rename) Wardrobe Collection

| Field | Value |
|---|---|
| **Method** | `PUT` or `PATCH` |
| **Path** | `/api/customers/{customerId}/wardrobe/collections/{collectionId}` |
| **Authentication** | Required — Bearer token |
| **Path parameters** | `customerId: uuid`, `collectionId: uuid` |
| **Query parameters** | None |
| **Request body** | JSON object |
| **Success status** | `200 OK` or `204 No Content` (unconfirmed) |
| **Tested status** | **Swagger-only** |

**Request body schema (Swagger-derived):**

```json
{
  "name": "string",
  "description": "string | null"
}
```

**Blocker:** The exact HTTP method (PUT vs PATCH) and success status code (200 vs 204) are not confirmed. This parallels the existing Outfit update endpoint which currently returns 500 INTERNAL_ERROR — the collection update may have similar risk.

**Safe to test:** Yes if collection is created first. Blocked by CONNECT tunnel.

---

### B4. Delete Wardrobe Collection

| Field | Value |
|---|---|
| **Method** | `DELETE` |
| **Path** | `/api/customers/{customerId}/wardrobe/collections/{collectionId}` |
| **Authentication** | Required — Bearer token |
| **Path parameters** | `customerId: uuid`, `collectionId: uuid` |
| **Query parameters** | None |
| **Request body** | None |
| **Success status** | `204 No Content` |
| **Tested status** | **Swagger-only** |

**Success response:** Empty body; do not attempt JSON parsing (consistent with Outfit delete pattern).  
**Behavior:** Deleting a collection with items — whether items are removed or the operation is blocked — is not confirmed. Assume cascade delete unless documented otherwise.

**Safe to test:** Yes (destructive but scoped to test data). Blocked by CONNECT tunnel.

---

### B5. List Collection Items

| Field | Value |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/customers/{customerId}/wardrobe/collections/{collectionId}/items` |
| **Authentication** | Required — Bearer token |
| **Path parameters** | `customerId: uuid`, `collectionId: uuid` |
| **Query parameters** | `pageNumber?: number`, `pageSize?: number` |
| **Success status** | `200 OK` |
| **Tested status** | **Swagger-only** |

**Success response envelope (Swagger-derived):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "productName": "string",
        "productImageUrl": "string | null",
        "addedAt": "string (ISO 8601)"
      }
    ],
    "pageNumber": 1,
    "pageSize": 10,
    "totalCount": 0,
    "totalPages": 0,
    "hasPreviousPage": false,
    "hasNextPage": false
  }
}
```

**Exact field names for item shape (especially product snapshot fields) are not confirmed.**  
**Safe to test:** Yes (read-only). Blocked by CONNECT tunnel.

---

### B6. Add Item to Collection

| Field | Value |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/customers/{customerId}/wardrobe/collections/{collectionId}/items` |
| **Authentication** | Required — Bearer token |
| **Path parameters** | `customerId: uuid`, `collectionId: uuid` |
| **Query parameters** | None |
| **Request body** | JSON object |
| **Success status** | `201 Created` or `200 OK` (unconfirmed) |
| **Tested status** | **Swagger-only** |

**Request body schema (Swagger-derived):**

```json
{
  "productId": "uuid"
}
```

Required: `productId`.

**Duplicate behavior:** Whether adding an already-present product returns 409 or is idempotent is not confirmed.

**Success response (Swagger-derived):**

```json
{
  "success": true,
  "data": "uuid"
}
```

`data` is the collection item UUID.

**Safe to test:** Yes. Blocked by CONNECT tunnel.

---

### B7. Remove Item from Collection

| Field | Value |
|---|---|
| **Method** | `DELETE` |
| **Path** | `/api/customers/{customerId}/wardrobe/collections/{collectionId}/items/{itemId}` |
| **Authentication** | Required — Bearer token |
| **Path parameters** | `customerId: uuid`, `collectionId: uuid`, `itemId: uuid` |
| **Query parameters** | None |
| **Request body** | None |
| **Success status** | `204 No Content` |
| **Tested status** | **Swagger-only** |

**Success response:** Empty body; do not attempt JSON parsing.  
**Safe to test:** Yes (destructive but scoped to test data). Blocked by CONNECT tunnel.

---

## C. Fit Feedback

### C1. Submit Fit Feedback

| Field | Value |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/customers/{customerId}/feedback` |
| **Authentication** | Required — Bearer token |
| **Path parameters** | `customerId: uuid` |
| **Query parameters** | None |
| **Request body** | JSON object |
| **Success status** | `201 Created` |
| **Tested status** | **Swagger-only** |

**Request body schema (Swagger-derived):**

```json
{
  "orderId": "uuid",
  "orderItemId": "uuid",
  "productId": "uuid",
  "fitRating": "TooSmall | TrueToSize | TooLarge",
  "overallRating": 1,
  "comment": "string | null"
}
```

Required: `orderId`, `orderItemId`, `productId`, `fitRating`, `overallRating`.  
Nullable: `comment`.

**Enum values:**
- `fitRating`: `"TooSmall"`, `"TrueToSize"`, `"TooLarge"` (exact string values unconfirmed; numeric enum possible).
- `overallRating`: integer 1–5 (range unconfirmed).

**BLOCKER: This endpoint requires a real completed order with a valid `orderId` and `orderItemId`. These identifiers come from the Customer order history API, which is not yet confirmed or integrated. Fake order IDs must never be used.**

**Error responses:**

| Status | Code | Condition |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing or invalid token |
| `404` | `NOT_FOUND` | orderId or orderItemId not found |
| `409` | `CONFLICT` / `DUPLICATE_FEEDBACK` | Feedback already submitted for this item (unconfirmed) |
| `422` | `VALIDATION_ERROR` | Invalid body or enum value |
| `500` | `INTERNAL_ERROR` | Backend error |

**Frontend prerequisites:**
- Authenticated Customer session.
- Real completed order with confirmed `orderId` and `orderItemId`.
- Customer order history API integrated and returning real IDs.

**Safe to test:** NO — requires real order data. Do not use fake order IDs.

---

### C2. Get Feedback by Order

| Field | Value |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/customers/{customerId}/feedback/orders/{orderId}` |
| **Authentication** | Required — Bearer token |
| **Path parameters** | `customerId: uuid`, `orderId: uuid` |
| **Query parameters** | None |
| **Success status** | `200 OK` |
| **Tested status** | **Swagger-only** |

**Success response envelope (Swagger-derived):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "orderItemId": "uuid",
      "productId": "uuid",
      "fitRating": "TrueToSize",
      "overallRating": 5,
      "comment": "string | null",
      "submittedAt": "string (ISO 8601)"
    }
  ]
}
```

**Exact response shape is not confirmed.**  
**BLOCKER: Requires real `orderId`.**  
**Safe to test:** NO — requires real order data.

---

### C3. Product Fit Statistics

| Field | Value |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/catalog/products/{productId}/fit-statistics` |
| **Authentication** | Required or optional (unconfirmed) |
| **Path parameters** | `productId: uuid` |
| **Query parameters** | None |
| **Success status** | `200 OK` |
| **Tested status** | **Swagger-only** |

**Success response envelope (Swagger-derived):**

```json
{
  "success": true,
  "data": {
    "productId": "uuid",
    "totalFeedbackCount": 0,
    "tooSmallPercentage": 0.0,
    "trueToSizePercentage": 0.0,
    "tooLargePercentage": 0.0,
    "averageOverallRating": 0.0
  }
}
```

**Exact field names are not confirmed.**  
**Path may be under `/api/customers/{customerId}/feedback/products/{productId}/statistics` instead.**  
**Safe to test:** Possibly yes (read-only, no order required). Blocked by CONNECT tunnel.

---

## Endpoint Matrix

| # | Method | Path | Auth | Swagger | Deployed | Command |
|---|---|---|---|---|---|---|
| 1 | POST | `/api/customer/wardrobe/suggestions` | Required | Documented | Not tested | 19 |
| 2 | POST | `/api/customer/wardrobe/suggestions/save` | Required | Documented | Not tested | 19 |
| 3 | POST | `/api/catalog/products/by-model-ids` | Required | Documented | Not tested | 19 |
| 4 | GET | `/api/customers/{customerId}/wardrobe/collections` | Required | Documented | Not tested | 20 |
| 5 | POST | `/api/customers/{customerId}/wardrobe/collections` | Required | Documented | Not tested | 20 |
| 6 | PUT/PATCH | `/api/customers/{customerId}/wardrobe/collections/{collectionId}` | Required | Documented | Not tested | 20 |
| 7 | DELETE | `/api/customers/{customerId}/wardrobe/collections/{collectionId}` | Required | Documented | Not tested | 20 |
| 8 | GET | `/api/customers/{customerId}/wardrobe/collections/{collectionId}/items` | Required | Documented | Not tested | 20 |
| 9 | POST | `/api/customers/{customerId}/wardrobe/collections/{collectionId}/items` | Required | Documented | Not tested | 20 |
| 10 | DELETE | `/api/customers/{customerId}/wardrobe/collections/{collectionId}/items/{itemId}` | Required | Documented | Not tested | 20 |
| 11 | POST | `/api/customers/{customerId}/feedback` | Required | Documented | **Blocked** | 21 |
| 12 | GET | `/api/customers/{customerId}/feedback/orders/{orderId}` | Required | Documented | **Blocked** | 21 |
| 13 | GET | `/api/catalog/products/{productId}/fit-statistics` | Unconfirmed | Documented | Not tested | 21 |

---

## Unresolved schema questions

| # | Endpoint | Question |
|---|---|---|
| 1 | Suggestions generate | Are any request fields required, or is empty body valid? |
| 2 | Suggestions generate | Do response products always include `productId`, or only `modelId`? |
| 3 | Save suggestion | Does `suggestionId` reference the generate response ID? |
| 4 | Save suggestion | Are items required to be Customer Favorites (INVALID_OUTFIT_ITEMS guard)? |
| 5 | Collections update | Is the method PUT or PATCH? Is success 200 or 204? |
| 6 | Collections delete | Are items cascade-deleted, or does deletion fail when items exist? |
| 7 | Add collection item | Is duplicate product idempotent or 409? |
| 8 | Fit feedback | Exact `fitRating` enum strings (TooSmall/TrueToSize/TooLarge or numeric)? |
| 9 | Fit feedback | `overallRating` range (1–5 or other)? |
| 10 | Fit statistics | Exact path (`/catalog/products/{id}/fit-statistics` or customer-scoped)? |
| 11 | All collections | Exact item shape returned in collection item list |

---

## Blockers

| Blocker | Affects | Severity |
|---|---|---|
| CONNECT tunnel 403 — cannot reach deployed backend | All 13 endpoints | High — no deployed verification possible |
| Real completed order IDs required | Fit Feedback (C1, C2) | Hard block — Command 21 cannot be implemented safely without real orders |
| Customer order history API not integrated | Fit Feedback (C1, C2) | Prerequisite for Command 21 |
| Exact `suggestionId` contract unclear | Save suggestion (A2) | Medium — may require generate call first |
| Favorites prerequisite for save unconfirmed | Save suggestion (A2) | Medium — may cause 422 INVALID_OUTFIT_ITEMS |
| Collection update method/status unconfirmed | Collections update (B3) | Low-medium — needs Swagger check before implementation |
| `modelId` vs `productId` in suggestions response unclear | AI Suggestions (A1) | Medium — determines whether by-model-ids call is conditional or always required |

---

## Recommended implementation order for Commands 19–21

### Command 19 — AI Outfit Suggestions

1. Read generate endpoint Swagger carefully; confirm whether request body fields are required.
2. Implement `POST /api/customer/wardrobe/suggestions` adapter.
3. Confirm response shape: if products always include `productId`, skip by-model-ids; if `modelId` may be the only identifier, integrate `getProductsByModelIds` (adapter already exists).
4. Implement generate UI with loading, empty and error states.
5. Implement `POST /api/customer/wardrobe/suggestions/save` adapter; clarify `suggestionId` and Favorites prerequisite before using.
6. Add tests for adapters, query hooks and UI states.
7. Do not invent suggestion output or save success.

### Command 20 — Wardrobe Collections

1. Implement in this order: list → create → delete → update (least risk to most).
2. Confirm collection update method (PUT vs PATCH) and success status before implementation.
3. Reuse existing paginated result normalization from `outfits.api.ts`.
4. Implement items in this order: list items → add item → remove item.
5. Clarify duplicate-add behavior before implementing add-item.
6. Add destructive confirmation for delete collection.
7. Invalidate collection list after create/delete; invalidate item list after add/remove.

### Command 21 — Fit Feedback

1. Do not implement production feedback submission UI until real `orderId`/`orderItemId` exist.
2. Confirm `fitRating` enum values and `overallRating` range from Swagger before any implementation.
3. Confirm exact path for fit statistics endpoint.
4. Implement product fit statistics display only if it does not require order data (read-only, public or catalog-scoped).
5. Gate submit and order-feedback UI on confirmed real order presence.

---

## Backend testing rules applied

- No destructive requests were made against real user data.
- No JWTs or credentials were used or recorded.
- No fake order IDs were used.
- No backend was reachable; all schemas are Swagger-derived only.
- Raw response status from CONNECT tunnel: `403 Forbidden` from envoy proxy (same as Command 13).
