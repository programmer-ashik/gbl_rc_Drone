// src/store/slices/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "../../services/authService";
import { cartService } from "../../services/cartService";
import { STORAGE_KEYS } from "../../constants";

// Async thunk for login
export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authService.login({ email, password });
      try {
        await cartService.sync();
      } catch {
        // Do not block login if cart sync fails.
      }
      return response;
    } catch (error) {
      return rejectWithValue(error.message || "Login failed");
    }
  },
);

// Async thunk for logout
export const logoutUser = createAsyncThunk(
  "auth/logout",
  async () => {
    await authService.logout();
    return null;
  },
);

// Async thunk for registration
export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register({
        name: userData.name,
        email: userData.email,
        password: userData.password,
      });
      return response;
    } catch (error) {
      return rejectWithValue(error.message || "Registration failed");
    }
  },
);

// Initial state
const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  userRole: "guest",
};

// Auth slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    resetAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.userRole = "guest";
      state.error = null;
      state.loading = false;
    },
    setAuthFromStorage: (state, action) => {
      const { user, accessToken, refreshToken } = action.payload || {};
      if (user && accessToken) {
        state.user = user;
        state.accessToken = accessToken;
        state.refreshToken = refreshToken || null;
        state.isAuthenticated = true;
        state.userRole = user.role || "customer";
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user || null;
        state.accessToken = action.payload.accessToken || null;
        state.refreshToken = action.payload.refreshToken || null;
        state.isAuthenticated = true;
        state.userRole = action.payload.user?.role || "customer";
        state.error = null;
        localStorage.setItem(
          STORAGE_KEYS.AUTH,
          JSON.stringify({
            user: state.user,
            accessToken: state.accessToken,
            refreshToken: state.refreshToken,
          }),
        );
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Login failed";
        state.isAuthenticated = false;
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken || null;
        state.isAuthenticated = true;
        state.userRole = action.payload.user?.role || "customer";
        state.error = null;
        localStorage.setItem(
          STORAGE_KEYS.AUTH,
          JSON.stringify({
            user: state.user,
            accessToken: state.accessToken,
            refreshToken: state.refreshToken,
          }),
        );
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Registration failed";
      })
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.userRole = "guest";
        state.loading = false;
        state.error = null;
        localStorage.removeItem(STORAGE_KEYS.AUTH);
      })
      .addCase(logoutUser.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.userRole = "guest";
        state.loading = false;
        state.error = null;
        localStorage.removeItem(STORAGE_KEYS.AUTH);
      });
  },
});

export const {
  clearAuthError,
  updateUser,
  resetAuth,
  setAuthFromStorage,
} = authSlice.actions;

export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectUserRole = (state) => state.auth.userRole;
export const selectUserName = (state) => state.auth.user?.name || "";
export const selectUserEmail = (state) => state.auth.user?.email || "";
export const selectAccessToken = (state) => state.auth.accessToken;

export default authSlice.reducer;