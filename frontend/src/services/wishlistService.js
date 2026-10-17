import { API_ENDPOINTS } from "../constants";
import { apiClient } from "./apiClient";

export const wishlistService = {
  get() {
    return apiClient.get(API_ENDPOINTS.WISHLIST.GET);
  },
  add(productId) {
    return apiClient.post(API_ENDPOINTS.WISHLIST.ADD, { productId });
  },
  remove(productId) {
    return apiClient.del(API_ENDPOINTS.WISHLIST.REMOVE, { params: { id: productId } });
  },
  clear() {
    return apiClient.post(API_ENDPOINTS.WISHLIST.CLEAR, {});
  },
};
