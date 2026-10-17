import { STORAGE_KEYS } from '../constants/api';
import { productImages, productPath, productPrice, productTitle, parseSpecifications } from './products';

const MAX = 4;
const listeners = new Set();

const read = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMPARE);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const write = (items) => {
  localStorage.setItem(STORAGE_KEYS.COMPARE, JSON.stringify(items.slice(0, MAX)));
  listeners.forEach((fn) => fn(items));
};

export const getCompareItems = () => read();

export const subscribeCompare = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const addToCompare = (product) => {
  if (!product?._id && !product?.id) return { items: read(), error: 'Invalid product' };
  const id = String(product._id || product.id);
  const current = read();
  if (current.some((item) => String(item._id) === id)) return { items: current, error: null };
  if (current.length >= MAX) return { items: current, error: `Compare up to ${MAX} products` };
  const specs = parseSpecifications(product.specifications || product.attributes || {});
  const entry = {
    _id: id,
    title: productTitle(product),
    slug: product.slug,
    image: productImages(product)[0] || product.image || '',
    price: productPrice(product),
    rating: Number(product.rating || 0),
    stock: Number(product.stock || 0),
    category: product.category || '',
    path: productPath(product),
    specs: Object.fromEntries(specs.map((row) => [row.key, row.value])),
  };
  const items = [...current, entry];
  write(items);
  return { items, error: null };
};

export const removeFromCompare = (productId) => {
  const items = read().filter((item) => String(item._id) !== String(productId));
  write(items);
  return items;
};

export const clearCompare = () => {
  write([]);
};

export const isInCompare = (productId) => read().some((item) => String(item._id) === String(productId));
