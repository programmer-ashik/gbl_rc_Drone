// src/utils/cn.js
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names with Tailwind CSS classes
 * Combines clsx and tailwind-merge for optimal class name merging
 *
 * @param {...any} inputs - Class names to merge
 * @returns {string} - Merged class names
 *
 * @example
 * cn('px-2 py-1', 'bg-blue-500', { 'text-white': true })
 * // => 'px-2 py-1 bg-blue-500 text-white'
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Generate conditional class names
 *
 * @param {Object} classes - Object with class names as keys and conditions as values
 * @returns {string} - Space-separated class names
 *
 * @example
 * conditionalClasses({
 *   'bg-blue-500': isActive,
 *   'text-white': isActive,
 *   'bg-gray-500': !isActive,
 * })
 */
export const conditionalClasses = (classes) => {
  return cn(
    Object.entries(classes)
      .filter(([_, condition]) => condition)
      .map(([className]) => className),
  );
};

/**
 * Create a class name builder with variants
 *
 * @param {Object} variants - Variant configurations
 * @param {string} defaultVariant - Default variant
 * @returns {Function} - Class name builder
 *
 * @example
 * const button = createVariantBuilder({
 *   size: {
 *     sm: 'px-2 py-1 text-sm',
 *     md: 'px-4 py-2 text-base',
 *     lg: 'px-6 py-3 text-lg',
 *   },
 *   variant: {
 *     primary: 'bg-blue-500 text-white',
 *     secondary: 'bg-gray-500 text-white',
 *   },
 * })
 *
 * button({ size: 'sm', variant: 'primary' })
 * // => 'px-2 py-1 text-sm bg-blue-500 text-white'
 */
export const createVariantBuilder = (variants, defaultVariant = {}) => {
  return (props = {}) => {
    const allProps = { ...defaultVariant, ...props };
    const classes = [];

    Object.keys(variants).forEach((key) => {
      const variantKey = allProps[key];
      if (variantKey && variants[key][variantKey]) {
        classes.push(variants[key][variantKey]);
      }
    });

    return cn(classes);
  };
};

/**
 * Memoize class names for performance
 *
 * @param {Function} fn - Function that generates class names
 * @returns {Function} - Memoized function
 */
export const memoizeClasses = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

/**
 * Filter out falsy class names
 *
 * @param {...any} classes - Class names to filter
 * @returns {string} - Filtered class names
 */
export const filterClasses = (...classes) => {
  return cn(classes.filter(Boolean));
};

export default cn;
