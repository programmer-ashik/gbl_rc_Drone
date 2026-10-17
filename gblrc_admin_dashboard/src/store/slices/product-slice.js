import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { productService } from '../../services';
import { pushToast } from './toast-slice';

export const fetchProducts = createAsyncThunk(
  'products/fetch',
  async (query, { rejectWithValue }) => {
    try {
      return await productService.manage(query);
    } catch (error) {
      return rejectWithValue(error.message || 'Could not load products');
    }
  },
);

export const fetchProduct = createAsyncThunk(
  'products/detail',
  async (id, { rejectWithValue }) => {
    try {
      return await productService.detail(id);
    } catch (error) {
      return rejectWithValue(error.message || 'Could not load product');
    }
  },
);

export const saveProduct = createAsyncThunk(
  'products/save',
  async ({ id, payload }, { dispatch, rejectWithValue }) => {
    try {
      const product = id ? await productService.update(id, payload) : await productService.create(payload);
      dispatch(pushToast({ type: 'success', message: id ? 'Product updated' : 'Product created' }));
      return product;
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Could not save product' }));
      return rejectWithValue(error.message || 'Could not save product');
    }
  },
);

export const removeProduct = createAsyncThunk(
  'products/remove',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const result = await productService.remove(id);
      dispatch(pushToast({ type: 'success', message: 'Product archived' }));
      return result;
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Could not archive product' }));
      return rejectWithValue(error.message || 'Could not archive product');
    }
  },
);

export const quickEditProduct = createAsyncThunk(
  'products/quick',
  async ({ id, payload }, { dispatch, rejectWithValue }) => {
    try {
      const product = await productService.quickEdit(id, payload);
      dispatch(pushToast({ type: 'success', message: 'Product updated' }));
      return product;
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Quick edit failed' }));
      return rejectWithValue(error.message || 'Quick edit failed');
    }
  },
);

export const bulkUpdateProducts = createAsyncThunk(
  'products/bulk',
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const result = await productService.bulk(payload);
      dispatch(pushToast({ type: 'success', message: 'Bulk update complete' }));
      return result;
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Bulk update failed' }));
      return rejectWithValue(error.message || 'Bulk update failed');
    }
  },
);

const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    total: 0,
    page: 1,
    totalPages: 1,
    current: null,
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {
    clearCurrentProduct(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload?.items || [];
        state.total = action.payload?.total || 0;
        state.page = action.payload?.page || 1;
        state.totalPages = action.payload?.totalPages || 1;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Could not load products';
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(saveProduct.pending, (state) => {
        state.saving = true;
      })
      .addCase(saveProduct.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(saveProduct.rejected, (state) => {
        state.saving = false;
      })
      .addCase(quickEditProduct.fulfilled, (state, action) => {
        const next = action.payload;
        state.items = state.items.map((item) => (item._id === next._id ? { ...item, ...next } : item));
      });
  },
});

export const { clearCurrentProduct } = productSlice.actions;
export const selectProducts = (state) => state.products;
export default productSlice.reducer;
