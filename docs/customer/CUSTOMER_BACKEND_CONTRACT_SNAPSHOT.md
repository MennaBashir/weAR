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

## New Swagger areas

- AI Outfit Suggestions
- Save suggestion
- Wardrobe Collections and collection items
- Fit Feedback and product fit statistics
- Catalog product resolution by model IDs

## Known guide/Swagger conflicts

- Older guide examples included customerId/retailerId and string session type in Try-on body.
- Current Swagger defines auth-derived customerId in URL and numeric sessionType with optional avatarId.
- Favorites runtime uses the verified toggle endpoint.
- Outfit slot values and detail/update status follow Swagger plus verified runtime evidence; runtime defects remain documented.

## Security rule

Customer identity must always come from authenticated state and match token identity. Never accept customerId from user-controlled form data.
