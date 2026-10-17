import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { adminService } from '../../services';
import { ROUTES } from '../../constants/routes';
import { pushToast } from '../../store/slices/toast-slice';
import HeadlessSelect from '../../components/headless-select';
import {
  downloadInvoiceHtml,
  formatDate,
  formatShortDate,
  money,
  printInvoiceHtml,
  statusBadgeClass,
} from '../../utils/orders';

const panelClass = 'rounded-2xl border border-border bg-background-secondary p-5';
const controlClass = 'rounded-xl border border-border bg-background px-3 py-2 text-sm';

export const UserDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('customer');
  const [tagsInput, setTagsInput] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUser(id);
      setUser(data);
      setRole(data.role === 'customer' ? 'customer' : data.role);
      setTagsInput((data.tags || []).join(', '));
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Failed to load user' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    adminService
      .listInvoiceTemplates()
      .then((list) => {
        const items = Array.isArray(list) ? list : [];
        setTemplates(items);
        const preferred = items.find((item) => item.isDefault) || items[0];
        if (preferred) setTemplateId(preferred._id);
      })
      .catch(() => setTemplates([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const saveRole = async () => {
    setBusy(true);
    try {
      const data = await adminService.updateUser(id, { role: role === 'customer' ? 'user' : role === 'store_admin' ? 'admin' : role });
      setUser(data);
      dispatch(pushToast({ type: 'success', message: 'Role updated' }));
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Role update failed' }));
    } finally {
      setBusy(false);
    }
  };

  const saveTags = async () => {
    setBusy(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
      const data = await adminService.updateUser(id, { tags });
      setUser(data);
      dispatch(pushToast({ type: 'success', message: 'Tags saved' }));
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Tags update failed' }));
    } finally {
      setBusy(false);
    }
  };

  const addCrmNote = async () => {
    if (!note.trim()) return;
    setBusy(true);
    try {
      const data = await adminService.updateUser(id, { note: note.trim() });
      setUser(data);
      setNote('');
      dispatch(pushToast({ type: 'success', message: 'CRM note added' }));
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Note failed' }));
    } finally {
      setBusy(false);
    }
  };

  const toggleBlock = async () => {
    setBusy(true);
    try {
      const data = await adminService.updateUser(id, { isBlocked: !user.isBlocked });
      setUser(data);
      dispatch(pushToast({ type: 'success', message: data.isBlocked ? 'User blocked' : 'User unblocked' }));
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Update failed' }));
    } finally {
      setBusy(false);
    }
  };

  const openOrderInvoice = async (orderId, mode = 'print') => {
    setBusy(true);
    try {
      const invoice = await adminService.getInvoice(orderId, templateId ? { templateId } : {});
      if (mode === 'download') downloadInvoiceHtml(invoice);
      else printInvoiceHtml(invoice);
      dispatch(pushToast({ type: 'success', message: mode === 'download' ? 'Invoice downloaded' : 'Invoice opened' }));
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Invoice failed' }));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className='text-sm text-text-muted'>Loading customer…</p>;
  if (!user) return <p className='text-sm text-danger'>Customer not found</p>;

  return (
    <div>
      <Link to={ROUTES.USERS} className='text-sm font-semibold text-warning'>
        ← Back to CRM
      </Link>
      <div className='mb-6 mt-2 flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-extrabold text-text-primary'>{user.name}</h1>
          <p className='text-sm text-text-muted'>
            Joined {formatShortDate(user.createdAt)} · {user.email}
          </p>
          {(user.tags || []).length ? (
            <div className='mt-2 flex flex-wrap gap-1'>
              {user.tags.map((tag) => (
                <span key={tag} className='rounded-full bg-warning-bg px-2 py-0.5 text-[11px] font-semibold text-warning'>
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <button
          type='button'
          disabled={busy}
          onClick={toggleBlock}
          className={`rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${user.isBlocked ? 'bg-emerald-600' : 'bg-red-600'}`}
        >
          {user.isBlocked ? 'Unblock customer' : 'Block customer'}
        </button>
      </div>

      <div className='mb-4 grid grid-cols-2 gap-4 md:grid-cols-4'>
        {[
          { label: 'Orders', value: user.ordersCount || 0 },
          { label: 'Total spent', value: money(user.totalSpent) },
          { label: 'Phone', value: user.phone || '—' },
          { label: 'Status', value: user.isBlocked ? 'Blocked' : 'Active' },
        ].map((card) => (
          <div key={card.label} className={panelClass}>
            <p className='text-xs uppercase text-text-muted'>{card.label}</p>
            <p className='mt-2 text-xl font-bold'>{card.value}</p>
          </div>
        ))}
      </div>

      <div className='grid grid-cols-1 gap-4 xl:grid-cols-3'>
        <section className={`${panelClass} xl:col-span-2`}>
          <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
            <h2 className='text-sm font-bold uppercase tracking-wide text-text-muted'>Order history & invoices</h2>
            <HeadlessSelect
              aria-label='Invoice template'
              className='w-52'
              value={templateId}
              placeholder='Invoice template'
              options={templates.map((template) => ({
                value: template._id,
                label: `${template.name}${template.isDefault ? ' (default)' : ''}`,
              }))}
              onChange={setTemplateId}
            />
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-left text-xs uppercase text-text-muted'>
                  <th className='py-2'>Order</th>
                  <th className='py-2'>Date</th>
                  <th className='py-2'>Total</th>
                  <th className='py-2'>Status</th>
                  <th className='py-2'>Invoice</th>
                </tr>
              </thead>
              <tbody>
                {(user.orders || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className='py-6 text-text-muted'>
                      No orders yet
                    </td>
                  </tr>
                ) : (
                  user.orders.map((order) => (
                    <tr key={order._id} className='border-t border-border'>
                      <td className='py-2'>
                        <Link to={ROUTES.ORDERS_DETAIL.replace(':id', order._id)} className='font-semibold text-warning'>
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className='py-2'>{formatDate(order.createdAt)}</td>
                      <td className='py-2'>{money(order.total)}</td>
                      <td className='py-2'>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ${statusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className='py-2'>
                        <div className='flex flex-wrap gap-1'>
                          <button type='button' disabled={busy} onClick={() => openOrderInvoice(order._id, 'print')} className='rounded-lg border border-border px-2 py-1 text-xs font-semibold'>
                            Print
                          </button>
                          <button type='button' disabled={busy} onClick={() => openOrderInvoice(order._id, 'download')} className='rounded-lg bg-warning px-2 py-1 text-xs font-semibold text-white'>
                            Download
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className='space-y-4'>
          <section className={panelClass}>
            <h2 className='mb-3 text-sm font-bold uppercase tracking-wide text-text-muted'>Role</h2>
            <HeadlessSelect
              aria-label='Role'
              className='mb-2'
              value={role}
              options={[
                { value: 'customer', label: 'User' },
                { value: 'store_admin', label: 'Admin' },
              ]}
              onChange={setRole}
            />
            <button type='button' disabled={busy} onClick={saveRole} className='w-full rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'>
              Save role
            </button>
          </section>

          <section className={panelClass}>
            <h2 className='mb-3 text-sm font-bold uppercase tracking-wide text-text-muted'>CRM tags</h2>
            <input
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
              placeholder='vip, wholesale, follow-up'
              className={`${controlClass} mb-2 w-full`}
            />
            <button type='button' disabled={busy} onClick={saveTags} className='w-full rounded-xl border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50'>
              Save tags
            </button>
          </section>

          <section className={panelClass}>
            <h2 className='mb-3 text-sm font-bold uppercase tracking-wide text-text-muted'>CRM notes</h2>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} className={`${controlClass} mb-2 w-full`} placeholder='Add internal note…' />
            <button type='button' disabled={busy} onClick={addCrmNote} className='mb-3 w-full rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'>
              Add note
            </button>
            <div className='max-h-64 space-y-2 overflow-y-auto'>
              {(user.crmNotes || []).map((entry, index) => (
                <div key={entry._id || index} className='rounded-xl bg-background p-3 text-sm'>
                  <p>{entry.body}</p>
                  <p className='mt-1 text-[11px] text-text-muted'>
                    {entry.authorName || 'Admin'} · {formatDate(entry.createdAt)}
                  </p>
                </div>
              ))}
              {!(user.crmNotes || []).length ? <p className='text-sm text-text-muted'>No CRM notes yet</p> : null}
            </div>
          </section>

          <section className={panelClass}>
            <h2 className='mb-3 text-sm font-bold uppercase tracking-wide text-text-muted'>Addresses</h2>
            {(user.addresses || []).length === 0 ? (
              <p className='text-sm text-text-muted'>No saved addresses</p>
            ) : (
              <div className='space-y-3'>
                {user.addresses.map((address, index) => (
                  <div key={address._id || index} className='rounded-xl bg-background p-3 text-sm'>
                    <p className='font-semibold'>{address.label || address.fullName || 'Address'}</p>
                    <p>{address.fullName}</p>
                    <p>{address.phone}</p>
                    <p className='text-text-muted'>
                      {address.address}
                      {address.city ? `, ${address.city}` : ''}
                      {address.postalCode ? ` ${address.postalCode}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default UserDetailPage;
