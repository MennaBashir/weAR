# Customer Backend Contract Snapshot

## Source date

2026-06-14 refresh based on the updated Swagger, the backend integration guide and verified deployed API tests performed on 2026-06-13.

## Source precedence

1. Verified deployed behavior
2. Current Swagger/OpenAPI
3. Backend integration guide
4. Older repository docs

## Avatar

- Manual create uses root measurement fields plus source.
- Create returns an Avatar UUID in `response.data`.
- Measurement update includes `avatarId`, root fields and returns 204.
- Delete sends `{ avatarId }` in the DELETE body and returns 204.
- Photo extraction uses multipart `ImageFile` and `HeightCm`.
- History is paginated and includes `measurementDataJson`.
- Size recommendation exposes `recommendedSize`, `confidenceScore` and `justification`.

## Try-on

- Customer ID is auth-derived and in the URL.
- Create body uses `productId`, numeric `sessionType` and optional `avatarId`.
- The current Swagger does not require customerId or retailerId in the create body.
- Result fields include status, resultImageUrl, recommendedSize, confidenceScore and durationSeconds.
- Sessions are paginated.
- 2D uses resultImageUrl.
- The 3D URL is treated as an Avatar model unless a distinct Try-on model is confirmed.

## Saved Outfits: documented versus deployed

Verified deployed:

- list: 200 paginated
- create before Favorites: 422 `INVALID_OUTFIT_ITEMS`
- create after Favorites: 201 with UUID string in `data`
- delete: 204 empty body
- list after delete: zero items
- deleted ID detail: 404 `NOT_FOUND`

Confirmed defects:

- existing detail GET: 500 `INTERNAL_ERROR`
- existing update PUT: 500 `INTERNAL_ERROR`

The frontend implements list/create/delete and does not expose fake detail/edit behavior.

## AI Outfit Suggestions (Command 19 — runtime-verified generate, save Swagger-only)

- Generate: `POST /api/customer/wardrobe/suggestions` — **runtime-verified** (2026-06-14).
  - `weatherCondition` (string) confirmed required: HTTP 400 `errors.WeatherCondition` when omitted.
  - Deployed success response (two runtime tests, 2026-06-14): `{ "success": true, "data": [ { "title": "...", "description": "...", "matchPercentage": 95, "styleTags": [...], "items": [...] } ] }`.
  - Top-level fields confirmed: `title` (not `name`/`outfitName`), `description` (not `styleNotes`), `matchPercentage`, `styleTags`, `items` (not `products`). No `id`/`suggestionId`.
  - Item-level fields confirmed: `id`, `productId`, `slot` (string — "Top"; no numeric `slotType`), `displayOrder`, `productName`, `price`, `primaryImageUrl`, `stockStatus`.
  - Backend may return a subset of requested `productIds`; not a frontend error.
  - Adapter normalizes: `title`→`name`, `description`→`styleNotes`, `items`/`products`→`products`, `productName`→`name` (item), `slot` preserved display-only, embedded display fields preserved; no second product lookup needed.
  - Missing `suggestionId` does NOT drop the suggestion; `AiSuggestion.suggestionId` is `string | null`.
  - `slot` string is never coerced to numeric `slotType`; no enum mapping invented.
- Save: `POST /api/customer/wardrobe/suggestions/save` — **Swagger-only** (not deployed-verified; save blocked because tested generate response contained no `suggestionId`). Requires `suggestionId`, `items[]` with `productId`/`slotType`/`displayOrder`; 201 with UUID string in `data`. Strict response validation. All products must be resolved before save is permitted.
- Model ID resolution: `POST /api/catalog/products/by-model-ids` — adapter exists; called only when suggestion products have `modelId` without `productId`.
- INVALID_OUTFIT_ITEMS: handled with explicit guidance and link to Favorites; no automatic Favorites mutation.

## Wardrobe Collections (Swagger-only, Command 20)

- List: `GET /api/customers/{customerId}/wardrobe/collections` — paginated envelope (same shape as Outfits).
- Create: `POST /api/customers/{customerId}/wardrobe/collections` — `name` required; returns UUID string in `data`.
- Update: `PUT/PATCH /api/customers/{customerId}/wardrobe/collections/{id}` — exact method and success status (200/204) unconfirmed.
- Delete: `DELETE /api/customers/{customerId}/wardrobe/collections/{id}` — 204 expected; cascade behavior unconfirmed.
- List items: `GET /api/customers/{customerId}/wardrobe/collections/{id}/items` — paginated; exact item shape unconfirmed.
- Add item: `POST /api/customers/{customerId}/wardrobe/collections/{id}/items` — `productId` required; duplicate behavior unconfirmed.
- Remove item: `DELETE /api/customers/{customerId}/wardrobe/collections/{id}/items/{itemId}` — 204 expected.

## Fit Feedback (Swagger-only, Command 21 — blocked)

- Submit: `POST /api/customers/{customerId}/feedback` — requires real `orderId`, `orderItemId`, `productId`, `fitRating` enum and `overallRating` integer; never use fake IDs.
- By order: `GET /api/customers/{customerId}/feedback/orders/{orderId}` — requires real `orderId`.
- Statistics: `GET /api/catalog/products/{productId}/fit-statistics` — exact path unconfirmed; read-only, may not require order data.
- Hard blocker: Customer order history API not integrated; no real order IDs available.

## New Swagger areas

- AI Outfit Suggestions — see section above
- Save suggestion — see section above
- Wardrobe Collections and collection items — see section above
- Fit Feedback and product fit statistics — see section above
- Catalog product resolution by model IDs — see section above

## Known guide/Swagger conflicts

- Older guide examples included customerId/retailerId and string session type in Try-on body.
- Current Swagger defines auth-derived customerId in URL and numeric sessionType with optional avatarId.
- Favorites runtime uses the verified toggle endpoint.
- Outfit slot values and detail/update status follow Swagger plus verified runtime evidence; runtime defects remain documented.

## Security rule

Customer identity must always come from authenticated state and match token identity. Never accept customerId from user-controlled form data.
