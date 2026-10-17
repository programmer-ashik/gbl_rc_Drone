import { BadRequestError } from '../http/errors.js';
function getBaseUrl(config) {
    return config.sandbox
        ? 'https://sandbox.sslcommerz.com'
        : 'https://securepay.sslcommerz.com';
}
function assertConfigured(config) {
    const storeId = config.storeId;
    const storePassword = config.storePassword;
    if (!config.enabled || !storeId || !storePassword) {
        throw new BadRequestError('SSLCommerz is not configured on this server', {
            code: 'SSLCOMMERZ_NOT_CONFIGURED',
        });
    }
    return { storeId, storePassword };
}
export async function sslcommerzInitiatePayment(config, input) {
    const { storeId, storePassword } = assertConfigured(config);
    const form = new URLSearchParams();
    form.set('store_id', storeId);
    form.set('store_passwd', storePassword);
    form.set('total_amount', String(input.amount));
    form.set('currency', input.currency);
    form.set('tran_id', input.tranId);
    form.set('success_url', config.successUrl);
    form.set('fail_url', config.failUrl);
    form.set('cancel_url', config.cancelUrl);
    form.set('ipn_url', config.ipnUrl);
    form.set('product_name', input.productName);
    form.set('product_category', 'subscription');
    form.set('product_profile', 'general');
    form.set('cus_email', input.customerEmail);
    form.set('cus_name', input.customerEmail);
    const resp = await fetch(`${getBaseUrl(config)}/gwprocess/v4/api.php`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: form,
    });
    const bodyText = await resp.text();
    let raw;
    try {
        raw = JSON.parse(bodyText);
    }
    catch {
        throw new BadRequestError('SSLCommerz initiate returned non-JSON response', {
            httpStatus: resp.status,
            bodySnippet: bodyText.slice(0, 240),
        });
    }
    const gatewayPageUrl = raw.GatewayPageURL ??
        (typeof raw.gateway_page_url === 'string' ? raw.gateway_page_url : undefined);
    if (!resp.ok || !gatewayPageUrl) {
        throw new BadRequestError('Failed to initiate SSLCommerz payment', {
            status: raw.status,
            failedreason: raw.failedreason,
        });
    }
    return { gatewayPageUrl, raw };
}
export async function sslcommerzValidatePayment(config, input) {
    const { storeId, storePassword } = assertConfigured(config);
    const url = new URL(`${getBaseUrl(config)}/validator/api/validationserverAPI.php`);
    url.searchParams.set('val_id', input.valId);
    url.searchParams.set('store_id', storeId);
    url.searchParams.set('store_passwd', storePassword);
    url.searchParams.set('v', '1');
    url.searchParams.set('format', 'json');
    const resp = await fetch(url.toString(), { method: 'GET' });
    const bodyText = await resp.text();
    let raw;
    try {
        raw = JSON.parse(bodyText);
    }
    catch {
        throw new BadRequestError('SSLCommerz validation returned non-JSON response', {
            httpStatus: resp.status,
            bodySnippet: bodyText.slice(0, 240),
        });
    }
    if (!resp.ok) {
        throw new BadRequestError('SSLCommerz validation request failed', {
            status: raw.status,
        });
    }
    return { raw };
}
//# sourceMappingURL=sslcommerz.client.js.map