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

## AI Outfit Suggestions (Command 19 — Swagger-only, implemented)

- Generate: `POST /api/customer/wardrobe/suggestions` — **partially runtime-verified**: `weatherCondition` (string) is confirmed required by deployed backend (HTTP 400 `errors.WeatherCondition: "The WeatherCondition field is required."` observed when omitted). Success response shape remains Swagger-only. Adapter supports documented `{ data: { suggestions: [...] } }` envelope and legacy `{ data: [...] }` direct-array shape. Field aliases: `id`/`suggestionId` → `suggestionId`; `outfitName`/`name` → `name`; `styleNotes` and `products[].reasoning` preserved. Submit guarded in UI until `weatherCondition` is non-empty.
- Save: `POST /api/customer/wardrobe/suggestions/save` — requires `suggestionId`, `items[]` with `productId`/`slotType`/`displayOrder`; 201 with UUID string in `data`. Strict response validation: only non-empty string accepted; throws `SuggestionApiError` otherwise. All products must be resolved (productId present, slotType numeric) before save is permitted — partial save not allowed.
- Model ID resolution: `POST /api/catalog/products/by-model-ids` — adapter exists; called only when suggestion products have `modelId` without `productId`.
- Unconfirmed: whether any generate field is required by the backend; whether Favorites prerequisite (INVALID_OUTFIT_ITEMS) applies to save. INVALID_OUTFIT_ITEMS handled with explicit guidance and link to Favorites; no automatic Favorites mutation.

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
