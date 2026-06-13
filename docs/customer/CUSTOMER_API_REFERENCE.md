# Customer API Reference

This is a compact implementation index. Swagger remains the full contract.

## Authentication
| Method | Endpoint | Use |
|---|---|---|
| POST | `/api/customer/auth/register` | Registration step 1. |
| POST | `/api/customer/auth/complete-profile` | Registration step 2. |
| POST | `/api/customer/auth/login` | Customer login. |
| POST | `/api/customer/auth/login/google` | Google login. |
| POST | `/api/customer/auth/refresh` | Rotate access/refresh tokens. |
| POST | `/api/customer/auth/logout` | Revoke session. |
| POST | `/api/customer/auth/forgot-password` | Request OTP. |
| POST | `/api/customer/auth/reset-password` | Reset with OTP. |

## Profile and addresses
| Method | Endpoint | Use |
|---|---|---|
| GET / PUT | `/api/customer/profile` | Read/update profile. |
| POST | `/api/customer/profile/change-password` | Change password. |
| POST | `/api/customer/profile/delete-account` | Delete account. |
| GET / POST | `/api/customer/addresses` | List/create addresses. |
| GET / PUT / DELETE | `/api/customer/addresses/{id}` | Address detail/update/delete. |
| PATCH | `/api/customer/addresses/{id}/default` | Set default address. |

## Catalog
| Method | Endpoint | Use |
|---|---|---|
| GET | `/api/catalog/products` | Browse products with retailer/category/search/price/multi-select filters, sorting and pagination. |
| GET | `/api/catalog/products/{productId}` | Product detail. |
| GET | `/api/catalog/products/{productId}/similar?limit=8` | Similar products. |
| POST | `/api/catalog/products/compare` | Compare 2–4 products. |
| POST | `/api/catalog/products/by-model-ids` | Resolve AI model IDs to product cards. |
| GET | `/api/catalog/categories` | Categories with counts. |
| GET | `/api/catalog/offers` | Active offers. |

## Favorites
| Method | Endpoint | Use |
|---|---|---|
| POST | `/api/customers/{customerId}/favorites/toggle` | Toggle favorite. |
| GET | `/api/customers/{customerId}/favorites` | Favorites list. |
| POST | `/api/customers/{customerId}/favorites/check` | Batch/check favorite state. |

Use optimistic updates only with rollback on failure and invalidate the favorites list plus affected product detail/card queries.

## Avatar
| Method | Endpoint | Use |
|---|---|---|
| GET | `/api/customers/{customerId}/avatar` | Active avatar; 404 means none. |
| POST | `/api/customers/{customerId}/avatar` | Create from manual measurements. |
| DELETE | `/api/customers/{customerId}/avatar` | Soft-delete avatar. |
| GET | `/api/customers/{customerId}/avatar/history` | Paginated measurement history. |
| PATCH | `/api/customers/{customerId}/avatar/measurements` | Replace measurements and append history snapshot. |
| GET | `/api/customers/{customerId}/avatar/size-recommendation/{productId}` | Product size recommendation. |
| POST | `/api/customers/{customerId}/avatar/extract-from-image` | Extract measurements and best-effort GLB avatar. |

### Image extraction rules
- `multipart/form-data`
- Field `imageFile`: one JPEG or PNG, max 5 MB.
- Field `heightCm`: required, 1–300.
- Do not manually set the multipart `Content-Type` header.
- The authenticated customer ID must match the path customer ID.
- `avatar3dModelUrl` may be null even on success.
- Null measurement values render as `—`.

## Outfits and recommendations
| Method | Endpoint | Use |
|---|---|---|
| GET / POST | `/api/customers/{customerId}/outfits` | List/create saved outfits. |
| GET / PUT / DELETE | `/api/customers/{customerId}/outfits/{outfitId}` | Outfit detail/update/delete. |
| GET | `/api/customers/{customerId}/outfits/complementary?productId={productId}&topK=4` | Complementary products where available in deployed backend. |

For complementary products, an empty array means the section should be hidden silently.

## Try-on
| Method | Endpoint | Use |
|---|---|---|
| POST | `/api/customers/{customerId}/try-on` | Start `Overlay2D`, `Model3D` or `ARLiveView` session. |
| GET | `/api/customers/{customerId}/try-on/sessions` | Try-on history. |
| GET | `/api/customers/{customerId}/try-on/sessions/{sessionId}` | Session detail. |
| GET | `/api/customers/{customerId}/products/{productId}/sessions` | Product-specific try-on sessions. |

### Try-on response handling
- Treat `resultImageUrl` by content/extension: image for 2D, `.glb` for 3D scene.
- Do not initialize WebGL until the user explicitly opens 3D.
- Generation may take roughly 12–24 seconds; use meaningful staged progress rather than a fake instant spinner.
- If 3D is unavailable, preserve the 2D path and explain the fallback without blocking the user.

## API-layer implementation rules
- Create domain adapters under `src/features/customer/api/`.
- Centralize envelope unwrapping and error normalization.
- Define TanStack Query keys per domain.
- Pass `AbortSignal` to cancellable reads where supported.
- Never duplicate token injection already handled by `apiClient`.
- Never build request URLs from untrusted customer IDs.

## Updated Customer contract notes (2026-06-14)

- Source precedence: deployed behavior → Swagger → integration guide → older docs.
- Avatar manual payloads are root-level; update/delete require avatarId and return 204.
- Avatar extraction multipart names are ImageFile and HeightCm.
- Try-on create body is productId + numeric sessionType + optional avatarId; customerId is in the URL.
- Saved Outfits list/create/delete are verified; existing detail/update currently return backend 500 errors.
- AI Suggestions, Wardrobe Collections and Fit Feedback are documented but not yet integrated.
