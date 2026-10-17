import { API_ENDPOINTS } from "../constants/api";
import { apiClient } from "./apiClient";

export const cmsService = {
  homepage() {
    return apiClient.get(API_ENDPOINTS.CMS.HOMEPAGE);
  },
  page(slug) {
    return apiClient.get(API_ENDPOINTS.CMS.PAGE, { params: { slug } });
  },
  pages() {
    return apiClient.get(API_ENDPOINTS.CMS.PAGES);
  },
  seo() {
    return apiClient.get(API_ENDPOINTS.CMS.SEO);
  },
  lookupRedirect(path) {
    return apiClient.get(API_ENDPOINTS.CMS.REDIRECT_LOOKUP, {
      query: { path },
    });
  },
};
