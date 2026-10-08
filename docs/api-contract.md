# Hợp đồng API mục tiêu
Base /v1; JSON camelCase, enum UPPER_SNAKE_CASE, UUID IDs, integer VND, timestamps ISO 8601. Swagger /docs là spec sinh từ code sau bước 3. Auth bearer verified backend. Lists trả {items,page,limit,total}; limit max 100. Lỗi {code,message,details,requestId}; không lộ SQL/stack/token.

| Method/path | Quyền / hành vi |
|---|---|
| GET /health, /ready | public minimal liveness/readiness |
| GET /stores, /categories, /products, /products/:id | public catalog; store availability |
| GET /me | authenticated profile |
| POST /checkout/quote | CUSTOMER, canonical cart→persisted quote |
| POST /orders | CUSTOMER, quoteId + cart, Idempotency-Key |
| GET /me/orders | owner list |
| GET /orders/:id, /orders/:id/history | owner / assigned staff / admin |
| POST /orders/:id/cancel | owner, PLACED, expectedVersion |
| GET /staff/orders | assigned staff/admin, scoped store |
| POST /staff/orders/:id/transitions | assigned staff/admin, toStatus+expectedVersion+reason |
| POST /staff/orders/:id/payments | assigned staff/admin, PAY_AT_COUNTER, expected payment version |
| PATCH /staff/stores/:storeId/variants/:variantId | assigned staff/admin, availability only |
| POST/PATCH /admin/categories, /admin/products | ADMIN; PATCH targets /:id |
| POST/PATCH /admin/products/:productId/variants | ADMIN; PATCH targets /:variantId |
| POST/PATCH /admin/modifier-groups, /admin/modifier-options | ADMIN; PATCH targets /:id |
| PUT /admin/products/:id/modifier-groups | ADMIN; replace validated group assignments |
| POST /admin/media/upload-url | ADMIN, validated Storage upload |

Quote request: {storeId,fulfillmentType:"PICKUP",paymentMethod:"PAY_AT_COUNTER",recipient:{name,phone},items:[{variantId,quantity,modifierOptionIds,note}]}.
Quote response: {quoteId,expiresAt,items,subtotalVnd,shippingFeeVnd:0,discountVnd:0,totalVnd}. Order request: quoteId plus same quote request fields; total supplied by client is not accepted as authoritative. Canonical hash includes recipient/store/items/method/type and note normalization; do not include changing transport/requestId data.
Order response: {id,code,status,version,payment,items,totals,createdAt}. Initial success 201; exact replay 200 with same order; replay auth still mandatory. Details/history private no-store.
Errors: 400 VALIDATION_ERROR; 401 UNAUTHENTICATED; 403 FORBIDDEN; 404 NOT_FOUND (can conceal unauthorized object); 409 PRICE_CHANGED/ITEM_UNAVAILABLE/IDEMPOTENCY_CONFLICT/INVALID_TRANSITION/VERSION_CONFLICT/QUOTE_ALREADY_USED; 410 QUOTE_EXPIRED; 429 RATE_LIMITED. Policy choices must be consistent in docs/tests/frontend.
Online payment/webhook endpoints are deferred; never mark paid based on browser redirect. When added, verify provider signatures, amount/currency/order binding and deduplicate event ID server-side.
