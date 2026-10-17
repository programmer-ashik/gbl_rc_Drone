import type { SslcommerzConfig } from './sslcommerz.config.js';
type SslcommerzInitResponse = {
    status?: string;
    failedreason?: string;
    GatewayPageURL?: string;
    sessionkey?: string;
    [k: string]: unknown;
};
type SslcommerzValidationResponse = {
    status?: string;
    val_id?: string;
    tran_id?: string;
    amount?: string;
    currency?: string;
    error?: string;
    [k: string]: unknown;
};
export declare function sslcommerzInitiatePayment(config: SslcommerzConfig, input: {
    tranId: string;
    amount: number;
    currency: string;
    productName: string;
    customerEmail: string;
}): Promise<{
    gatewayPageUrl: string;
    raw: SslcommerzInitResponse;
}>;
export declare function sslcommerzValidatePayment(config: SslcommerzConfig, input: {
    valId: string;
}): Promise<{
    raw: SslcommerzValidationResponse;
}>;
export {};
