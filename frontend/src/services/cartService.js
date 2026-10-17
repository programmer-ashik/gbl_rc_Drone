import { API_ENDPOINTS } from "../constants";
import { apiClient } from "./apiClient";

export const cartService = {
  get() {
    return apiClient.get(API_ENDPOINTS.CART.GET, { useSession: true });
  },
  add(productId, quantity = 1) {
    return apiClient.post(
      API_ENDPOINTS.CART.ADD,
      { productId, quantity },
      { useSession: true },
    );
  },
  update(productId, quantity) {
    return apiClient.put(
      API_ENDPOINTS.CART.UPDATE,
      { quantity },
      { params: { id: productId }, useSession: true },
    );
  },
  remove(productId) {
    return apiClient.del(API_ENDPOINTS.CART.REMOVE, {
      params: { id: productId },
      useSession: true,
    });
  },
  clear() {
    return apiClient.post(API_ENDPOINTS.CART.CLEAR, {}, { useSession: true });
  },
  sync() {
    return apiClient.post(API_ENDPOINTS.CART.SYNC, {
      sessionId: apiClient.getSessionId(),
    });
  },
};
