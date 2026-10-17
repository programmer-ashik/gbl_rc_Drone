import React, { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectAuth } from '../store';
import { ROUTES } from '../constants/routes';
import { ToastHost } from './toast-host';
import { AdminRealtimeBridge } from './AdminRealtimeBridge';

const SIDEBAR_STORAGE_KEY = 'gblrc_admin_sidebar_collapsed';

const NAV = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', end: true },
  { to: ROUTES.CATEGORIES, label: 'Categories', end: true },
  { to: ROUTES.CATEGORIES_TREE, label: 'Category tree' },
  { to: ROUTES.PRODUCTS, label: 'Products', end: true },
  { to: ROUTES.STOCK, label: 'Stock' },
  { to: ROUTES.PRODUCTS_IMPORT, label: 'Product import' },
  { to: ROUTES.ORDERS, label: 'Orders' },
  { to: ROUTES.INVOICES, label: 'Invoices' },
  { to: ROUTES.USERS, label: 'CRM / Customers' },
  { to: ROUTES.CMS_PAGES, label: 'CMS Pages' },
  { to: ROUTES.CMS_TERMS, label: 'Terms & Conditions' },
  { to: ROUTES.CMS_PRIVACY, label: 'Privacy Policy' },
  { to: ROUTES.CMS_HOMEPAGE, label: 'Homepage CMS' },
  { to: ROUTES.CMS_SEO, label: 'SEO' },
  { to: ROUTES.CMS_REDIRECTS, label: 'Redirects' },
  { to: ROUTES.CMS_TESTIMONIALS, label: 'Testimonials' },
  { to: ROUTES.SETTINGS, label: 'Settings' },
  { to: ROUTES.SECURITY, label: 'Security' },
  { to: ROUTES.ACTIVITY_LOGS, label: 'Activity logs' },
  { to: ROUTES.MAINTENANCE, label: 'Maintenance' },
  { to: ROUTES.LIVE_CHAT, label: 'Live chat' },
];

const ChevronIcon = ({ collapsed }) => (
  <svg viewBox='0 0 20 20' fill='currentColor' className='h-4 w-4' aria-hidden='true'>
    {collapsed ? (
      <path
        fillRule='evenodd'
        d='M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z'
        clipRule='evenodd'
      />
    ) : (
      <path
        fillRule='evenodd'
        d='M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z'
        clipRule='evenodd'
      />
    )}
  </svg>
);

export const Layout = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(selectAuth);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  return (
    <div className='min-h-screen bg-background text-text'>
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col overflow-hidden border-r border-border bg-background-secondary transition-[width] duration-200 ${
          collapsed ? 'w-[4.5rem]' : 'w-60'
        }`}
      >
        <div className={`shrink-0 ${collapsed ? 'px-2 pt-5 pb-3' : 'px-5 pt-5 pb-4'}`}>
          {collapsed ? (
            <div className='flex flex-col items-center gap-1'>
              <span className='flex h-9 w-9 items-center justify-center rounded-xl bg-warning text-xs font-extrabold text-white'>
                GBL
              </span>
            </div>
          ) : (
            <>
              <p className='text-xs uppercase tracking-[0.2em] text-warning'>GBLrcDrone</p>
              <h1 className='text-lg font-bold text-text-primary'>Admin Dashboard</h1>
            </>
          )}
        </div>

        <nav className={`flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain pb-3 ${collapsed ? 'px-2' : 'px-3'}`}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end || item.to === ROUTES.DASHBOARD}
              title={item.label}
              className={({ isActive }) =>
                `rounded-xl text-sm font-semibold transition-colors ${
                  collapsed ? 'flex items-center justify-center px-0 py-2.5' : 'px-3 py-2'
                } ${isActive ? 'bg-warning text-white' : 'text-text-muted hover:bg-background'}`
              }
            >
              {collapsed ? (
                <span className='text-[11px] font-extrabold uppercase tracking-wide'>
                  {item.label
                    .split(/[\s/]+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join('')}
                </span>
              ) : (
                item.label
              )}
            </NavLink>
          ))}
        </nav>

        <div className={`shrink-0 border-t border-border p-2 ${collapsed ? '' : 'px-3'}`}>
          <button
            type='button'
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`flex w-full items-center rounded-xl border border-border px-3 py-2 text-xs font-semibold text-text-muted hover:bg-background ${
              collapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            {!collapsed ? <span>Collapse</span> : null}
            <ChevronIcon collapsed={collapsed} />
          </button>
        </div>
      </aside>

      <div className={`transition-[margin] duration-200 ${collapsed ? 'ml-[4.5rem]' : 'ml-60'}`}>
        <header className='flex items-center justify-between border-b border-border px-6 py-4 sm:px-8'>
          <div className='flex items-center gap-3'>
            <button
              type='button'
              onClick={() => setCollapsed((value) => !value)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className='inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-text-muted hover:bg-background-secondary lg:hidden'
            >
              <ChevronIcon collapsed={collapsed} />
            </button>
            <p className='text-sm text-text-muted'>Synced with storefront navigation APIs</p>
          </div>
          <div className='flex items-center gap-3'>
            <span className='text-sm font-medium'>{user?.name}</span>
            <button
              type='button'
              onClick={() => dispatch(logout())}
              className='rounded-lg border border-border px-3 py-1.5 text-xs font-semibold'
            >
              Logout
            </button>
          </div>
        </header>
        <main className='p-6 sm:p-8'>
          <ToastHost />
          <AdminRealtimeBridge />
          <Outlet />
        </main>
      </div>
    </div>
  );
};
