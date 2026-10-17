# Payments — scaffold

Shared **SSLCommerz** client for all Innovexa products. One sandbox merchant account; per-product IPN and redirect URLs.

**Workspace guide:** [`../../../../SSLCOMMERZ_SHARED.md`](../../../../SSLCOMMERZ_SHARED.md)  
**Reference app:** `backend/src/api/v1/payments/`

## Files

- `sslcommerz.config.ts` — env parsing + `buildSslcommerzTranId()`
- `sslcommerz.client.ts` — initiate + validation API calls

## Env (copy store creds from workspace `.env.sslcommerz.example`)

```env
PAYMENT_APP_SLUG=<product-slug>
SSLCOMMERZ_SANDBOX=true
SSLCOMMERZ_STORE_ID=...
SSLCOMMERZ_STORE_PASSWORD=...
SSLCOMMERZ_IPN_URL=http://localhost:<port>/api/v1/payments/sslcommerz/ipn
SSLCOMMERZ_SUCCESS_URL=http://localhost:5173/#/billing?payment=success
SSLCOMMERZ_FAIL_URL=http://localhost:5173/#/billing?payment=fail
SSLCOMMERZ_CANCEL_URL=http://localhost:5173/#/billing?payment=cancel
```

When porting to a JS backend, copy these files and adjust imports to your error types.
