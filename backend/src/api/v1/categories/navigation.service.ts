import { CategoryModel } from './category.model.js';
import { buildCategoryTree, toCategoryDto, type CategoryDto, type CategoryTreeNode } from './category.mapper.js';
import { CACHE_KEYS, CACHE_TTL } from '../../../core/cache/keys.js';
import { cacheReadThrough } from '../../../core/cache/redis.js';
import { invalidateCategoryCaches } from '../../../core/cache/invalidate.js';

const ACTIVE_QUERY = {
  $or: [{ isActive: true }, { isActive: { $exists: false }, active: { $ne: false } }],
};

const loadActiveCategories = async (): Promise<CategoryDto[]> => {
  const docs = await CategoryModel.find(ACTIVE_QUERY)
    .sort({ displayOrder: 1, order: 1, name: 1, label: 1 })
    .lean();
  return docs.map((doc) => toCategoryDto(doc as unknown as CategoryDto & { _id: any }));
};

export const getNavigationTree = async (): Promise<CategoryTreeNode[]> =>
  cacheReadThrough(CACHE_KEYS.CATEGORIES_TREE, CACHE_TTL.CATEGORIES, async () =>
    buildCategoryTree(await loadActiveCategories()),
  );

export const getNavCategories = async (): Promise<CategoryTreeNode[]> =>
  cacheReadThrough(CACHE_KEYS.CATEGORIES_NAV, CACHE_TTL.CATEGORIES, async () => {
    const categories = await loadActiveCategories();
    return buildCategoryTree(categories, (item) => item.isNavVisible);
  });

export const getFooterCategories = async (): Promise<CategoryDto[]> =>
  cacheReadThrough(CACHE_KEYS.CATEGORIES_FOOTER, CACHE_TTL.CATEGORIES, async () => {
    const categories = await loadActiveCategories();
    return categories
      .filter((item) => item.isFooterVisible)
      .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
  });

export const invalidateNavigationCache = async (): Promise<void> => {
  await invalidateCategoryCaches();
};

export const migrateLegacyCategories = async (): Promise<void> => {
  const docs = await CategoryModel.find();
  const bySlug = new Map(docs.map((doc) => [doc.slug, doc]));

  for (const doc of docs) {
    let dirty = false;
    const name = (doc.name || doc.label || '').trim();
    if (name && (doc.name !== name || doc.label !== name)) {
      doc.name = name;
      doc.label = name;
      dirty = true;
    }
    const isActive = doc.isActive ?? doc.active ?? true;
    if (doc.isActive !== isActive || doc.active !== isActive) {
      doc.isActive = isActive;
      doc.active = isActive;
      dirty = true;
    }
    const displayOrder = doc.displayOrder ?? doc.order ?? 0;
    if (doc.displayOrder !== displayOrder || doc.order !== displayOrder) {
      doc.displayOrder = displayOrder;
      doc.order = displayOrder;
      dirty = true;
    }
    if (doc.isNavVisible === undefined || doc.isNavVisible === null) {
      doc.isNavVisible = true;
      dirty = true;
    }
    if (doc.isFooterVisible === undefined || doc.isFooterVisible === null) {
      doc.isFooterVisible = doc.level === 1 && !doc.parentId && !doc.parentSlug;
      dirty = true;
    }
    if (!doc.parentId && doc.parentSlug) {
      const parent = bySlug.get(doc.parentSlug);
      if (parent) {
        doc.parentId = parent._id;
        dirty = true;
      }
    }
    const nextLevel = doc.parentId || doc.parentSlug ? Math.min(3, ((bySlug.get(doc.parentSlug || '')?.level || 1) + 1)) : 1;
    if (doc.parentId) {
      const parent = docs.find((item) => item._id.toString() === doc.parentId?.toString());
      const computed = parent ? Math.min(3, (parent.level || 1) + 1) : nextLevel;
      if (doc.level !== computed) {
        doc.level = computed as 1 | 2 | 3;
        dirty = true;
      }
    } else if (!doc.parentSlug && doc.level !== 1) {
      doc.level = 1;
      dirty = true;
    }
    if (dirty) await doc.save();
  }
};
