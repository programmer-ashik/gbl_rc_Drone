import { API_ENDPOINTS } from "../constants";
import { apiClient } from "./apiClient";

export const categoryService = {
  list() {
    return apiClient.get(API_ENDPOINTS.CATEGORIES.LIST);
  },
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
};
