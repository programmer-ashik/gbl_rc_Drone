import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Icon } from "../../common/Icon/Icon";
import { ROUTES } from "../../../constants";
import { cn } from "../../../utils/cn";
import ProductSearchForm from "./ProductSearchForm";

const navItemClasses =
  "px-2.5 py-1.5 text-[13px] font-medium text-text rounded-lg whitespace-nowrap transition-colors duration-200 hover:bg-warning-bg hover:text-warning focus-visible:bg-warning-bg focus-visible:text-warning focus-visible:outline-none";

export const DesktopHeader = ({
  isCategoriesOpen,
  setIsCategoriesOpen,
  hoveredCategory,
  setHoveredCategory,
  categories = [],
  loading = false,
}) => {
  const activeCategory =
    categories.find((category) => category.id === hoveredCategory) ??
    categories[0];
  // Show a few top-level categories inline; rest live in the mega menu
  const inlineCategories = categories.slice(0, 5);

  const openCategories = () => {
    setIsCategoriesOpen(true);
    setHoveredCategory((current) => current ?? categories[0]?.id ?? null);
  };

  const closeCategories = () => {
    setIsCategoriesOpen(false);
    setHoveredCategory(null);
  };

  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      closeCategories();
    }
  };

  return (
    <div className='relative hidden w-full items-center gap-1 self-stretch lg:flex xl:gap-2'>
      <Link to={ROUTES.HOME} className={navItemClasses}>
        Home
      </Link>

      <div
        className='static flex items-center self-stretch'
        onMouseEnter={openCategories}
        onMouseLeave={closeCategories}
        onFocus={openCategories}
        onBlur={handleBlur}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            closeCategories();
            event.currentTarget.querySelector("button")?.focus();
          }
        }}
      >
        <button
          type='button'
          id='desktop-categories-trigger'
          aria-haspopup='menu'
          aria-expanded={isCategoriesOpen}
          aria-controls='desktop-categories-menu'
          onClick={() => {
            if (isCategoriesOpen) closeCategories();
            else openCategories();
          }}
          className={cn(
            navItemClasses,
            "inline-flex cursor-pointer items-center gap-1",
            isCategoriesOpen && "bg-warning-bg text-warning",
          )}
        >
          Categories
          <Icon
            name='chevron-down'
            size={4}
            className={cn(
              "cursor-default transition-transform duration-200",
              isCategoriesOpen && "rotate-180",
            )}
          />
        </button>

        <AnimatePresence>
          {isCategoriesOpen && (
            <motion.div
              id='desktop-categories-menu'
              role='menu'
              initial={{ opacity: 0, y: -14, scaleY: 0.96 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -10, scaleY: 0.98 }}
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 28,
                mass: 0.7,
              }}
              className='absolute inset-x-0 top-full z-[130] origin-top overflow-hidden rounded-b-2xl bg-background shadow-2xl shadow-black/15'
            >
              <div className='grid min-h-80 grid-cols-[240px_minmax(0,1fr)]'>
                <div className='p-3'>
                  <p className='px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.16em] text-text-muted'>
                    Shop by category
                  </p>
                  <div className='max-h-[22rem] space-y-1 overflow-y-auto'>
                    {loading && !categories.length ? (
                      <p className='px-3 py-4 text-sm text-text-muted'>
                        Loading categories…
                      </p>
                    ) : null}
                    {categories.map((category) => {
                      const isActive = activeCategory?.id === category.id;
                      return (
                        <Link
                          key={category.id}
                          to={category.path}
                          role='menuitem'
                          onMouseEnter={() => setHoveredCategory(category.id)}
                          onFocus={() => setHoveredCategory(category.id)}
                          onClick={closeCategories}
                          className={cn(
                            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none",
                            isActive
                              ? "bg-warning-bg text-warning"
                              : "text-text hover:bg-warning-bg hover:text-warning focus-visible:bg-warning-bg focus-visible:text-warning",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background-secondary transition-colors duration-200",
                              isActive && "bg-warning-bg text-warning",
                            )}
                          >
                            <Icon
                              name={category.icon || "grid"}
                              size={5}
                              className='cursor-default'
                            />
                          </span>
                          <span className='min-w-0 flex-1 truncate'>
                            {category.label}
                          </span>
                          {(category.subcategories?.length || 0) > 0 ? (
                            <Icon
                              name='chevron-right'
                              size={4}
                              className={cn(
                                "shrink-0 cursor-default text-text-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-warning",
                                isActive && "translate-x-0.5 text-warning",
                              )}
                            />
                          ) : null}
                        </Link>
                      );
                    })}
                    {!loading && !categories.length ? (
                      <p className='px-3 py-4 text-sm text-text-muted'>
                        No categories yet.
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className='p-6'>
                  {activeCategory ? (
                    <AnimatePresence mode='wait'>
                      <motion.div
                        key={activeCategory.id}
                        initial={{ opacity: 0, x: 16, filter: "blur(2px)" }}
                        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, x: -12, filter: "blur(2px)" }}
                        transition={{
                          duration: 0.22,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <div className='mb-5 flex items-center justify-between gap-4'>
                          <div>
                            <p className='text-xs font-semibold uppercase tracking-[0.16em] text-warning'>
                              Explore
                            </p>
                            <h3 className='mt-1 text-xl font-bold text-text-primary'>
                              {activeCategory.label}
                            </h3>
                          </div>
                          <Link
                            to={activeCategory.path}
                            onClick={closeCategories}
                            className='inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-warning transition-colors duration-200 hover:bg-warning-bg focus-visible:bg-warning-bg focus-visible:outline-none'
                          >
                            View all
                            <Icon name='arrow-right' size={4} />
                          </Link>
                        </div>

                        {(activeCategory.subcategories || []).length ? (
                          <div className='grid grid-cols-2 gap-2 xl:grid-cols-3'>
                            {activeCategory.subcategories.map((subcategory) => (
                              <div key={subcategory.id} className='space-y-1'>
                                <Link
                                  to={subcategory.path}
                                  role='menuitem'
                                  onClick={closeCategories}
                                  className='block rounded-lg px-3 py-2.5 text-sm font-medium text-text transition-colors duration-200 hover:bg-warning-bg hover:text-warning focus-visible:bg-warning-bg focus-visible:text-warning focus-visible:outline-none'
                                >
                                  {subcategory.label}
                                </Link>
                                {(subcategory.subcategories || []).map(
                                  (nested) => (
                                    <Link
                                      key={nested.id}
                                      to={nested.path}
                                      role='menuitem'
                                      onClick={closeCategories}
                                      className='block rounded-lg px-3 py-1.5 text-xs text-text-secondary transition-colors duration-200 hover:bg-warning-bg hover:text-warning'
                                    >
                                      {nested.label}
                                    </Link>
                                  ),
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className='text-sm text-text-muted'>
                            No subcategories — browse all {activeCategory.label}{" "}
                            products.
                          </p>
                        )}

                        <div className='mt-6 flex flex-wrap gap-2'>
                          <Link
                            to={ROUTES.PRODUCTS}
                            onClick={closeCategories}
                            className='inline-flex items-center gap-2 rounded-lg bg-warning-bg px-3 py-2 text-sm font-semibold text-warning transition-colors duration-200 hover:bg-warning/15'
                          >
                            <Icon name='shopping-bag' size={4} />
                            All Products
                          </Link>
                          <Link
                            to={ROUTES.NEW_ARRIVALS}
                            onClick={closeCategories}
                            className='inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-text transition-colors duration-200 hover:bg-warning-bg hover:text-warning'
                          >
                            <Icon name='star' size={4} />
                            New Arrivals
                          </Link>
                          <Link
                            to={ROUTES.SALE}
                            onClick={closeCategories}
                            className='inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-text transition-colors duration-200 hover:bg-warning-bg hover:text-warning'
                          >
                            <Icon name='tag' size={4} />
                            Sale
                          </Link>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  ) : (
                    <div className='flex min-h-64 items-center justify-center text-sm text-text-muted'>
                      {loading
                        ? "Loading categories…"
                        : "No categories are available."}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className='hidden items-center gap-1 xl:flex'>
        <Link to={ROUTES.PRODUCTS} className={navItemClasses}>
          All Products
        </Link>
        <Link to={ROUTES.CONTACT} className={navItemClasses}>
          Contact Us
        </Link>
      </div>

      <ProductSearchForm className='ml-auto w-40 lg:w-48 xl:w-60' />
    </div>
  );
};

export default DesktopHeader;
