import 'dotenv/config';
import { connectDatabase } from '../src/loaders/mongoose.loader.js';
import { CategoryModel } from '../src/api/v1/categories/category.model.js';
import { ProductModel, calculateFinalPrice } from '../src/api/v1/products/product.model.js';
import { recountCategoryProducts } from '../src/api/v1/products/product.service.js';

const toId = (value: { _id?: { toString(): string } } | null | undefined) =>
  value?._id ? value._id.toString() : undefined;

const run = async () => {
  await connectDatabase();

  const categories = await CategoryModel.find().lean();
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
    if (child && parent && child.parentId && child.parentId.toString() !== parent._id.toString() && child.parentSlug !== parent.slug) {
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
    const tags = Array.isArray(product.tags) && product.tags.length
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
    product.seoTitle = product.seoTitle || name.slice(0, 120);
    product.seoDescription = product.seoDescription || String(product.description || '').slice(0, 320);
    product.viewCount = Number(product.viewCount) || 0;
    product.compatibleWith = Array.isArray(product.compatibleWith) ? product.compatibleWith : [];
    product.variants = Array.isArray(product.variants) ? product.variants : [];
    const inferred: Record<string, string> = {};
    const category = String(product.category || '');
    const subcategory = String(product.subcategory || '');
    if (category === 'motors' || subcategory.includes('motor')) {
      inferred.type = 'brushless';
      inferred.use = 'drone';
    } else if (category === 'batteries' || subcategory.includes('lipo') || subcategory.includes('battery')) {
      inferred.chemistry = 'lipo';
      inferred.use = 'power';
    } else if (category === 'drones') {
      inferred.platform = 'quadcopter';
      inferred.use = 'aerial';
    } else if (category === 'fpv-racing') {
      inferred.use = 'fpv';
      inferred.platform = 'racing';
    } else if (category === 'transmitters') {
      inferred.use = 'radio';
    } else if (category === 'accessories') {
      inferred.use = 'workshop';
    }
    if (product.isBestSeller) inferred.tier = 'bestseller';
    else if (product.isNewArrival) inferred.tier = 'new';
    const current =
      product.attributes && typeof product.attributes === 'object' && !Array.isArray(product.attributes)
        ? product.attributes
        : {};
    product.attributes = { ...inferred, ...current };
    await product.save();
    updated += 1;
  }

  await ProductModel.syncIndexes();
  await CategoryModel.syncIndexes();
  await recountCategoryProducts(categories.map((item) => toId(item)));

  console.log(`Product migration complete: ${updated} updated, ${skipped} skipped`);
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
