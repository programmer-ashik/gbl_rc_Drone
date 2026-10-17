import mongoose, { Schema, type InferSchemaType, type Types, type Model } from 'mongoose';

export const COMPATIBLE_PRODUCT_TYPES = ['motor', 'esc', 'propeller', 'battery', 'frame'] as const;
export type CompatibleProductType = (typeof COMPATIBLE_PRODUCT_TYPES)[number];

export const getStockStatus = (
  stock: number,
  lowStockThreshold = 5,
): 'in_stock' | 'low_stock' | 'out_of_stock' => {
  if (stock <= 0) return 'out_of_stock';
  if (stock <= lowStockThreshold) return 'low_stock';
  return 'in_stock';
};

export const calculateFinalPrice = (basePrice: number, discount = 0, fallbackPrice?: number | null) => {
  const base = Math.max(0, Number(basePrice) || 0);
  if (fallbackPrice != null && Number.isFinite(Number(fallbackPrice))) {
    return Math.max(0, Number(fallbackPrice));
  }
  const percent = Math.min(100, Math.max(0, Number(discount) || 0));
  if (percent <= 0) return base;
  return Math.round(base * (1 - percent / 100) * 100) / 100;
};

export const parseSpecificationAttributes = (specifications: unknown) => {
  const attributes: Record<string, string> = {};
  (Array.isArray(specifications) ? specifications : []).forEach((entry) => {
    const text = String(entry || '');
    const separator = text.indexOf(':');
    if (separator <= 0) return;
    const key = text
      .slice(0, separator)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const value = text.slice(separator + 1).trim();
    if (key && value) attributes[key] = value;
  });
  return attributes;
};

const ProductPhotoSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, default: '', trim: true },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: true },
);

const ComboItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false },
);

const CompatibleWithSchema = new Schema(
  {
    productType: {
      type: String,
      required: true,
      enum: COMPATIBLE_PRODUCT_TYPES,
      lowercase: true,
      trim: true,
    },
    productIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  },
  { _id: false },
);

const ProductVariantSchema = new Schema(
  {
    sku: { type: String, required: true, trim: true, maxlength: 80 },
    name: { type: String, default: '', trim: true, maxlength: 80 },
    price: { type: Number, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    attributes: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: true },
);

const ProductSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    name: { type: String, default: '', trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, trim: true },
    subtitle: { type: String, default: '' },
    image: { type: String, default: '' },
    images: { type: [String], default: [] },
    photos: { type: [ProductPhotoSchema], default: [] },
    category: { type: String, required: true, index: true },
    subcategory: { type: String, default: '', index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    subCategoryId: { type: Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    tags: { type: [String], default: [] },
    sku: { type: String, default: '', trim: true, maxlength: 80, index: true },
    productType: {
      type: String,
      enum: ['single', 'combo', 'variable'],
      default: 'single',
      index: true,
    },
    price: { type: Number, required: true, min: 0 },
    basePrice: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    discountPrice: { type: Number, default: null, min: 0 },
    finalPrice: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 1 },
    stockAlertThreshold: { type: Number, default: 5, min: 1 },
    stockStatus: {
      type: String,
      enum: ['in_stock', 'low_stock', 'out_of_stock'],
      default: 'out_of_stock',
      index: true,
    },
    isFeatured: { type: Boolean, default: false, index: true },
    isBestSeller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    displayOrder: { type: Number, default: 0, min: 0 },
    seoTitle: { type: String, default: '', trim: true, maxlength: 120 },
    seoDescription: { type: String, default: '', trim: true, maxlength: 320 },
    viewCount: { type: Number, default: 0, min: 0 },
    onSale: { type: Boolean, default: false },
    isCombo: { type: Boolean, default: false, index: true },
    comboItems: { type: [ComboItemSchema], default: [] },
    compatibleWith: { type: [CompatibleWithSchema], default: [] },
    variants: { type: [ProductVariantSchema], default: [] },
    specifications: { type: [String], default: [] },
    attributes: { type: Schema.Types.Mixed, default: {} },
    blockDiagram: { type: String, default: '' },
    descriptionText: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'active', 'archived'], default: 'active', index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null, index: true },
  },
  { timestamps: true },
);

