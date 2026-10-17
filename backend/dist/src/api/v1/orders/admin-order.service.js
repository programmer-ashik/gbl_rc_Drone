import mongoose from 'mongoose';
import { z } from 'zod';
import { BadRequestError, NotFoundError } from '../../../core/http/errors.js';
import { sendCustomerEmail, statusChangeEmail } from '../../../core/mail/mailer.js';
import { emitRealtime } from '../../../core/realtime/hub.js';
import { UserModel } from '../users/user.model.js';
import { ProductModel } from '../products/product.model.js';
import { restoreInventory } from '../products/inventory.js';
import { ORDER_TRANSITIONS, OrderModel, normalizeOrderStatus, } from './order.model.js';
const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const orderListQuerySchema = z.object({
    search: z.string().trim().max(120).optional(),
    status: z
        .enum(['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'completed', 'cancelled', 'all'])
        .optional()
        .default('all'),
    paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded', 'all']).optional().default('all'),
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(20),
});
export const updateOrderStatusSchema = z.object({
    status: z.enum(['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'completed', 'cancelled']),
    note: z.string().trim().max(500).optional().default(''),
    notifyCustomer: z.boolean().optional().default(true),
});
export const bulkOrderSchema = z.object({
    ids: z.array(objectIdSchema).min(1).max(200),
    action: z.enum(['status', 'paymentStatus']),
    status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled']).optional(),
    paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
    note: z.string().trim().max(500).optional().default(''),
    notifyCustomer: z.boolean().optional().default(true),
});
export const orderNoteSchema = z.object({
    body: z.string().trim().min(1).max(2000),
});
export const emailCustomerSchema = z.object({
    subject: z.string().trim().min(1).max(160),
    body: z.string().trim().min(1).max(5000),
});
const startOfDay = (value) => {
    if (!value)
        return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return null;
    date.setHours(0, 0, 0, 0);
    return date;
};
const endOfDay = (value) => {
    if (!value)
        return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return null;
    date.setHours(23, 59, 59, 999);
    return date;
};
export const buildOrderFilter = (query) => {
    const filter = {};
    if (query.status && query.status !== 'all') {
        if (query.status === 'processing')
            filter.status = { $in: ['processing', 'confirmed'] };
        else
            filter.status = query.status;
    }
    if (query.paymentStatus && query.paymentStatus !== 'all')
        filter.paymentStatus = query.paymentStatus;
    const from = startOfDay(query.from);
    const to = endOfDay(query.to);
    if (from || to) {
        filter.createdAt = {};
        if (from)
            filter.createdAt.$gte = from;
        if (to)
            filter.createdAt.$lte = to;
    }
    if (query.search) {
        const pattern = new RegExp(escapeRegex(query.search), 'i');
        filter.$or = [
            { orderNumber: pattern },
            { 'shippingAddress.fullName': pattern },
            { 'shippingAddress.email': pattern },
            { 'shippingAddress.phone': pattern },
            { transactionId: pattern },
        ];
    }
    return filter;
};
export const listAdminOrders = async (rawQuery) => {
    const query = orderListQuerySchema.parse(rawQuery);
    const filter = buildOrderFilter(query);
    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
        OrderModel.find(filter)
            .populate('userId', 'name email phone role isBlocked')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(query.limit)
            .lean(),
        OrderModel.countDocuments(filter),
    ]);
    return {
        items: items.map((item) => ({
            ...item,
            status: normalizeOrderStatus(item.status),
            customer: item.userId,
        })),
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
};
export const getAdminOrder = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id) && !String(id).startsWith('ORD-')) {
        throw new BadRequestError('Invalid order id');
    }
    const order = mongoose.Types.ObjectId.isValid(id)
        ? await OrderModel.findById(id)
            .populate('userId', 'name email phone role isBlocked addresses createdAt')
            .lean()
        : await OrderModel.findOne({ orderNumber: id })
            .populate('userId', 'name email phone role isBlocked addresses createdAt')
            .lean();
    if (!order)
        throw new NotFoundError('Order not found');
    return {
        ...order,
        status: normalizeOrderStatus(order.status),
        customer: order.userId,
        nextStatuses: ORDER_TRANSITIONS[normalizeOrderStatus(order.status)] || [],
    };
};
const cancelAndRestore = async (order) => {
    if (!['pending', 'processing', 'confirmed'].includes(order.status)) {
        throw new BadRequestError('Only pending or processing orders can be cancelled');
    }
    if (!order.inventoryRestored) {
        await restoreInventory(order.items.map((item) => ({
            productId: item.productId.toString(),
            quantity: item.quantity,
        })));
        order.inventoryRestored = true;
    }
    order.status = 'cancelled';
    return order;
};
export const updateOrderStatus = async (id, payload, actor) => {
    if (!mongoose.Types.ObjectId.isValid(id))
        throw new BadRequestError('Invalid order id');
    const order = await OrderModel.findById(id);
    if (!order)
        throw new NotFoundError('Order not found');
    const current = normalizeOrderStatus(order.status);
    let next = normalizeOrderStatus(payload.status);
    if (payload.status === 'confirmed')
        next = 'processing';
    if (current === next)
        return getAdminOrder(id);
    const allowed = ORDER_TRANSITIONS[current] || [];
    if (!allowed.includes(next) && !(current === 'confirmed' && next === 'processing')) {
        throw new BadRequestError(`Cannot move order from ${current} to ${next}`);
    }
    if (next === 'cancelled')
        await cancelAndRestore(order);
    else
        order.status = next;
    if (next === 'completed' && order.paymentMethod === 'cod') {
        order.paymentStatus = 'paid';
    }
    order.timeline = order.timeline || [];
    order.timeline.push({
        status: next,
        note: payload.note || `Status updated to ${next}`,
        actorId: actor?.id || null,
        actorName: actor?.name || 'Admin',
        createdAt: new Date(),
    });
    if (payload.notifyCustomer !== false && order.shippingAddress?.email) {
        const mail = await sendCustomerEmail(statusChangeEmail({
            orderNumber: order.orderNumber,
            status: next,
            shippingAddress: order.shippingAddress,
        }));
        order.emailLog = order.emailLog || [];
        order.emailLog.push(mail);
    }
    await order.save();
    emitRealtime('admin:stats', { message: 'Order status changed', orderId: id }, ['admin']);
    return getAdminOrder(id);
};
export const bulkUpdateOrders = async (payload, actor) => {
    let updated = 0;
    const errors = [];
    for (const id of payload.ids) {
        try {
            if (payload.action === 'status') {
                if (!payload.status)
                    throw new BadRequestError('Status is required');
                await updateOrderStatus(id, { status: payload.status, note: payload.note, notifyCustomer: payload.notifyCustomer }, actor);
            }
            else {
                if (!payload.paymentStatus)
                    throw new BadRequestError('Payment status is required');
                const order = await OrderModel.findById(id);
                if (!order)
                    throw new NotFoundError('Order not found');
                order.paymentStatus = payload.paymentStatus;
                order.timeline = order.timeline || [];
                order.timeline.push({
                    status: normalizeOrderStatus(order.status),
                    note: payload.note || `Payment marked ${payload.paymentStatus}`,
                    actorId: actor?.id || null,
                    actorName: actor?.name || 'Admin',
                    createdAt: new Date(),
                });
                await order.save();
            }
            updated += 1;
        }
        catch (error) {
            errors.push({ id, message: error instanceof Error ? error.message : 'Update failed' });
        }
    }
    return { updated, errors, total: payload.ids.length };
};
export const addOrderNote = async (id, body, actor) => {
    if (!mongoose.Types.ObjectId.isValid(id))
        throw new BadRequestError('Invalid order id');
    const order = await OrderModel.findById(id);
    if (!order)
        throw new NotFoundError('Order not found');
    order.notes = order.notes || [];
    order.notes.push({
        body,
        actorId: actor?.id || null,
        actorName: actor?.name || 'Admin',
        createdAt: new Date(),
    });
    await order.save();
    return getAdminOrder(id);
};
export const emailOrderCustomer = async (id, payload) => {
    const order = await getAdminOrder(id);
    const to = order.shippingAddress?.email || order.customer?.email;
    if (!to)
        throw new BadRequestError('Customer email is missing');
    const mail = await sendCustomerEmail({
        to,
        subject: payload.subject,
        body: payload.body,
        kind: 'manual',
    });
    await OrderModel.updateOne({ _id: order._id }, { $push: { emailLog: mail } });
    return { sent: true, mail };
};
export const invoicePayload = async (id) => {
    const order = await getAdminOrder(id);
    return {
        invoiceNumber: `INV-${order.orderNumber}`,
        issuedAt: new Date().toISOString(),
        order,
    };
};
const rangeStart = (days) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - days);
    return date;
};
export const getOrderAnalytics = async (range = 'daily') => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = rangeStart(6);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const usersWeekStart = rangeStart(6);
    const paidMatch = { status: { $nin: ['cancelled'] } };
    const chartStart = range === 'monthly' ? monthStart : range === 'weekly' ? weekStart : weekStart;
    const chartFormat = range === 'monthly' ? '%Y-%m-%d' : '%Y-%m-%d';
    const [todayOrders, weekOrders, monthOrders, todayRevenue, weekRevenue, monthRevenue, statusBreakdown, paymentBreakdown, revenueByDay, topProducts, recentOrders, newUsersByDay, newUsersCount,] = await Promise.all([
        OrderModel.countDocuments({ createdAt: { $gte: todayStart }, ...paidMatch }),
        OrderModel.countDocuments({ createdAt: { $gte: weekStart }, ...paidMatch }),
        OrderModel.countDocuments({ createdAt: { $gte: monthStart }, ...paidMatch }),
        OrderModel.aggregate([
            { $match: { createdAt: { $gte: todayStart }, ...paidMatch } },
            { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
        OrderModel.aggregate([
            { $match: { createdAt: { $gte: weekStart }, ...paidMatch } },
            { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
        OrderModel.aggregate([
            { $match: { createdAt: { $gte: monthStart }, ...paidMatch } },
            { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
        OrderModel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
        OrderModel.aggregate([{ $group: { _id: '$paymentStatus', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
        OrderModel.aggregate([
            { $match: { createdAt: { $gte: chartStart }, ...paidMatch } },
            {
                $group: {
                    _id: { $dateToString: { format: chartFormat, date: '$createdAt' } },
                    revenue: { $sum: '$total' },
                    orders: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]),
        OrderModel.aggregate([
            { $match: paidMatch },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.productId',
                    title: { $first: '$items.title' },
                    image: { $first: '$items.image' },
                    quantity: { $sum: '$items.quantity' },
                    revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                },
            },
            { $sort: { quantity: -1 } },
            { $limit: 8 },
        ]),
        OrderModel.find()
            .sort({ createdAt: -1 })
            .limit(8)
            .select('orderNumber total status paymentStatus shippingAddress createdAt')
            .lean(),
        UserModel.aggregate([
            { $match: { createdAt: { $gte: usersWeekStart }, role: 'customer' } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]),
        UserModel.countDocuments({ createdAt: { $gte: usersWeekStart }, role: 'customer' }),
    ]);
    const statusMap = new Map();
    statusBreakdown.forEach((row) => {
        const key = normalizeOrderStatus(row._id);
        statusMap.set(key, (statusMap.get(key) || 0) + row.count);
    });
    return {
        range,
        realtime: {
            today: { orders: todayOrders, revenue: todayRevenue[0]?.total || 0 },
            week: { orders: weekOrders, revenue: weekRevenue[0]?.total || 0 },
            month: { orders: monthOrders, revenue: monthRevenue[0]?.total || 0 },
        },
        statusBreakdown: [...statusMap.entries()].map(([status, count]) => ({ status, count })),
        paymentBreakdown: paymentBreakdown.map((row) => ({
            status: row._id || 'pending',
            count: row.count,
        })),
        revenueByDay,
        topProducts,
        recentOrders: recentOrders.map((order) => ({
            ...order,
            status: normalizeOrderStatus(order.status),
            customer: order.shippingAddress?.fullName || order.shippingAddress?.email || '—',
        })),
        newUsers: {
            total: newUsersCount,
            byDay: newUsersByDay,
        },
    };
};
export const listAdminUsers = async (rawQuery) => {
    const search = typeof rawQuery.search === 'string' ? rawQuery.search.trim() : '';
    const role = typeof rawQuery.role === 'string' ? rawQuery.role : 'all';
    const blocked = typeof rawQuery.blocked === 'string' ? rawQuery.blocked : 'all';
    const page = Math.max(1, Number(rawQuery.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(rawQuery.limit) || 20));
    const filter = {};
    if (search) {
        const pattern = new RegExp(escapeRegex(search), 'i');
        filter.$or = [{ name: pattern }, { email: pattern }, { phone: pattern }];
    }
    if (role !== 'all')
        filter.role = role;
    if (blocked === 'true')
        filter.isBlocked = true;
    if (blocked === 'false')
        filter.isBlocked = { $ne: true };
    const [users, total] = await Promise.all([
        UserModel.find(filter).select('-password -refreshTokenHash').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        UserModel.countDocuments(filter),
    ]);
    const ids = users.map((user) => user._id);
    const stats = await OrderModel.aggregate([
        { $match: { userId: { $in: ids }, status: { $ne: 'cancelled' } } },
        {
            $group: {
                _id: '$userId',
                ordersCount: { $sum: 1 },
                totalSpent: { $sum: '$total' },
            },
        },
    ]);
    const statsMap = new Map(stats.map((row) => [String(row._id), row]));
    return {
        items: users.map((user) => {
            const row = statsMap.get(String(user._id));
            return {
                ...user,
                ordersCount: row?.ordersCount || 0,
                totalSpent: row?.totalSpent || 0,
            };
        }),
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
    };
};
export const getAdminUser = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id))
        throw new BadRequestError('Invalid user id');
    const user = await UserModel.findById(id).select('-password -refreshTokenHash').lean();
    if (!user)
        throw new NotFoundError('User not found');
    const orders = await OrderModel.find({ userId: id }).sort({ createdAt: -1 }).limit(50).lean();
    const totals = await OrderModel.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(id), status: { $ne: 'cancelled' } } },
        { $group: { _id: null, ordersCount: { $sum: 1 }, totalSpent: { $sum: '$total' } } },
    ]);
    const addressFromOrders = orders
        .map((order) => order.shippingAddress)
        .filter(Boolean)
        .slice(0, 5);
    return {
        ...user,
        orders,
        ordersCount: totals[0]?.ordersCount || 0,
        totalSpent: totals[0]?.totalSpent || 0,
        addresses: user.addresses?.length ? user.addresses : addressFromOrders,
    };
};
export const updateAdminUser = async (id, payload) => {
    if (!mongoose.Types.ObjectId.isValid(id))
        throw new BadRequestError('Invalid user id');
    const user = await UserModel.findById(id);
    if (!user)
        throw new NotFoundError('User not found');
    if (payload.isBlocked !== undefined)
        user.isBlocked = payload.isBlocked;
    if (payload.role) {
        if (!['customer', 'store_admin', 'platform_admin'].includes(payload.role)) {
            throw new BadRequestError('Unsupported role');
        }
        user.role = payload.role;
    }
    if (payload.phone !== undefined)
        user.phone = payload.phone;
    if (payload.name !== undefined)
        user.name = payload.name;
    await user.save();
    return getAdminUser(id);
};
export const exportUsersCsv = async () => {
    const data = await listAdminUsers({ page: 1, limit: 500 });
    const headers = ['name', 'email', 'phone', 'role', 'isBlocked', 'ordersCount', 'totalSpent', 'createdAt'];
    const rows = data.items.map((user) => [
        user.name,
        user.email,
        user.phone || '',
        user.role,
        user.isBlocked ? 'true' : 'false',
        user.ordersCount,
        user.totalSpent,
        user.createdAt,
    ]
        .map((value) => {
        const text = String(value ?? '');
        return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    })
        .join(','));
    return { filename: 'users.csv', csv: [headers.join(','), ...rows].join('\n'), total: data.items.length };
};
export const enrichOrderItemsFromProducts = async (items) => {
    const ids = items.map((item) => item.productId);
    const products = await ProductModel.find({ _id: { $in: ids } }).lean();
    const map = new Map(products.map((product) => [product._id.toString(), product]));
    return items.map((item) => {
        const product = map.get(item.productId);
        if (!product)
            return null;
        return {
            productId: product._id,
            title: product.name || product.title,
            image: product.image,
            price: product.finalPrice ?? product.discountPrice ?? product.price,
            quantity: item.quantity,
            sku: product.sku || '',
            variantName: '',
            variantSku: '',
            isCombo: Boolean(product.isCombo || product.productType === 'combo'),
            comboItems: (product.comboItems || []).map((entry) => ({
                productId: entry.productId,
                title: '',
                quantity: entry.quantity || 1,
            })),
        };
    }).filter(Boolean);
};
