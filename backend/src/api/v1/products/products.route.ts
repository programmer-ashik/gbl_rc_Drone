import mongoose from 'mongoose';
import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../../utils/async-handler.js';
import { envelope } from '../../../core/http/middleware.js';
import { zodValidate } from '../../../core/http/validate.js';
import { requireAuth, requireRole } from '../../../core/auth/middleware.js';
import { NotFoundError, BadRequestError } from '../../../core/http/errors.js';
import { ProductModel } from './product.model.js';
import { ReviewModel } from '../reviews/review.model.js';
import { auditLog } from '../../../core/logging/audit.js';
import {
  archiveProduct,
  compatibleWithSchema,
  createProduct,
  incrementProductViews,
  updateProduct,
  variantSchema,
} from './product.service.js';
import { filterProducts, searchProducts } from './product-filter.service.js';
import {
  bulkProductSchema,
  bulkUpdateProducts,
  exportProducts,
  getManagedProduct,
  importProducts,
  listManagedProducts,
  parseCsv,
  quickEditProduct,
  quickEditSchema,
  validateImportRows,
} from './product-admin.service.js';
import { productFileUpload, productImageUpload } from './product-upload.js';
import { getCachedFeaturedProducts, getCachedNewProducts, getCachedProductDetail } from '../../../core/cache/product-cache.js';

const booleanQuery = z.enum(['true', 'false']).transform((value) => value === 'true');
const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/);
const assetUrlSchema = z
  .string()
  .trim()
  .refine((value) => value === '' || value.startsWith('/') || /^https?:\/\//i.test(value), 'Enter a valid image URL or upload path');

const adminOnly = [requireAuth, requireRole('store_admin', 'platform_admin', 'platform_super_admin')];

const listQuerySchema = z.object({
  category: z.string().trim().optional(),
  subcategory: z.string().trim().optional(),
  categoryId: objectIdSchema.optional(),
  subCategoryId: objectIdSchema.optional(),
  search: z.string().trim().max(120).optional(),
  productType: z.enum(['single', 'combo', 'variable']).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'rating', 'name', 'popular']).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  stockStatus: z.enum(['in_stock', 'low_stock', 'out_of_stock']).optional(),
  inStock: booleanQuery.optional(),
  onSale: booleanQuery.optional(),
  isNewArrival: booleanQuery.optional(),
  isBestSeller: booleanQuery.optional(),
  isFeatured: booleanQuery.optional(),
  isCombo: booleanQuery.optional(),
  tags: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).refine((query) => query.maxPrice === undefined || query.minPrice === undefined || query.maxPrice >= query.minPrice, {
  message: 'Maximum price must be greater than or equal to minimum price',
  path: ['maxPrice'],
});

const photoSchema = z.object({
  url: assetUrlSchema,
  alt: z.string().max(160).optional().default(''),
  isPrimary: z.boolean().optional().default(false),
});

const comboItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
});

