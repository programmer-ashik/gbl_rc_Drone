import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { adminService } from "../../services/adminService";

const initialState = {
  dashboard: null,
  stats: null,
  users: [],
  products: [],
  orders: [],
  loading: {
    dashboard: false,
    stats: false,
    users: false,
    products: false,
    orders: false,
  },
  error: {
    dashboard: null,
    stats: null,
    users: null,
    products: null,
    orders: null,
  },
};

export const fetchAdminDashboard = createAsyncThunk(
  "admin/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      return await adminService.getDashboard();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load dashboard");
    }
  },
);

export const fetchAdminStats = createAsyncThunk(
  "admin/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      return await adminService.getStats();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load stats");
    }
  },
);

export const fetchAdminUsers = createAsyncThunk(
  "admin/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      return await adminService.getUsers();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load users");
    }
  },
);

export const fetchAdminProducts = createAsyncThunk(
  "admin/fetchProducts",
  async (_, { rejectWithValue }) => {
    try {
      return await adminService.getProducts();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load products");
    }
  },
);

export const fetchAdminOrders = createAsyncThunk(
  "admin/fetchOrders",
  async (_, { rejectWithValue }) => {
    try {
      return await adminService.getOrders();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load orders");
    }
  },
);

const setLoading = (state, key, value) => {
  state.loading[key] = value;
  if (value) state.error[key] = null;
};

const setError = (state, key, payload, fallback) => {
  state.error[key] = payload || fallback;
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminDashboard.pending, (state) => {
        setLoading(state, "dashboard", true);
      })
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
        setLoading(state, "dashboard", false);
        state.dashboard = action.payload;
      })
      .addCase(fetchAdminDashboard.rejected, (state, action) => {
        setLoading(state, "dashboard", false);
        setError(state, "dashboard", action.payload, "Failed to load dashboard");
      })
      .addCase(fetchAdminStats.pending, (state) => {
        setLoading(state, "stats", true);
      })
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        setLoading(state, "stats", false);
        state.stats = action.payload;
      })
      .addCase(fetchAdminStats.rejected, (state, action) => {
        setLoading(state, "stats", false);
        setError(state, "stats", action.payload, "Failed to load stats");
      })
      .addCase(fetchAdminUsers.pending, (state) => {
        setLoading(state, "users", true);
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        setLoading(state, "users", false);
        state.users = action.payload || [];
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        setLoading(state, "users", false);
        setError(state, "users", action.payload, "Failed to load users");
      })
      .addCase(fetchAdminProducts.pending, (state) => {
        setLoading(state, "products", true);
      })
      .addCase(fetchAdminProducts.fulfilled, (state, action) => {
        setLoading(state, "products", false);
        state.products = action.payload || [];
      })
      .addCase(fetchAdminProducts.rejected, (state, action) => {
        setLoading(state, "products", false);
        setError(state, "products", action.payload, "Failed to load products");
      })
      .addCase(fetchAdminOrders.pending, (state) => {
        setLoading(state, "orders", true);
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        setLoading(state, "orders", false);
        state.orders = action.payload || [];
      })
      .addCase(fetchAdminOrders.rejected, (state, action) => {
        setLoading(state, "orders", false);
        setError(state, "orders", action.payload, "Failed to load orders");
      });
  },
});

export const selectAdmin = (state) => state.admin;
export default adminSlice.reducer;
