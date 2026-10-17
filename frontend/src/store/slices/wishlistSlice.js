import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { wishlistService } from "../../services/wishlistService";

const initialState = {
  items: [],
  loading: false,
  actionLoadingId: null,
  error: null,
};

export const fetchWishlist = createAsyncThunk("wishlist/fetch", async (_, { rejectWithValue }) => {
  try {
    return await wishlistService.get();
  } catch (error) {
    return rejectWithValue(error.message || "Failed to load wishlist");
  }
});

export const addWishlistItem = createAsyncThunk("wishlist/add", async (productId, { rejectWithValue }) => {
  try {
    if (!productId) throw new Error("Missing product id");
    return await wishlistService.add(String(productId));
  } catch (error) {
    return rejectWithValue(error.message || "Failed to add wishlist item");
  }
});

export const removeWishlistItem = createAsyncThunk(
  "wishlist/remove",
  async (productId, { rejectWithValue }) => {
    try {
      if (!productId) throw new Error("Missing product id");
      return await wishlistService.remove(String(productId));
    } catch (error) {
      return rejectWithValue(error.message || "Failed to remove wishlist item");
    }
  },
);

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    clearWishlistError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.items = action.payload || [];
        state.loading = false;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load wishlist";
      })
      .addCase(addWishlistItem.pending, (state, action) => {
        state.actionLoadingId = String(action.meta.arg || "");
        state.error = null;
      })
      .addCase(addWishlistItem.fulfilled, (state, action) => {
        state.items = action.payload || [];
        state.actionLoadingId = null;
      })
      .addCase(addWishlistItem.rejected, (state, action) => {
        state.actionLoadingId = null;
        state.error = action.payload || "Failed to add wishlist item";
      })
      .addCase(removeWishlistItem.pending, (state, action) => {
        state.actionLoadingId = String(action.meta.arg || "");
        state.error = null;
      })
      .addCase(removeWishlistItem.fulfilled, (state, action) => {
        state.items = action.payload || [];
        state.actionLoadingId = null;
      })
      .addCase(removeWishlistItem.rejected, (state, action) => {
        state.actionLoadingId = null;
        state.error = action.payload || "Failed to remove wishlist item";
      });
  },
});

export const { clearWishlistError } = wishlistSlice.actions;
export default wishlistSlice.reducer;
