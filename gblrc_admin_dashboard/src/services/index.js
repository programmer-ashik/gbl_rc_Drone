import { API_ENDPOINTS } from "../constants/api";
import { apiClient } from "./apiClient";

export const authService = {
  login(payload) {
    return apiClient.post(API_ENDPOINTS.AUTH.LOGIN, payload);
  },
  profile() {
    return apiClient.get(API_ENDPOINTS.AUTH.PROFILE);
  },
};

export const adminService = {
  getDashboard(query = {}) {
    return apiClient.get(API_ENDPOINTS.ADMIN.DASHBOARD, { query });
  },
  getStats(query = {}) {
    return apiClient.get(API_ENDPOINTS.ADMIN.STATS, { query });
  },
  getAnalytics(query = {}) {
    return apiClient.get(API_ENDPOINTS.ADMIN.ANALYTICS, { query });
  },
  getOrders(query = {}) {
    return apiClient.get(API_ENDPOINTS.ADMIN.ORDERS, { query });
  },
  getOrder(id) {
    return apiClient.get(API_ENDPOINTS.ADMIN.ORDER_DETAIL, { params: { id } });
  },
  updateOrderStatus(id, payload) {
    return apiClient.put(API_ENDPOINTS.ADMIN.ORDER_STATUS, payload, { params: { id } });
  },
  bulkOrders(payload) {
    return apiClient.post(API_ENDPOINTS.ADMIN.ORDER_BULK, payload);
  },
  addOrderNote(id, body) {
    return apiClient.post(API_ENDPOINTS.ADMIN.ORDER_NOTES, { body }, { params: { id } });
  },
  emailOrderCustomer(id, payload) {
    return apiClient.post(API_ENDPOINTS.ADMIN.ORDER_EMAIL, payload, { params: { id } });
  },
  getInvoice(id, query = {}) {
    return apiClient.get(API_ENDPOINTS.ADMIN.ORDER_INVOICE, { params: { id }, query });
  },
  listInvoiceTemplates() {
    return apiClient.get(API_ENDPOINTS.ADMIN.INVOICE_TEMPLATES);
  },
  createInvoiceTemplate(payload) {
    return apiClient.post(API_ENDPOINTS.ADMIN.INVOICE_TEMPLATES, payload);
  },
  updateInvoiceTemplate(id, payload) {
    return apiClient.put(API_ENDPOINTS.ADMIN.INVOICE_TEMPLATE, payload, { params: { id } });
  },
  deleteInvoiceTemplate(id) {
    return apiClient.del(API_ENDPOINTS.ADMIN.INVOICE_TEMPLATE, { params: { id } });
  },
  getStock(query = {}) {
    return apiClient.get(API_ENDPOINTS.ADMIN.STOCK, { query });
  },
  updateStock(id, payload) {
    return apiClient.patch(API_ENDPOINTS.ADMIN.STOCK_ITEM, payload, { params: { id } });
  },
  getUsers(query = {}) {
    return apiClient.get(API_ENDPOINTS.ADMIN.USERS, { query });
  },
  getUser(id) {
    return apiClient.get(API_ENDPOINTS.ADMIN.USER_DETAIL, { params: { id } });
  },
  updateUser(id, payload) {
    return apiClient.patch(API_ENDPOINTS.ADMIN.USER_DETAIL, payload, { params: { id } });
  },
  exportUsers() {
    return apiClient.get(API_ENDPOINTS.ADMIN.USERS_EXPORT);
  },
  getProducts() {
    return apiClient.get(API_ENDPOINTS.ADMIN.PRODUCTS);
  },
};

export const cmsAdminService = {
  listPages() {
    return apiClient.get(API_ENDPOINTS.ADMIN.CMS_PAGES);
  },
  createPage(payload) {
    return apiClient.post(API_ENDPOINTS.ADMIN.CMS_PAGES, payload);
  },
  updatePage(id, payload) {
    return apiClient.put(API_ENDPOINTS.ADMIN.CMS_PAGE, payload, { params: { id } });
  },
  deletePage(id) {
    return apiClient.del(API_ENDPOINTS.ADMIN.CMS_PAGE, { params: { id } });
  },
  getHomepage() {
    return apiClient.get(API_ENDPOINTS.ADMIN.CMS_HOMEPAGE);
  },
  saveHomepage(payload) {
    return apiClient.put(API_ENDPOINTS.ADMIN.CMS_HOMEPAGE, payload);
  },
  getSeo() {
    return apiClient.get(API_ENDPOINTS.ADMIN.CMS_SEO);
  },
  saveSeo(payload) {
    return apiClient.put(API_ENDPOINTS.ADMIN.CMS_SEO, payload);
  },
  listRedirects() {
    return apiClient.get(API_ENDPOINTS.ADMIN.CMS_REDIRECTS);
  },
  createRedirect(payload) {
    return apiClient.post(API_ENDPOINTS.ADMIN.CMS_REDIRECTS, payload);
  },
  updateRedirect(id, payload) {
    return apiClient.put(API_ENDPOINTS.ADMIN.CMS_REDIRECT, payload, { params: { id } });
  },
  deleteRedirect(id) {
    return apiClient.del(API_ENDPOINTS.ADMIN.CMS_REDIRECT, { params: { id } });
  },
  listTestimonials() {
    return apiClient.get(API_ENDPOINTS.ADMIN.CMS_TESTIMONIALS);
  },
  createTestimonial(payload) {
    return apiClient.post(API_ENDPOINTS.ADMIN.CMS_TESTIMONIALS, payload);
  },
  updateTestimonial(id, payload) {
    return apiClient.put(API_ENDPOINTS.ADMIN.CMS_TESTIMONIAL, payload, { params: { id } });
  },
  deleteTestimonial(id) {
    return apiClient.del(API_ENDPOINTS.ADMIN.CMS_TESTIMONIAL, { params: { id } });
  },
};

