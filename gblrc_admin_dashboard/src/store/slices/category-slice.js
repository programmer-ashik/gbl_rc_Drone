import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { categoryService } from '../../services';
import { pushToast } from './toast-slice';

export const fetchCategories = createAsyncThunk(
  'categories/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await categoryService.manage();
    } catch (error) {
      return rejectWithValue(error.message || 'Could not load categories');
    }
  },
);

export const fetchCategoryTree = createAsyncThunk(
  'categories/tree',
  async (_, { rejectWithValue }) => {
    try {
      return await categoryService.tree();
    } catch (error) {
      return rejectWithValue(error.message || 'Could not load category tree');
    }
  },
);

export const saveCategory = createAsyncThunk(
  'categories/save',
  async ({ id, payload }, { dispatch, rejectWithValue }) => {
    try {
      const category = id
        ? await categoryService.update(id, payload)
        : await categoryService.create(payload);
      dispatch(pushToast({ type: 'success', message: id ? 'Category updated' : 'Category created' }));
      await dispatch(fetchCategories());
      return category;
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Could not save category' }));
      return rejectWithValue(error.message || 'Could not save category');
    }
  },
);

export const removeCategory = createAsyncThunk(
  'categories/remove',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const result = await categoryService.remove(id);
      dispatch(pushToast({ type: 'success', message: 'Category disabled' }));
      await dispatch(fetchCategories());
      return result;
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Could not disable category' }));
      return rejectWithValue(error.message || 'Could not disable category');
    }
  },
);

export const reorderCategoryItems = createAsyncThunk(
  'categories/reorder',
  async (items, { dispatch, rejectWithValue }) => {
    try {
      const result = await categoryService.reorder(items);
      dispatch(pushToast({ type: 'success', message: 'Category order saved' }));
      await dispatch(fetchCategories());
      return result;
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Could not reorder categories' }));
      return rejectWithValue(error.message || 'Could not reorder categories');
    }
  },
);

export const bulkUpdateCategoryItems = createAsyncThunk(
  'categories/bulk',
  async (items, { dispatch, rejectWithValue }) => {
    try {
      const result = await categoryService.bulkUpdate(items);
      dispatch(pushToast({ type: 'success', message: 'Bulk update complete' }));
      await dispatch(fetchCategories());
      return result;
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Bulk update failed' }));
      return rejectWithValue(error.message || 'Bulk update failed');
    }
  },
);

export const fetchCategoryUsage = createAsyncThunk(
  'categories/usage',
  async (id, { rejectWithValue }) => {
    try {
      return await categoryService.usage(id);
    } catch (error) {
      return rejectWithValue(error.message || 'Could not load category usage');
    }
  },
);

const categorySlice = createSlice({
  name: 'categories',
  initialState: {
    items: [],
    tree: [],
    usage: null,
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {
    clearCategoryError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        if (!state.items.length) state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Could not load categories';
      })
      .addCase(fetchCategoryTree.fulfilled, (state, action) => {
        state.tree = action.payload || [];
      })
      .addCase(saveCategory.pending, (state) => {
        state.saving = true;
      })
      .addCase(saveCategory.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(saveCategory.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(removeCategory.pending, (state) => {
        state.saving = true;
      })
      .addCase(removeCategory.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(removeCategory.rejected, (state) => {
        state.saving = false;
      })
      .addCase(reorderCategoryItems.pending, (state) => {
        state.saving = true;
      })
      .addCase(reorderCategoryItems.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(reorderCategoryItems.rejected, (state) => {
        state.saving = false;
      })
      .addCase(bulkUpdateCategoryItems.pending, (state) => {
        state.saving = true;
      })
      .addCase(bulkUpdateCategoryItems.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(bulkUpdateCategoryItems.rejected, (state) => {
        state.saving = false;
      })
      .addCase(fetchCategoryUsage.fulfilled, (state, action) => {
        state.usage = action.payload;
      });
  },
});

export const { clearCategoryError } = categorySlice.actions;
export const selectCategories = (state) => state.categories;
export default categorySlice.reducer;
