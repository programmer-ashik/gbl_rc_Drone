import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { cartService } from "../../services/cartService";

const initialState = {
  items: [],
  subtotal: 0,
  totalItems: 0,
  loading: false,
  error: null,
};

export const fetchCart = createAsyncThunk("cart/fetch", async (_, { rejectWithValue }) => {
  try {
    return await cartService.get();
  } catch (error) {
    return rejectWithValue(error.message || "Failed to load cart");
  }
});

export const addToCart = createAsyncThunk(
  "cart/add",
  async ({ productId, quantity = 1 }, { rejectWithValue }) => {
    try {
      return await cartService.add(productId, quantity);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to add item");
    }
  },
);

export const updateCartItem = createAsyncThunk(
  "cart/update",
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      return await cartService.update(productId, quantity);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update item");
    }
  },
);

export const removeCartItem = createAsyncThunk("cart/remove", async (productId, { rejectWithValue }) => {
  try {
    return await cartService.remove(productId);
  } catch (error) {
    return rejectWithValue(error.message || "Failed to remove item");
  }
});

export const clearCart = createAsyncThunk("cart/clear", async (_, { rejectWithValue }) => {
  try {
    await cartService.clear();
    return { items: [], subtotal: 0, totalItems: 0 };
  } catch (error) {
    return rejectWithValue(error.message || "Failed to clear cart");
  }
});

const applyCartState = (state, payload) => {
  state.items = payload?.items || [];
  state.subtotal = payload?.subtotal || 0;
  state.totalItems = payload?.totalItems || 0;
  state.loading = false;
  state.error = null;
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => applyCartState(state, action.payload))
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load cart";
      })
      .addCase(addToCart.fulfilled, (state, action) => applyCartState(state, action.payload))
      .addCase(updateCartItem.fulfilled, (state, action) => applyCartState(state, action.payload))
      .addCase(removeCartItem.fulfilled, (state, action) => applyCartState(state, action.payload))
      .addCase(clearCart.fulfilled, (state, action) => applyCartState(state, action.payload));
  },
});

export const selectCart = (state) => state.cart;
export default cartSlice.reducer;