export const settingsService = {
  get() {
    return apiClient.get(API_ENDPOINTS.ADMIN.SETTINGS);
  },
  save(payload) {
    return apiClient.put(API_ENDPOINTS.ADMIN.SETTINGS, payload);
  },
  health() {
    return apiClient.get(API_ENDPOINTS.ADMIN.SETTINGS_HEALTH);
  },
  flushCache() {
    return apiClient.post(API_ENDPOINTS.ADMIN.SETTINGS_CACHE_FLUSH, {});
  },
  listBackups() {
    return apiClient.get(API_ENDPOINTS.ADMIN.SETTINGS_BACKUPS);
  },
  createBackup() {
    return apiClient.post(API_ENDPOINTS.ADMIN.SETTINGS_BACKUPS, {});
  },
  activity(query = {}) {
    return apiClient.get(API_ENDPOINTS.ADMIN.SETTINGS_ACTIVITY, { query });
  },
  exportActivity(query = {}) {
    return apiClient.get(API_ENDPOINTS.ADMIN.SETTINGS_ACTIVITY_EXPORT, { query });
  },
  admins() {
    return apiClient.get(API_ENDPOINTS.ADMIN.SETTINGS_ADMINS);
  },
};

export const categoryService = {
  tree() {
    return apiClient.get(API_ENDPOINTS.CATEGORIES.TREE);
  },
  nav() {
    return apiClient.get(API_ENDPOINTS.CATEGORIES.NAV);
  },
  footer() {
    return apiClient.get(API_ENDPOINTS.CATEGORIES.FOOTER);
  },
  manage() {
    return apiClient.get(API_ENDPOINTS.CATEGORIES.MANAGE);
  },
  create(payload) {
    return apiClient.post(API_ENDPOINTS.CATEGORIES.CREATE, payload);
  },
  update(id, payload) {
    return apiClient.put(API_ENDPOINTS.CATEGORIES.UPDATE, payload, { params: { id } });
  },
  remove(id) {
    return apiClient.del(API_ENDPOINTS.CATEGORIES.DELETE, { params: { id } });
  },
  reorder(items) {
    return apiClient.put(API_ENDPOINTS.CATEGORIES.REORDER, { items });
  },
  bulkUpdate(items) {
    return apiClient.put(API_ENDPOINTS.CATEGORIES.BULK, { items });
  },
  toggleVisibility(id, payload) {
    return apiClient.patch(API_ENDPOINTS.CATEGORIES.VISIBILITY, payload, { params: { id } });
  },
  usage(id) {
    return apiClient.get(API_ENDPOINTS.CATEGORIES.USAGE, { params: { id } });
  },
  uploadImage(file) {
    return apiClient.upload(API_ENDPOINTS.CATEGORIES.UPLOAD_IMAGE, file);
  },
};

export const productService = {
  manage(query = {}) {
    return apiClient.get(API_ENDPOINTS.PRODUCTS.MANAGE, { query });
  },
  detail(id) {
    return apiClient.get(API_ENDPOINTS.PRODUCTS.DETAIL, { params: { id } });
  },
  create(payload) {
    return apiClient.post(API_ENDPOINTS.PRODUCTS.CREATE, payload);
  },
  update(id, payload) {
    return apiClient.put(API_ENDPOINTS.PRODUCTS.UPDATE, payload, { params: { id } });
  },
  remove(id) {
    return apiClient.del(API_ENDPOINTS.PRODUCTS.DELETE, { params: { id } });
  },
  quickEdit(id, payload) {
    return apiClient.patch(API_ENDPOINTS.PRODUCTS.QUICK, payload, { params: { id } });
  },
  bulk(payload) {
    return apiClient.post(API_ENDPOINTS.PRODUCTS.BULK, payload);
  },
  export(query = {}) {
    return apiClient.get(API_ENDPOINTS.PRODUCTS.EXPORT, { query });
  },
  validateImport(payload) {
    return apiClient.post(API_ENDPOINTS.PRODUCTS.IMPORT_VALIDATE, payload);
  },
  import(payload) {
    return apiClient.post(API_ENDPOINTS.PRODUCTS.IMPORT, payload);
  },
  uploadImages(files) {
    return apiClient.upload(API_ENDPOINTS.PRODUCTS.UPLOAD_IMAGE, files, 'images');
  },
  uploadFile(file) {
    return apiClient.upload(API_ENDPOINTS.PRODUCTS.UPLOAD_FILE, file, 'file');
  },
  searchActive(query = {}) {
    return apiClient.get(API_ENDPOINTS.PRODUCTS.LIST, { query: { ...query, limit: query.limit || 8 } });
  },
};

export const chatService = {
  adminThreads() {
    return apiClient.get('/api/v1/chat/admin/threads');
  },
  adminThread(id) {
    return apiClient.get(`/api/v1/chat/admin/threads/${id}`);
  },
  send(id, body) {
    return apiClient.post(`/api/v1/chat/${id}/messages`, { body });
  },
  close(id) {
    return apiClient.post(`/api/v1/chat/admin/threads/${id}/close`, {});
  },
};
