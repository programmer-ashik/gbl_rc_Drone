import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "../../common/Icon/Icon";
import { Button } from "../../common/Button/Button";
import { useTheme } from "../../../contexts/ThemeContext";
import { useSidebar } from "../../../hooks/useSidebar";
import { ROUTES } from "../../../constants";
import { useCatalog } from "../../../contexts/CatalogContext";
import { selectCart } from "../../../store/slices/cartSlice";
import {
  logoutUser,
  selectIsAuthenticated,
  selectUser,
} from "../../../store/slices/authSlice";
import { DesktopHeader } from "./DesktopHeader";
import { MobileHeader } from "./MobileHeader";
import ProductSearchForm from "./ProductSearchForm";

const mobileUtilityLinks = [
  { label: "Home", path: ROUTES.HOME, icon: "home" },
  { label: "All Products", path: ROUTES.PRODUCTS, icon: "shopping-bag" },
  { label: "New Arrivals", path: ROUTES.NEW_ARRIVALS, icon: "star" },
  { label: "Sale", path: ROUTES.SALE, icon: "tag" },
  { label: "Contact Us", path: ROUTES.CONTACT, icon: "email" },
];

const ACCOUNT_MENU_Z = 9999;

export const Header = () => {
  const { mode, toggleTheme } = useTheme();
  const { toggleSidebar, isOpen } = useSidebar();
  const { navCategories, categories, loading: categoriesLoading } = useCatalog();
  const menuCategories = navCategories?.length ? navCategories : categories;
  const { totalItems } = useSelector(selectCart);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState(null);
  const [accountMenuPos, setAccountMenuPos] = useState({ top: 0, right: 0 });
  const location = useLocation();
  const navigationRef = useRef(null);
  const accountButtonRef = useRef(null);
  const accountMenuRef = useRef(null);

  const displayName = user?.name?.trim() || user?.email || "Account";
  const firstName = displayName.split(/\s+/)[0];

  const closeNavigation = () => {
    setIsCategoriesOpen(false);
    setIsMenuOpen(false);
    setHoveredCategory(null);
    setExpandedMobileCategory(null);
  };

  const updateAccountMenuPos = () => {
    const button = accountButtonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    setAccountMenuPos({
      top: Math.round(rect.bottom + 8),
      right: Math.max(8, Math.round(window.innerWidth - rect.right)),
    });
  };

  useEffect(() => {
    closeNavigation();
    setIsAccountOpen(false);
  }, [location.pathname]);

  useLayoutEffect(() => {
    if (!isAccountOpen) return undefined;
    updateAccountMenuPos();
    const onReposition = () => updateAccountMenuPos();
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [isAccountOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navigationRef.current && !navigationRef.current.contains(event.target)) {
        closeNavigation();
      }
      const inButton = accountButtonRef.current?.contains(event.target);
      const inMenu = accountMenuRef.current?.contains(event.target);
      if (!inButton && !inMenu) setIsAccountOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeNavigation();
        setIsAccountOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleLogout = async () => {
    setIsAccountOpen(false);
    try {
      await dispatch(logoutUser());
    } catch {
      /* ignore */
    }
    navigate(ROUTES.HOME);
  };

  const accountMenu = (
    <AnimatePresence>
      {isAccountOpen ? (
        <motion.div
          ref={accountMenuRef}
          role="menu"
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          style={{
            position: "fixed",
            top: accountMenuPos.top,
            right: accountMenuPos.right,
            zIndex: ACCOUNT_MENU_Z,
          }}
          className="w-48 origin-top-right overflow-hidden rounded-xl border border-border bg-background py-1 shadow-xl shadow-black/15"
        >
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-sm font-semibold text-text-primary">{displayName}</p>
            {user?.email ? <p className="truncate text-[11px] text-text-muted">{user.email}</p> : null}
          </div>
          <Link
            to={ROUTES.ORDERS}
            role="menuitem"
            onClick={() => setIsAccountOpen(false)}
            className="block px-3 py-2 text-sm text-text hover:bg-background-secondary hover:text-warning"
          >
            My orders
          </Link>
          <Link
            to={ROUTES.WISHLIST}
            role="menuitem"
            onClick={() => setIsAccountOpen(false)}
            className="block px-3 py-2 text-sm text-text hover:bg-background-secondary hover:text-warning"
          >
            Wishlist
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="block w-full cursor-pointer px-3 py-2 text-left text-sm text-text hover:bg-background-secondary hover:text-warning"
          >
            Log out
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return (
    <header className="relative z-[100] bg-background">
      <div className="relative z-[120] border-b border-border/50 bg-background-secondary">
        <div className="site-container">
          <div className="flex h-10 items-center justify-between sm:h-11">
            <Link
              to={ROUTES.HOME}
              className="flex items-center gap-2 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-warning to-warning/70">
                <span className="text-xs font-bold text-white">GBL</span>
              </div>
              <span className="hidden text-[13px] font-semibold text-text transition-colors hover:text-warning sm:block">
                GBLrcDrone
              </span>
            </Link>

            <div className="hidden items-center gap-2 text-[12px] text-text-muted md:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
              <span>Free shipping on orders over ৳5000</span>
              <span className="h-3 w-px bg-border" />
              <span className="font-medium text-warning">New arrivals</span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="xs"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-warning-bg hover:text-warning"
              >
                <Icon name={mode === "dark" ? "sun" : "moon"} size={4} />
              </Button>

              <Link to={ROUTES.WISHLIST} aria-label="Wishlist">
                <Button
                  variant="ghost"
                  size="xs"
                  className="relative rounded-lg p-1.5 text-text-muted transition-colors hover:bg-warning-bg hover:text-warning"
                >
                  <Icon name="heart" size={4} />
                </Button>
              </Link>

              <Link to={ROUTES.COMPARE} aria-label="Compare">
                <Button
                  variant="ghost"
                  size="xs"
                  className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-warning-bg hover:text-warning"
                >
                  <Icon name="grid" size={4} />
                </Button>
              </Link>

              <Link to={ROUTES.ORDERS} aria-label="Orders">
                <Button
                  variant="ghost"
                  size="xs"
                  className="hidden rounded-lg p-1.5 text-text-muted transition-colors hover:bg-warning-bg hover:text-warning sm:inline-flex"
                >
                  <Icon name="shopping-bag" size={4} />
                </Button>
              </Link>

              <Link to={ROUTES.CART} aria-label="Shopping cart">
                <Button
                  variant="ghost"
                  size="xs"
                  className="relative rounded-lg p-1.5 text-text-muted transition-colors hover:bg-warning-bg hover:text-warning"
                >
                  <Icon name="shopping-cart" size={4} />
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-warning text-[9px] font-bold text-white shadow-lg shadow-warning/30">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                </Button>
              </Link>

              <span className="hidden h-4 w-px bg-border/50 sm:block" />

              <div className="flex items-center gap-1">
                {isAuthenticated ? (
                  <>
                    <button
                      ref={accountButtonRef}
                      type="button"
                      onClick={() => {
                        setIsAccountOpen((open) => {
                          if (!open) window.requestAnimationFrame(updateAccountMenuPos);
                          return !open;
                        });
                      }}
                      aria-expanded={isAccountOpen}
                      aria-haspopup="menu"
                      className="inline-flex max-w-[10rem] cursor-pointer items-center gap-1.5 rounded-lg bg-warning-bg px-2 py-1 text-[12px] font-semibold text-warning outline-none transition-colors hover:bg-warning/15 focus-visible:outline-none sm:max-w-[14rem] sm:px-2.5"
                    >
                      <Icon name="user" size={4} className="shrink-0 cursor-pointer" />
                      <span className="truncate">{firstName}</span>
                      <Icon
                        name="chevron-down"
                        size={3.5}
                        className={`shrink-0 cursor-pointer transition-transform ${isAccountOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {typeof document !== "undefined" ? createPortal(accountMenu, document.body) : null}
                  </>
                ) : (
                  <div className="flex items-center gap-1">
                    <Link to={ROUTES.LOGIN}>
                      <Button
                        variant="ghost"
                        size="xs"
                        className="cursor-pointer rounded-lg bg-background px-2.5 py-1 text-[12px] font-medium text-text transition-colors hover:bg-background-secondary sm:px-3"
                      >
                        Log In
                      </Button>
                    </Link>
                    <Link to={ROUTES.REGISTER} className="hidden sm:inline-flex">
                      <Button
                        variant="solid"
                        size="xs"
                        className="cursor-pointer rounded-lg bg-warning px-2.5 py-1 text-[12px] font-medium text-white transition-colors hover:bg-warning/80"
                      >
                        Sign Up Free
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-[110] border-b border-border bg-background">
        <nav
          ref={navigationRef}
          className="site-container relative"
          aria-label="Primary navigation"
        >
          <div className="flex h-11 items-center justify-between">
            <DesktopHeader
              isCategoriesOpen={isCategoriesOpen}
              setIsCategoriesOpen={setIsCategoriesOpen}
              hoveredCategory={hoveredCategory}
              setHoveredCategory={setHoveredCategory}
              categories={menuCategories}
              loading={categoriesLoading}
            />

            <MobileHeader
              isCategoriesOpen={isCategoriesOpen}
              setIsCategoriesOpen={setIsCategoriesOpen}
              isMenuOpen={isMenuOpen}
              setIsMenuOpen={setIsMenuOpen}
              isOpen={isOpen}
              toggleSidebar={toggleSidebar}
            />
          </div>

          <AnimatePresence initial={false}>
            {isCategoriesOpen && (
              <motion.div
                id="mobile-categories-menu"
                role="menu"
                initial={{ height: 0, opacity: 0, y: -10 }}
                animate={{ height: "auto", opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: -8 }}
                transition={{ type: "spring", stiffness: 360, damping: 30, mass: 0.75 }}
                className="absolute inset-x-0 top-full z-[120] origin-top overflow-hidden rounded-b-2xl bg-background shadow-2xl shadow-black/15 lg:hidden"
              >
                <div className="max-h-[calc(100vh-8rem)] overflow-y-auto px-3 pb-4 pt-3 sm:px-5">
                  <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
                    Shop by category
                  </p>
                  <div className="space-y-1">
                    {categoriesLoading && !menuCategories.length ? (
                      <p className="px-3 py-4 text-sm text-text-muted">Loading categories…</p>
                    ) : null}
                    {!categoriesLoading && !menuCategories.length ? (
                      <p className="px-3 py-4 text-sm text-text-muted">No categories yet.</p>
                    ) : null}
                    {menuCategories.map((category) => {
                      const isExpanded = expandedMobileCategory === category.id;
                      const subs = category.subcategories || [];
                      return (
                        <div key={category.id}>
                          <div className="flex items-center gap-1 rounded-lg transition-colors duration-200 hover:bg-warning-bg focus-within:bg-warning-bg">
                            <Link
                              to={category.path}
                              role="menuitem"
                              onClick={() => setIsCategoriesOpen(false)}
                              className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text transition-colors duration-200 hover:text-warning focus-visible:text-warning focus-visible:outline-none"
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background-secondary">
                                <Icon name={category.icon || "grid"} size={5} className="cursor-default" />
                              </span>
                              <span className="truncate">{category.label}</span>
                            </Link>
                            {subs.length > 0 ? (
                              <button
                                type="button"
                                aria-label={`${isExpanded ? "Collapse" : "Expand"} ${category.label}`}
                                aria-expanded={isExpanded}
                                onClick={() =>
                                  setExpandedMobileCategory((current) =>
                                    current === category.id ? null : category.id,
                                  )
                                }
                                className="mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors duration-200 hover:bg-warning-bg hover:text-warning focus-visible:bg-warning-bg focus-visible:text-warning focus-visible:outline-none"
                              >
                                <Icon
                                  name="chevron-down"
                                  size={4}
                                  className={`cursor-default transition-transform duration-200 ${
                                    isExpanded ? "rotate-180" : ""
                                  }`}
                                />
                              </button>
                            ) : null}
                          </div>
                          <AnimatePresence initial={false}>
                            {isExpanded ? (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                                className="overflow-hidden"
                              >
                                <div className="space-y-1 pb-2 pl-11 pr-2 pt-1">
                                  {subs.map((subcategory) => (
                                    <div key={subcategory.id}>
                                      <Link
                                        to={subcategory.path}
                                        role="menuitem"
                                        onClick={() => setIsCategoriesOpen(false)}
                                        className="block rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors duration-200 hover:bg-warning-bg hover:text-warning focus-visible:bg-warning-bg focus-visible:text-warning focus-visible:outline-none"
                                      >
                                        {subcategory.label}
                                      </Link>
                                      {(subcategory.subcategories || []).map((nested) => (
                                        <Link
                                          key={nested.id}
                                          to={nested.path}
                                          role="menuitem"
                                          onClick={() => setIsCategoriesOpen(false)}
                                          className="ml-3 block rounded-lg px-3 py-1.5 text-xs text-text-muted transition-colors duration-200 hover:bg-warning-bg hover:text-warning"
                                        >
                                          {nested.label}
                                        </Link>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            ) : null}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-3">
                    <Link
                      to={ROUTES.PRODUCTS}
                      role="menuitem"
                      onClick={() => setIsCategoriesOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-warning transition-colors duration-200 hover:bg-warning-bg focus-visible:bg-warning-bg focus-visible:outline-none"
                    >
                      <Icon name="shopping-bag" size={5} />
                      All Products
                    </Link>
                    <Link
                      to={ROUTES.NEW_ARRIVALS}
                      role="menuitem"
                      onClick={() => setIsCategoriesOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-warning transition-colors duration-200 hover:bg-warning-bg focus-visible:bg-warning-bg focus-visible:outline-none"
                    >
                      <Icon name="star" size={5} />
                      New Arrivals
                    </Link>
                    <Link
                      to={ROUTES.SALE}
                      role="menuitem"
                      onClick={() => setIsCategoriesOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-warning transition-colors duration-200 hover:bg-warning-bg focus-visible:bg-warning-bg focus-visible:outline-none"
                    >
                      <Icon name="tag" size={5} />
                      Sale
                    </Link>
                  </div>
                  <ProductSearchForm className="mobile-search mt-3" onSearch={() => setIsCategoriesOpen(false)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {isMenuOpen && (
              <motion.div
                id="mobile-navigation-menu"
                role="menu"
                initial={{ height: 0, opacity: 0, y: -10 }}
                animate={{ height: "auto", opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: -8 }}
                transition={{ type: "spring", stiffness: 360, damping: 30, mass: 0.75 }}
                className="absolute inset-x-0 top-full z-[120] origin-top overflow-hidden rounded-b-2xl bg-background shadow-2xl shadow-black/15 lg:hidden"
              >
                <div className="space-y-1 px-3 pb-4 pt-3 sm:px-5">
                  {mobileUtilityLinks.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      role="menuitem"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text transition-colors duration-200 hover:bg-warning-bg hover:text-warning focus-visible:bg-warning-bg focus-visible:text-warning focus-visible:outline-none"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-background-secondary">
                        <Icon name={item.icon} size={5} className="cursor-default" />
                      </span>
                      {item.label}
                    </Link>
                  ))}
                  {menuCategories.slice(0, 6).map((category) => (
                    <Link
                      key={category.id}
                      to={category.path}
                      role="menuitem"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text transition-colors duration-200 hover:bg-warning-bg hover:text-warning focus-visible:bg-warning-bg focus-visible:text-warning focus-visible:outline-none"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-background-secondary">
                        <Icon name={category.icon || "grid"} size={5} className="cursor-default" />
                      </span>
                      {category.label}
                    </Link>
                  ))}
                  {isAuthenticated ? (
                    <>
                      <Link
                        to={ROUTES.ORDERS}
                        role="menuitem"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text transition-colors duration-200 hover:bg-warning-bg hover:text-warning"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-background-secondary">
                          <Icon name="shopping-bag" size={5} className="cursor-default" />
                        </span>
                        My orders
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsMenuOpen(false);
                          handleLogout();
                        }}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-text transition-colors duration-200 hover:bg-warning-bg hover:text-warning"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-background-secondary">
                          <Icon name="user" size={5} className="cursor-default" />
                        </span>
                        Log out ({firstName})
                      </button>
                    </>
                  ) : (
                    <Link
                      to={ROUTES.LOGIN}
                      role="menuitem"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-warning transition-colors duration-200 hover:bg-warning-bg"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning-bg">
                        <Icon name="user" size={5} className="cursor-default" />
                      </span>
                      Log In
                    </Link>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </div>
    </header>
  );
};

export default Header;
