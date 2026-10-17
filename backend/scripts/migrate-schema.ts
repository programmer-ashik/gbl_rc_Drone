/**
 * Schema migration: categories → navigation tree, then products.
 * Safe to re-run (idempotent field sync).
 * Usage: npm run migrate
 */
import 'dotenv/config';
import { connectDatabase } from '../src/loaders/mongoose.loader.js';
import { CategoryModel } from '../src/api/v1/categories/category.model.js';
import { ProductModel, calculateFinalPrice } from '../src/api/v1/products/product.model.js';
import { recountCategoryProducts } from '../src/api/v1/products/product.service.js';
import { invalidateNavigationCache } from '../src/api/v1/categories/navigation.service.js';
import { CartModel } from '../src/api/v1/cart/cart.model.js';

const toId = (value: { _id?: { toString(): string } } | null | undefined) =>
  value?._id ? value._id.toString() : undefined;

const repairCartIndexes = async () => {
  const coll = CartModel.collection;
  for (const name of [
    'userId_1_organizationId_1',
    'sessionId_1_organizationId_1',
    'userId_1',
    'sessionId_1',
  ]) {
    try {
      await coll.dropIndex(name);
      console.log(`Dropped legacy cart index: ${name}`);
    } catch {
      // already gone
    }
  }
  // Clear guest carts that used null userId (blocked by old unique index)
  const cleaned = await CartModel.deleteMany({
    $or: [{ userId: null }, { userId: { $exists: false } }],
    sessionId: { $type: 'string' },
  });
  if (cleaned.deletedCount) {
    console.log(`Cleared ${cleaned.deletedCount} legacy guest cart(s)`);
  }
  await CartModel.syncIndexes();
  console.log('Cart indexes synced');
};

const migrateCategories = async () => {
  const categories = await CategoryModel.find();
  let updated = 0;

  const byId = new Map(categories.map((item) => [item._id.toString(), item]));

  for (const category of categories) {
    const name = String(category.name || category.label || category.slug || '').trim();
    if (!name) continue;

    let parent = category.parentId ? byId.get(category.parentId.toString()) : null;
    if (!parent && category.parentSlug) {
      parent = categories.find((item) => item.slug === category.parentSlug) || null;
    }

    let level = 1;
    if (parent) {
      const grand = parent.parentId ? byId.get(parent.parentId.toString()) : null;
      level = grand ? 3 : 2;
      category.parentId = parent._id;
      category.parentSlug = parent.slug;
    } else {
      category.parentId = null;
      category.parentSlug = null;
    }

    category.name = name;
    category.label = name;
    category.level = level;
    category.isActive = category.isActive ?? category.active ?? true;
    category.active = category.isActive;
    const order = Number(category.displayOrder ?? category.order ?? 0) || 0;
    category.displayOrder = order;
    category.order = order;
    category.isNavVisible = category.isNavVisible !== false;
    category.isFooterVisible = Boolean(category.isFooterVisible);
    category.metaTitle = category.metaTitle || `${name} | GBLrc`;
    category.metaDescription = category.metaDescription || `Shop ${name} at GBLrc Drone store.`;
    category.productCount = Number(category.productCount) || 0;

    await category.save();
    updated += 1;
  }

  // Ensure root categories are nav-visible by default
  const roots = await CategoryModel.find({ $or: [{ parentId: null }, { level: 1 }] });
  for (const root of roots) {
    if (root.isNavVisible == null) {
      root.isNavVisible = true;
      await root.save();
    }
  }

  await CategoryModel.syncIndexes();
  console.log(`Categories migrated: ${updated} (roots for nav: ${roots.length})`);
  return categories;
};

