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
    <div className="flex w-full items-center justify-between lg:hidden">
      {/* Left - Sidebar Toggle & Logo */}
      <div className="flex items-center gap-2">
        <Link to={ROUTES.HOME} className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-warning to-warning/70 shadow-sm">
            <span className="text-xs font-bold text-white">GBL</span>
          </div>
          <span className="hidden text-[13px] font-semibold tracking-tight text-text sm:inline">
            GBLrcDrone
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
            "inline-flex items-center justify-center rounded-lg px-2 py-1.5 text-[12px] font-medium text-text transition-colors duration-200 hover:bg-warning-bg hover:text-warning focus-visible:bg-warning-bg focus-visible:text-warning focus-visible:outline-none sm:text-[13px]",
            isCategoriesOpen && "bg-warning-bg text-warning",
          )}
        >
          <Icon name="grid" size={3.5} className="min-[380px]:mr-1" />
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
            "inline-flex items-center justify-center rounded-lg px-2 py-1.5 text-[12px] font-medium text-text transition-colors duration-200 hover:bg-warning-bg hover:text-warning focus-visible:bg-warning-bg focus-visible:text-warning focus-visible:outline-none sm:text-[13px]",
            isMenuOpen && "bg-warning-bg text-warning",
          )}
        >
          <Icon
            name={isMenuOpen ? "close" : "menu"}
            size={3.5}
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
