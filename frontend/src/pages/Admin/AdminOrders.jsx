import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminLayout from "../../components/admin/AdminLayout";
import DataTable from "../../components/admin/DataTable";
import { fetchAdminOrders, selectAdmin } from "../../store/slices/adminSlice";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleDateString();
};

export const AdminOrders = () => {
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector(selectAdmin);

  useEffect(() => {
    dispatch(fetchAdminOrders());
  }, [dispatch]);

  const rows = orders.map((order) => ({
    id: order._id,
    orderNumber: order.orderNumber,
    customer: order.shippingAddress?.fullName || "N/A",
    total: `৳${order.total ?? 0}`,
    paymentMethod: (order.paymentMethod || "cod").toUpperCase(),
    status: order.status,
    createdAt: formatDate(order.createdAt),
  }));

  return (
    <AdminLayout title='Orders Management'>
      {error.orders && (
        <div className='mb-4 rounded-xl border border-red-400/30 bg-red-500/10 text-red-400 text-sm p-3'>
          {error.orders}
        </div>
      )}

      <DataTable
        title='All Orders'
        loading={loading.orders}
        rows={rows}
        columns={[
          { key: "orderNumber", label: "Order" },
          { key: "customer", label: "Customer" },
          { key: "total", label: "Total" },
          { key: "paymentMethod", label: "Payment" },
          { key: "status", label: "Status" },
          { key: "createdAt", label: "Date" },
        ]}
        emptyMessage='No orders found.'
      />
    </AdminLayout>
  );
};

export default AdminOrders;
