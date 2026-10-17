import { API_ENDPOINTS } from "../constants";
import { apiClient } from "./apiClient";

export const authService = {
  login(payload) {
    return apiClient.post(API_ENDPOINTS.AUTH.LOGIN, payload);
  },
  register(payload) {
    return apiClient.post(API_ENDPOINTS.AUTH.REGISTER, payload);
  },
  logout() {
    return apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {});
  },
  refresh(refreshToken) {
    return apiClient.post(API_ENDPOINTS.AUTH.REFRESH, { refreshToken });
  },
  profile() {
    return apiClient.get(API_ENDPOINTS.AUTH.PROFILE);
  },
};
