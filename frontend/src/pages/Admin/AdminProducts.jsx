import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import DataTable from "../../components/admin/DataTable";
import {
  fetchAdminProducts,
  selectAdmin,
} from "../../store/slices/adminSlice";
import { ROUTES } from "../../constants";

export const AdminProducts = () => {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector(selectAdmin);

  useEffect(() => {
    dispatch(fetchAdminProducts());
  }, [dispatch]);

  const rows = products.map((product) => ({
    id: product._id,
    title: product.title,
    category: product.category,
    price: `৳${product.discountPrice || product.price}`,
    stock: product.stock,
    status: product.status,
    slug: product.slug,
  }));

  return (
    <AdminLayout title='Products Management'>
      {error.products && (
        <div className='mb-4 rounded-xl border border-red-400/30 bg-red-500/10 text-red-400 text-sm p-3'>
          {error.products}
        </div>
      )}

      <DataTable
        title='All Products'
        loading={loading.products}
        rows={rows}
        columns={[
          { key: "title", label: "Product" },
          { key: "category", label: "Category" },
          { key: "price", label: "Price" },
          { key: "stock", label: "Stock" },
          { key: "status", label: "Status" },
          {
            key: "slug",
            label: "View",
            render: (value) => (
              <Link
                to={`${ROUTES.PRODUCTS}/${value}`}
                className='text-warning hover:underline text-xs font-semibold'
              >
                Open
              </Link>
            ),
          },
        ]}
        emptyMessage='No products found.'
      />
    </AdminLayout>
  );
};

export default AdminProducts;
