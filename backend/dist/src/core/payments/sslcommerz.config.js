/**
 * Shared SSLCommerz env — same store credentials across all Innovexa products.
 * Per-product: IPN + redirect URLs and PAYMENT_APP_SLUG.
 * See workspace SSLCOMMERZ_SHARED.md
 */
export function loadSslcommerzConfig(input) {
    const apiBase = process.env.API_PUBLIC_URL ??
        input.apiPublicUrl ??
        `http://localhost:${input.port}`;
    const clientBase = process.env.CLIENT_PUBLIC_URL ??
        input.clientPublicUrl ??
        'http://localhost:5173';
    const billingPath = input.defaultBillingHashPath ?? '/#/billing?payment=';
    return {
        enabled: Boolean(process.env.SSLCOMMERZ_STORE_ID && process.env.SSLCOMMERZ_STORE_PASSWORD),
        sandbox: (process.env.SSLCOMMERZ_SANDBOX ?? 'true').toLowerCase() === 'true',
        storeId: process.env.SSLCOMMERZ_STORE_ID ?? null,
        storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD ?? null,
        appSlug: process.env.PAYMENT_APP_SLUG ?? input.defaultAppSlug,
        ipnUrl: process.env.SSLCOMMERZ_IPN_URL ??
            `${apiBase}/api/v1/payments/sslcommerz/ipn`,
        successUrl: process.env.SSLCOMMERZ_SUCCESS_URL ??
            `${clientBase}${billingPath}success`,
        failUrl: process.env.SSLCOMMERZ_FAIL_URL ??
            `${clientBase}${billingPath}fail`,
        cancelUrl: process.env.SSLCOMMERZ_CANCEL_URL ??
            `${clientBase}${billingPath}cancel`,
    };
}
export function buildSslcommerzTranId(config, organizationId) {
    const suffix = `${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    return `${config.appSlug}_org_${organizationId}_${suffix}`;
}