const migrateProducts = async (categories: Awaited<ReturnType<typeof CategoryModel.find>>) => {
  const bySlug = new Map(categories.map((item) => [item.slug, item]));
  const byId = new Map(categories.map((item) => [item._id.toString(), item]));

  let updated = 0;
  let skipped = 0;
  const cursor = ProductModel.find().cursor();

  for await (const product of cursor) {
    const name = String(product.name || product.title || '').trim();
    if (!name) {
      skipped += 1;
      continue;
    }

    const parent =
      (product.categoryId && byId.get(product.categoryId.toString())) ||
      bySlug.get(String(product.category || '').toLowerCase()) ||
      null;
    let child =
      (product.subCategoryId && byId.get(product.subCategoryId.toString())) ||
      bySlug.get(String(product.subcategory || '').toLowerCase()) ||
      null;
    if (child && parent && child._id.toString() === parent._id.toString()) child = null;
    if (
      child &&
      parent &&
      child.parentId &&
      child.parentId.toString() !== parent._id.toString() &&
      child.parentSlug !== parent.slug
    ) {
      child = null;
    }

    const basePrice = Number(product.basePrice ?? product.price ?? 0);
    let discount = Number(product.discount);
    if (!Number.isFinite(discount)) discount = 0;
    let finalPrice = product.finalPrice != null ? Number(product.finalPrice) : null;
    if ((finalPrice == null || finalPrice === 0) && product.discountPrice != null && product.discountPrice < basePrice) {
      finalPrice = Number(product.discountPrice);
      if (basePrice > 0) {
        discount = Math.round(((basePrice - finalPrice) / basePrice) * 10000) / 100;
      }
    }
    if (finalPrice == null) finalPrice = calculateFinalPrice(basePrice, discount, product.discountPrice);
    const threshold = Number(product.stockAlertThreshold ?? product.lowStockThreshold ?? 5) || 5;
    const tags =
      Array.isArray(product.tags) && product.tags.length
        ? product.tags
        : [product.category, product.subcategory].filter(Boolean);

    product.name = name;
    product.title = name;
    product.categoryId = parent?._id ?? product.categoryId ?? null;
    product.subCategoryId = child?._id ?? null;
    if (parent) product.category = parent.slug;
    if (child) product.subcategory = child.slug;
    product.tags = [...new Set(tags.map((tag: string) => String(tag).trim().toLowerCase()).filter(Boolean))];
    product.price = basePrice;
    product.basePrice = basePrice;
    product.discount = discount;
    product.finalPrice = finalPrice;
    product.discountPrice = finalPrice < basePrice ? finalPrice : null;
    product.onSale = Boolean(product.onSale) || finalPrice < basePrice;
    product.stockAlertThreshold = threshold;
    product.lowStockThreshold = threshold;
    product.isFeatured = Boolean(product.isFeatured || product.isBestSeller);
    product.isBestSeller = Boolean(product.isBestSeller);
    product.isNewArrival = Boolean(product.isNewArrival);
    product.isActive = product.status === 'active';
    product.displayOrder = Number(product.displayOrder) || 0;
    product.seoTitle = product.seoTitle || `${name} - Buy Online at gblrcdrone.com`.slice(0, 120);
    product.seoDescription = product.seoDescription || String(product.description || '').slice(0, 320);
    product.viewCount = Number(product.viewCount) || 0;
    product.compatibleWith = Array.isArray(product.compatibleWith) ? product.compatibleWith : [];
    product.variants = Array.isArray(product.variants) ? product.variants : [];
    product.comboItems = Array.isArray(product.comboItems) ? product.comboItems : [];
    if (product.isCombo || product.productType === 'combo') {
      product.isCombo = true;
      product.productType = 'combo';
    } else {
      product.productType = product.productType || 'single';
    }

    await product.save();
    updated += 1;
  }

  await ProductModel.syncIndexes();
  await recountCategoryProducts(categories.map((item) => toId(item)));
  console.log(`Products migrated: ${updated} updated, ${skipped} skipped`);
};

const run = async () => {
  await connectDatabase();
  console.log('Starting schema migration…');
  await repairCartIndexes();
  const categories = await migrateCategories();
  await migrateProducts(categories);
  await invalidateNavigationCache().catch(() => undefined);
  console.log('Migration complete. Navigation cache invalidated.');
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
