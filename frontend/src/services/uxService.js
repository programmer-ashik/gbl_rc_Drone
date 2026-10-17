import { API_ENDPOINTS } from '../constants';
import { apiClient } from './apiClient';

export const reviewService = {
  list(productId, sort = 'newest') {
    return apiClient.get(API_ENDPOINTS.REVIEWS.LIST, { params: { productId }, query: { sort } });
  },
  create(payload) {
    return apiClient.post(API_ENDPOINTS.REVIEWS.CREATE, payload);
  },
  update(id, payload) {
    return apiClient.put(API_ENDPOINTS.REVIEWS.UPDATE, payload, { params: { id } });
  },
  remove(id) {
    return apiClient.del(API_ENDPOINTS.REVIEWS.DELETE, { params: { id } });
  },
  markHelpful(id) {
    return apiClient.post(`/api/v1/reviews/${id}/helpful`, {});
  },
};

export const stockAlertService = {
  subscribe(productId, email) {
    return apiClient.post('/api/v1/stock-alerts/subscribe', { productId, email });
  },
  mine() {
    return apiClient.get('/api/v1/stock-alerts/mine');
  },
  remove(id) {
    return apiClient.del(`/api/v1/stock-alerts/${id}`);
  },
};

export const chatService = {
  start(payload) {
    return apiClient.post('/api/v1/chat/start', payload);
  },
  mine(guestId) {
    return apiClient.get('/api/v1/chat/mine', { query: guestId ? { guestId } : {} });
  },
  send(threadId, body, guestId) {
    return apiClient.post(`/api/v1/chat/${threadId}/messages`, { body, guestId });
  },
  adminThreads() {
    return apiClient.get('/api/v1/chat/admin/threads');
  },
  adminThread(id) {
    return apiClient.get(`/api/v1/chat/admin/threads/${id}`);
  },
  close(id) {
    return apiClient.post(`/api/v1/chat/admin/threads/${id}/close`, {});
  },
};
