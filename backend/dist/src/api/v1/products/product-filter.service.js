import mongoose from 'mongoose';
import { z } from 'zod';
import { CategoryModel } from '../categories/category.model.js';
import { ProductModel } from './product.model.js';
const blankToUndefined = (value) => (value === '' || value == null ? undefined : value);
const booleanQuery = z.preprocess(blankToUndefined, z.enum(['true', 'false']).transform((value) => value === 'true').optional());
const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/);
const optionalNumber = z.preprocess(blankToUndefined, z.coerce.number().min(0).optional());
const optionalRating = z.preprocess(blankToUndefined, z.coerce.number().min(0).max(5).optional());
const optionalText = z.preprocess(blankToUndefined, z.string().trim().max(120).optional());
const SORT_MAP = {
    'price-asc': { effectivePrice: 1, createdAt: -1 },
    price_asc: { effectivePrice: 1, createdAt: -1 },
    'price-desc': { effectivePrice: -1, createdAt: -1 },
    price_desc: { effectivePrice: -1, createdAt: -1 },
    rating: { rating: -1, reviewsCount: -1 },
    newest: { createdAt: -1 },
    popularity: { viewCount: -1, rating: -1 },
    popular: { viewCount: -1, rating: -1 },
    name: { title: 1 },
};
export const filterQuerySchema = z.object({
    category: optionalText,
    categoryId: z.preprocess(blankToUndefined, objectIdSchema.optional()),
    subCategory: optionalText,
    subcategory: optionalText,
    subCategoryId: z.preprocess(blankToUndefined, objectIdSchema.optional()),
    minPrice: optionalNumber,
    maxPrice: optionalNumber,
    rating: optionalRating,
    inStock: booleanQuery,
    isFeatured: booleanQuery,
    isNewArrival: booleanQuery,
    isBestSeller: booleanQuery,
    tags: z.union([z.string(), z.array(z.string())]).optional(),
    sort: z
        .enum([
        'price-asc',
        'price-desc',
        'rating',
        'newest',
        'popularity',
        'price_asc',
        'price_desc',
        'popular',
        'name',
    ])
        .optional()
        .default('newest'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    q: optionalText,
    search: optionalText,
}).refine((query) => query.maxPrice === undefined || query.minPrice === undefined || query.maxPrice >= query.minPrice, { message: 'Maximum price must be greater than or equal to minimum price', path: ['maxPrice'] });
export const searchQuerySchema = z.object({
    q: z.string().trim().min(1).max(120),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
    suggest: booleanQuery.optional().default(true),
});
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const asList = (value) => {
    if (value == null || value === '')
        return [];
    const parts = Array.isArray(value) ? value : String(value).split(',');
    return [...new Set(parts.map((item) => String(item).trim()).filter(Boolean))];
};
const isObjectId = (value) => Boolean(value && objectIdSchema.safeParse(value).success);
export const parseAttributeFilters = (query) => {
    const attributes = {};
    const add = (key, value) => {
        const normalizedKey = String(key || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        if (!normalizedKey || value == null || value === '')
            return;
        const values = asList(value).map((item) => item.trim()).filter(Boolean);
        if (!values.length)
            return;
        attributes[normalizedKey] = [...new Set([...(attributes[normalizedKey] || []), ...values])];
    };
    if (query.attributes && typeof query.attributes === 'object' && !Array.isArray(query.attributes)) {
        Object.entries(query.attributes).forEach(([key, value]) => add(key, value));
    }
    else if (typeof query.attributes === 'string') {
        const raw = query.attributes.trim();
        if (raw.startsWith('{')) {
            try {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') {
                    Object.entries(parsed).forEach(([key, value]) => add(key, value));
                }
            }
            catch {
                raw.split(',').forEach((pair) => {
                    const [key, ...rest] = pair.split(':');
                    add(key, rest.join(':'));
                });
            }
        }
        else {
            raw.split(',').forEach((pair) => {
                const [key, ...rest] = pair.split(':');
                add(key, rest.join(':'));
            });
        }
    }
    if (query.attr && typeof query.attr === 'object' && !Array.isArray(query.attr)) {
        Object.entries(query.attr).forEach(([key, value]) => add(key, value));
    }
    else {
        asList(query.attr).forEach((pair) => {
            const [key, ...rest] = String(pair).split(':');
            add(key, rest.join(':'));
        });
    }
    Object.entries(query).forEach(([key, value]) => {
        if (key.startsWith('attr.') || key.startsWith('attributes.')) {
            add(key.replace(/^attr(ibutes)?\./, ''), value);
        }
        const bracket = /^(?:attr|attributes)\[([^\]]+)\]$/i.exec(key);
        if (bracket)
            add(bracket[1], value);
    });
    return attributes;
};
const effectivePriceExpr = { $ifNull: ['$finalPrice', { $ifNull: ['$discountPrice', '$price'] }] };
const attributeEnrichment = [
    {
        $addFields: {
            specAttributes: {
                $reduce: {
                    input: {
                        $filter: {
                            input: {
                                $map: {
                                    input: { $ifNull: ['$specifications', []] },
                                    as: 'spec',
                                    in: {
                                        k: {
                                            $replaceAll: {
                                                input: {
                                                    $toLower: { $trim: { input: { $arrayElemAt: [{ $split: [{ $toString: '$$spec' }, ':'] }, 0] } } },
                                                },
                                                find: ' ',
                                                replacement: '-',
                                            },
                                        },
                                        v: {
                                            $trim: {
                                                input: { $ifNull: [{ $arrayElemAt: [{ $split: [{ $toString: '$$spec' }, ':'] }, 1] }, ''] },
                                            },
                                        },
                                    },
                                },
                            },
                            as: 'pair',
                            cond: { $and: [{ $ne: ['$$pair.k', ''] }, { $ne: ['$$pair.v', ''] }] },
                        },
                    },
                    initialValue: {},
                    in: { $mergeObjects: ['$$value', { $arrayToObject: [[{ k: '$$this.k', v: '$$this.v' }]] }] },
                },
            },
        },
    },
    {
        $addFields: {
            attributes: {
                $mergeObjects: [
                    '$specAttributes',
                    {
                        $cond: {
                            if: { $eq: [{ $type: { $ifNull: ['$attributes', {}] } }, 'object'] },
                            then: { $ifNull: ['$attributes', {}] },
                            else: {},
                        },
                    },
                ],
            },
            effectivePrice: effectivePriceExpr,
        },
    },
];
const attributeValueMatch = (key, values) => {
    const clauses = values.map((value) => ({
        [`attributes.${key}`]: { $regex: `^${escapeRegex(value)}$`, $options: 'i' },
    }));
    return clauses.length === 1 ? clauses[0] : { $or: clauses };
};
const categoryClause = (value, id) => {
    const token = id || value;
    if (!token)
        return null;
    if (isObjectId(token)) {
        return { $or: [{ categoryId: new mongoose.Types.ObjectId(token) }, { category: token.toLowerCase() }] };
    }
    return { category: token.toLowerCase() };
};
const subCategoryClause = (value, id) => {
    const token = id || value;
    if (!token)
        return null;
    if (isObjectId(token)) {
        return {
            $or: [{ subCategoryId: new mongoose.Types.ObjectId(token) }, { subcategory: token.toLowerCase() }],
        };
    }
    return { subcategory: token.toLowerCase() };
};
const searchClause = (term) => {
    if (!term)
        return null;
    const pattern = new RegExp(escapeRegex(term), 'i');
    return {
        $or: [
            { name: pattern },
            { title: pattern },
            { subtitle: pattern },
            { description: pattern },
            { descriptionText: pattern },
            { seoTitle: pattern },
            { tags: pattern },
            { specifications: pattern },
            { category: pattern },
            { subcategory: pattern },
        ],
    };
};
export const buildProductMatch = (query, attributes, options = {}) => {
    const includePrice = options.includePrice !== false;
    const includeAttributes = options.includeAttributes !== false;
    const clauses = [{ status: 'active' }];
    const category = categoryClause(query.category, query.categoryId);
    if (category)
        clauses.push(category);
    const subCategory = subCategoryClause(query.subCategory || query.subcategory, query.subCategoryId);
    if (subCategory)
        clauses.push(subCategory);
    if (query.inStock === true)
        clauses.push({ stock: { $gt: 0 } });
    if (query.inStock === false)
        clauses.push({ stock: { $lte: 0 } });
    if (query.isFeatured !== undefined)
        clauses.push({ isFeatured: query.isFeatured });
    if (query.isNewArrival !== undefined)
        clauses.push({ isNewArrival: query.isNewArrival });
    if (query.isBestSeller !== undefined)
        clauses.push({ isBestSeller: query.isBestSeller });
    if (query.rating != null)
        clauses.push({ rating: { $gte: query.rating } });
    const tags = asList(query.tags).map((tag) => tag.toLowerCase());
    if (tags.length)
        clauses.push({ tags: { $in: tags } });
    const text = query.q || query.search;
    const search = searchClause(text);
    if (search)
        clauses.push(search);
    if (includeAttributes) {
        Object.entries(attributes).forEach(([key, values]) => {
            clauses.push(attributeValueMatch(key, values));
        });
    }
    if (includePrice && (query.minPrice != null || query.maxPrice != null)) {
        const bounds = {};
        if (query.minPrice != null)
            bounds.$gte = query.minPrice;
        if (query.maxPrice != null)
            bounds.$lte = query.maxPrice;
        clauses.push({
            $expr: {
                $and: Object.entries(bounds).map(([op, amount]) => ({ [op]: [effectivePriceExpr, amount] })),
            },
        });
    }
    return clauses.length === 1 ? clauses[0] : { $and: clauses };
};
const PRICE_BOUNDARIES = [0, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
const formatAttributeKey = (key) => String(key || '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
const escapeHtml = (value) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
const highlightText = (value, query) => {
    const text = escapeHtml(String(value || ''));
    if (!text || !query)
        return text;
    return text.replace(new RegExp(`(${escapeRegex(query)})`, 'ig'), '<mark>$1</mark>');
};
const withHighlights = (product, term) => {
    if (!term)
        return product;
    return {
        ...product,
        highlights: {
            name: highlightText(product.name || product.title, term),
            title: highlightText(product.title || product.name, term),
            description: highlightText(String(product.description || '').slice(0, 220), term),
            specifications: (product.specifications || [])
                .map((entry) => highlightText(entry, term))
                .filter((entry) => entry.includes('<mark>')),
        },
    };
};
export const filterProducts = async (rawQuery) => {
    const query = filterQuerySchema.parse(rawQuery);
    const attributes = parseAttributeFilters(rawQuery);
    const scopeMatch = buildProductMatch(query, attributes, { includePrice: false, includeAttributes: false });
    const extraClauses = [];
    Object.entries(attributes).forEach(([key, values]) => {
        extraClauses.push(attributeValueMatch(key, values));
    });
    if (query.minPrice != null || query.maxPrice != null) {
        const bounds = {};
        if (query.minPrice != null)
            bounds.$gte = query.minPrice;
        if (query.maxPrice != null)
            bounds.$lte = query.maxPrice;
        extraClauses.push({
            $expr: {
                $and: Object.entries(bounds).map(([op, amount]) => ({ [op]: ['$effectivePrice', amount] })),
            },
        });
    }
    const extraMatch = extraClauses.length ? { $and: extraClauses } : null;
    const sort = SORT_MAP[query.sort || 'newest'] || SORT_MAP.newest;
    const skip = (query.page - 1) * query.limit;
    const [listResult, facetResult] = await Promise.all([
        ProductModel.aggregate([
            { $match: scopeMatch },
            ...attributeEnrichment,
            ...(extraMatch ? [{ $match: extraMatch }] : []),
            {
                $facet: {
                    items: [{ $sort: sort }, { $skip: skip }, { $limit: query.limit }, { $unset: ['effectivePrice', 'specAttributes'] }],
                    metadata: [{ $count: 'total' }],
                },
            },
        ]),
        ProductModel.aggregate([
            { $match: scopeMatch },
            ...attributeEnrichment,
            {
                $facet: {
                    priceStats: [
                        { $group: { _id: null, min: { $min: '$effectivePrice' }, max: { $max: '$effectivePrice' } } },
                    ],
                    priceBuckets: [
                        {
                            $bucket: {
                                groupBy: '$effectivePrice',
                                boundaries: PRICE_BOUNDARIES,
                                default: '100000+',
                                output: { count: { $sum: 1 } },
                            },
                        },
                    ],
                    categories: [{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
                    subCategories: [
                        { $match: { subcategory: { $nin: [null, ''] } } },
                        { $group: { _id: '$subcategory', count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                    ],
                    ratings: [
                        {
                            $bucket: {
                                groupBy: '$rating',
                                boundaries: [0, 1, 2, 3, 4, 5, 6],
                                default: 'other',
                                output: { count: { $sum: 1 } },
                            },
                        },
                    ],
                    attributes: [
                        { $project: { attributes: { $ifNull: ['$attributes', {}] } } },
                        { $project: { attrs: { $objectToArray: '$attributes' } } },
                        { $unwind: { path: '$attrs', preserveNullAndEmptyArrays: false } },
                        { $match: { 'attrs.k': { $nin: [null, ''] }, 'attrs.v': { $nin: [null, ''] } } },
                        {
                            $group: {
                                _id: { key: '$attrs.k', value: { $toString: '$attrs.v' } },
                                count: { $sum: 1 },
                            },
                        },
                        { $sort: { count: -1 } },
                        { $limit: 80 },
                    ],
                },
            },
        ]),
    ]);
    const total = listResult[0]?.metadata?.[0]?.total ?? 0;
    const facets = facetResult[0] || {};
    const priceStats = facets.priceStats?.[0] || { min: 0, max: 0 };
    const ratingBuckets = new Map((facets.ratings || [])
        .filter((row) => Number.isFinite(Number(row._id)))
        .map((row) => [Number(row._id), Number(row.count)]));
    const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
        rating: star,
        count: [5, 4, 3, 2, 1]
            .filter((value) => value >= star)
            .reduce((sum, value) => sum + (ratingBuckets.get(value) || 0), 0),
    }));
    const attributeMap = new Map();
    (facets.attributes || []).forEach((row) => {
        const key = row._id?.key;
        const value = row._id?.value;
        if (!key || !value)
            return;
        const list = attributeMap.get(key) || [];
        list.push({ value, count: row.count });
        attributeMap.set(key, list);
    });
    const categorySlugs = (facets.categories || []).map((row) => row._id).filter(Boolean);
    const subCategorySlugs = (facets.subCategories || []).map((row) => row._id).filter(Boolean);
    const labels = (await CategoryModel.find({ slug: { $in: [...categorySlugs, ...subCategorySlugs] } })
        .select('slug name label')
        .lean());
    const labelBySlug = new Map(labels.map((item) => [item.slug, item.name || item.label || item.slug]));
    const searchTerm = query.q || query.search;
    return {
        items: (listResult[0]?.items ?? []).map((product) => withHighlights(product, searchTerm)),
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
        applied: {
            ...query,
            attributes,
            subCategory: query.subCategory || query.subcategory || '',
        },
        facets: {
            price: {
                min: Math.floor(Number(priceStats.min) || 0),
                max: Math.ceil(Number(priceStats.max) || 0),
                ranges: (facets.priceBuckets || [])
                    .map((row, index, list) => {
                    const from = row._id === '100000+' ? 100000 : Number(row._id);
                    const next = list[index + 1]?._id;
                    const to = row._id === '100000+' || next == null || next === '100000+' ? null : Number(next);
                    if (!Number.isFinite(from) || (to != null && !Number.isFinite(to)))
                        return null;
                    return {
                        from,
                        to,
                        label: to == null ? `৳${from.toLocaleString()}+` : `৳${from.toLocaleString()} – ৳${to.toLocaleString()}`,
                        count: row.count,
                    };
                })
                    .filter((row) => row && row.count > 0),
            },
            categories: (facets.categories || []).map((row) => ({
                slug: row._id,
                name: labelBySlug.get(row._id) || row._id,
                count: row.count,
            })),
            subCategories: (facets.subCategories || []).map((row) => ({
                slug: row._id,
                name: labelBySlug.get(row._id) || row._id,
                count: row.count,
            })),
            ratings: ratingDistribution,
            attributes: [...attributeMap.entries()].map(([key, values]) => ({
                key,
                label: formatAttributeKey(key),
                values,
            })),
        },
    };
};
export const searchProducts = async (rawQuery) => {
    const query = searchQuerySchema.parse(rawQuery);
    const pattern = new RegExp(escapeRegex(query.q), 'i');
    const prefix = new RegExp(`^${escapeRegex(query.q)}`, 'i');
    const skip = (query.page - 1) * query.limit;
    const match = { status: 'active', ...searchClause(query.q) };
    const [items, total, suggestions] = await Promise.all([
        ProductModel.find(match)
            .sort({ rating: -1, viewCount: -1, createdAt: -1 })
            .skip(skip)
            .limit(query.limit)
            .lean(),
        ProductModel.countDocuments(match),
        query.suggest
            ? Promise.all([
                ProductModel.find({ status: 'active', $or: [{ name: prefix }, { title: prefix }, { name: pattern }, { title: pattern }] })
                    .select('name title slug image category')
                    .sort({ viewCount: -1, rating: -1 })
                    .limit(8)
                    .lean(),
                CategoryModel.find({
                    $and: [
                        { $or: [{ isActive: true }, { active: { $ne: false } }] },
                        { $or: [{ name: pattern }, { label: pattern }, { slug: pattern }] },
                    ],
                })
                    .select('name label slug level')
                    .limit(5)
                    .lean(),
                ProductModel.distinct('tags', { status: 'active', tags: pattern }),
            ])
            : Promise.resolve([[], [], []]),
    ]);
    const [productSuggestions, categorySuggestions, tagSuggestions] = suggestions;
    return {
        query: query.q,
        items: items.map((product) => withHighlights(product, query.q)),
        suggestions: [
            ...productSuggestions.map((item) => ({
                type: 'product',
                text: item.name || item.title,
                slug: item.slug,
                image: item.image,
                category: item.category,
            })),
            ...categorySuggestions.map((item) => ({
                type: 'category',
                text: item.name || item.label,
                slug: item.slug,
                level: item.level,
            })),
            ...tagSuggestions.slice(0, 5).map((tag) => ({
                type: 'tag',
                text: tag,
                slug: tag,
            })),
        ],
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
};