const productObjectSchema = z.object({
  title: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
  slug: z.string().trim().max(80).optional(),
  sku: z.string().trim().max(80).optional().default(''),
  productType: z.enum(['single', 'combo', 'variable']).optional(),
  description: z.string().trim().min(1),
  subtitle: z.string().trim().optional().default(''),
  image: assetUrlSchema.optional().default(''),
  images: z.array(assetUrlSchema).max(12).optional().default([]),
  photos: z.array(photoSchema).max(12).optional().default([]),
  category: z.string().trim().min(1).optional(),
  subcategory: z.string().trim().optional().default(''),
  categoryId: objectIdSchema.optional(),
  subCategoryId: objectIdSchema.nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(30).optional().default([]),
  price: z.coerce.number().min(0).optional(),
  basePrice: z.coerce.number().min(0).optional(),
  discount: z.coerce.number().min(0).max(100).optional(),
  discountPrice: z.coerce.number().min(0).nullable().optional().default(null),
  finalPrice: z.coerce.number().min(0).optional(),
  rating: z.coerce.number().min(0).max(5).optional().default(0),
  reviewsCount: z.coerce.number().int().min(0).optional().default(0),
  stock: z.coerce.number().int().min(0).optional().default(0),
  lowStockThreshold: z.coerce.number().int().min(1).optional().default(5),
  stockAlertThreshold: z.coerce.number().int().min(1).optional(),
  isFeatured: z.boolean().optional().default(false),
  isBestSeller: z.boolean().optional().default(false),
  isNewArrival: z.boolean().optional().default(false),
  isActive: z.boolean().optional(),
  displayOrder: z.coerce.number().int().min(0).optional().default(0),
  seoTitle: z.string().trim().max(120).optional().default(''),
  seoDescription: z.string().trim().max(320).optional().default(''),
  viewCount: z.coerce.number().int().min(0).optional(),
  onSale: z.boolean().optional().default(false),
  isCombo: z.boolean().optional().default(false),
  comboItems: z.array(comboItemSchema).max(30).optional().default([]),
  compatibleWith: z.array(compatibleWithSchema).max(20).optional().default([]),
  variants: z.array(variantSchema).max(50).optional().default([]),
  specifications: z.array(z.string()).optional().default([]),
  attributes: z.any().optional(),
  blockDiagram: z.string().optional().default(''),
  descriptionText: z.string().optional().default(''),
  status: z.enum(['draft', 'active', 'archived']).optional().default('active'),
});

const refineProductPayload = (
  payload: Partial<z.infer<typeof productObjectSchema>>,
  context: z.RefinementCtx,
) => {
  if (!payload.title && !payload.name) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['name'], message: 'Product name is required' });
  }
  if (!payload.category && !payload.categoryId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['category'], message: 'Category is required' });
  }
  if (payload.price == null && payload.basePrice == null) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['price'], message: 'Price is required' });
  }
  const basePrice = payload.basePrice ?? payload.price;
  const salePrice = payload.finalPrice ?? payload.discountPrice;
  if (salePrice != null && basePrice != null && salePrice > basePrice) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['discountPrice'],
      message: 'Discount price must be lower than price',
    });
  }
  if (payload.photos && payload.photos.filter((photo) => photo.isPrimary).length > 1) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['photos'], message: 'Only one photo can be primary' });
  }
  if ((payload.isCombo || payload.productType === 'combo') && payload.comboItems && payload.comboItems.length < 2) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['comboItems'], message: 'A combo package requires at least two products' });
  }
};

const productSchema = productObjectSchema.superRefine(refineProductPayload);
const productUpdateSchema = productObjectSchema.partial().superRefine((payload, context) => {
  const basePrice = payload.basePrice ?? payload.price;
  const salePrice = payload.finalPrice ?? payload.discountPrice;
  if (salePrice != null && basePrice != null && salePrice > basePrice) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['discountPrice'],
      message: 'Discount price must be lower than price',
    });
  }
  if (payload.photos && payload.photos.filter((photo) => photo.isPrimary).length > 1) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['photos'], message: 'Only one photo can be primary' });
  }
  if ((payload.isCombo || payload.productType === 'combo') && payload.comboItems && payload.comboItems.length < 2) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['comboItems'], message: 'A combo package requires at least two products' });
  }
});

