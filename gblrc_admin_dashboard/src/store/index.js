import { configureStore, createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { STORAGE_KEYS } from "../constants/api";
import { authService } from "../services";
import categoryReducer from './slices/category-slice';
import productReducer from './slices/product-slice';
import toastReducer from './slices/toast-slice';

const ADMIN_ROLES = ["store_admin", "platform_admin", "platform_super_admin"];

export const loginAdmin = createAsyncThunk("auth/login", async (payload, { rejectWithValue }) => {
  try {
    const data = await authService.login(payload);
    if (!ADMIN_ROLES.includes(data?.user?.role)) {
      return rejectWithValue("This account does not have admin access");
    }
    return data;
  } catch (error) {
    return rejectWithValue(error.message || "Login failed");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  },
  reducers: {
    setAuthFromStorage(state, action) {
      const { user, accessToken, refreshToken } = action.payload || {};
      if (user && accessToken) {
        state.user = user;
        state.accessToken = accessToken;
        state.refreshToken = refreshToken || null;
        state.isAuthenticated = true;
      }
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem(STORAGE_KEYS.AUTH);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        localStorage.setItem(
          STORAGE_KEYS.AUTH,
          JSON.stringify({
            user: action.payload.user,
            accessToken: action.payload.accessToken,
            refreshToken: action.payload.refreshToken,
          }),
        );
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Login failed";
      });
  },
});

export const { setAuthFromStorage, logout } = authSlice.actions;
export const selectAuth = (state) => state.auth;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    categories: categoryReducer,
    products: productReducer,
    toast: toastReducer,
  },
});
