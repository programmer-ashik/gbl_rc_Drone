import { STORAGE_KEYS } from '../constants/api';
import { productImages, productPath, productPrice, productTitle } from './products';

const MAX = 12;

const read = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECENTLY_VIEWED);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const write = (items) => {
  localStorage.setItem(STORAGE_KEYS.RECENTLY_VIEWED, JSON.stringify(items.slice(0, MAX)));
};

export const getRecentlyViewed = () => read();

export const trackProductView = (product) => {
  if (!product?._id && !product?.id) return getRecentlyViewed();
  const id = String(product._id || product.id);
  const entry = {
    _id: id,
    title: productTitle(product),
    slug: product.slug,
    image: productImages(product)[0] || product.image || '',
    price: productPrice(product),
    path: productPath(product),
    viewedAt: Date.now(),
  };
  const next = [entry, ...read().filter((item) => String(item._id) !== id)].slice(0, MAX);
  write(next);
  return next;
};

export const clearRecentlyViewed = () => {
  localStorage.removeItem(STORAGE_KEYS.RECENTLY_VIEWED);
};