type ListQuery = z.infer<typeof listQuerySchema>;

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildFilter = (query: ListQuery, includeInactive = false): mongoose.FilterQuery<unknown> => {
  const filter: mongoose.FilterQuery<unknown> = includeInactive ? {} : { status: 'active' };
  if (query.categoryId) filter.categoryId = query.categoryId;
  else if (query.category) filter.category = query.category.toLowerCase();
  if (query.subCategoryId) filter.subCategoryId = query.subCategoryId;
  else if (query.subcategory) filter.subcategory = query.subcategory.toLowerCase();
  if (query.stockStatus) filter.stockStatus = query.stockStatus;
  if (query.inStock !== undefined) filter.stock = query.inStock ? { $gt: 0 } : { $lte: 0 };
  if (query.onSale !== undefined) {
    filter.$or = query.onSale
      ? [{ onSale: true }, { discountPrice: { $ne: null } }, { $expr: { $lt: ['$finalPrice', '$basePrice'] } }]
      : [{ onSale: false }, { onSale: { $exists: false } }];
  }
  if (query.isNewArrival !== undefined) filter.isNewArrival = query.isNewArrival;
  if (query.isBestSeller !== undefined) filter.isBestSeller = query.isBestSeller;
  if (query.isFeatured !== undefined) filter.isFeatured = query.isFeatured;
  if (query.isCombo !== undefined) filter.isCombo = query.isCombo;
  if (query.productType === 'combo') filter.isCombo = true;
  if (query.productType === 'variable') filter['variants.0'] = { $exists: true };
  if (query.productType === 'single') {
    filter.isCombo = { $ne: true };
    filter.$and = [...((filter.$and as mongoose.FilterQuery<unknown>[]) || []), { $or: [{ variants: { $size: 0 } }, { variants: { $exists: false } }] }];
  }
  if (query.tags) filter.tags = { $in: query.tags.split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean) };
  if (query.search) {
    const pattern = new RegExp(escapeRegex(query.search), 'i');
    const searchFilter = [
      { title: pattern },
      { name: pattern },
      { subtitle: pattern },
      { description: pattern },
      { category: pattern },
      { subcategory: pattern },
      { tags: pattern },
      { seoTitle: pattern },
      { sku: pattern },
      { 'variants.sku': pattern },
    ];
    if (filter.$or) filter.$and = [{ $or: filter.$or }, { $or: searchFilter }];
    else filter.$or = searchFilter;
  }
  const priceConditions = [];
  if (query.minPrice !== undefined) {
    priceConditions.push({ $gte: [{ $ifNull: ['$finalPrice', { $ifNull: ['$discountPrice', '$price'] }] }, query.minPrice] });
  }
  if (query.maxPrice !== undefined) {
    priceConditions.push({ $lte: [{ $ifNull: ['$finalPrice', { $ifNull: ['$discountPrice', '$price'] }] }, query.maxPrice] });
  }
  if (priceConditions.length) filter.$expr = priceConditions.length === 1 ? priceConditions[0] : { $and: priceConditions };
  return filter;
};

const parseSort = (sort?: ListQuery['sort']): Record<string, 1 | -1> => {
  if (sort === 'price_asc') return { effectivePrice: 1, createdAt: -1 };
  if (sort === 'price_desc') return { effectivePrice: -1, createdAt: -1 };
  if (sort === 'rating') return { rating: -1, reviewsCount: -1 };
  if (sort === 'name') return { title: 1 };
  if (sort === 'popular') return { viewCount: -1, rating: -1 };
  return { createdAt: -1 };
};

const listProducts = async (query: ListQuery, includeInactive = false) => {
  const filter = buildFilter(query, includeInactive);
  const skip = (query.page - 1) * query.limit;
  const [result] = await ProductModel.aggregate([
    { $match: filter },
    { $addFields: { effectivePrice: { $ifNull: ['$finalPrice', { $ifNull: ['$discountPrice', '$price'] }] } } },
    {
      $facet: {
        items: [{ $sort: parseSort(query.sort) }, { $skip: skip }, { $limit: query.limit }, { $unset: 'effectivePrice' }],
        metadata: [{ $count: 'total' }],
      },
    },
  ]);
  return {
    items: result?.items ?? [],
    total: result?.metadata?.[0]?.total ?? 0,
    page: query.page,
    limit: query.limit,
    totalPages: Math.max(1, Math.ceil((result?.metadata?.[0]?.total ?? 0) / query.limit)),
  };
};

