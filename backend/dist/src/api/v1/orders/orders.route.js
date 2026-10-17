import mongoose from 'mongoose';
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../../utils/async-handler.js';
import { envelope } from '../../../core/http/middleware.js';
import { zodValidate } from '../../../core/http/validate.js';
import { requireAuth, requireRole } from '../../../core/auth/middleware.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../../core/http/errors.js';
import { ProductModel } from '../products/product.model.js';
import { OrderModel, normalizeOrderStatus } from './order.model.js';
import { auditLog } from '../../../core/logging/audit.js';
import { CartModel } from '../cart/cart.model.js';
import { consolidateInventoryLines, reserveInventory, restoreInventory } from '../products/inventory.js';
import { updateOrderStatus } from './admin-order.service.js';
import { notifyNewOrder } from '../../../core/cache/invalidate.js';
import { emitRealtime } from '../../../core/realtime/hub.js';
const createOrderSchema = z.object({
    items: z
        .array(z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().min(1),
        variantSku: z.string().optional(),
        variantName: z.string().optional(),
    }))
        .min(1),
    shippingAddress: z.object({
        fullName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(1),
        address: z.string().min(1),
        city: z.string().min(1),
        postalCode: z.string().min(1),
    }),
    paymentMethod: z.enum(['cod', 'card', 'bkash', 'nagad', 'other']).default('cod'),
});
const updateStatusSchema = z.object({
    status: z.enum(['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'completed', 'cancelled']),
    note: z.string().trim().max(500).optional().default(''),
    notifyCustomer: z.boolean().optional().default(true),
});
const buildOrderNumber = () => `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
const isAdminRole = (role) => ['store_admin', 'platform_admin', 'platform_super_admin'].includes(role);
const cancelOrderAndRestoreStock = async (orderId) => {
    const order = await OrderModel.findOneAndUpdate({ _id: orderId, status: { $in: ['pending', 'confirmed', 'processing'] }, inventoryRestored: false }, { status: 'cancelled', inventoryRestored: true }, { new: true });
    if (!order)
        throw new BadRequestError('Only pending or processing orders can be cancelled');
    try {
        await restoreInventory(order.items.map((item) => ({ productId: item.productId.toString(), quantity: item.quantity })));
    }
    catch (error) {
        await OrderModel.updateOne({ _id: order._id }, { status: 'pending', inventoryRestored: false });
        throw error;
    }
    return order;
};
export const ordersRouter = Router();
ordersRouter.use(requireAuth);
ordersRouter.post('/', zodValidate(createOrderSchema), asyncHandler(async (req, res) => {
    const payload = req.body;
    const requestedItems = consolidateInventoryLines(payload.items);
    const productIds = requestedItems.map((item) => item.productId);
    if (!productIds.every((id) => mongoose.Types.ObjectId.isValid(id))) {
        throw new BadRequestError('Invalid product id in order items');
    }
    const products = await ProductModel.find({
        _id: { $in: productIds },
        status: 'active',
    }).lean();
    const productMap = new Map(products.map((product) => [product._id.toString(), product]));
    const items = requestedItems.map((item) => {
        const product = productMap.get(item.productId);
        if (!product)
            throw new NotFoundError(`Product not found: ${item.productId}`);
        const requestItem = payload.items.find((entry) => entry.productId === item.productId);
        const variant = (product.variants || []).find((entry) => entry.sku === requestItem?.variantSku);
        const unitPrice = variant?.price ?? product.finalPrice ?? product.discountPrice ?? product.price;
        return {
            productId: product._id,
            title: product.name || product.title,
            image: product.image,
            price: unitPrice,
            quantity: item.quantity,
            sku: product.sku || '',
            variantName: variant?.name || requestItem?.variantName || '',
            variantSku: variant?.sku || requestItem?.variantSku || '',
            isCombo: Boolean(product.isCombo || product.productType === 'combo'),
            comboItems: (product.comboItems || []).map((entry) => ({
                productId: entry.productId,
                title: '',
                quantity: entry.quantity || 1,
            })),
        };
    });
    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shippingFee = 100;
    const total = subtotal + shippingFee;
    await reserveInventory(requestedItems);
    let order;
    try {
        order = await OrderModel.create({
            orderNumber: buildOrderNumber(),
            userId: req.auth.sub,
            organizationId: req.auth.organizationId,
            items,
            shippingAddress: payload.shippingAddress,
            paymentMethod: payload.paymentMethod,
            paymentStatus: 'pending',
            status: 'pending',
            subtotal,
            shippingFee,
            total,
            inventoryRestored: false,
            timeline: [
                {
                    status: 'pending',
                    note: 'Order placed',
                    actorName: 'Customer',
                    createdAt: new Date(),
                },
            ],
        });
        await CartModel.updateOne({ userId: req.auth.sub }, { items: [] });
    }
    catch (error) {
        await restoreInventory(requestedItems);
        throw error;
    }
    auditLog(req, { action: 'order.create', targetType: 'Order', targetId: order._id.toString() });
    notifyNewOrder({
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
    });
    envelope.created(res, order);
}));
ordersRouter.get('/', asyncHandler(async (req, res) => {
    const role = req.auth.role;
    const query = isAdminRole(role) ? {} : { userId: req.auth.sub };
    const items = await OrderModel.find(query).sort({ createdAt: -1 }).lean();
    envelope.ok(res, items.map((item) => ({ ...item, status: normalizeOrderStatus(item.status) })));
}));
ordersRouter.get('/history', asyncHandler(async (req, res) => {
    const items = await OrderModel.find({ userId: req.auth.sub }).sort({ createdAt: -1 }).lean();
    envelope.ok(res, items.map((item) => ({ ...item, status: normalizeOrderStatus(item.status) })));
}));
ordersRouter.get('/:id', asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id))
        throw new BadRequestError('Invalid order id');
    const order = await OrderModel.findById(id).lean();
    if (!order)
        throw new NotFoundError('Order not found');
    if (order.userId.toString() !== req.auth.sub && !isAdminRole(req.auth.role)) {
        throw new ForbiddenError('Order access denied');
    }
    envelope.ok(res, { ...order, status: normalizeOrderStatus(order.status) });
}));
ordersRouter.post('/:id/cancel', asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id))
        throw new BadRequestError('Invalid order id');
    const order = await OrderModel.findById(id);
    if (!order)
        throw new NotFoundError('Order not found');
    if (order.userId.toString() !== req.auth.sub && !isAdminRole(req.auth.role)) {
        throw new ForbiddenError('Order access denied');
    }
    const cancelledOrder = await cancelOrderAndRestoreStock(id);
    auditLog(req, { action: 'order.cancel', targetType: 'Order', targetId: cancelledOrder._id.toString() });
    envelope.ok(res, cancelledOrder);
}));
ordersRouter.put('/:id', requireRole('store_admin', 'platform_admin', 'platform_super_admin'), zodValidate(updateStatusSchema), asyncHandler(async (req, res) => {
    const payload = req.body;
    const order = await updateOrderStatus(String(req.params.id), payload, {
        id: req.auth?.sub,
        name: req.auth?.email || 'Admin',
    });
    auditLog(req, { action: 'order.update_status', targetType: 'Order', targetId: String(order._id) });
    emitRealtime('admin:stats', { message: 'Order status changed', orderId: String(order._id) }, ['admin']);
    envelope.ok(res, order);
}));
