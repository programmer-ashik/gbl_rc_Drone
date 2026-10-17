import { API_ENDPOINTS } from "../constants";
import { apiClient } from "./apiClient";

export const orderService = {
  create(payload) {
    return apiClient.post(API_ENDPOINTS.ORDERS.CREATE, payload);
  },
  list() {
    return apiClient.get(API_ENDPOINTS.ORDERS.LIST);
  },
  history() {
    return apiClient.get(API_ENDPOINTS.ORDERS.HISTORY);
  },
  detail(id) {
    return apiClient.get(API_ENDPOINTS.ORDERS.DETAIL, { params: { id } });
  },
  cancel(id) {
    return apiClient.post(API_ENDPOINTS.ORDERS.CANCEL, {}, { params: { id } });
  },
  invoice(id, query = {}) {
    return apiClient.get(API_ENDPOINTS.ORDERS.INVOICE, { params: { id }, query });
  },
  invoiceTemplates() {
    return apiClient.get(API_ENDPOINTS.ORDERS.INVOICE_TEMPLATES);
  },
};
