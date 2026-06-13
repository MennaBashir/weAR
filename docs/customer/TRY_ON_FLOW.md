# Customer Try-on Flow

## Contract authority

Use verified runtime behavior first, then current Swagger, then the older integration guide.

## Entry

1. Customer opens Product Details.
2. Product ID is selected from backend catalog data.
3. Size/color remain UI selections unless Swagger explicitly includes them in the create payload.
4. Customer identity comes from authenticated state.
5. Active Avatar is checked.
6. Without a product, `/customer/try-on` shows the valid `No product selected` state.

## Create request

`POST /api/customers/{customerId}/try-on`

- `customerId` is auth-derived and appears in the URL.
- Request body:

```json
{
  "productId": "uuid",
  "sessionType": 0,
  "avatarId": "uuid-or-null"
}
```

- `sessionType` remains a numeric enum until stable enum names are published.
- Do not add `customerId` or `retailerId` to the body unless a later Swagger version requires them.

## Result

Normalize:

- `status`
- `resultImageUrl`
- `recommendedSize`
- `confidenceScore`
- `durationSeconds`

The 2D view uses `resultImageUrl` and is the mandatory fallback.

## 3D semantics

Use the active Avatar `avatar3dModelUrl` unless Try-on explicitly returns a distinct model. Do not claim the Avatar GLB includes the selected garment without backend confirmation.

Keep:

- lazy `@google/model-viewer`
- URL validation
- viewer error boundary
- 2D fallback if model loading fails

## History

`GET /api/customers/{customerId}/try-on/sessions` is paginated. Normalize pagination and session fields including IDs, status, result, recommendation/confidence, duration and created time.

## Retry and Cart

Retry preserves product/selections and must not duplicate an in-flight request. Add to Cart remains local/frontend-only until a Customer cart backend exists.
