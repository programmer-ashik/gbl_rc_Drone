/**
 * Shared SSLCommerz env — same store credentials across all Innovexa products.
 * Per-product: IPN + redirect URLs and PAYMENT_APP_SLUG.
 * See workspace SSLCOMMERZ_SHARED.md
 */
export type SslcommerzConfig = {
    enabled: boolean;
    sandbox: boolean;
    storeId: string | null;
    storePassword: string | null;
    appSlug: string;
    ipnUrl: string;
    successUrl: string;
    failUrl: string;
    cancelUrl: string;
};
export declare function loadSslcommerzConfig(input: {
    port: number;
    apiPublicUrl?: string;
    clientPublicUrl?: string;
    defaultAppSlug: string;
    defaultBillingHashPath?: string;
}): SslcommerzConfig;
export declare function buildSslcommerzTranId(config: Pick<SslcommerzConfig, 'appSlug'>, organizationId: string): string;
