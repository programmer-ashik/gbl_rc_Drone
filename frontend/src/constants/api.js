// src/constants/api.js
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: "/api/v1/auth/login",
    REGISTER: "/api/v1/auth/register",
    LOGOUT: "/api/v1/auth/logout",
    REFRESH: "/api/v1/auth/refresh",
    PROFILE: "/api/v1/auth/profile",
  },

  // Products
  PRODUCTS: {
    LIST: "/api/v1/products",
    DETAIL: "/api/v1/products/:id",
    CREATE: "/api/v1/products",
    UPDATE: "/api/v1/products/:id",
    DELETE: "/api/v1/products/:id",
    CATEGORIES: "/api/v1/categories",
    SUB_CATEGORIES: "/api/v1/categories/:slug/sub",
    FEATURED: "/api/v1/products/featured",
    NEW_ARRIVALS: "/api/v1/products/new-arrivals",
    ON_SALE: "/api/v1/products/on-sale",
    COMBO_PACKAGES: "/api/v1/products/combo-packages",
    RELATED: "/api/v1/products/:id/related",
    REVIEWS: "/api/v1/products/:id/reviews",
    FILTER: "/api/v1/products/filter",
    SEARCH: "/api/v1/products/search",
  },

  // Cart
  CART: {
    GET: "/api/v1/cart",
    ADD: "/api/v1/cart/add",
    UPDATE: "/api/v1/cart/update/:id",
    REMOVE: "/api/v1/cart/remove/:id",
    CLEAR: "/api/v1/cart/clear",
    SYNC: "/api/v1/cart/sync",
  },

  // Orders
  ORDERS: {
    LIST: "/api/v1/orders",
    DETAIL: "/api/v1/orders/:id",
    CREATE: "/api/v1/orders",
    UPDATE: "/api/v1/orders/:id",
    CANCEL: "/api/v1/orders/:id/cancel",
    HISTORY: "/api/v1/orders/history",
    INVOICE: "/api/v1/orders/:id/invoice",
    INVOICE_TEMPLATES: "/api/v1/orders/invoice-templates",
  },

  // Wishlist
  WISHLIST: {
    GET: "/api/v1/wishlist",
    ADD: "/api/v1/wishlist/add",
    REMOVE: "/api/v1/wishlist/remove/:id",
    CLEAR: "/api/v1/wishlist/clear",
  },

  // Reviews
  REVIEWS: {
    LIST: "/api/v1/reviews/:productId",
    CREATE: "/api/v1/reviews",
    UPDATE: "/api/v1/reviews/:id",
    DELETE: "/api/v1/reviews/:id",
    HELPFUL: "/api/v1/reviews/:id/helpful",
  },

  STOCK_ALERTS: {
    SUBSCRIBE: "/api/v1/stock-alerts/subscribe",
    MINE: "/api/v1/stock-alerts/mine",
    DELETE: "/api/v1/stock-alerts/:id",
  },

  CHAT: {
    START: "/api/v1/chat/start",
    MINE: "/api/v1/chat/mine",
    MESSAGE: "/api/v1/chat/:id/messages",
    ADMIN_THREADS: "/api/v1/chat/admin/threads",
    ADMIN_THREAD: "/api/v1/chat/admin/threads/:id",
    CLOSE: "/api/v1/chat/admin/threads/:id/close",
  },

  // Admin
  ADMIN: {
    DASHBOARD: "/api/v1/admin/dashboard",
    STATS: "/api/v1/admin/stats",
    USERS: "/api/v1/admin/users",
    PRODUCTS: "/api/v1/admin/products",
    ORDERS: "/api/v1/admin/orders",
    INVENTORY: "/api/v1/admin/inventory",
    CATEGORIES: "/api/v1/categories/manage/all",
    CATEGORY_REORDER: "/api/v1/categories/reorder",
    CATEGORY_BULK: "/api/v1/categories/bulk",
    CATEGORY_VISIBILITY: "/api/v1/categories/:id/visibility",
  },

  CATEGORIES: {
    LIST: "/api/v1/categories",
    TREE: "/api/v1/categories/tree",
    NAV: "/api/v1/categories/nav",
    FOOTER: "/api/v1/categories/footer",
    MANAGE: "/api/v1/categories/manage/all",
    CREATE: "/api/v1/categories",
    UPDATE: "/api/v1/categories/:id",
    DELETE: "/api/v1/categories/:id",
    REORDER: "/api/v1/categories/reorder",
    BULK: "/api/v1/categories/bulk",
    VISIBILITY: "/api/v1/categories/:id/visibility",
  },

  SUPPORT: {
    CREATE: "/api/v1/support",
    LIST: "/api/v1/support",
    UPDATE: "/api/v1/support/:id",
  },

  CMS: {
    HOMEPAGE: "/api/v1/cms/homepage",
    PAGES: "/api/v1/cms/pages",
    PAGE: "/api/v1/cms/pages/:slug",
    SEO: "/api/v1/cms/seo",
    REDIRECT_LOOKUP: "/api/v1/cms/redirects/lookup",
  },
};

/** Origin only — never include `/api` (endpoints already start with `/api/v1/...`). */
const normalizeApiOrigin = (value) =>
  String(value || "https://rcdrone.gblent.com")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api$/i, "");

export const API_CONFIG = {
  BASE_URL: normalizeApiOrigin(import.meta.env.VITE_API_URL),
  TIMEOUT: 30000,
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000,
  HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

export const STORAGE_KEYS = {
  AUTH: "auth",
  CART: "cart",
  THEME: "theme",
  WISHLIST: "wishlist",
  RECENTLY_VIEWED: "recently-viewed",
  SEARCH_HISTORY: "search-history",
  COMPARE: "compare",
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  INTERNAL_ERROR: 500,
};

export const ERROR_MESSAGES = {
  NETWORK: "Network error. Please check your connection.",
  SERVER: "Server error. Please try again later.",
  UNAUTHORIZED: "You are not authorized. Please login.",
  FORBIDDEN: "You do not have permission to perform this action.",
  NOT_FOUND: "Resource not found.",
  VALIDATION: "Please check your input and try again.",
  TIMEOUT: "Request timeout. Please try again.",
};
