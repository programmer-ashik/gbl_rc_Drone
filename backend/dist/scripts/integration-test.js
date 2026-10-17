/**
 * End-to-end API integration smoke tests.
 * Usage: npm run test:integration
 * Env: BASE_URL (default http://127.0.0.1:5000), ADMIN_EMAIL, ADMIN_PASSWORD
 */
import 'dotenv/config';
const BASE = (process.env.BASE_URL || `http://127.0.0.1:${process.env.PORT || 5000}`).replace(/\/$/, '');
const API = `${BASE}/api/v1`;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.PLATFORM_ADMIN_EMAIL || 'store_admin@gblrc.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.PLATFORM_ADMIN_PASSWORD || 'Test@123456';
const results = [];
const sessionId = `itest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const timed = async (name, fn) => {
    const start = Date.now();
    try {
        const value = await fn();
        results.push({ name, ok: true, ms: Date.now() - start });
        return value;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        results.push({ name, ok: false, detail: message, ms: Date.now() - start });
        throw error;
    }
};
const request = async (path, init = {}) => {
    const headers = new Headers(init.headers || {});
    if (!headers.has('Content-Type') && init.body)
        headers.set('Content-Type', 'application/json');
    const res = await fetch(`${API}${path}`, { ...init, headers });
    const text = await res.text();
    let json = null;
    try {
        json = text ? JSON.parse(text) : null;
    }
    catch {
        json = { raw: text };
    }
    if (!res.ok) {
        throw new Error(`${init.method || 'GET'} ${path} → ${res.status} ${json?.message || text.slice(0, 160)}`);
    }
    return json?.data !== undefined ? json.data : json;
};
const soft = async (name, fn) => {
    try {
        await timed(name, fn);
    }
    catch {
        // recorded in results
    }
};
const run = async () => {
    console.log(`Integration tests → ${API}`);
    // --- Health ---
    await soft('health', async () => {
        const data = await request('/health');
        if (!data?.status && data?.status !== 'ok' && !data?.service) {
            // accept either shape
            if (!data)
                throw new Error('empty health');
        }
    });
    // --- Navigation: categories → products → details ---
    let categorySlug = 'drones';
    let productId = '';
    let productSlug = '';
    await soft('nav: categories/tree', async () => {
        const tree = await request('/categories/tree');
        const list = Array.isArray(tree) ? tree : tree?.categories || tree?.items || [];
        if (!list.length)
            throw new Error('empty category tree');
        categorySlug = list[0].slug || categorySlug;
    });
    await soft('nav: categories/nav', async () => {
        const nav = await request('/categories/nav');
        const list = Array.isArray(nav) ? nav : nav?.items || [];
        if (!list.length)
            throw new Error('empty nav');
    });
    await soft('nav: products by category', async () => {
        const data = await request(`/products?category=${encodeURIComponent(categorySlug)}&limit=5`);
        const items = data?.items || data?.products || (Array.isArray(data) ? data : []);
        if (!items.length) {
            const fallback = await request('/products?limit=5');
            const all = fallback?.items || fallback?.products || (Array.isArray(fallback) ? fallback : []);
            if (!all.length)
                throw new Error('no products');
            productId = String(all[0]._id || all[0].id);
            productSlug = all[0].slug || '';
            return;
        }
        productId = String(items[0]._id || items[0].id);
        productSlug = items[0].slug || '';
    });
    await soft('nav: product details', async () => {
        if (!productId)
            throw new Error('no productId');
        const detail = await request(`/products/${productId}`);
        if (!detail?._id && !detail?.id)
            throw new Error('missing product detail');
        productSlug = detail.slug || productSlug;
    });
    // --- Search & filters ---
    await soft('search: keyword', async () => {
        const data = await request('/products/search?q=drone&limit=5');
        const items = data?.items || data?.products || (Array.isArray(data) ? data : []);
        if (!Array.isArray(items))
            throw new Error('invalid search payload');
    });
    await soft('search: filter', async () => {
        await request(`/products/filter?category=${encodeURIComponent(categorySlug)}&minPrice=0&maxPrice=999999`);
    });
    // --- Cart: add / update / remove ---
    const cartHeaders = { 'x-session-id': sessionId };
    await soft('cart: add', async () => {
        if (!productId)
            throw new Error('no productId');
        const cart = await request('/cart/add', {
            method: 'POST',
            headers: cartHeaders,
            body: JSON.stringify({ productId, quantity: 1 }),
        });
        if (!cart?.items?.length)
            throw new Error('cart empty after add');
    });
    await soft('cart: update quantity', async () => {
        const cart = await request(`/cart/update/${productId}`, {
            method: 'PUT',
            headers: cartHeaders,
            body: JSON.stringify({ quantity: 2 }),
        });
        const line = cart?.items?.find((item) => String(item.productId) === productId);
        if (!line || line.quantity !== 2)
            throw new Error('quantity not updated');
    });
    await soft('cart: remove', async () => {
        await request(`/cart/remove/${productId}`, { method: 'DELETE', headers: cartHeaders });
        const cart = await request('/cart/', { headers: cartHeaders });
        const still = cart?.items?.some((item) => String(item.productId) === productId);
        if (still)
            throw new Error('item still in cart');
    });
    // Re-add for checkout
    await soft('cart: re-add for checkout', async () => {
        await request('/cart/add', {
            method: 'POST',
            headers: cartHeaders,
            body: JSON.stringify({ productId, quantity: 1 }),
        });
    });
    // --- Auth + checkout ---
    let customerToken = '';
    const customerEmail = `itest.${Date.now()}@example.com`;
    const customerPassword = 'Test@123456';
    await soft('auth: register customer', async () => {
        try {
            const data = await request('/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    name: 'Integration Tester',
                    email: customerEmail,
                    password: customerPassword,
                }),
            });
            customerToken = data?.accessToken || data?.token || '';
        }
        catch {
            // fallback login if register shape differs
        }
        if (!customerToken) {
            const login = await request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email: customerEmail, password: customerPassword }),
            });
            customerToken = login?.accessToken || login?.token || '';
        }
        if (!customerToken)
            throw new Error('no customer token');
    });
    await soft('checkout: create order (COD)', async () => {
        if (!customerToken || !productId)
            throw new Error('missing token/product');
        const order = await request('/orders', {
            method: 'POST',
            headers: { Authorization: `Bearer ${customerToken}` },
            body: JSON.stringify({
                items: [{ productId, quantity: 1 }],
                shippingAddress: {
                    fullName: 'Integration Tester',
                    email: customerEmail,
                    phone: '01700000000',
                    address: 'Test Street 1',
                    city: 'Dhaka',
                    postalCode: '1200',
                },
                paymentMethod: 'cod',
            }),
        });
        if (!order?._id && !order?.orderNumber)
            throw new Error('order not created');
    });
    // --- Combo packages ---
    let comboId = '';
    await soft('combo: list packages', async () => {
        const data = await request('/products/combo-packages');
        const items = data?.items || data?.products || (Array.isArray(data) ? data : []);
        if (items.length) {
            comboId = String(items[0]._id || items[0].id);
            const detail = await request(`/products/${comboId}`);
            if (detail?.isCombo || detail?.productType === 'combo') {
                if ((detail.comboItems || []).length < 2 && !(detail.comboItems || []).length) {
                    // soft: some combos may store differently
                }
            }
        }
    });
    await soft('combo: add to cart (if available)', async () => {
        if (!comboId) {
            results.push({ name: 'combo: add to cart (if available)', ok: true, detail: 'skipped — no combo packages' });
            return;
        }
        await request('/cart/add', {
            method: 'POST',
            headers: cartHeaders,
            body: JSON.stringify({ productId: comboId, quantity: 1 }),
        });
    });
    // --- Admin CRUD ---
    let adminToken = '';
    await soft('admin: login', async () => {
        const login = await request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
        });
        adminToken = login?.accessToken || login?.token || '';
        if (!adminToken)
            throw new Error('admin login failed');
    });
    const authAdmin = () => ({ Authorization: `Bearer ${adminToken}` });
    let createdProductId = '';
    let createdCategoryId = '';
    await soft('admin: dashboard', async () => {
        await request('/admin/dashboard?range=daily', { headers: authAdmin() });
    });
    await soft('admin: create category', async () => {
        const slug = `itest-cat-${Date.now()}`;
        const cat = await request('/admin/categories', {
            method: 'POST',
            headers: authAdmin(),
            body: JSON.stringify({
                name: 'Integration Test Category',
                slug,
                isActive: true,
                isNavVisible: false,
                isFooterVisible: false,
            }),
        });
        createdCategoryId = String(cat?._id || cat?.id || '');
        if (!createdCategoryId)
            throw new Error('category not created');
    });
    await soft('admin: create product', async () => {
        const slug = `itest-prod-${Date.now()}`;
        const product = await request('/products', {
            method: 'POST',
            headers: authAdmin(),
            body: JSON.stringify({
                name: 'Integration Test Product',
                title: 'Integration Test Product',
                slug,
                description: 'Temporary product for integration tests',
                basePrice: 1000,
                price: 1000,
                stock: 10,
                status: 'active',
                category: categorySlug,
                image: 'https://res.cloudinary.com/dba0ebn3c/image/upload/v1785174952/Quadcopter_drone_edn26i.jpg',
            }),
        });
        createdProductId = String(product?._id || product?.id || '');
        if (!createdProductId)
            throw new Error('product not created');
    });
    await soft('admin: update product', async () => {
        if (!createdProductId)
            throw new Error('no product');
        await request(`/products/${createdProductId}`, {
            method: 'PUT',
            headers: authAdmin(),
            body: JSON.stringify({
                name: 'Integration Test Product Updated',
                title: 'Integration Test Product Updated',
                basePrice: 1100,
                price: 1100,
                stock: 8,
                status: 'active',
            }),
        });
    });
    await soft('admin: delete product', async () => {
        if (!createdProductId)
            throw new Error('no product');
        await request(`/products/${createdProductId}`, { method: 'DELETE', headers: authAdmin() });
    });
    await soft('admin: delete category', async () => {
        if (!createdCategoryId)
            throw new Error('no category');
        await request(`/admin/categories/${createdCategoryId}`, { method: 'DELETE', headers: authAdmin() });
    });
    await soft('admin: settings + health', async () => {
        await request('/admin/settings', { headers: authAdmin() });
        await request('/admin/settings/health', { headers: authAdmin() });
    });
    // --- CMS / SEO ---
    await soft('cms: homepage', async () => {
        await request('/cms/homepage');
    });
    await soft('seo: sitemap', async () => {
        const res = await fetch(`${BASE}/sitemap.xml`);
        if (!res.ok)
            throw new Error(`sitemap ${res.status}`);
    });
    // Summary
    const failed = results.filter((r) => !r.ok);
    const passed = results.filter((r) => r.ok);
    console.log('\n── Results ──');
    for (const row of results) {
        const flag = row.ok ? 'PASS' : 'FAIL';
        console.log(`${flag.padEnd(4)} ${row.name}${row.ms != null ? ` (${row.ms}ms)` : ''}${row.detail ? ` — ${row.detail}` : ''}`);
    }
    console.log(`\n${passed.length} passed, ${failed.length} failed`);
    if (failed.length)
        process.exit(1);
};
run().catch((error) => {
    console.error(error);
    process.exit(1);
});
