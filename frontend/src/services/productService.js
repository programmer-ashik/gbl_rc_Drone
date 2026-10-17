import { API_ENDPOINTS } from "../constants";
import { apiClient } from "./apiClient";
import {
  filterMockProducts,
  getMockProduct,
  getMockProductResponse,
} from "../data/mockData";

const arrayOrFallback = async (request, fallback) => {
  try {
    const data = await withCatalogTimeout(request());
    return Array.isArray(data) && data.length ? data : fallback();
  } catch {
    return fallback();
  }
};

const withCatalogTimeout = (request, timeout = 1200) =>
  Promise.race([
    request,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error("Catalog API timeout")), timeout);
    }),
  ]);

export const productService = {
  async list(query = {}) {
    try {
      const data = await withCatalogTimeout(apiClient.get(API_ENDPOINTS.PRODUCTS.LIST, { query }));
      return data?.items?.length || data?.total > 0 ? data : getMockProductResponse(query);
    } catch {
      return getMockProductResponse(query);
    }
  },
  async detail(id) {
    try {
      return await withCatalogTimeout(
        apiClient.get(API_ENDPOINTS.PRODUCTS.DETAIL, { params: { id } }),
        4000,
      );
    } catch (error) {
      const product = getMockProduct(id);
      if (product) return product;
      throw error;
    }
  },
  featured() {
    return arrayOrFallback(
      () => apiClient.get(API_ENDPOINTS.PRODUCTS.FEATURED),
      () => filterMockProducts({ isBestSeller: true }),
    );
  },
  newArrivals() {
    return arrayOrFallback(
      () => apiClient.get(API_ENDPOINTS.PRODUCTS.NEW_ARRIVALS),
      () => filterMockProducts({ isNewArrival: true }).slice(0, 10),
    );
  },
  onSale() {
    return arrayOrFallback(
      () => apiClient.get(API_ENDPOINTS.PRODUCTS.ON_SALE),
      () => filterMockProducts({ onSale: true }),
    );
  },
  comboPackages(query = {}) {
    return apiClient.get(API_ENDPOINTS.PRODUCTS.COMBO_PACKAGES, { query });
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
  async related(id) {
    try {
      const data = await withCatalogTimeout(
        apiClient.get(API_ENDPOINTS.PRODUCTS.RELATED, { params: { id } }),
        4000,
      );
      if (data?.length) return data;
    } catch {
      // Use the local catalog below.
    }
    const product = getMockProduct(id);
    return product
      ? filterMockProducts({ category: product.category }).filter((item) => item._id !== product._id).slice(0, 8)
      : [];
  },
  reviews(id) {
    return apiClient.get(API_ENDPOINTS.PRODUCTS.REVIEWS, { params: { id } });
  },
  filter(query = {}) {
    return apiClient.get(API_ENDPOINTS.PRODUCTS.FILTER, { query });
  },
  search(query = {}) {
    return apiClient.get(API_ENDPOINTS.PRODUCTS.SEARCH, { query });
  },
};
