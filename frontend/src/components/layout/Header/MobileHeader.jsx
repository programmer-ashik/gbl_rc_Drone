// src/components/layout/Header/MobileHeader.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Icon } from "../../common/Icon/Icon";
import { Button } from "../../common/Button/Button";
import { ROUTES } from "../../../constants";
import { cn } from "../../../utils/cn";

export const MobileHeader = ({
  isCategoriesOpen,
  setIsCategoriesOpen,
  isMenuOpen,
  setIsMenuOpen,
  isOpen,
  toggleSidebar,
}) => {
  return (
    <div className="flex lg:hidden items-center justify-between w-full py-1">
      {/* Left - Sidebar Toggle & Logo */}
      <div className="flex items-center gap-2">
        <Link to={ROUTES.HOME} className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-warning to-warning/70 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-text font-bold text-xs">GBL</span>
          </div>
          <span className="hidden sm:inline text-base font-bold text-text tracking-tight">
            GBL
          </span>
        </Link>
      </div>

      {/* Right - Dual Toggles (Categories & Menu) */}
      <div className="flex items-center gap-1.5">
        {/* Categories Button */}
        <button
          type="button"
          onClick={() => {
            setIsCategoriesOpen(!isCategoriesOpen);
            setIsMenuOpen(false); // Close menu drawer when opening categories
          }}
          aria-label="Toggle categories"
          aria-expanded={isCategoriesOpen}
          aria-controls="mobile-categories-menu"
          className={cn(
            "inline-flex items-center justify-center px-2.5 py-2 text-text hover:bg-warning-bg hover:text-warning focus-visible:bg-warning-bg focus-visible:text-warning focus-visible:outline-none transition-colors duration-200 rounded-lg text-xs sm:text-sm font-medium",
            isCategoriesOpen && "bg-warning-bg text-warning",
          )}
        >
          <Icon name="grid" size={4} className="min-[380px]:mr-1" />
          <span className="hidden min-[380px]:inline">Categories</span>
          <Icon
            name="chevron-down"
            size={3.5}
            className={cn(
              "hidden min-[380px]:inline-block transition-transform duration-200 ml-1",
              isCategoriesOpen && "rotate-180",
            )}
          />
        </button>

        {/* Menu Button */}
        <button
          type="button"
          onClick={() => {
            setIsMenuOpen(!isMenuOpen);
            setIsCategoriesOpen(false); // Close categories drawer when opening menu
          }}
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation-menu"
          className={cn(
            "inline-flex items-center justify-center px-2.5 py-2 text-text hover:bg-warning-bg hover:text-warning focus-visible:bg-warning-bg focus-visible:text-warning focus-visible:outline-none transition-colors duration-200 rounded-lg text-xs sm:text-sm font-medium",
            isMenuOpen && "bg-warning-bg text-warning",
          )}
        >
          <Icon
            name={isMenuOpen ? "close" : "menu"}
            size={4}
            className="min-[380px]:mr-1"
          />
          <span className="hidden min-[380px]:inline">Menu</span>
          <Icon
            name="chevron-down"
            size={3.5}
            className={cn(
              "hidden min-[380px]:inline-block transition-transform duration-200 ml-1",
              isMenuOpen && "rotate-180",
            )}
          />
        </button>
      </div>
    </div>
  );
};

export default MobileHeader;
