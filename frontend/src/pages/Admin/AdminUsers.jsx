import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminLayout from "../../components/admin/AdminLayout";
import DataTable from "../../components/admin/DataTable";
import { fetchAdminUsers, selectAdmin } from "../../store/slices/adminSlice";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleDateString();
};

export const AdminUsers = () => {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector(selectAdmin);

  useEffect(() => {
    dispatch(fetchAdminUsers());
  }, [dispatch]);

  const rows = users.map((user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    organization: user.organizationId || "-",
    joinedAt: formatDate(user.createdAt),
  }));

  return (
    <AdminLayout title='Users Management'>
      {error.users && (
        <div className='mb-4 rounded-xl border border-red-400/30 bg-red-500/10 text-red-400 text-sm p-3'>
          {error.users}
        </div>
      )}

      <DataTable
        title='All Users'
        loading={loading.users}
        rows={rows}
        columns={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "role", label: "Role" },
          { key: "organization", label: "Organization" },
          { key: "joinedAt", label: "Joined" },
        ]}
        emptyMessage='No users found.'
      />
    </AdminLayout>
  );
};

export default AdminUsers;
