import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ROUTES } from "../../constants";
import Icon from "../common/Icon/Icon";

const ADMIN_NAV = [
  { label: "Dashboard", path: ROUTES.ADMIN, icon: "dashboard" },
  { label: "Categories", path: ROUTES.ADMIN_CATEGORIES, icon: "grid" },
  { label: "Products", path: ROUTES.ADMIN_PRODUCTS, icon: "cube" },
  { label: "Orders", path: ROUTES.ADMIN_ORDERS, icon: "shopping-bag" },
  { label: "Users", path: ROUTES.ADMIN_USERS, icon: "users" },
];

export const AdminLayout = ({ title, children }) => {
  const location = useLocation();

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-text'>
      <div className='mb-6'>
        <h1 className='text-2xl sm:text-3xl font-extrabold tracking-tight'>{title}</h1>
        <p className='text-sm text-text-muted mt-1'>
          Admin panel for store operations and analytics.
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
        <aside className='lg:col-span-3 bg-background-secondary border border-border rounded-2xl p-4 h-fit'>
          <nav className='flex flex-col gap-2'>
            {ADMIN_NAV.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    active
                      ? "bg-warning text-white"
                      : "text-text-muted hover:text-text hover:bg-background"
                  }`}
                >
                  <Icon name={item.icon} size={4} className='cursor-default' />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className='lg:col-span-9'>{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
