import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getRealtimeSocket } from '../lib/realtime';
import { queryKeys } from '../lib/queryClient';

/**
 * Subscribes to catalog WebSocket events and invalidates React Query caches.
 * Shows a lightweight "Data updated" toast without forcing a full page reload.
 */
export const RealtimeSync = () => {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState('');

  useEffect(() => {
    const socket = getRealtimeSocket();

    const show = (message) => {
      setToast(message || 'Data updated');
      window.clearTimeout(show._timer);
      show._timer = window.setTimeout(() => setToast(''), 3200);
    };

    const onCategories = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      show('Navigation updated');
    };

    const onProducts = (payload) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      show(payload?.message || 'Catalog updated');
    };

    const onStock = (payload) => {
      const ids = payload?.productIds || [];
      ids.forEach((id) => {
        if (id) queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(String(id)) });
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.featured });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.newArrivals });
      show('Stock updated');
    };

    socket.on('catalog:categories', onCategories);
    socket.on('catalog:products', onProducts);
    socket.on('admin:stock', onStock);

    return () => {
      socket.off('catalog:categories', onCategories);
      socket.off('catalog:products', onProducts);
      socket.off('admin:stock', onStock);
    };
  }, [queryClient]);

  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-text px-4 py-2 text-sm font-semibold text-white shadow-lg">
      {toast}
    </div>
  );
};

export default RealtimeSync;
