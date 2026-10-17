import mongoose from 'mongoose';
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../../utils/async-handler.js';
import { envelope } from '../../../core/http/middleware.js';
import { zodValidate } from '../../../core/http/validate.js';
import { requireAuth } from '../../../core/auth/middleware.js';
import { verifyAccessToken } from '../../../core/auth/jwt.js';
import { BadRequestError, NotFoundError } from '../../../core/http/errors.js';
import { CartModel } from './cart.model.js';
import { ProductModel } from '../products/product.model.js';
import { auditLog } from '../../../core/logging/audit.js';
const addSchema = z.object({
    productId: z.string().min(1),
    quantity: z.coerce.number().int().min(1).default(1),
});
const updateSchema = z.object({
    quantity: z.coerce.number().int().min(1),
});
const sessionSchema = z.object({
    sessionId: z.string().min(1),
});
const getIdentity = (req) => {
    if (req.auth?.sub) {
        return { userId: req.auth.sub, sessionId: null, organizationId: req.auth.organizationId ?? null };
    }
    const sessionId = String(req.headers['x-session-id'] ?? '');
    if (!sessionId) {
        throw new BadRequestError('x-session-id header is required for guest cart');
    }
    return { userId: null, sessionId, organizationId: null };
};
const loadCart = async (identity) => {
    if (identity.userId) {
        return CartModel.findOne({ userId: identity.userId }).populate('items.productId').lean();
    }
    return CartModel.findOne({ sessionId: identity.sessionId }).populate('items.productId').lean();
};
const toCartResponse = (cart) => {
    const items = (cart?.items ?? [])
        .map((item) => {
        const product = item.productId;
        if (!product)
            return null;
        const unitPrice = product.discountPrice ?? product.price;
        return {
            productId: product._id.toString(),
            title: product.title,
            slug: product.slug,
            image: product.image,
            price: unitPrice,
            quantity: item.quantity,
            lineTotal: unitPrice * item.quantity,
            availableStock: product.stock,
            stockStatus: product.stockStatus,
            isAvailable: product.status === 'active' && product.stock >= item.quantity,
        };
    })
        .filter(Boolean);
    const subtotal = items.reduce((acc, item) => acc + item.lineTotal, 0);
    return {
        items,
        subtotal,
        totalItems: items.reduce((acc, item) => acc + item.quantity, 0),
    };
};
export const cartRouter = Router();
cartRouter.use((req, _res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        try {
            req.auth = verifyAccessToken(token);
        }
        catch {
            // Keep guest fallback for invalid token.
        }
    }
    next();
});
cartRouter.get('/', asyncHandler(async (req, res) => {
    const identity = getIdentity(req);
    const cart = await loadCart(identity);
    envelope.ok(res, toCartResponse(cart));
}));
cartRouter.post('/add', zodValidate(addSchema), asyncHandler(async (req, res) => {
    const identity = getIdentity(req);
    const { productId, quantity } = req.body;
    if (!mongoose.Types.ObjectId.isValid(productId))
        throw new BadRequestError('Invalid product id');
    const product = await ProductModel.findById(productId);
    if (!product || product.status !== 'active')
        throw new NotFoundError('Product not found');
    const query = identity.userId ? { userId: identity.userId } : { sessionId: identity.sessionId };
    const cart = await CartModel.findOne(query);
    const currentQuantity = cart?.items.find((item) => item.productId.toString() === productId)?.quantity ?? 0;
    if (product.stock < currentQuantity + quantity) {
        throw new BadRequestError(`Only ${product.stock} item(s) are available`);
    }
    if (!cart) {
        const createPayload = {
            items: [{ productId, quantity }],
        };
        // Omit null identity fields so partial unique indexes allow many guest carts
        if (identity.userId)
            createPayload.userId = identity.userId;
        if (identity.sessionId)
            createPayload.sessionId = identity.sessionId;
        if (identity.organizationId)
            createPayload.organizationId = identity.organizationId;
        await CartModel.create(createPayload);
    }
    else {
        const existing = cart.items.find((item) => item.productId.toString() === productId);
        if (existing)
            existing.quantity += quantity;
        else
            cart.items.push({ productId: new mongoose.Types.ObjectId(productId), quantity });
        await cart.save();
    }
    if (req.auth) {
        auditLog(req, { action: 'cart.add', targetType: 'Product', targetId: productId });
    }
    const freshCart = await loadCart(identity);
    envelope.ok(res, toCartResponse(freshCart));
}));
cartRouter.put('/update/:productId', zodValidate(updateSchema), asyncHandler(async (req, res) => {
    const identity = getIdentity(req);
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId))
        throw new BadRequestError('Invalid product id');
    const query = identity.userId ? { userId: identity.userId } : { sessionId: identity.sessionId };
    const cart = await CartModel.findOne(query);
    if (!cart)
        throw new NotFoundError('Cart not found');
    const line = cart.items.find((item) => item.productId.toString() === productId);
    if (!line)
        throw new NotFoundError('Cart item not found');
    const quantity = req.body.quantity;
    const product = await ProductModel.findOne({ _id: productId, status: 'active' }).lean();
    if (!product)
        throw new NotFoundError('Product not found');
    if (product.stock < quantity)
        throw new BadRequestError(`Only ${product.stock} item(s) are available`);
    line.quantity = quantity;
    await cart.save();
    const freshCart = await loadCart(identity);
    envelope.ok(res, toCartResponse(freshCart));
}));
cartRouter.delete('/remove/:productId', asyncHandler(async (req, res) => {
    const identity = getIdentity(req);
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId))
        throw new BadRequestError('Invalid product id');
    const query = identity.userId ? { userId: identity.userId } : { sessionId: identity.sessionId };
    const cart = await CartModel.findOne(query);
    if (!cart)
        throw new NotFoundError('Cart not found');
    cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
    await cart.save();
    const freshCart = await loadCart(identity);
    envelope.ok(res, toCartResponse(freshCart));
}));
cartRouter.post('/clear', asyncHandler(async (req, res) => {
    const identity = getIdentity(req);
    const query = identity.userId ? { userId: identity.userId } : { sessionId: identity.sessionId };
    const cart = await CartModel.findOne(query);
    if (cart) {
        cart.items = [];
        await cart.save();
    }
    envelope.ok(res, { cleared: true });
}));
cartRouter.post('/sync', requireAuth, zodValidate(sessionSchema), asyncHandler(async (req, res) => {
    const { sessionId } = req.body;
    const userId = req.auth.sub;
    const [userCart, guestCart] = await Promise.all([
        CartModel.findOne({ userId }),
        CartModel.findOne({ sessionId }),
    ]);
    if (!guestCart) {
        const fresh = await loadCart({ userId, sessionId: null, organizationId: req.auth.organizationId });
        envelope.ok(res, toCartResponse(fresh));
        return;
    }
    const target = userCart ?? new CartModel({ userId, sessionId: null, organizationId: req.auth.organizationId, items: [] });
    const productIds = guestCart.items.map((item) => item.productId);
    const products = await ProductModel.find({ _id: { $in: productIds }, status: 'active' }).select('_id stock').lean();
    const stockByProduct = new Map(products.map((product) => [product._id.toString(), product.stock]));
    for (const guestItem of guestCart.items) {
        const availableStock = stockByProduct.get(guestItem.productId.toString()) ?? 0;
        if (availableStock <= 0)
            continue;
        const existing = target.items.find((item) => item.productId.toString() === guestItem.productId.toString());
        if (existing)
            existing.quantity = Math.min(existing.quantity + guestItem.quantity, availableStock);
        else
            target.items.push({ productId: guestItem.productId, quantity: Math.min(guestItem.quantity, availableStock) });
    }
    await Promise.all([target.save(), CartModel.deleteOne({ _id: guestCart._id })]);
    auditLog(req, { action: 'cart.sync', targetType: 'Cart', targetId: target._id.toString() });
    const fresh = await loadCart({ userId, sessionId: null, organizationId: req.auth.organizationId });
    envelope.ok(res, toCartResponse(fresh));
}));
