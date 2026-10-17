import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { getAdminRealtimeSocket } from '../lib/realtime';
import { pushToast } from '../store/slices/toast-slice';

/**
 * Admin WebSocket listener — stock, orders, low-stock, and stats refresh signals.
 * Consumers register via custom events on window for dashboard refetch.
 */
export const AdminRealtimeBridge = () => {
  const dispatch = useDispatch();
  const [banner, setBanner] = useState('');
  const timer = useRef(null);

  useEffect(() => {
    const socket = getAdminRealtimeSocket();

    const flash = (message) => {
      setBanner(message);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setBanner(''), 4000);
    };

    const onOrder = (payload) => {
      const text = payload?.orderNumber
        ? `New order ${payload.orderNumber}`
        : payload?.message || 'New order received';
      dispatch(pushToast({ type: 'success', message: text }));
      flash(text);
      window.dispatchEvent(new CustomEvent('admin:realtime', { detail: { type: 'order', payload } }));
    };

    const onStock = (payload) => {
      dispatch(pushToast({ type: 'success', message: payload?.message || 'Stock updated' }));
      flash(payload?.message || 'Stock updated');
      window.dispatchEvent(new CustomEvent('admin:realtime', { detail: { type: 'stock', payload } }));
    };

    const onLowStock = (payload) => {
      const count = payload?.products?.length || 0;
      const text = count ? `Low stock alert: ${count} product(s)` : payload?.message || 'Low stock alert';
      dispatch(pushToast({ type: 'error', message: text }));
      flash(text);
      window.dispatchEvent(new CustomEvent('admin:realtime', { detail: { type: 'low-stock', payload } }));
    };

    const onStats = (payload) => {
      window.dispatchEvent(new CustomEvent('admin:realtime', { detail: { type: 'stats', payload } }));
    };

    const onCategories = (payload) => {
      dispatch(pushToast({ type: 'success', message: payload?.message || 'Categories updated' }));
      window.dispatchEvent(new CustomEvent('admin:realtime', { detail: { type: 'categories', payload } }));
    };

    const onProducts = (payload) => {
      dispatch(pushToast({ type: 'success', message: payload?.message || 'Products updated' }));
      window.dispatchEvent(new CustomEvent('admin:realtime', { detail: { type: 'products', payload } }));
    };

    socket.on('admin:order', onOrder);
    socket.on('admin:stock', onStock);
    socket.on('admin:low-stock', onLowStock);
    socket.on('admin:stats', onStats);
    socket.on('catalog:categories', onCategories);
    socket.on('catalog:products', onProducts);

    return () => {
      socket.off('admin:order', onOrder);
      socket.off('admin:stock', onStock);
      socket.off('admin:low-stock', onLowStock);
      socket.off('admin:stats', onStats);
      socket.off('catalog:categories', onCategories);
      socket.off('catalog:products', onProducts);
    };
  }, [dispatch]);

  if (!banner) return null;

  return (
    <div className='pointer-events-none fixed bottom-6 right-6 z-[80] rounded-2xl bg-text px-4 py-2 text-sm font-semibold text-white shadow-lg'>
      {banner}
    </div>
  );
};

export default AdminRealtimeBridge;
