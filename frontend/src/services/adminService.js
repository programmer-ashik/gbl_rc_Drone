import { API_ENDPOINTS } from "../constants";
import { apiClient } from "./apiClient";

export const adminService = {
  getDashboard() {
    return apiClient.get(API_ENDPOINTS.ADMIN.DASHBOARD);
  },
  getStats() {
    return apiClient.get(API_ENDPOINTS.ADMIN.STATS);
  },
  getUsers() {
    return apiClient.get(API_ENDPOINTS.ADMIN.USERS);
  },
  getProducts() {
    return apiClient.get(API_ENDPOINTS.ADMIN.PRODUCTS);
  },
  getOrders() {
    return apiClient.get(API_ENDPOINTS.ADMIN.ORDERS);
  },
};
