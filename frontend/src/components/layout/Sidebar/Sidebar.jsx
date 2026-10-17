// src/components/layout/Sidebar/Sidebar.jsx
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Icon } from "../../common/Icon/Icon";
import { Button } from "../../common/Button/Button";
import { useSidebar } from "../../../hooks/useSidebar";
import { useCatalog } from "../../../contexts/CatalogContext";
import { cn } from "../../../utils/cn";

export const Sidebar = () => {
  const { isOpen, closeSidebar } = useSidebar();
  const location = useLocation();
  const [expandedCategories, setExpandedCategories] = useState([]);
  const { categories, loading } = useCatalog();

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  const isCategoryActive = (path) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className='flex flex-col h-full bg-background'>
      {/* Sidebar Header - Only visible on mobile */}
      <div className='flex items-center justify-between p-4 lg:hidden'>
        <h2 className='text-lg font-bold text-text-primary'>Categories</h2>
        <Button variant='ghost' size='sm' onClick={closeSidebar}>
          <Icon name='close' size={6} />
        </Button>
      </div>

      {/* Scrollable Content - Hide scrollbar */}
      <nav
        className={cn(
          "flex-1 p-4 space-y-1",
          // Hide scrollbar for all browsers
          "scrollbar-hide",
          // For Firefox
          "scrollbar-none",
          // For Webkit browsers (Chrome, Safari, Edge)
          "[&::-webkit-scrollbar]:hidden",
          // For Firefox
          "[-ms-overflow-style:none]",
          "[scrollbar-width:none]",
          // Keep scrolling functional
          "overflow-y-auto overflow-x-hidden",
        )}
      >
        {/* All Products */}
        <Link
          to='/products'
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
            location.pathname === "/products"
              ? "bg-background-secondary text-text-primary"
              : "text-text-secondary hover:bg-background-secondary hover:text-text-primary",
          )}
          onClick={closeSidebar}
        >
          <Icon name='grid' size={5} />
          <span className='text-sm font-medium'>All Products</span>
        </Link>

        {/* New Arrivals */}
        <Link
          to='/new-arrivals'
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
            location.pathname === "/new-arrivals"
              ? "bg-background-secondary text-text-primary"
              : "text-text-secondary hover:bg-background-secondary hover:text-text-primary",
          )}
          onClick={closeSidebar}
        >
          <Icon name='star' size={5} />
          <span className='text-sm font-medium'>New Arrivals</span>
        </Link>

        {/* Sale */}
        <Link
          to='/sale'
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
            location.pathname === "/sale"
              ? "bg-warning-bg text-warning"
              : "text-warning hover:bg-warning-bg",
          )}
          onClick={closeSidebar}
        >
          <Icon name='tag' size={5} />
          <span className='text-sm font-medium'>Sale</span>
        </Link>

        <div className='border-t border-border my-4'></div>

        {/* Category List */}
        {loading && <p className='px-3 py-2 text-xs text-text-muted'>Loading categories...</p>}
        {categories.map((category) => {
          const isExpanded = expandedCategories.includes(category.id);
          const isActive = isCategoryActive(category.path);

          return (
            <div key={category.id} className='space-y-1'>
              <button
                onClick={() => toggleCategory(category.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors",
                  isActive
                    ? "bg-background-secondary text-text-primary"
                    : "text-text-secondary hover:bg-background-secondary hover:text-text-primary",
                )}
              >
                <span className='flex items-center gap-3'>
                  <Icon name={category.icon} size={5} />
                  <span className='text-sm font-medium'>{category.label}</span>
                </span>
                {category.subcategories.length > 0 && (
                  <Icon
                    name='chevron-right'
                    size={4}
                    className={cn(
                      "transition-transform",
                      isExpanded && "rotate-90",
                    )}
                  />
                )}
              </button>

              {/* Subcategories */}
              {category.subcategories.length > 0 && isExpanded && (
                <div className='ml-6 pl-2 border-l-2 border-border space-y-1'>
                  {category.subcategories.map((sub) => (
                    <div key={sub.id}>
                      <Link
                        to={sub.path}
                        className={cn(
                          "block px-3 py-1.5 text-sm rounded-lg transition-colors",
                          location.pathname === sub.path
                            ? "text-warning bg-warning-bg"
                            : "text-text-secondary hover:text-text-primary hover:bg-background-secondary",
                        )}
                        onClick={closeSidebar}
                      >
                        {sub.label}
                      </Link>
                      {(sub.subcategories || []).map((nested) => (
                        <Link
                          key={nested.id}
                          to={nested.path}
                          className={cn(
                            "block ml-3 px-3 py-1 text-xs rounded-lg transition-colors",
                            location.pathname === nested.path
                              ? "text-warning bg-warning-bg"
                              : "text-text-muted hover:text-text-primary hover:bg-background-secondary",
                          )}
                          onClick={closeSidebar}
                        >
                          {nested.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className='border-t border-border my-4'></div>

        {/* Help & Support */}
        <Link
          to='/help'
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
            location.pathname === "/help"
              ? "bg-warning-bg text-warning"
              : "text-text-secondary hover:text-text-primary hover:bg-background-secondary",
          )}
          onClick={closeSidebar}
        >
          <Icon name='phone' size={5} />
          <span>Help & Support</span>
        </Link>
      </nav>

      {/* Sidebar Footer */}
      <div className='p-4 border-t border-border bg-background'>
        <div className='flex items-center gap-2 text-xs text-text-muted'>
          <Icon name='shield' size={4} />
          <span>Secure Shopping</span>
          <span className='mx-2'>•</span>
          <Icon name='truck' size={4} />
          <span>Free Shipping Over ৳5000</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
