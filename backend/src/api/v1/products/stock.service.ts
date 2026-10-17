import mongoose from 'mongoose';
import { z } from 'zod';
import { BadRequestError, NotFoundError } from '../../../core/http/errors.js';
import { ProductModel } from '../products/product.model.js';
import { invalidateProductDetailCaches, notifyLowStock } from '../../../core/cache/invalidate.js';
import { notifyBackInStock } from '../stock-alerts/stock-alert.service.js';

export const stockUpdateSchema = z.object({
  stock: z.coerce.number().int().min(0).optional(),
  variants: z
    .array(
      z.object({
        sku: z.string().min(1),
        stock: z.coerce.number().int().min(0),
      }),
    )
    .optional(),
});

export const listStockInventory = async (rawQuery: Record<string, unknown>) => {
  const page = Math.max(1, Number(rawQuery.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(rawQuery.limit) || 40));
  const search = typeof rawQuery.search === 'string' ? rawQuery.search.trim() : '';
  const productType = typeof rawQuery.productType === 'string' ? rawQuery.productType : 'all';
  const stockStatus = typeof rawQuery.stockStatus === 'string' ? rawQuery.stockStatus : 'all';

  const filter: Record<string, unknown> = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { 'variants.sku': { $regex: search, $options: 'i' } },
      { 'variants.name': { $regex: search, $options: 'i' } },
    ];
  }
  if (productType !== 'all') filter.productType = productType;
  if (stockStatus !== 'all') filter.stockStatus = stockStatus;

  const [items, total] = await Promise.all([
    ProductModel.find(filter)
      .select('name title sku productType stock stockStatus stockAlertThreshold lowStockThreshold variants image status updatedAt')
      .sort({ stock: 1, updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ProductModel.countDocuments(filter),
  ]);

  return {
    items: items.map((product: any) => ({
      ...product,
      name: product.name || product.title,
      variants: (product.variants || []).map((variant: any) => ({
        sku: variant.sku,
        name: variant.name,
        stock: Number(variant.stock) || 0,
        price: variant.price,
      })),
    })),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};

export const updateProductStock = async (id: string, payload: z.infer<typeof stockUpdateSchema>) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestError('Invalid product id');
  const product = await ProductModel.findById(id);
  if (!product) throw new NotFoundError('Product not found');

  if (Array.isArray(payload.variants) && payload.variants.length) {
    const stockBySku = new Map(payload.variants.map((entry) => [entry.sku, entry.stock]));
    product.variants = (product.variants || []).map((variant: any) => {
      if (stockBySku.has(variant.sku)) {
        variant.stock = stockBySku.get(variant.sku);
      }
      return variant;
    });
    const variantStock = (product.variants || []).reduce(
      (sum: number, variant: any) => sum + (Number(variant.stock) || 0),
      0,
    );
    product.stock = variantStock;
    if (product.productType !== 'combo') product.productType = 'variable';
  } else if (payload.stock !== undefined) {
    product.stock = payload.stock;
  }

  await product.save();
  await invalidateProductDetailCaches([String(product._id), product.slug].filter(Boolean) as string[], {
    action: 'stock',
  });
  if (product.stockStatus === 'low_stock' || product.stockStatus === 'out_of_stock') {
    notifyLowStock([product.toObject()]);
  }
  if (Number(product.stock || 0) > 0) {
    await notifyBackInStock([product.toObject()]);
  }
  return product.toObject();
};
