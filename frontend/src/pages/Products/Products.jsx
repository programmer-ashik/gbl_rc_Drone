import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ROUTES } from "../../constants";
import ProductCard from "./ProductCard";
import ProductFilters from "../../components/products/ProductFilters";
import YouMayLike from "../../components/products/YouMayLike";
import QuickViewModal from "../../components/products/QuickViewModal";
import { ProductCardSkeleton } from "../../components/common/Skeleton/Skeleton";
import HeadlessSelect from "../../components/common/HeadlessSelect/HeadlessSelect";
import Icon from "../../components/common/Icon/Icon";
import Button from "../../components/common/Button/Button";
import { productService } from "../../services/productService";
import { useCatalog } from "../../contexts/CatalogContext";
import { readProductFilters, toFilterQuery, toFilterSearchParams } from "../../hooks/useProductFilters";
import { productPath } from "../../utils/products";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Highest rated" },
  { value: "popularity", label: "Popularity" },
];

const PRODUCT_GRID =
  "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

const gridTransition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] };

export const Products = ({
  lockedCategory = "",
  lockedSubCategory = "",
  title,
  hideInlineSearch = false,
  emptyMessage = "Try a different search or clear some filters.",
}) => {
  const { categories } = useCatalog();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(
    () => readProductFilters(searchParams, { category: lockedCategory, subCategory: lockedSubCategory }),
    [searchParams, lockedCategory, lockedSubCategory],
  );
  const [searchInput, setSearchInput] = useState(filters.q);
  const [result, setResult] = useState({ items: [], total: 0, totalPages: 1, facets: {}, page: 1, limit: 20 });
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quickView, setQuickView] = useState(null);
  const hasLoadedOnce = useRef(false);
  const requestId = useRef(0);

  useEffect(() => {
    setSearchInput(filters.q);
  }, [filters.q]);

  useEffect(() => {
    let active = true;
    const id = ++requestId.current;
    if (hasLoadedOnce.current) setRefreshing(true);
    else setInitialLoading(true);

    const query = toFilterQuery({
      ...filters,
      minPrice: "",
      maxPrice: "",
      rating: "",
      inStock: "",
      attributes: {},
      subCategory: lockedSubCategory || "",
    });

    productService
      .filter(query)
      .then((data) => {
        if (!active || id !== requestId.current) return;
        setResult(data || { items: [], total: 0, totalPages: 1, facets: {} });
      })
      .catch(() => {
        if (!active || id !== requestId.current) return;
        setResult({ items: [], total: 0, totalPages: 1, facets: {} });
      })
      .finally(() => {
        if (!active || id !== requestId.current) return;
        hasLoadedOnce.current = true;
        setInitialLoading(false);
        setRefreshing(false);
      });

    return () => {
      active = false;
    };
  }, [searchParams.toString(), lockedCategory, lockedSubCategory]);

  const applyFilters = (nextFilters) => {
    const cleaned = {
      ...nextFilters,
      minPrice: "",
      maxPrice: "",
      rating: "",
      inStock: "",
      attributes: {},
      subCategory: lockedSubCategory || "",
    };
    setSearchParams(toFilterSearchParams(cleaned, { category: lockedCategory, subCategory: lockedSubCategory }));
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearchParams(
      toFilterSearchParams(
        {
          sort: "newest",
          category: "",
          attributes: {},
          minPrice: "",
          maxPrice: "",
          rating: "",
          inStock: "",
          isFeatured: "",
          isNewArrival: "",
          q: "",
        },
        { category: lockedCategory, subCategory: lockedSubCategory },
      ),
    );
  };

  const submitSearch = (event) => {
    event.preventDefault();
    applyFilters({ ...filters, q: searchInput.trim(), page: 1 });
  };

  const heading = title || (filters.isFeatured === "true"
    ? "Featured Products"
    : filters.isNewArrival === "true"
      ? "New Arrival Products"
      : filters.q
        ? `Results for “${filters.q}”`
        : "All Products");

  const page = Number(filters.page || 1);
  const items = result.items || [];
  const showEmpty = !initialLoading && !refreshing && items.length === 0;
  const excludeIds = useMemo(
    () => items.map((item) => item._id || item.id).filter(Boolean),
    [items],
  );

  return (
    <div className="site-container bg-background py-5 text-text md:py-8">
      <nav className="page-breadcrumb" aria-label="Breadcrumb">
        <Link to={ROUTES.HOME} className="shrink-0 transition-colors hover:text-warning">Home</Link>
        <Icon name="chevron-right" size={3} className="shrink-0 cursor-default" />
        <Link to={ROUTES.PRODUCTS} className="shrink-0 transition-colors hover:text-warning">Products</Link>
        {lockedCategory && (
          <>
            <Icon name="chevron-right" size={3} className="shrink-0 cursor-default" />
            <span className="truncate font-medium capitalize text-text">{lockedCategory.replace(/-/g, " ")}</span>
          </>
        )}
        {lockedSubCategory && (
          <>
            <Icon name="chevron-right" size={3} className="shrink-0 cursor-default" />
            <span className="truncate font-medium capitalize text-text">{lockedSubCategory.replace(/-/g, " ")}</span>
          </>
        )}
      </nav>

      <div className="mb-4 flex flex-col justify-between gap-3 border-b border-border pb-4 md:flex-row md:items-end">
        <div className="min-w-0">
          <h1 className="page-title truncate capitalize">{heading}</h1>
          <p className="mt-1 text-[13px] text-text-muted">
            <span className="font-bold text-warning">{result.total || 0}</span> products found
            {!initialLoading && items.length > 0 && (
              <> · showing {(page - 1) * (result.limit || 20) + 1}–{(page - 1) * (result.limit || 20) + items.length}</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <HeadlessSelect
            label="Sort"
            value={filters.sort}
            options={SORT_OPTIONS}
            onChange={(next) => applyFilters({ ...filters, sort: next, page: 1 })}
            className="w-52"
            buttonClassName="bg-background-secondary"
          />
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-warning hover:bg-warning-bg">
            Clear all
          </Button>
        </div>
      </div>

      <form
        onSubmit={submitSearch}
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        {!hideInlineSearch ? (
          <div className="relative min-w-0 flex-1">
            <label htmlFor="products-search" className="mb-1 block text-xs font-semibold text-text-muted">
              Search
            </label>
            <Icon name="search" size={5} className="pointer-events-none absolute left-3 top-8 cursor-default text-text-muted" />
            <input
              id="products-search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              className="w-full rounded-xl border border-border bg-background-secondary py-2.5 pl-10 pr-4 text-sm text-text outline-none transition-colors focus:border-warning focus:ring-2 focus:ring-warning/20 focus:outline-none"
            />
          </div>
        ) : null}
        {!lockedCategory ? (
          <ProductFilters
            filters={filters}
            facets={result.facets || {}}
            categories={categories}
            lockedCategory={lockedCategory}
            onChange={applyFilters}
            className="w-full shrink-0 sm:w-56"
          />
        ) : null}
        {!hideInlineSearch ? (
          <Button type="submit" variant="solid" size="sm" className="h-[42px] shrink-0 cursor-pointer rounded-xl bg-warning px-5 text-white sm:mb-0">
            Search
          </Button>
        ) : null}
      </form>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_240px]">
        <section className="min-h-[24rem] min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            {initialLoading ? (
              <motion.div
                key="skeletons"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={gridTransition}
                className={PRODUCT_GRID}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => (
                  <ProductCardSkeleton key={item} />
                ))}
              </motion.div>
            ) : showEmpty ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={gridTransition}
                className="rounded-2xl bg-background-secondary py-16 text-center"
              >
                <Icon name="search" size={8} className="mx-auto mb-3 cursor-default text-warning" />
                <h2 className="font-bold text-text-primary">No products found</h2>
                <p className="mt-1 text-sm text-text-muted">{emptyMessage}</p>
                <Button variant="solid" size="sm" onClick={clearFilters} className="mt-4 bg-warning text-white">Clear filters</Button>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: refreshing ? 0.5 : 1 }}
                exit={{ opacity: 0 }}
                transition={gridTransition}
                className="relative will-change-[opacity]"
              >
                <div className={`${PRODUCT_GRID} ${refreshing ? "pointer-events-none" : ""}`}>
                  {items.map((product) => (
                    <ProductCard
                      key={product._id || product.id}
                      product={{ ...product, path: productPath(product) }}
                      onQuickView={setQuickView}
                      compact
                    />
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm">
                  <p className="text-text-muted">Page {result.page} of {result.totalPages}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={page <= 1 || refreshing}
                      className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
                      onClick={() => applyFilters({ ...filters, page: page - 1 })}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={page >= (result.totalPages || 1) || refreshing}
                      className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
                      onClick={() => applyFilters({ ...filters, page: page + 1 })}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <div className="min-w-0 xl:sticky xl:top-[calc(var(--header-h,64px)+1rem)] xl:self-start">
          <YouMayLike excludeIds={excludeIds} category={lockedCategory || filters.category || ""} />
        </div>
      </div>

      <QuickViewModal product={quickView} open={Boolean(quickView)} onClose={() => setQuickView(null)} />
    </div>
  );
};

export default Products;