export const productsRouter = Router();

productsRouter.get('/', asyncHandler(async (req, res) => {
  const query = listQuerySchema.parse(req.query);
  envelope.ok(res, await listProducts(query));
}));

productsRouter.get('/combo-packages', asyncHandler(async (req, res) => {
  const query = listQuerySchema.parse({ ...req.query, isCombo: 'true' });
  envelope.ok(res, await listProducts(query));
}));

productsRouter.get('/filter', asyncHandler(async (req, res) => {
  envelope.ok(res, await filterProducts(req.query as Record<string, unknown>));
}));

productsRouter.get('/search', asyncHandler(async (req, res) => {
  envelope.ok(res, await searchProducts(req.query as Record<string, unknown>));
}));

productsRouter.get('/featured', asyncHandler(async (_req, res) => {
  envelope.ok(res, await getCachedFeaturedProducts());
}));

productsRouter.get('/new-arrivals', asyncHandler(async (_req, res) => {
  envelope.ok(res, await getCachedNewProducts());
}));

productsRouter.get('/on-sale', asyncHandler(async (_req, res) => {
  const items = await ProductModel.find({
    status: 'active',
    $or: [{ onSale: true }, { discountPrice: { $ne: null } }, { $expr: { $lt: ['$finalPrice', '$basePrice'] } }],
  })
    .sort({ createdAt: -1 })
    .limit(12)
    .lean();
  envelope.ok(res, items);
}));

const handleUpload =
  (uploader: (req: Request, res: Response, callback: (error?: unknown) => void) => void) =>
  (req: Request, res: Response, next: NextFunction) => {
    uploader(req, res, (error) => {
      if (error) {
        next(new BadRequestError((error as Error).message || 'Upload failed'));
        return;
      }
      next();
    });
  };

productsRouter.get('/manage', ...adminOnly, asyncHandler(async (req, res) => {
  envelope.ok(res, await listManagedProducts(req.query as Record<string, unknown>));
}));

productsRouter.get('/manage/:id', ...adminOnly, asyncHandler(async (req, res) => {
  envelope.ok(res, await getManagedProduct(String(req.params.id)));
}));

productsRouter.get('/export', ...adminOnly, asyncHandler(async (req, res) => {
  envelope.ok(res, await exportProducts(req.query as Record<string, unknown>));
}));

productsRouter.post('/bulk', ...adminOnly, zodValidate(bulkProductSchema), asyncHandler(async (req, res) => {
  const result = await bulkUpdateProducts(req.body);
  auditLog(req, { action: `product.bulk.${req.body.action}`, targetType: 'Product', metadata: { count: result.updated } });
  envelope.ok(res, result);
}));

productsRouter.post('/import/validate', ...adminOnly, asyncHandler(async (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : parseCsv(String(req.body?.csv || ''));
  envelope.ok(res, await validateImportRows(rows));
}));

productsRouter.post('/import', ...adminOnly, asyncHandler(async (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : parseCsv(String(req.body?.csv || ''));
  const result = await importProducts(rows, req.auth?.organizationId ?? null);
  auditLog(req, { action: 'product.import', targetType: 'Product', metadata: { created: result.created, total: result.total } });
  envelope.ok(res, result);
}));

productsRouter.post(
  '/upload-image',
  ...adminOnly,
  handleUpload(productImageUpload.array('images', 12)),
  asyncHandler(async (req, res) => {
    const files = ((req as Request & { files?: Array<{ filename: string }> }).files || []);
    if (!files.length) throw new BadRequestError('Image file is required');
    const items = files.map((file) => ({ url: `/uploads/products/${file.filename}`, filename: file.filename }));
    auditLog(req, { action: 'product.image-upload', targetType: 'Product', metadata: { count: items.length } });
    envelope.created(res, { url: items[0].url, items });
  }),
);

