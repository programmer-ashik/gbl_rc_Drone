import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminLayout from "../../components/admin/AdminLayout";
import MetricCard from "../../components/admin/MetricCard";
import {
  fetchAdminDashboard,
  fetchAdminStats,
  fetchAdminOrders,
  selectAdmin,
} from "../../store/slices/adminSlice";
import DataTable from "../../components/admin/DataTable";

export const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { dashboard, stats, orders, loading, error } = useSelector(selectAdmin);

  useEffect(() => {
    dispatch(fetchAdminDashboard());
    dispatch(fetchAdminStats());
    dispatch(fetchAdminOrders());
  }, [dispatch]);

  const recentOrders = orders.slice(0, 6).map((order) => ({
    id: order._id,
    orderNumber: order.orderNumber,
    customer: order.shippingAddress?.fullName || "N/A",
    total: `৳${order.total ?? 0}`,
    status: order.status,
  }));

  return (
    <AdminLayout title='Store Dashboard'>
      {(error.dashboard || error.stats) && (
        <div className='mb-4 rounded-xl border border-red-400/30 bg-red-500/10 text-red-400 text-sm p-3'>
          {error.dashboard || error.stats}
        </div>
      )}

      <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6'>
        <MetricCard
          label='Customers'
          value={loading.dashboard ? "..." : dashboard?.users ?? 0}
          icon='users'
        />
        <MetricCard
          label='Products'
          value={loading.dashboard ? "..." : dashboard?.products ?? 0}
          icon='cube'
        />
        <MetricCard
          label='Orders'
          value={loading.dashboard ? "..." : dashboard?.orders ?? 0}
          icon='shopping-bag'
        />
        <MetricCard
          label='Revenue'
          value={loading.stats ? "..." : `৳${stats?.revenue ?? 0}`}
          icon='chart'
        />
        <MetricCard
          label='Pending'
          value={loading.stats ? "..." : stats?.pendingOrders ?? 0}
          icon='clock'
        />
      </div>

      <DataTable
        title='Recent Orders'
        loading={loading.orders}
        rows={recentOrders}
        columns={[
          { key: "orderNumber", label: "Order" },
          { key: "customer", label: "Customer" },
          { key: "total", label: "Total" },
          {
            key: "status",
            label: "Status",
            render: (value) => (
              <span className='text-xs font-semibold uppercase tracking-wide'>{value}</span>
            ),
          },
        ]}
        emptyMessage='No orders yet.'
      />
    </AdminLayout>
  );
};

export default AdminDashboard;