ProductSchema.pre('validate', function syncDerivedProductFields() {
  const product = this as any;
  const name = (product.name || product.title || '').trim();
  product.name = name;
  product.title = name;

  if (!product.photos.length && product.images.length) {
    product.photos = product.images.map((url, index) => ({
      url,
      alt: product.title,
      isPrimary: url === product.image || (!product.image && index === 0),
    }));
  }

  if (product.photos.length) {
    const selectedPrimaryIndex = product.photos.findIndex((photo) => photo.isPrimary);
    const primaryIndex = selectedPrimaryIndex >= 0 ? selectedPrimaryIndex : 0;
    product.photos.forEach((photo, index) => {
      photo.isPrimary = index === primaryIndex;
      if (!photo.alt) photo.alt = product.title;
    });
    product.image = product.photos[primaryIndex].url;
    product.images = product.photos.map((photo) => photo.url);
  } else if (product.image) {
    product.photos = [{ url: product.image, alt: product.title, isPrimary: true }];
    product.images = [product.image];
  }

  const basePrice = Number(product.basePrice ?? product.price ?? 0);
  product.price = basePrice;
  product.basePrice = basePrice;

  let discount = Number(product.discount);
  if (!Number.isFinite(discount)) discount = 0;
  let finalPrice =
    product.finalPrice != null && Number(product.finalPrice) > 0
      ? Number(product.finalPrice)
      : calculateFinalPrice(basePrice, discount, product.discountPrice ?? null);

  if (discount === 0 && product.discountPrice != null && basePrice > 0 && product.discountPrice < basePrice) {
    discount = Math.round(((basePrice - Number(product.discountPrice)) / basePrice) * 10000) / 100;
    finalPrice = Number(product.discountPrice);
  }

  product.discount = Math.min(100, Math.max(0, discount));
  product.finalPrice = finalPrice;
  product.discountPrice = finalPrice < basePrice ? finalPrice : null;
  product.onSale = finalPrice < basePrice;

  const threshold = Number(product.stockAlertThreshold ?? product.lowStockThreshold ?? 5) || 5;
  product.stockAlertThreshold = threshold;
  product.lowStockThreshold = threshold;
  product.stockStatus = getStockStatus(product.stock, threshold);

  if (product.status === 'archived') {
    product.isActive = false;
  } else if (product.isActive === true) {
    product.status = 'active';
  } else if (product.isActive === false) {
    product.status = 'draft';
  } else {
    product.isActive = product.status === 'active';
  }

  if (product.productType === 'combo' || product.isCombo) {
    product.productType = 'combo';
    product.isCombo = true;
  } else if (product.productType === 'variable' || (Array.isArray(product.variants) && product.variants.length && product.productType !== 'single')) {
    product.productType = 'variable';
    product.isCombo = false;
    const variantStock = (product.variants || []).reduce((sum: number, variant: { stock?: number }) => sum + (Number(variant.stock) || 0), 0);
    if (variantStock > 0 || (product.variants || []).length) {
      product.stock = variantStock;
    }
  } else {
    product.productType = 'single';
    product.isCombo = false;
  }

  product.sku = String(product.sku || product.variants?.[0]?.sku || '').trim();
  product.tags = [...new Set((product.tags || []).map((tag) => String(tag).trim().toLowerCase()).filter(Boolean))];
  const specAttributes = parseSpecificationAttributes(product.specifications);
  const currentAttributes =
    product.attributes && typeof product.attributes === 'object' && !Array.isArray(product.attributes)
      ? Object.fromEntries(
          Object.entries(product.attributes).map(([key, value]) => [
            String(key).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
            value == null ? '' : String(value).trim(),
          ]).filter(([key, value]) => key && value),
        )
      : {};
  product.attributes = { ...specAttributes, ...currentAttributes };
  if (!product.seoTitle) {
    product.seoTitle = `${name} - Buy Online at gblrcdrone.com`.slice(0, 120);
  }
  if (!product.seoDescription) {
    const plain = String(product.description || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    product.seoDescription = plain.slice(0, 320);
  }
});

ProductSchema.index({ category: 1, subcategory: 1, status: 1, isCombo: 1 });
ProductSchema.index({ categoryId: 1, isActive: 1, displayOrder: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ 'variants.sku': 1 });
ProductSchema.index({ stockStatus: 1, stock: 1, status: 1 });
ProductSchema.index({ title: 'text', subtitle: 'text', description: 'text' });

export type ProductDoc = InferSchemaType<typeof ProductSchema> & { _id: Types.ObjectId };

export const ProductModel = (
  (mongoose.models.Product as mongoose.Model<ProductDoc> | undefined) ||
  mongoose.model<ProductDoc>('Product', ProductSchema)
) as Model<any>;
