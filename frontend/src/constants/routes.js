// src/constants/routes.js
export const ROUTES = {
  // Public Routes
  HOME: "/",
  PRODUCTS: "/products",
  PRODUCT_DETAIL: "/products/:id",
  PRODUCT_SLUG: "/product/:slug",
  SEARCH: "/search",
  CART: "/cart",
  NEW_ARRIVALS: "/new-arrivals",
  SALE: "/sale",
  ABOUT: "/about",
  CONTACT: "/contact",
  COMBO_PACKAGES: "/combo-packages",
  COMBO_BUILDER: "/combo-builder",
  LOGIN: "/login",
  REGISTER: "/register",
  HELP: "/help",
  RETURNS: "/returns",
  // Protected Routes
  CHECKOUT: "/checkout",
  PROFILE: "/profile",
  ORDERS: "/orders",
  WISHLIST: "/wishlist",
  COMPARE: "/compare",
  ORDER_DETAIL: "/orders/:id",

  // Category Routes
  CATEGORY: "/category/:slug",
  CATEGORY_SUB: "/category/:slug/:subslug",

  // Admin Routes
  ADMIN: "/admin",
  ADMIN_PRODUCTS: "/admin/products",
  ADMIN_ORDERS: "/admin/orders",
  ADMIN_USERS: "/admin/users",
  ADMIN_CATEGORIES: "/admin/categories",

  // Static Pages
  FAQ: "/faq",
  PRIVACY: "/privacy",
  TERMS: "/terms",
  SHIPPING: "/shipping",
  RETURNS: "/returns",

  // Auth Callbacks
  VERIFY_EMAIL: "/verify-email",
  RESET_PASSWORD: "/reset-password",
  FORGOT_PASSWORD: "/forgot-password",
};

// Helper to generate dynamic routes
export const generateProductRoute = (slugOrId) => `/product/${slugOrId}`;
export const generateCategoryRoute = (slug) => `/category/${slug}`;
export const generateSubcategoryRoute = (slug, subslug) =>
  `/category/${slug}/${subslug}`;
export const generateSearchRoute = (query) =>
  `/search${query ? `?q=${encodeURIComponent(query)}` : ""}`;
export const generateAdminRoute = (section) => `/admin/${section}`;
