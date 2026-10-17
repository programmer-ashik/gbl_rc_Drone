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

const buildHeaders = () => {
  const headers = { ...API_CONFIG.HEADERS };
  const auth = readAuth();
  if (auth?.accessToken) {
    headers.Authorization = `Bearer ${auth.accessToken}`;
  }
  return headers;
};

const buildSessionHeader = () => {
  const key = "guest_session_id";
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
};

const withPathParams = (path, params = {}) => {
  let result = path;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`:${key}`, encodeURIComponent(String(value)));
  }
  return result;
};

const parseResponse = async (response) => {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) {
    const message = payload?.message || payload?.error || "Request failed";
    const error = new Error(message);
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
      headers: { ...API_CONFIG.HEADERS },
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

const request = async (method, path, { body, params = {}, useSession = false } = {}, retried = false) => {
  const headers = buildHeaders();
  if (useSession) headers["x-session-id"] = buildSessionHeader();
  const response = await fetch(`${API_CONFIG.BASE_URL}${withPathParams(path, params)}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 401 && shouldAttemptRefresh(path, retried)) {
    if (!readAuth()?.refreshToken) {
      clearSessionAndRedirect();
      throw new Error("Session expired");
    }
    try {
      await refreshAccessToken();
      return request(method, path, { body, params, useSession }, true);
    } catch {
      clearSessionAndRedirect();
      throw new Error("Session expired");
    }
  }

  return parseResponse(response);
};

export const apiClient = {
  async get(path, { params = {}, query = {}, useSession = false } = {}, retried = false) {
    const url = new URL(`${API_CONFIG.BASE_URL}${withPathParams(path, params)}`);
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item !== undefined && item !== null && item !== "") url.searchParams.append(key, String(item));
        });
        return;
      }
      if (typeof value === "object") {
        Object.entries(value).forEach(([nestedKey, nestedValue]) => {
          if (nestedValue === undefined || nestedValue === null || nestedValue === "") return;
          url.searchParams.set(
            `${key}[${nestedKey}]`,
            Array.isArray(nestedValue) ? nestedValue.join(",") : String(nestedValue),
          );
        });
        return;
      }
      url.searchParams.set(key, String(value));
    });
    const headers = buildHeaders();
    if (useSession) headers["x-session-id"] = buildSessionHeader();
    const response = await fetch(url.toString(), { method: "GET", headers });

    if (response.status === 401 && shouldAttemptRefresh(path, retried)) {
      if (!readAuth()?.refreshToken) {
        clearSessionAndRedirect();
        throw new Error("Session expired");
      }
      try {
        await refreshAccessToken();
        return apiClient.get(path, { params, query, useSession }, true);
      } catch {
        clearSessionAndRedirect();
        throw new Error("Session expired");
      }
    }

    return parseResponse(response);
  },

  async post(path, body, { params = {}, useSession = false } = {}) {
    return request("POST", path, { body, params, useSession });
  },

  async patch(path, body, { params = {}, useSession = false } = {}) {
    return request("PATCH", path, { body, params, useSession });
  },

  async put(path, body, { params = {}, useSession = false } = {}) {
    return request("PUT", path, { body, params, useSession });
  },

  async del(path, { params = {}, useSession = false } = {}) {
    return request("DELETE", path, { params, useSession });
  },

  getSessionId() {
    return buildSessionHeader();
  },
};