productsRouter.post(
  '/upload-file',
  ...adminOnly,
  handleUpload(productFileUpload.single('file')),
  asyncHandler(async (req, res) => {
    const file = (req as Request & { file?: { filename: string; mimetype: string; originalname: string } }).file;
    if (!file) throw new BadRequestError('File is required');
    const url = `/uploads/product-files/${file.filename}`;
    auditLog(req, { action: 'product.file-upload', targetType: 'Product', metadata: { url } });
    envelope.created(res, { url, filename: file.originalname, mimeType: file.mimetype });
  }),
);

productsRouter.patch('/:id/quick', ...adminOnly, zodValidate(quickEditSchema), asyncHandler(async (req, res) => {
  const doc = await quickEditProduct(String(req.params.id), req.body);
  auditLog(req, { action: 'product.quick-edit', targetType: 'Product', targetId: doc._id.toString() });
  envelope.ok(res, doc);
}));

productsRouter.get('/:id/reviews', asyncHandler(async (req, res) => {
  const productId = String(req.params.id);
  const product: any = mongoose.Types.ObjectId.isValid(productId)
    ? await ProductModel.findById(productId).lean()
    : await ProductModel.findOne({ slug: productId.toLowerCase() }).lean();
  if (!product) throw new NotFoundError('Product not found');
  const reviews = await ReviewModel.find({ productId: product._id }).populate('userId', 'name').sort({ createdAt: -1 }).lean();
  envelope.ok(res, reviews);
}));

productsRouter.get('/:id/related', asyncHandler(async (req, res) => {
  const productId = String(req.params.id);
  const product: any = mongoose.Types.ObjectId.isValid(productId)
    ? await ProductModel.findById(productId).lean()
    : await ProductModel.findOne({ slug: productId.toLowerCase() }).lean();
  if (!product) throw new NotFoundError('Product not found');
  const tagFilter = product.tags?.length ? [{ tags: { $in: product.tags } }] : [];
  const relatedMatch: mongoose.FilterQuery<unknown> = {
    status: 'active',
    _id: { $ne: product._id },
    isCombo: product.isCombo,
    $or: [
      ...(product.categoryId ? [{ categoryId: product.categoryId }] : []),
      { category: product.category },
      ...tagFilter,
    ],
  };
  const items = await ProductModel.find(relatedMatch)
    .sort({ rating: -1, viewCount: -1, createdAt: -1 })
    .limit(8)
    .lean();
  envelope.ok(res, items);
}));

productsRouter.get('/:id', asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const product: any = await getCachedProductDetail(id);
  await incrementProductViews(product._id.toString());
  envelope.ok(res, { ...product, viewCount: (product.viewCount || 0) + 1 });
}));

productsRouter.post('/', requireAuth, requireRole('store_admin', 'platform_admin', 'platform_super_admin'), zodValidate(productSchema), asyncHandler(async (req, res) => {
  const doc = await createProduct(req.body, req.auth?.organizationId ?? null);
  auditLog(req, { action: 'product.create', targetType: 'Product', targetId: doc._id.toString() });
  envelope.created(res, doc);
}));

productsRouter.put('/:id', requireAuth, requireRole('store_admin', 'platform_admin', 'platform_super_admin'), zodValidate(productUpdateSchema), asyncHandler(async (req, res) => {
  const doc = await updateProduct(String(req.params.id), req.body);
  auditLog(req, { action: 'product.update', targetType: 'Product', targetId: doc._id.toString() });
  envelope.ok(res, doc);
}));

productsRouter.delete('/:id', requireAuth, requireRole('store_admin', 'platform_admin', 'platform_super_admin'), asyncHandler(async (req, res) => {
  const doc = await archiveProduct(String(req.params.id));
  auditLog(req, { action: 'product.delete', targetType: 'Product', targetId: doc._id.toString() });
  envelope.ok(res, { archived: true, id: doc._id });
}));
