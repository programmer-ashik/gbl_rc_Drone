import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoryService } from '../services/categoryService';
import { queryKeys } from '../lib/queryClient';

const CatalogContext = React.createContext(null);

const withPath = (category, parentPath = '') => {
  const slug = category.slug || category.id || '';
  const path = parentPath ? `${parentPath}/${slug}` : `/category/${slug}`;
  const rawChildren = Array.isArray(category.children)
    ? category.children
    : Array.isArray(category.subcategories)
      ? category.subcategories
      : [];
  const children = rawChildren.map((child) => withPath(child, path));

  return {
    ...category,
    id: category._id || category.id || slug,
    slug,
    name: category.name || category.label || slug,
    label: category.name || category.label || slug,
    icon: category.icon || 'grid',
    path,
    children,
    subcategories: children,
  };
};

const normalizeCategories = (items = []) =>
  (Array.isArray(items) ? items : [])
    .map((category) => withPath(category))
    .sort((a, b) => (a.displayOrder ?? a.order ?? 0) - (b.displayOrder ?? b.order ?? 0));

export const CatalogProvider = ({ children }) => {
  const treeQuery = useQuery({
    queryKey: queryKeys.categories.tree,
    queryFn: () => categoryService.tree(),
    placeholderData: (previous) => previous,
  });
  const navQuery = useQuery({
    queryKey: queryKeys.categories.nav,
    queryFn: () => categoryService.nav(),
    placeholderData: (previous) => previous,
  });
  const footerQuery = useQuery({
    queryKey: queryKeys.categories.footer,
    queryFn: () => categoryService.footer(),
    placeholderData: (previous) => previous,
  });

  const categories = useMemo(() => {
    if (Array.isArray(treeQuery.data)) return normalizeCategories(treeQuery.data);
    return [];
  }, [treeQuery.data]);

  const navCategories = useMemo(() => {
    if (Array.isArray(navQuery.data) && navQuery.data.length) {
      return normalizeCategories(navQuery.data);
    }
    // Prefer full tree for navbar when nav endpoint is empty
    return categories;
  }, [navQuery.data, categories]);

  const footerCategories = useMemo(() => {
    if (Array.isArray(footerQuery.data) && footerQuery.data.length) {
      return footerQuery.data.map((item) => ({
        ...item,
        id: item._id || item.slug,
        name: item.name || item.label,
        label: item.name || item.label,
        path: `/category/${item.slug}`,
        icon: item.icon || 'grid',
      }));
    }
    return categories
      .filter((item) => item.isFooterVisible !== false && !item.parentId)
      .map((item) => ({
        ...item,
        path: `/category/${item.slug}`,
      }));
  }, [footerQuery.data, categories]);

  const refreshCategories = async () => {
    await Promise.all([treeQuery.refetch(), navQuery.refetch(), footerQuery.refetch()]);
  };

  const loading =
    (treeQuery.isLoading && !treeQuery.data) || (navQuery.isLoading && !navQuery.data);

  const value = useMemo(
    () => ({
      categories,
      navCategories,
      footerCategories,
      loading,
      isFetching: treeQuery.isFetching || navQuery.isFetching || footerQuery.isFetching,
      error:
        treeQuery.error?.message || navQuery.error?.message || footerQuery.error?.message || '',
      refreshCategories,
    }),
    [categories, navCategories, footerCategories, loading, treeQuery, navQuery, footerQuery],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
};

export const useCatalog = () => {
  const context = React.useContext(CatalogContext);
  if (!context) throw new Error('useCatalog must be used inside CatalogProvider');
  return context;
};
