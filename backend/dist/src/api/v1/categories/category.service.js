import mongoose from 'mongoose';
import { z } from 'zod';
import { BadRequestError, NotFoundError } from '../../../core/http/errors.js';
import { makeSlug } from '../../../utils/strings.js';
import { ProductModel } from '../products/product.model.js';
import { CategoryModel } from './category.model.js';
import { toCategoryDto } from './category.mapper.js';
import { invalidateNavigationCache } from './navigation.service.js';
const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/);
const optionalParentId = z.union([objectIdSchema, z.null()]).optional();
export const categoryWriteSchema = z.object({
    name: z.string().trim().min(1).max(80).optional(),
    label: z.string().trim().min(1).max(80).optional(),
    slug: z.string().trim().max(80).optional(),
    icon: z.string().trim().max(120).optional(),
    image: z.string().trim().max(2048).optional(),
    parentId: optionalParentId,
    parentSlug: z.string().trim().nullable().optional(),
    displayOrder: z.coerce.number().int().min(0).optional(),
    order: z.coerce.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
    active: z.boolean().optional(),
    isNavVisible: z.boolean().optional(),
    isFooterVisible: z.boolean().optional(),
    metaTitle: z.string().trim().max(120).optional(),
    metaDescription: z.string().trim().max(320).optional(),
    level: z.coerce.number().int().min(1).max(3).optional(),
});
export const categoryCreateSchema = categoryWriteSchema;
export const reorderSchema = z.object({
    items: z
        .array(z.object({
        id: objectIdSchema,
        displayOrder: z.coerce.number().int().min(0),
        parentId: optionalParentId,
    }))
        .min(1),
});
export const visibilityObjectSchema = z.object({
    isActive: z.boolean().optional(),
    active: z.boolean().optional(),
    isNavVisible: z.boolean().optional(),
    isFooterVisible: z.boolean().optional(),
});
export const visibilitySchema = visibilityObjectSchema;
export const bulkUpdateSchema = z.object({
    items: z.array(categoryWriteSchema.extend({ id: objectIdSchema })).min(1),
});
const productLinkQuery = (category) => {
    const isChild = (category.level || 1) > 1 || Boolean(category.parentSlug) || Boolean(category.parentId);
    return isChild
        ? {
            status: { $ne: 'archived' },
            $or: [{ subCategoryId: category._id }, { subcategory: category.slug }],
        }
        : {
            status: { $ne: 'archived' },
            $or: [{ categoryId: category._id }, { category: category.slug }],
        };
};
const assertValidId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id))
        throw new BadRequestError('Invalid category id');
};
const uniqueSlug = async (source, excludeId, allowSuffix = true) => {
    const base = makeSlug(source);
    if (!base)
        throw new BadRequestError('Invalid category slug');
    const exists = await CategoryModel.exists({ slug: base, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
    if (!exists)
        return base;
    if (!allowSuffix)
        throw new BadRequestError('Category slug already exists');
    let slug = base;
    let suffix = 2;
    while (await CategoryModel.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
        slug = `${base.slice(0, 40)}-${suffix++}`;
    }
    return slug;
};
const isDescendant = async (ancestorId, candidateParentId) => {
    let currentId = candidateParentId;
    const seen = new Set();
    while (currentId && !seen.has(currentId)) {
        if (currentId === ancestorId)
            return true;
        seen.add(currentId);
        const parent = await CategoryModel.findById(currentId).select('parentId').lean();
        currentId = parent?.parentId ? parent.parentId.toString() : null;
    }
    return false;
};
const normalizeParentId = (value) => {
    if (value === undefined)
        return undefined;
    if (value === null || value === '')
        return null;
    return String(value);
};
const normalizeParentSlug = (value) => {
    if (value === undefined)
        return undefined;
    if (value === null || value === '')
        return null;
    return String(value);
};
export const resolveParent = async (payload, ownId) => {
    const parentId = normalizeParentId(payload.parentId);
    const parentSlug = normalizeParentSlug(payload.parentSlug);
    const hasParentId = parentId !== undefined;
    const hasParentSlug = parentSlug !== undefined;
    if ((hasParentId && parentId === null) || (hasParentSlug && parentSlug === null)) {
        return { parent: null, parentId: null, parentSlug: null, level: 1 };
    }
    let parent = null;
    if (parentId) {
        parent = await CategoryModel.findById(parentId);
    }
    else if (parentSlug) {
        parent = await CategoryModel.findOne({ slug: parentSlug.toLowerCase() });
    }
    if (!parent) {
        if (!parentId && !parentSlug) {
            return { parent: null, parentId: null, parentSlug: null, level: 1 };
        }
        throw new BadRequestError('Parent category not found');
    }
    if (ownId && parent._id.toString() === ownId) {
        throw new BadRequestError('A category cannot be its own parent');
    }
    if (ownId && (await isDescendant(ownId, parent._id.toString()))) {
        throw new BadRequestError('Cannot move a category under its own descendant');
    }
    const parentLevel = parent.level || 1;
    if (parentLevel >= 3)
        throw new BadRequestError('Cannot nest under a level-3 category');
    if (!(parent.isActive ?? parent.active ?? true)) {
        throw new BadRequestError('Parent must be an active category');
    }
    return {
        parent,
        parentId: parent._id,
        parentSlug: parent.slug,
        level: (parentLevel + 1),
    };
};
const cascadeChildren = async (category) => {
    const children = await CategoryModel.find({
        $or: [{ parentId: category._id }, { parentSlug: category.slug }],
    });
    for (const child of children) {
        child.parentId = category._id;
        child.parentSlug = category.slug;
        child.level = Math.min(3, (category.level || 1) + 1);
        await child.save();
        await cascadeChildren(child);
    }
};
const applyWriteFields = (category, payload) => {
    const name = (payload.name || payload.label || category.name || category.label || '').trim();
    if (name) {
        category.name = name;
        category.label = name;
    }
    if (payload.icon !== undefined)
        category.icon = payload.icon;
    if (payload.image !== undefined)
        category.image = payload.image;
    if (payload.metaTitle !== undefined)
        category.metaTitle = payload.metaTitle;
    if (payload.metaDescription !== undefined)
        category.metaDescription = payload.metaDescription;
    if (payload.isNavVisible !== undefined)
        category.isNavVisible = payload.isNavVisible;
    if (payload.isFooterVisible !== undefined)
        category.isFooterVisible = payload.isFooterVisible;
    const isActive = payload.isActive ?? payload.active;
    if (isActive !== undefined) {
        category.isActive = isActive;
        category.active = isActive;
    }
    const displayOrder = payload.displayOrder ?? payload.order;
    if (displayOrder !== undefined) {
        category.displayOrder = displayOrder;
        category.order = displayOrder;
    }
};
export const createCategory = async (payload) => {
    const name = (payload.name || payload.label || '').trim();
    if (!name)
        throw new BadRequestError('name is required');
    const parent = await resolveParent(payload);
    const slug = await uniqueSlug(payload.slug || name, undefined, !payload.slug);
    const displayOrder = payload.displayOrder ?? payload.order ?? 0;
    const isActive = payload.isActive ?? payload.active ?? true;
    const category = await CategoryModel.create({
        name,
        label: name,
        slug,
        parentId: parent.parentId,
        parentSlug: parent.parentSlug,
        level: parent.level,
        displayOrder,
        order: displayOrder,
        isActive,
        active: isActive,
        icon: payload.icon ?? '',
        image: payload.image ?? '',
        metaTitle: payload.metaTitle ?? '',
        metaDescription: payload.metaDescription ?? '',
        isNavVisible: payload.isNavVisible ?? true,
        isFooterVisible: payload.isFooterVisible ?? false,
    });
    await invalidateNavigationCache();
    return toCategoryDto(category);
};
export const updateCategory = async (id, payload) => {
    assertValidId(id);
    const category = await CategoryModel.findById(id);
    if (!category)
        throw new NotFoundError('Category not found');
    const name = (payload.name || payload.label || category.name || category.label).trim();
    const nextSlug = payload.slug || payload.name || payload.label
        ? await uniqueSlug(payload.slug || name, category._id.toString(), !payload.slug)
        : category.slug;
    const parentInput = payload.parentId !== undefined || payload.parentSlug !== undefined
        ? payload
        : { parentId: category.parentId?.toString() ?? null, parentSlug: category.parentSlug };
    const parent = await resolveParent(parentInput, category._id.toString());
    const oldSlug = category.slug;
    applyWriteFields(category, payload);
    category.slug = nextSlug;
    category.parentId = parent.parentId;
    category.parentSlug = parent.parentSlug;
    category.level = parent.level;
    await category.save();
    if (oldSlug !== nextSlug) {
        await Promise.all([
            CategoryModel.updateMany({ parentSlug: oldSlug }, { parentSlug: nextSlug }),
            ProductModel.updateMany({ category: oldSlug }, { category: nextSlug }),
            ProductModel.updateMany({ subcategory: oldSlug }, { subcategory: nextSlug }),
        ]);
    }
    await cascadeChildren(category);
    await invalidateNavigationCache();
    return toCategoryDto(category);
};
export const disableCategory = async (id) => {
    assertValidId(id);
    const category = await CategoryModel.findById(id);
    if (!category)
        throw new NotFoundError('Category not found');
    const productQuery = productLinkQuery(category);
    const [hasProducts, hasChildren] = await Promise.all([
        ProductModel.exists(productQuery),
        CategoryModel.exists({
            $or: [{ parentId: category._id }, { parentSlug: category.slug }],
            $and: [{ $or: [{ isActive: true }, { active: true }] }],
        }),
    ]);
    if (hasProducts || hasChildren) {
        throw new BadRequestError('Archive or move linked products and subcategories before disabling this category');
    }
    category.isActive = false;
    category.active = false;
    await category.save();
    await invalidateNavigationCache();
    return { disabled: true };
};
export const toggleCategoryVisibility = async (id, payload) => {
    assertValidId(id);
    if (payload.isActive === undefined &&
        payload.active === undefined &&
        payload.isNavVisible === undefined &&
        payload.isFooterVisible === undefined) {
        throw new BadRequestError('At least one visibility field is required');
    }
    const category = await CategoryModel.findById(id);
    if (!category)
        throw new NotFoundError('Category not found');
    applyWriteFields(category, payload);
    await category.save();
    await invalidateNavigationCache();
    return toCategoryDto(category);
};
export const reorderCategories = async (items) => {
    const ids = items.map((item) => item.id);
    const existing = await CategoryModel.find({ _id: { $in: ids } });
    if (existing.length !== ids.length)
        throw new BadRequestError('One or more categories were not found');
    for (const item of items) {
        const category = existing.find((doc) => doc._id.toString() === item.id);
        if (!category)
            continue;
        category.displayOrder = item.displayOrder;
        category.order = item.displayOrder;
        if (item.parentId !== undefined) {
            const parent = await resolveParent({ parentId: item.parentId }, category._id.toString());
            category.parentId = parent.parentId;
            category.parentSlug = parent.parentSlug;
            category.level = parent.level;
        }
        await category.save();
        if (item.parentId !== undefined)
            await cascadeChildren(category);
    }
    await invalidateNavigationCache();
    const updated = await CategoryModel.find({ _id: { $in: ids } }).sort({ displayOrder: 1, name: 1 }).lean();
    return updated.map((doc) => toCategoryDto(doc));
};
export const bulkUpdateCategories = async (items) => {
    const results = [];
    for (const item of items) {
        const { id, ...payload } = item;
        results.push(await updateCategory(id, payload));
    }
    return results;
};
export const listManagedCategories = async () => {
    const categories = await CategoryModel.find().sort({ level: 1, displayOrder: 1, name: 1 }).lean();
    const dtos = categories.map((doc) => toCategoryDto(doc));
    const [categoryIdCounts, subCategoryIdCounts, categoryCounts, subcategoryCounts] = await Promise.all([
        ProductModel.aggregate([
            { $match: { status: { $ne: 'archived' }, categoryId: { $ne: null } } },
            { $group: { _id: '$categoryId', count: { $sum: 1 } } },
        ]),
        ProductModel.aggregate([
            { $match: { status: { $ne: 'archived' }, subCategoryId: { $ne: null } } },
            { $group: { _id: '$subCategoryId', count: { $sum: 1 } } },
        ]),
        ProductModel.aggregate([
            {
                $match: {
                    status: { $ne: 'archived' },
                    $or: [{ categoryId: null }, { categoryId: { $exists: false } }],
                },
            },
            { $group: { _id: '$category', count: { $sum: 1 } } },
        ]),
        ProductModel.aggregate([
            {
                $match: {
                    status: { $ne: 'archived' },
                    subcategory: { $nin: [null, ''] },
                    $or: [{ subCategoryId: null }, { subCategoryId: { $exists: false } }],
                },
            },
            { $group: { _id: '$subcategory', count: { $sum: 1 } } },
        ]),
    ]);
    const byCategoryId = new Map(categoryIdCounts.map((row) => [String(row._id), row.count]));
    const bySubCategoryId = new Map(subCategoryIdCounts.map((row) => [String(row._id), row.count]));
    const byCategory = new Map(categoryCounts.map((row) => [row._id, row.count]));
    const bySubcategory = new Map(subcategoryCounts.map((row) => [row._id, row.count]));
    const childCountByParent = new Map();
    dtos.forEach((item) => {
        if (!item.parentId)
            return;
        childCountByParent.set(item.parentId, (childCountByParent.get(item.parentId) || 0) + 1);
    });
    return dtos.map((item) => ({
        ...item,
        productCount: item.level > 1
            ? (bySubCategoryId.get(item._id) || 0) + (bySubcategory.get(item.slug) || 0)
            : (byCategoryId.get(item._id) || 0) + (byCategory.get(item.slug) || 0),
        childCount: childCountByParent.get(item._id) || 0,
    }));
};
export const getCategoryUsage = async (id) => {
    assertValidId(id);
    const category = await CategoryModel.findById(id);
    if (!category)
        throw new NotFoundError('Category not found');
    const [productCount, childCount] = await Promise.all([
        ProductModel.countDocuments(productLinkQuery(category)),
        CategoryModel.countDocuments({
            $and: [
                { $or: [{ parentId: category._id }, { parentSlug: category.slug }] },
                { $or: [{ isActive: true }, { active: true }] },
            ],
        }),
    ]);
    return {
        id: category._id.toString(),
        name: category.name || category.label,
        slug: category.slug,
        productCount,
        childCount,
        canDelete: productCount === 0 && childCount === 0,
    };
};
