import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { ROUTES } from '../../constants';
import Icon from '../../components/common/Icon/Icon';

const money = (value) => `৳${Number(value || 0).toLocaleString()}`;
const formatDate = (value) => (value ? new Date(value).toLocaleString() : '—');

export const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService
      .history()
      .then((data) => setOrders(Array.isArray(data) ? data : data?.items || []))
      .catch((err) => setError(err.message || 'Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-text-muted">
        <Link to={ROUTES.HOME}>Home</Link>
        <Icon name="chevron-right" size={3} />
        <span className="font-medium text-text">My orders</span>
      </nav>
      <h1 className="mb-6 text-2xl font-extrabold">Order tracking</h1>
      {loading && <p className="text-sm text-text-muted">Loading…</p>}
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      {!loading && !orders.length && <p className="text-sm text-text-muted">No orders yet.</p>}
      <div className="space-y-3">
        {orders.map((order) => (
          <Link
            key={order._id}
            to={`/orders/${order._id}`}
            className="block rounded-2xl border border-border bg-background-secondary p-4 transition hover:border-warning"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-bold">{order.orderNumber}</p>
                <p className="text-xs text-text-muted">{formatDate(order.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold capitalize text-warning">{order.status}</p>
                <p className="text-sm font-bold">{money(order.total)}</p>
              </div>
            </div>
            {order.estimatedDeliveryDate ? (
              <p className="mt-2 text-xs text-text-muted">Est. delivery {formatDate(order.estimatedDeliveryDate)}</p>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default OrdersPage;
