/** Origin only — never include `/api` (endpoints already start with `/api/v1/...`). */
const normalizeApiOrigin = (value) =>
  String(value || "https://rcdrone.gblent.com")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api$/i, "");

export const API_CONFIG = {
  BASE_URL: normalizeApiOrigin(import.meta.env.VITE_API_URL),
};

export const STORAGE_KEYS = {
  AUTH: "gblrc-admin-auth",
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/v1/auth/login",
    REFRESH: "/api/v1/auth/refresh",
    PROFILE: "/api/v1/auth/profile",
  },
  ADMIN: {
    DASHBOARD: "/api/v1/admin/dashboard",
    STATS: "/api/v1/admin/stats",
    ANALYTICS: "/api/v1/admin/analytics/orders",
    USERS: "/api/v1/admin/users",
    USER_DETAIL: "/api/v1/admin/users/:id",
    USERS_EXPORT: "/api/v1/admin/users/export",
    PRODUCTS: "/api/v1/admin/products",
    ORDERS: "/api/v1/admin/orders",
    ORDER_DETAIL: "/api/v1/admin/orders/:id",
    ORDER_STATUS: "/api/v1/admin/orders/:id/status",
    ORDER_BULK: "/api/v1/admin/orders/bulk",
    ORDER_NOTES: "/api/v1/admin/orders/:id/notes",
    ORDER_EMAIL: "/api/v1/admin/orders/:id/email",
    ORDER_INVOICE: "/api/v1/admin/orders/:id/invoice",
    INVOICE_TEMPLATES: "/api/v1/admin/invoices/templates",
    INVOICE_TEMPLATE: "/api/v1/admin/invoices/templates/:id",
    STOCK: "/api/v1/admin/stock",
    STOCK_ITEM: "/api/v1/admin/stock/:id",
    CATEGORIES: "/api/v1/admin/categories",
    CMS_PAGES: "/api/v1/cms/admin/pages",
    CMS_PAGE: "/api/v1/cms/admin/pages/:id",
    CMS_HOMEPAGE: "/api/v1/cms/admin/homepage",
    CMS_SEO: "/api/v1/cms/admin/seo",
    CMS_REDIRECTS: "/api/v1/cms/admin/redirects",
    CMS_REDIRECT: "/api/v1/cms/admin/redirects/:id",
    CMS_TESTIMONIALS: "/api/v1/cms/admin/testimonials",
    CMS_TESTIMONIAL: "/api/v1/cms/admin/testimonials/:id",
    SETTINGS: "/api/v1/admin/settings",
    SETTINGS_HEALTH: "/api/v1/admin/settings/health",
    SETTINGS_CACHE_FLUSH: "/api/v1/admin/settings/cache/flush",
    SETTINGS_BACKUPS: "/api/v1/admin/settings/backups",
    SETTINGS_ACTIVITY: "/api/v1/admin/settings/activity",
    SETTINGS_ACTIVITY_EXPORT: "/api/v1/admin/settings/activity/export",
    SETTINGS_ADMINS: "/api/v1/admin/settings/admins",
  },
  CATEGORIES: {
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
    USAGE: "/api/v1/categories/:id/usage",
    UPLOAD_IMAGE: "/api/v1/categories/upload-image",
  },
  PRODUCTS: {
    MANAGE: "/api/v1/products/manage",
    DETAIL: "/api/v1/products/manage/:id",
    CREATE: "/api/v1/products",
    UPDATE: "/api/v1/products/:id",
    DELETE: "/api/v1/products/:id",
    QUICK: "/api/v1/products/:id/quick",
    BULK: "/api/v1/products/bulk",
    EXPORT: "/api/v1/products/export",
    IMPORT: "/api/v1/products/import",
    IMPORT_VALIDATE: "/api/v1/products/import/validate",
    UPLOAD_IMAGE: "/api/v1/products/upload-image",
    UPLOAD_FILE: "/api/v1/products/upload-file",
    LIST: "/api/v1/products",
  },
};
