import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { dismissToast, selectToasts } from '../store/slices/toast-slice';

export const ToastHost = () => {
  const dispatch = useDispatch();
  const toasts = useSelector(selectToasts);

  useEffect(() => {
    if (!toasts.length) return undefined;
    const timers = toasts.map((toast) =>
      setTimeout(() => dispatch(dismissToast(toast.id)), 3200),
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, dispatch]);

  if (!toasts.length) return null;

  return (
    <div className='fixed right-6 top-6 z-50 flex w-80 flex-col gap-2'>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-xl border px-4 py-3 text-sm shadow-lg ${
            toast.type === 'error'
              ? 'border-red-200 bg-red-50 text-danger'
              : 'border-emerald-200 bg-emerald-50 text-success'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};

export default ToastHost;
