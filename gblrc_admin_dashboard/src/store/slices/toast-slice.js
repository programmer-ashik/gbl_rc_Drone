import { createSlice } from '@reduxjs/toolkit';

const toastSlice = createSlice({
  name: 'toast',
  initialState: { items: [] },
  reducers: {
    pushToast(state, action) {
      state.items.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: action.payload.type || 'success',
        message: action.payload.message,
      });
    },
    dismissToast(state, action) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
  },
});

export const { pushToast, dismissToast } = toastSlice.actions;
export const selectToasts = (state) => state.toast.items;
export default toastSlice.reducer;
