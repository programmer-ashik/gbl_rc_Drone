import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { adminService } from '../../services';
import { ROUTES } from '../../constants/routes';
import { pushToast } from '../../store/slices/toast-slice';
import HeadlessSelect from '../../components/headless-select';
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  customerLabel,
  formatDate,
  money,
  printInvoiceHtml,
  statusBadgeClass,
} from '../../utils/orders';

const controlClass = 'rounded-xl border border-border bg-background px-3 py-2 text-sm';

const toLabel = (status) => status.charAt(0).toUpperCase() + status.slice(1);
const ORDER_STATUS_OPTIONS = ORDER_STATUSES.map((status) => ({ value: status, label: toLabel(status) }));
const STATUS_FILTER_OPTIONS = [{ value: 'all', label: 'All statuses' }, ...ORDER_STATUS_OPTIONS];
const PAYMENT_FILTER_OPTIONS = [
  { value: 'all', label: 'All payments' },
  ...PAYMENT_STATUSES.map((status) => ({ value: status, label: toLabel(status) })),
];

export const OrderListPage = () => {
  const dispatch = useDispatch();
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState({
    search: '',
    status: 'all',
    paymentStatus: 'all',
    from: '',
    to: '',
    page: 1,
    limit: 20,
  });
  const [data, setData] = useState({ items: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('processing');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onRealtime = (event) => {
      if (event.detail?.type === 'order' || event.detail?.type === 'stats') {
        setQuery((current) => ({ ...current }));
      }
    };
    window.addEventListener('admin:realtime', onRealtime);
    return () => window.removeEventListener('admin:realtime', onRealtime);
  }, []);

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
      .getOrders(query)
      .then((result) => {
        if (!active) return;
        setData(result);
        setSelected([]);
      })
      .catch((error) => {
        if (!active) return;
        dispatch(pushToast({ type: 'error', message: error.message || 'Failed to load orders' }));
        setData({ items: [], total: 0, page: 1, totalPages: 1 });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [dispatch, query]);

  const toggle = (id) => {
    setSelected((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  };

  const toggleAll = () => {
    if (selected.length === data.items.length) setSelected([]);
    else setSelected(data.items.map((item) => item._id));
  };

  const runBulkStatus = async () => {
    if (!selected.length) return;
    setBusy(true);
    try {
      const result = await adminService.bulkOrders({
        ids: selected,
        action: 'status',
        status: bulkStatus,
        notifyCustomer: true,
        note: `Bulk status update to ${bulkStatus}`,
      });
      dispatch(
        pushToast({
          type: 'success',
          message: `Updated ${result.updated}/${result.total} orders`,
        }),
      );
      setQuery((current) => ({ ...current }));
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Bulk update failed' }));
    } finally {
      setBusy(false);
    }
  };

  const printSelected = async () => {
    if (!selected.length) return;
    setBusy(true);
    try {
      for (const id of selected) {
        const invoice = await adminService.getInvoice(id);
        printInvoiceHtml(invoice);
      }
      dispatch(pushToast({ type: 'success', message: `Opened ${selected.length} invoice(s)` }));
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Print failed' }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className='mb-6 flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-extrabold text-text-primary'>Orders</h1>
          <p className='text-sm text-text-muted'>{data.total} orders matching filters</p>
        </div>
      </div>

      <div className='mb-4 grid grid-cols-1 gap-3 md:grid-cols-5'>
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder='Search order ID, name, email'
          className={controlClass}
        />
        <HeadlessSelect
          aria-label='Order status'
          value={query.status}
          options={STATUS_FILTER_OPTIONS}
          onChange={(status) => setQuery((current) => ({ ...current, status, page: 1 }))}
        />
        <HeadlessSelect
          aria-label='Payment status'
          value={query.paymentStatus}
          options={PAYMENT_FILTER_OPTIONS}
          onChange={(paymentStatus) => setQuery((current) => ({ ...current, paymentStatus, page: 1 }))}
        />
        <input
          type='date'
          value={query.from}
          onChange={(event) => setQuery((current) => ({ ...current, from: event.target.value, page: 1 }))}
          className={controlClass}
        />
        <input
          type='date'
          value={query.to}
          onChange={(event) => setQuery((current) => ({ ...current, to: event.target.value, page: 1 }))}
          className={controlClass}
        />
      </div>

      <div className='mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-background-secondary p-3'>
        <span className='text-sm text-text-muted'>{selected.length} selected</span>
        <HeadlessSelect
          aria-label='Bulk status'
          value={bulkStatus}
          options={ORDER_STATUS_OPTIONS}
          onChange={setBulkStatus}
          className='w-44'
        />
        <button
          type='button'
          disabled={!selected.length || busy}
          onClick={runBulkStatus}
          className='rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'
        >
          Update status
        </button>
        <button
          type='button'
          disabled={!selected.length || busy}
          onClick={printSelected}
          className='rounded-xl border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50'
        >
          Print invoices
        </button>
      </div>

      <div className='overflow-hidden rounded-2xl border border-border bg-background-secondary'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-left text-xs uppercase text-text-muted'>
              <th className='px-4 py-3'>
                <input type='checkbox' checked={data.items.length > 0 && selected.length === data.items.length} onChange={toggleAll} />
              </th>
              <th className='px-4 py-3'>Order ID</th>
              <th className='px-4 py-3'>Customer</th>
              <th className='px-4 py-3'>Date</th>
              <th className='px-4 py-3'>Total</th>
              <th className='px-4 py-3'>Payment</th>
              <th className='px-4 py-3'>Status</th>
              <th className='px-4 py-3'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className='px-4 py-8 text-center text-text-muted'>
                  Loading orders…
                </td>
              </tr>
            ) : data.items.length === 0 ? (
              <tr>
                <td colSpan={8} className='px-4 py-8 text-center text-text-muted'>
                  No orders found
                </td>
              </tr>
            ) : (
              data.items.map((item) => {
                const customer = customerLabel(item);
                return (
                  <tr key={item._id} className='border-t border-border'>
                    <td className='px-4 py-3'>
                      <input type='checkbox' checked={selected.includes(item._id)} onChange={() => toggle(item._id)} />
                    </td>
                    <td className='px-4 py-3 font-semibold'>{item.orderNumber}</td>
                    <td className='px-4 py-3'>
                      <div>{customer.name}</div>
                      <div className='text-xs text-text-muted'>{customer.email}</div>
                    </td>
                    <td className='px-4 py-3'>{formatDate(item.createdAt)}</td>
                    <td className='px-4 py-3'>{money(item.total)}</td>
                    <td className='px-4 py-3'>
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadgeClass(item.paymentStatus || 'pending')}`}>
                        {item.paymentStatus || 'pending'}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ${statusBadgeClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <Link to={ROUTES.ORDERS_DETAIL.replace(':id', item._id)} className='font-semibold text-warning'>
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })
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

export default OrderListPage;
