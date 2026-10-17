import { API_CONFIG, STORAGE_KEYS } from "../constants/api";

const AUTH_REFRESH_PATH = "/api/v1/auth/refresh";
const AUTH_LOGIN_PATH = "/api/v1/auth/login";

let refreshPromise = null;
let sessionExpiredHandling = false;

const readAuth = () => {
  const authRaw = localStorage.getItem(STORAGE_KEYS.AUTH);
  if (!authRaw) return null;
  try {
    return JSON.parse(authRaw);
  } catch {
    return null;
  }
};

const writeAuth = (next) => {
  localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("auth:tokens-refreshed", { detail: next }));
};

const clearSessionAndRedirect = () => {
  if (sessionExpiredHandling) return;
  sessionExpiredHandling = true;
  localStorage.removeItem(STORAGE_KEYS.AUTH);
  window.dispatchEvent(new CustomEvent("auth:session-expired"));
  window.confirm("Your session has expired. Please sign in again.");
  if (!window.location.pathname.includes("/login")) {
    window.location.assign("/login");
  }
};

const buildHeaders = (extra = {}) => {
  const headers = { "Content-Type": "application/json", Accept: "application/json", ...extra };
  const auth = readAuth();
  if (auth?.accessToken) headers.Authorization = `Bearer ${auth.accessToken}`;
  return headers;
};

const withPathParams = (path, params = {}) => {
  let result = path;
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`:${key}`, encodeURIComponent(String(value)));
  });
  return result;
};

const parseResponse = async (response) => {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) {
    const error = new Error(payload?.message || "Request failed");
    error.status = response.status;
    throw error;
  }
  return payload.data;
};

const refreshAccessToken = async () => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const auth = readAuth();
    if (!auth?.refreshToken) {
      throw new Error("No refresh token");
    }
    const response = await fetch(`${API_CONFIG.BASE_URL}${AUTH_REFRESH_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refreshToken: auth.refreshToken }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.success === false) {
      throw new Error(payload?.message || "Session expired");
    }
    const next = {
      ...auth,
      user: payload.data?.user || auth.user,
      accessToken: payload.data?.accessToken,
      refreshToken: payload.data?.refreshToken,
    };
    if (!next.accessToken || !next.refreshToken) {
      throw new Error("Session expired");
    }
    writeAuth(next);
    return next;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};

const shouldAttemptRefresh = (path, retried) => {
  if (retried) return false;
  const resolved = String(path || "");
  return !resolved.includes(AUTH_REFRESH_PATH) && !resolved.includes(AUTH_LOGIN_PATH);
};

const request = async (method, path, { body, params } = {}, retried = false) => {
  const url = `${API_CONFIG.BASE_URL}${withPathParams(path, params)}`;
  const response = await fetch(url, {
    method,
    headers: buildHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 401 && shouldAttemptRefresh(path, retried)) {
    if (!readAuth()?.refreshToken) {
      clearSessionAndRedirect();
      throw new Error("Session expired");
    }
    try {
      await refreshAccessToken();
      return request(method, path, { body, params }, true);
    } catch {
      clearSessionAndRedirect();
      throw new Error("Session expired");
    }
  }

  return parseResponse(response);
};

export const apiClient = {
  get(path, options = {}) {
    const { params, query } = options;
    let resolved = withPathParams(path, params);
    if (query) {
      const search = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return;
        search.set(key, String(value));
      });
      const qs = search.toString();
      if (qs) resolved += `?${qs}`;
    }
    return request("GET", resolved);
  },
  post: (path, body, options) => request("POST", path, { ...options, body }),
  put: (path, body, options) => request("PUT", path, { ...options, body }),
  patch: (path, body, options) => request("PATCH", path, { ...options, body }),
  del: (path, options) => request("DELETE", path, options),
  async upload(path, file, fieldName = "image") {
    const headers = { Accept: "application/json" };
    const auth = readAuth();
    if (auth?.accessToken) headers.Authorization = `Bearer ${auth.accessToken}`;
    const form = new FormData();
    const files = Array.isArray(file) ? file : [file];
    files.forEach((item) => form.append(fieldName, item));

    const doUpload = async (retried = false) => {
      const response = await fetch(`${API_CONFIG.BASE_URL}${path}`, {
        method: "POST",
        headers,
        body: form,
      });
      if (response.status === 401 && shouldAttemptRefresh(path, retried)) {
        try {
          const next = await refreshAccessToken();
          headers.Authorization = `Bearer ${next.accessToken}`;
          return doUpload(true);
        } catch {
          clearSessionAndRedirect();
          throw new Error("Session expired");
        }
      }
      return parseResponse(response);
    };

    return doUpload();
  },
};
