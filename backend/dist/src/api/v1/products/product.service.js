import mongoose from 'mongoose';
import { z } from 'zod';
import { BadRequestError, NotFoundError } from '../../../core/http/errors.js';
import { makeSlug } from '../../../utils/strings.js';
import { invalidateProductCaches } from '../../../core/cache/invalidate.js';
import { CategoryModel } from '../categories/category.model.js';
import { ProductModel, calculateFinalPrice, } from './product.model.js';
const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/);
export const compatibleWithSchema = z.object({
    productType: z.enum(['motor', 'esc', 'propeller', 'battery', 'frame']),
    productIds: z.array(objectIdSchema).max(50).default([]),
});
export const variantSchema = z.object({
    sku: z.string().trim().min(1).max(80),
    name: z.string().trim().max(80).optional().default(''),
    price: z.coerce.number().min(0).optional(),
    stock: z.coerce.number().int().min(0).optional().default(0),
    attributes: z.any().optional(),
});
export const applyProductPricing = (payload) => {
    const basePrice = Number(payload.basePrice ?? payload.price ?? 0);
    let discount = payload.discount;
    let finalPrice = payload.finalPrice ?? undefined;
    if (discount == null && payload.discountPrice != null && basePrice > 0 && payload.discountPrice < basePrice) {
        discount = Math.round(((basePrice - payload.discountPrice) / basePrice) * 10000) / 100;
        finalPrice = payload.discountPrice;
    }
    discount = Math.min(100, Math.max(0, Number(discount) || 0));
    if (finalPrice == null) {
        finalPrice = calculateFinalPrice(basePrice, discount, payload.discountPrice ?? null);
    }
    return {
        price: basePrice,
        basePrice,
        discount,
        finalPrice,
        discountPrice: finalPrice < basePrice ? finalPrice : null,
        onSale: finalPrice < basePrice,
    };
};
export const uniqueProductSlug = async (source, excludeId) => {
    const base = makeSlug(source);
    if (!base)
        throw new BadRequestError('Invalid product name');
    const exists = await ProductModel.exists({
        slug: base,
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });
    if (!exists)
        return base;
    let slug = base;
    let suffix = 2;
    while (await ProductModel.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
        slug = `${base.slice(0, 40)}-${suffix++}`;
    }
    return slug;
};
const toIdString = (value) => {
    if (!value)
        return null;
    return typeof value === 'string' ? value : String(value);
};
export const resolveProductCategories = async (payload) => {
    let parent = payload.categoryId
        ? await CategoryModel.findById(payload.categoryId)
        : payload.category
            ? await CategoryModel.findOne({ slug: payload.category.toLowerCase() })
            : null;
    if (!parent)
        throw new BadRequestError('Select an existing category');
    if (!(parent.isActive ?? parent.active ?? true)) {
        throw new BadRequestError('Select an active category');
    }
    if (parent.level > 1 && !payload.subCategoryId && !payload.subcategory) {
        const root = parent.parentId ? await CategoryModel.findById(parent.parentId) : null;
        if (!root)
            throw new BadRequestError('Parent category not found');
        return {
            categoryId: root._id,
            subCategoryId: parent._id,
            category: root.slug,
            subcategory: parent.slug,
        };
    }
    let child = null;
    if (payload.subCategoryId) {
        child = await CategoryModel.findById(payload.subCategoryId);
    }
    else if (payload.subcategory) {
        child = await CategoryModel.findOne({ slug: payload.subcategory.toLowerCase() });
    }
    if (payload.subCategoryId || payload.subcategory) {
        if (!child)
            throw new BadRequestError('The subcategory does not exist');
        if (!(child.isActive ?? child.active ?? true)) {
            throw new BadRequestError('Select an active subcategory');
        }
        const belongsToParent = toIdString(child.parentId) === parent._id.toString() || child.parentSlug === parent.slug;
        if (!belongsToParent) {
            throw new BadRequestError('The subcategory does not belong to the selected category');
        }
    }
    return {
        categoryId: parent._id,
        subCategoryId: child?._id ?? null,
        category: parent.slug,
        subcategory: child?.slug ?? '',
    };
};
export const recountCategoryProducts = async (categoryIds) => {
    const ids = [...new Set(categoryIds.filter(Boolean).map((id) => String(id)))];
    for (const id of ids) {
        if (!mongoose.Types.ObjectId.isValid(id))
            continue;
        const category = await CategoryModel.findById(id);
        if (!category)
            continue;
        const count = await ProductModel.countDocuments({
            status: { $ne: 'archived' },
            $or: [
                { categoryId: category._id },
                { subCategoryId: category._id },
                {
                    $and: [
                        { $or: [{ categoryId: null }, { categoryId: { $exists: false } }] },
                        { category: category.slug },
                    ],
                },
                {
                    $and: [
                        { $or: [{ subCategoryId: null }, { subCategoryId: { $exists: false } }] },
                        { subcategory: category.slug },
                    ],
                },
            ],
        });
        category.productCount = count;
        await category.save();
    }
};
export const validateComboAndCompatibility = async (payload, currentProductId) => {
    if (payload.comboItems?.length) {
        const ids = payload.comboItems.map((item) => item.productId);
        if (!ids.every((id) => mongoose.Types.ObjectId.isValid(id))) {
            throw new BadRequestError('Invalid product in combo package');
        }
        if (currentProductId && ids.includes(currentProductId)) {
            throw new BadRequestError('A combo package cannot include itself');
        }
        const count = await ProductModel.countDocuments({
            _id: { $in: ids },
            status: 'active',
            isCombo: { $ne: true },
        });
        if (count !== new Set(ids).size) {
            throw new BadRequestError('Combo items must reference active individual products');
        }
    }
    if (!payload.compatibleWith?.length)
        return;
    const ids = payload.compatibleWith.flatMap((entry) => entry.productIds || []);
    if (!ids.length)
        return;
    if (!ids.every((id) => mongoose.Types.ObjectId.isValid(id))) {
        throw new BadRequestError('Invalid product in compatibility list');
    }
    if (currentProductId && ids.includes(currentProductId)) {
        throw new BadRequestError('A product cannot list itself as compatible');
    }
    const count = await ProductModel.countDocuments({ _id: { $in: ids } });
    if (count !== new Set(ids).size) {
        throw new BadRequestError('Compatibility items must reference existing products');
    }
};
export const createProduct = async (payload, organizationId) => {
    const name = String(payload.name || payload.title || '').trim();
    if (!name)
        throw new BadRequestError('Product name is required');
    const categories = await resolveProductCategories(payload);
    await validateComboAndCompatibility(payload);
    const pricing = applyProductPricing(payload);
    const requestedSlug = String(payload.slug || '').trim();
    const slug = await uniqueProductSlug(requestedSlug || name);
    const threshold = Number(payload.stockAlertThreshold ?? payload.lowStockThreshold ?? 5) || 5;
    const doc = await ProductModel.create({
        ...payload,
        ...pricing,
        ...categories,
        name,
        title: name,
        slug,
        stockAlertThreshold: threshold,
        lowStockThreshold: threshold,
        organizationId: organizationId ?? null,
    });
    await recountCategoryProducts([
        toIdString(categories.categoryId),
        toIdString(categories.subCategoryId),
    ]);
    await invalidateProductCaches([doc._id.toString(), doc.slug], { action: 'create' });
    return doc;
};
export const updateProduct = async (id, payload) => {
    if (!mongoose.Types.ObjectId.isValid(id))
        throw new BadRequestError('Invalid product id');
    const doc = await ProductModel.findById(id);
    if (!doc)
        throw new NotFoundError('Product not found');
    const previousCategoryId = toIdString(doc.categoryId);
    const previousSubCategoryId = toIdString(doc.subCategoryId);
    const nextName = String(payload.name || payload.title || doc.name || doc.title || '').trim();
    if (!nextName)
        throw new BadRequestError('Product name is required');
    const categoryInput = {
        category: payload.category ?? doc.category,
        subcategory: payload.subcategory !== undefined ? String(payload.subcategory) : doc.subcategory,
        categoryId: payload.categoryId !== undefined ? payload.categoryId : previousCategoryId,
        subCategoryId: payload.subCategoryId !== undefined
            ? payload.subCategoryId
            : previousSubCategoryId,
    };
    const categories = await resolveProductCategories(categoryInput);
    await validateComboAndCompatibility(payload, id);
    const pricing = applyProductPricing({
        price: payload.basePrice ?? payload.price ?? doc.basePrice ?? doc.price,
        basePrice: payload.basePrice ?? payload.price ?? doc.basePrice,
        discount: payload.discount ?? doc.discount,
        discountPrice: payload.discountPrice !== undefined
            ? payload.discountPrice
            : payload.discount !== undefined
                ? null
                : doc.discountPrice,
        finalPrice: payload.finalPrice ?? undefined,
    });
    const nameChanged = nextName !== (doc.name || doc.title);
    if (payload.slug && String(payload.slug).trim() && String(payload.slug).trim().toLowerCase() !== doc.slug) {
        doc.slug = await uniqueProductSlug(String(payload.slug), id);
    }
    else if (nameChanged) {
        doc.slug = await uniqueProductSlug(nextName, id);
    }
    const threshold = Number(payload.stockAlertThreshold ?? payload.lowStockThreshold ?? doc.stockAlertThreshold ?? doc.lowStockThreshold ?? 5);
    Object.assign(doc, payload, pricing, categories, {
        name: nextName,
        title: nextName,
        stockAlertThreshold: threshold,
        lowStockThreshold: threshold,
    });
    await doc.save();
    await recountCategoryProducts([
        previousCategoryId,
        previousSubCategoryId,
        toIdString(categories.categoryId),
        toIdString(categories.subCategoryId),
    ]);
    await invalidateProductCaches([doc._id.toString(), doc.slug], { action: 'update' });
    return doc;
};
export const archiveProduct = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id))
        throw new BadRequestError('Invalid product id');
    const doc = await ProductModel.findById(id);
    if (!doc)
        throw new NotFoundError('Product not found');
    doc.status = 'archived';
    doc.isActive = false;
    await doc.save();
    await recountCategoryProducts([toIdString(doc.categoryId), toIdString(doc.subCategoryId)]);
    await invalidateProductCaches([doc._id.toString(), doc.slug], { action: 'delete' });
    return doc;
};
export const incrementProductViews = async (id) => {
    await ProductModel.updateOne({ _id: id }, { $inc: { viewCount: 1 } });
};
