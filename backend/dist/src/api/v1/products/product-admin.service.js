import mongoose from 'mongoose';
import { z } from 'zod';
import { BadRequestError, NotFoundError } from '../../../core/http/errors.js';
import { invalidateProductCaches } from '../../../core/cache/invalidate.js';
import { CategoryModel } from '../categories/category.model.js';
import { ProductModel } from './product.model.js';
import { archiveProduct, createProduct, resolveProductCategories, updateProduct, } from './product.service.js';
const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const manageQuerySchema = z.object({
    search: z.string().trim().max(120).optional(),
    category: z.string().trim().optional(),
    categoryId: objectIdSchema.optional(),
    productType: z.enum(['single', 'combo', 'variable']).optional(),
    stockStatus: z.enum(['in_stock', 'low_stock', 'out_of_stock']).optional(),
    status: z.enum(['draft', 'active', 'archived', 'all']).optional().default('all'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(20),
    sort: z.enum(['newest', 'name', 'price_asc', 'price_desc', 'stock']).optional().default('newest'),
});
export const bulkProductSchema = z.object({
    ids: z.array(objectIdSchema).min(1).max(200),
    action: z.enum(['delete', 'status', 'category']),
    status: z.enum(['draft', 'active', 'archived']).optional(),
    categoryId: objectIdSchema.optional(),
    subCategoryId: objectIdSchema.nullable().optional(),
});
export const quickEditSchema = z.object({
    stock: z.coerce.number().int().min(0).optional(),
    price: z.coerce.number().min(0).optional(),
    basePrice: z.coerce.number().min(0).optional(),
    discount: z.coerce.number().min(0).max(100).optional(),
});
const IMPORT_HEADERS = [
    'name',
    'slug',
    'sku',
    'category',
    'subcategory',
    'productType',
    'basePrice',
    'discount',
    'stock',
    'stockAlertThreshold',
    'status',
    'isFeatured',
    'isBestSeller',
    'isNewArrival',
    'description',
    'specifications',
    'seoTitle',
    'seoDescription',
    'image',
    'tags',
];
const asBoolean = (value, fallback = false) => {
    if (value == null || value === '')
        return fallback;
    const normalized = String(value).trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(normalized))
        return true;
    if (['false', '0', 'no', 'n'].includes(normalized))
        return false;
    return fallback;
};
const csvEscape = (value) => {
    const text = value == null ? '' : String(value);
    if (/[",\n\r]/.test(text))
        return `"${text.replace(/"/g, '""')}"`;
    return text;
};
export const parseCsv = (text) => {
    const rows = [];
    let row = [];
    let cell = '';
    let inQuotes = false;
    const input = String(text || '').replace(/^\uFEFF/, '');
    for (let index = 0; index < input.length; index += 1) {
        const char = input[index];
        if (inQuotes) {
            if (char === '"') {
                if (input[index + 1] === '"') {
                    cell += '"';
                    index += 1;
                }
                else {
                    inQuotes = false;
                }
            }
            else {
                cell += char;
            }
        }
        else if (char === '"') {
            inQuotes = true;
        }
        else if (char === ',') {
            row.push(cell);
            cell = '';
        }
        else if (char === '\n' || char === '\r') {
            if (char === '\r' && input[index + 1] === '\n')
                index += 1;
            row.push(cell);
            cell = '';
            if (row.some((value) => String(value).trim()))
                rows.push(row);
            row = [];
        }
        else {
            cell += char;
        }
    }
    if (cell.length || row.length) {
        row.push(cell);
        if (row.some((value) => String(value).trim()))
            rows.push(row);
    }
    if (rows.length < 2)
        return [];
    const headers = rows[0].map((header) => header.trim());
    return rows.slice(1).map((values, rowIndex) => {
        const record = { _row: String(rowIndex + 2) };
        headers.forEach((header, index) => {
            if (header)
                record[header] = String(values[index] || '').trim();
        });
        return record;
    });
};
export const rowsToCsv = (rows, headers = IMPORT_HEADERS) => [headers.join(','), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))].join('\n');
const sortMap = {
    newest: { createdAt: -1 },
    name: { title: 1 },
    price_asc: { finalPrice: 1, createdAt: -1 },
    price_desc: { finalPrice: -1, createdAt: -1 },
    stock: { stock: 1, title: 1 },
};
export const buildManageFilter = (query) => {
    const filter = {};
    if (query.status && query.status !== 'all')
        filter.status = query.status;
    if (query.categoryId)
        filter.categoryId = query.categoryId;
    else if (query.category)
        filter.category = query.category.toLowerCase();
    if (query.productType) {
        if (query.productType === 'combo')
            filter.$or = [{ productType: 'combo' }, { isCombo: true }];
        else if (query.productType === 'variable')
            filter.$or = [{ productType: 'variable' }, { 'variants.0': { $exists: true }, isCombo: { $ne: true } }];
        else
            filter.$and = [{ isCombo: { $ne: true } }, { $or: [{ productType: 'single' }, { productType: { $exists: false } }, { variants: { $size: 0 } }] }];
    }
    if (query.stockStatus)
        filter.stockStatus = query.stockStatus;
    if (query.search) {
        const pattern = new RegExp(escapeRegex(query.search), 'i');
        const search = [
            { title: pattern },
            { name: pattern },
            { sku: pattern },
            { slug: pattern },
            { 'variants.sku': pattern },
        ];
        if (filter.$or) {
            filter.$and = [...(filter.$and || []), { $or: filter.$or }, { $or: search }];
            delete filter.$or;
        }
        else {
            filter.$or = search;
        }
    }
    return filter;
};
export const listManagedProducts = async (rawQuery) => {
    const query = manageQuerySchema.parse(rawQuery);
    const filter = buildManageFilter(query);
    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
        ProductModel.find(filter)
            .sort(sortMap[query.sort] || sortMap.newest)
            .skip(skip)
            .limit(query.limit)
            .lean(),
        ProductModel.countDocuments(filter),
    ]);
    return {
        items,
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
};
export const getManagedProduct = async (id) => {
    const product = mongoose.Types.ObjectId.isValid(id)
        ? await ProductModel.findById(id)
            .populate('comboItems.productId', 'title name slug image stock sku')
            .populate('compatibleWith.productIds', 'title name slug image sku')
            .lean()
        : await ProductModel.findOne({ slug: id.toLowerCase() })
            .populate('comboItems.productId', 'title name slug image stock sku')
            .populate('compatibleWith.productIds', 'title name slug image sku')
            .lean();
    if (!product)
        throw new NotFoundError('Product not found');
    return product;
};
export const quickEditProduct = async (id, payload) => {
    if (!mongoose.Types.ObjectId.isValid(id))
        throw new BadRequestError('Invalid product id');
    return updateProduct(id, {
        ...(payload.stock != null ? { stock: payload.stock } : {}),
        ...(payload.basePrice != null || payload.price != null
            ? { basePrice: payload.basePrice ?? payload.price, price: payload.basePrice ?? payload.price }
            : {}),
        ...(payload.discount != null ? { discount: payload.discount } : {}),
    });
};
export const bulkUpdateProducts = async (payload) => {
    const products = await ProductModel.find({ _id: { $in: payload.ids } });
    if (!products.length)
        throw new BadRequestError('No matching products found');
    if (payload.action === 'delete') {
        await Promise.all(products.map((item) => archiveProduct(item._id.toString())));
        return { updated: products.length, action: payload.action };
    }
    if (payload.action === 'status') {
        if (!payload.status)
            throw new BadRequestError('Status is required');
        await Promise.all(products.map(async (item) => {
            item.status = payload.status;
            item.isActive = payload.status === 'active';
            await item.save();
        }));
        await invalidateProductCaches(products.flatMap((item) => [item._id.toString(), item.slug]), { action: 'bulk-status' });
        return { updated: products.length, action: payload.action, status: payload.status };
    }
    if (!payload.categoryId)
        throw new BadRequestError('Category is required');
    const categories = await resolveProductCategories({
        categoryId: payload.categoryId,
        subCategoryId: payload.subCategoryId ?? null,
    });
    await Promise.all(products.map(async (item) => {
        item.categoryId = categories.categoryId;
        item.subCategoryId = categories.subCategoryId;
        item.category = categories.category;
        item.subcategory = categories.subcategory;
        await item.save();
    }));
    await invalidateProductCaches(products.flatMap((item) => [item._id.toString(), item.slug]), { action: 'bulk-category' });
    return { updated: products.length, action: payload.action };
};
export const exportProducts = async (rawQuery) => {
    const query = manageQuerySchema.parse({ ...rawQuery, page: 1, limit: 200 });
    const filter = buildManageFilter(query);
    const items = await ProductModel.find(filter).sort({ title: 1 }).limit(500).lean();
    const rows = items.map((item) => ({
        name: item.name || item.title,
        slug: item.slug,
        sku: item.sku || item.variants?.[0]?.sku || '',
        category: item.category,
        subcategory: item.subcategory,
        productType: item.productType || (item.isCombo ? 'combo' : item.variants?.length ? 'variable' : 'single'),
        basePrice: item.basePrice ?? item.price,
        discount: item.discount || 0,
        stock: item.stock,
        stockAlertThreshold: item.stockAlertThreshold || item.lowStockThreshold || 5,
        status: item.status,
        isFeatured: item.isFeatured,
        isBestSeller: item.isBestSeller,
        isNewArrival: item.isNewArrival,
        description: item.descriptionText || String(item.description || '').replace(/<[^>]+>/g, ' '),
        specifications: (item.specifications || []).join(' | '),
        seoTitle: item.seoTitle,
        seoDescription: item.seoDescription,
        image: item.image,
        tags: (item.tags || []).join('|'),
    }));
    return { filename: 'products.csv', csv: rowsToCsv(rows), rows, total: rows.length };
};
const normalizeImportRow = (row, index) => {
    const name = (row.name || row.title || '').trim();
    const category = (row.category || '').trim().toLowerCase();
    const productType = (row.productType || row.type || 'single').trim().toLowerCase();
    const basePrice = Number(row.basePrice ?? row.price ?? 0);
    const errors = [];
    const line = Number(row._row || index + 2);
    if (!name)
        errors.push({ row: line, field: 'name', message: 'Name is required' });
    if (!category)
        errors.push({ row: line, field: 'category', message: 'Category is required' });
    if (!Number.isFinite(basePrice) || basePrice < 0)
        errors.push({ row: line, field: 'basePrice', message: 'Price must be 0 or more' });
    if (productType && !['single', 'combo', 'variable'].includes(productType)) {
        errors.push({ row: line, field: 'productType', message: 'Type must be single, combo, or variable' });
    }
    return {
        errors,
        payload: {
            name,
            title: name,
            slug: (row.slug || '').trim(),
            sku: (row.sku || '').trim(),
            category,
            subcategory: (row.subcategory || '').trim().toLowerCase(),
            productType: (['single', 'combo', 'variable'].includes(productType) ? productType : 'single'),
            isCombo: productType === 'combo',
            basePrice,
            price: basePrice,
            discount: Number(row.discount || 0) || 0,
            stock: Number(row.stock || 0) || 0,
            stockAlertThreshold: Number(row.stockAlertThreshold || row.lowStockThreshold || 5) || 5,
            status: ['draft', 'active', 'archived'].includes((row.status || '').toLowerCase())
                ? (row.status || 'active').toLowerCase()
                : 'active',
            isFeatured: asBoolean(row.isFeatured),
            isBestSeller: asBoolean(row.isBestSeller),
            isNewArrival: asBoolean(row.isNewArrival),
            description: row.description || name,
            descriptionText: row.description || name,
            specifications: (row.specifications || '')
                .split('|')
                .map((item) => item.trim())
                .filter(Boolean),
            seoTitle: row.seoTitle || '',
            seoDescription: row.seoDescription || '',
            image: row.image || '',
            images: row.image ? [row.image] : [],
            tags: (row.tags || '')
                .split(/[|,]/)
                .map((item) => item.trim())
                .filter(Boolean),
        },
    };
};
export const validateImportRows = async (rows) => {
    const categories = await CategoryModel.find().select('slug name isActive active').lean();
    const slugs = new Set(categories.map((item) => String(item.slug || '').toLowerCase()));
    const errors = [];
    const prepared = rows.map((row, index) => {
        const next = normalizeImportRow(row, index);
        errors.push(...next.errors);
        if (next.payload.category && !slugs.has(next.payload.category)) {
            errors.push({ row: Number(row._row || index + 2), field: 'category', message: `Unknown category "${next.payload.category}"` });
        }
        if (next.payload.subcategory && !slugs.has(next.payload.subcategory)) {
            errors.push({ row: Number(row._row || index + 2), field: 'subcategory', message: `Unknown subcategory "${next.payload.subcategory}"` });
        }
        return next.payload;
    });
    return { valid: errors.length === 0, errors, rows: prepared, total: rows.length };
};
export const importProducts = async (rows, organizationId) => {
    const preview = await validateImportRows(rows);
    if (!preview.valid)
        return { ...preview, created: 0, skipped: preview.rows.length };
    const created = [];
    for (const payload of preview.rows) {
        const doc = await createProduct({
            ...payload,
            comboItems: [],
            variants: [],
        }, organizationId);
        created.push({ id: doc._id, name: doc.name || doc.title, slug: doc.slug });
    }
    return { valid: true, errors: [], created: created.length, items: created, total: preview.total };
};
