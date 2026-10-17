import { API_ENDPOINTS } from "../constants";
import { apiClient } from "./apiClient";

export const supportService = {
  create(payload) {
    return apiClient.post(API_ENDPOINTS.SUPPORT.CREATE, payload);
  },
  list(query = {}) {
    return apiClient.get(API_ENDPOINTS.SUPPORT.LIST, { query });
  },
  update(id, payload) {
    return apiClient.put(API_ENDPOINTS.SUPPORT.UPDATE, payload, { params: { id } });
  },
};
