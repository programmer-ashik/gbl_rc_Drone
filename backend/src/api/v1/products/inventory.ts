import mongoose from 'mongoose';
import { BadRequestError } from '../../../core/http/errors.js';
import { invalidateProductDetailCaches, notifyLowStock } from '../../../core/cache/invalidate.js';
import { ProductModel } from './product.model.js';
import { notifyBackInStock } from '../stock-alerts/stock-alert.service.js';

export type InventoryLine = {
  productId: string;
  quantity: number;
  variantSku?: string;
};

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

const lineKey = (line: InventoryLine) => `${line.productId}::${line.variantSku || ''}`;

export const consolidateInventoryLines = (lines: InventoryLine[]): InventoryLine[] => {
  const quantities = new Map<string, InventoryLine>();
  for (const line of lines) {
    const key = lineKey(line);
    const existing = quantities.get(key);
    if (existing) existing.quantity += line.quantity;
    else quantities.set(key, { productId: line.productId, quantity: line.quantity, variantSku: line.variantSku });
  }
  return Array.from(quantities.values());
};

const afterStockChange = async (
  products: Array<{ _id: unknown; slug?: string; stock?: number; stockStatus?: string; title?: string; name?: string }>,
) => {
  const refs = products.flatMap((product) => [String(product._id), product.slug].filter(Boolean));
  await invalidateProductDetailCaches(refs as string[], { action: 'stock' });
  const low = products.filter((product) => product.stockStatus === 'low_stock' || product.stockStatus === 'out_of_stock');
  notifyLowStock(low as Array<Record<string, unknown>>);
  const restocked = products.filter((product) => Number(product.stock || 0) > 0);
  if (restocked.length) await notifyBackInStock(restocked);
};

const syncVariantProductStock = async (productId: string) => {
  const product = await ProductModel.findById(productId);
  if (!product) return null;
  if (Array.isArray(product.variants) && product.variants.length) {
    product.stock = product.variants.reduce((sum: number, variant: any) => sum + (Number(variant.stock) || 0), 0);
    await product.save();
  }
  return product;
};

export const reserveInventory = async (lines: InventoryLine[]): Promise<void> => {
  const reserved: InventoryLine[] = [];
  const touched: Array<{ _id: unknown; slug?: string; stock?: number; stockStatus?: string; title?: string; name?: string }> = [];

  try {
    for (const line of consolidateInventoryLines(lines)) {
      if (line.variantSku) {
        const product = await ProductModel.findOneAndUpdate(
          {
            _id: new mongoose.Types.ObjectId(line.productId),
            status: 'active',
            variants: {
              $elemMatch: { sku: line.variantSku, stock: { $gte: line.quantity } },
            },
          },
          { $inc: { 'variants.$.stock': -line.quantity } },
          { new: true },
        );
        if (!product) throw new BadRequestError('One or more variants do not have enough stock');
        const synced = await syncVariantProductStock(line.productId);
        reserved.push(line);
        if (synced) touched.push(synced as any);
        continue;
      }

      const product = await ProductModel.findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(line.productId),
          status: 'active',
          stock: { $gte: line.quantity },
        },
        [
          { $set: { stock: { $subtract: ['$stock', line.quantity] } } },
          { $set: { stockStatus: stockStatusExpression } },
        ],
        { new: true },
      );

      if (!product) {
        throw new BadRequestError('One or more products do not have enough stock');
      }

      reserved.push(line);
      touched.push(product as any);
    }
  } catch (error) {
    if (reserved.length) await restoreInventory(reserved);
    throw error;
  }

  await afterStockChange(touched);
};

export const restoreInventory = async (lines: InventoryLine[]): Promise<void> => {
  const touched: Array<{ _id: unknown; slug?: string; stock?: number; stockStatus?: string; title?: string; name?: string }> = [];
  for (const line of consolidateInventoryLines(lines)) {
    if (line.variantSku) {
      const product = await ProductModel.findOneAndUpdate(
        {
          _id: line.productId,
          'variants.sku': line.variantSku,
        },
        { $inc: { 'variants.$.stock': line.quantity } },
        { new: true },
      );
      if (product) {
        const synced = await syncVariantProductStock(line.productId);
        if (synced) touched.push(synced as any);
      }
      continue;
    }

    const product = await ProductModel.findByIdAndUpdate(
      line.productId,
      [
        { $set: { stock: { $add: ['$stock', line.quantity] } } },
        { $set: { stockStatus: stockStatusExpression } },
      ],
      { new: true },
    );
    if (product) touched.push(product as any);
  }
  if (touched.length) await afterStockChange(touched);
};
