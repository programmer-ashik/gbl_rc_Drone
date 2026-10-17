import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { adminService } from '../../services';
import { ROUTES } from '../../constants/routes';
import { pushToast } from '../../store/slices/toast-slice';
import HeadlessSelect from '../../components/headless-select';
import { downloadTextFile, formatShortDate, money } from '../../utils/orders';

const controlClass = 'rounded-xl border border-border bg-background px-3 py-2 text-sm';

const ROLE_FILTER_OPTIONS = [
  { value: 'all', label: 'All roles' },
  { value: 'customer', label: 'Users' },
  { value: 'store_admin', label: 'Admins' },
];
const ACCOUNT_FILTER_OPTIONS = [
  { value: 'all', label: 'All accounts' },
  { value: 'false', label: 'Active' },
  { value: 'true', label: 'Blocked' },
];

export const UserListPage = () => {
  const dispatch = useDispatch();
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState({ search: '', role: 'all', blocked: 'all', page: 1, limit: 20 });
  const [data, setData] = useState({ items: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery((current) => (current.search === searchInput ? current : { ...current, search: searchInput, page: 1 }));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    adminService
      .getUsers(query)
      .then((result) => {
        if (!active) return;
        setData(result);
      })
      .catch((error) => {
        if (!active) return;
        dispatch(pushToast({ type: 'error', message: error.message || 'Failed to load users' }));
        setData({ items: [], total: 0, page: 1, totalPages: 1 });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [dispatch, query]);

  const exportCsv = async () => {
    try {
      const file = await adminService.exportUsers();
      downloadTextFile(file.filename || 'users.csv', file.csv);
      dispatch(pushToast({ type: 'success', message: `Exported ${file.total} users` }));
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Export failed' }));
    }
  };

  const roleLabel = (role) => {
    if (role === 'store_admin' || role === 'platform_admin' || role === 'platform_super_admin') return 'admin';
    return 'user';
  };

  return (
    <div>
      <div className='mb-6 flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-extrabold text-text-primary'>CRM / Customers</h1>
          <p className='mt-1 text-sm text-text-muted'>Search customers, review spend, and open full order history.</p>
          <p className='text-sm text-text-muted'>{data.total} accounts</p>
        </div>
        <button type='button' onClick={exportCsv} className='rounded-xl border border-border px-4 py-2 text-sm font-semibold'>
          Export user data
        </button>
      </div>

      <div className='mb-4 grid grid-cols-1 gap-3 md:grid-cols-3'>
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder='Search name, email, phone'
          className={controlClass}
        />
        <HeadlessSelect
          aria-label='Role'
          value={query.role}
          options={ROLE_FILTER_OPTIONS}
          onChange={(role) => setQuery((current) => ({ ...current, role, page: 1 }))}
        />
        <HeadlessSelect
          aria-label='Account status'
          value={query.blocked}
          options={ACCOUNT_FILTER_OPTIONS}
          onChange={(blocked) => setQuery((current) => ({ ...current, blocked, page: 1 }))}
        />
      </div>

      <div className='overflow-hidden rounded-2xl border border-border bg-background-secondary'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-left text-xs uppercase text-text-muted'>
              <th className='px-4 py-3'>Name</th>
              <th className='px-4 py-3'>Email</th>
              <th className='px-4 py-3'>Phone</th>
              <th className='px-4 py-3'>Orders</th>
              <th className='px-4 py-3'>Total spent</th>
              <th className='px-4 py-3'>Join date</th>
              <th className='px-4 py-3'>Role</th>
              <th className='px-4 py-3'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className='px-4 py-8 text-center text-text-muted'>
                  Loading users…
                </td>
              </tr>
            ) : data.items.length === 0 ? (
              <tr>
                <td colSpan={8} className='px-4 py-8 text-center text-text-muted'>
                  No users found
                </td>
              </tr>
            ) : (
              data.items.map((user) => (
                <tr key={user._id} className='border-t border-border'>
                  <td className='px-4 py-3 font-semibold'>
                    {user.name}
                    {user.isBlocked ? <span className='ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700'>Blocked</span> : null}
                  </td>
                  <td className='px-4 py-3'>{user.email}</td>
                  <td className='px-4 py-3'>{user.phone || '—'}</td>
                  <td className='px-4 py-3'>{user.ordersCount || 0}</td>
                  <td className='px-4 py-3'>{money(user.totalSpent)}</td>
                  <td className='px-4 py-3'>{formatShortDate(user.createdAt)}</td>
                  <td className='px-4 py-3 capitalize'>{roleLabel(user.role)}</td>
                  <td className='px-4 py-3'>
                    <Link to={ROUTES.USERS_DETAIL.replace(':id', user._id)} className='font-semibold text-warning'>
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className='mt-4 flex items-center justify-between'>
        <p className='text-sm text-text-muted'>
          Page {data.page} of {data.totalPages}
        </p>
        <div className='flex gap-2'>
          <button
            type='button'
            disabled={query.page <= 1}
            onClick={() => setQuery((current) => ({ ...current, page: current.page - 1 }))}
            className='rounded-xl border border-border px-3 py-1.5 text-sm disabled:opacity-40'
          >
            Previous
          </button>
          <button
            type='button'
            disabled={query.page >= data.totalPages}
            onClick={() => setQuery((current) => ({ ...current, page: current.page + 1 }))}
            className='rounded-xl border border-border px-3 py-1.5 text-sm disabled:opacity-40'
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserListPage;
