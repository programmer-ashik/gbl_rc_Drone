import mongoose from 'mongoose';
import { BadRequestError } from '../../../core/http/errors.js';
import { invalidateProductDetailCaches, notifyLowStock } from '../../../core/cache/invalidate.js';
import { ProductModel } from './product.model.js';
const stockStatusExpression = {
    $switch: {
        branches: [
            { case: { $lte: ['$stock', 0] }, then: 'out_of_stock' },
            {
                case: {
                    $lte: ['$stock', { $ifNull: ['$stockAlertThreshold', { $ifNull: ['$lowStockThreshold', 5] }] }],
                },
                then: 'low_stock',
            },
        ],
        default: 'in_stock',
    },
};
export const consolidateInventoryLines = (lines) => {
    const quantities = new Map();
    for (const line of lines) {
        quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.quantity);
    }
    return Array.from(quantities, ([productId, quantity]) => ({ productId, quantity }));
};
const afterStockChange = async (products) => {
    const refs = products.flatMap((product) => [String(product._id), product.slug].filter(Boolean));
    await invalidateProductDetailCaches(refs, { action: 'stock' });
    const low = products.filter((product) => product.stockStatus === 'low_stock' || product.stockStatus === 'out_of_stock');
    notifyLowStock(low);
};
export const reserveInventory = async (lines) => {
    const reserved = [];
    const touched = [];
    try {
        for (const line of consolidateInventoryLines(lines)) {
            const product = await ProductModel.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(line.productId),
                status: 'active',
                stock: { $gte: line.quantity },
            }, [
                { $set: { stock: { $subtract: ['$stock', line.quantity] } } },
                { $set: { stockStatus: stockStatusExpression } },
            ], { new: true });
            if (!product) {
                throw new BadRequestError('One or more products do not have enough stock');
            }
            reserved.push(line);
            touched.push(product);
        }
    }
    catch (error) {
        if (reserved.length)
            await restoreInventory(reserved);
        throw error;
    }
    await afterStockChange(touched);
};
export const restoreInventory = async (lines) => {
    const touched = [];
    for (const line of consolidateInventoryLines(lines)) {
        const product = await ProductModel.findByIdAndUpdate(line.productId, [
            { $set: { stock: { $add: ['$stock', line.quantity] } } },
            { $set: { stockStatus: stockStatusExpression } },
        ], { new: true });
        if (product)
            touched.push(product);
    }
    if (touched.length)
        await afterStockChange(touched);
};
