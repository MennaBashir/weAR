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
