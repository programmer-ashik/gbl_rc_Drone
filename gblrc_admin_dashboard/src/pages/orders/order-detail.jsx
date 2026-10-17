import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { adminService } from '../../services';
import { ROUTES } from '../../constants/routes';
import { pushToast } from '../../store/slices/toast-slice';
import HeadlessSelect from '../../components/headless-select';
import {
  customerLabel,
  downloadInvoiceHtml,
  formatDate,
  money,
  printInvoiceHtml,
  statusBadgeClass,
} from '../../utils/orders';

const controlClass = 'rounded-xl border border-border bg-background px-3 py-2 text-sm';
const panelClass = 'rounded-2xl border border-border bg-background-secondary p-5';

export const OrderDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [note, setNote] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.getOrder(id);
      setOrder(data);
      setStatus(data.nextStatuses?.[0] || data.status || '');
      setEmailSubject(`Update on order ${data.orderNumber}`);
      setEmailBody(`Hi ${data.shippingAddress?.fullName || 'there'},\n\nRegarding your order ${data.orderNumber}…\n`);
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Failed to load order' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    adminService
      .listInvoiceTemplates()
      .then((list) => {
        const items = Array.isArray(list) ? list.filter((item) => item.isActive !== false) : [];
        setTemplates(items);
        const preferred = items.find((item) => item.isDefault) || items[0];
        if (preferred) setTemplateId(preferred._id);
      })
      .catch(() => setTemplates([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchInvoice = () => adminService.getInvoice(id, templateId ? { templateId } : {});

  const printInvoice = async () => {
    setBusy(true);
    try {
      const invoice = await fetchInvoice();
      printInvoiceHtml(invoice);
      dispatch(pushToast({ type: 'success', message: 'Invoice opened for print' }));
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Invoice failed' }));
    } finally {
      setBusy(false);
    }
  };

  const downloadInvoice = async () => {
    setBusy(true);
    try {
      const invoice = await fetchInvoice();
      downloadInvoiceHtml(invoice);
      dispatch(pushToast({ type: 'success', message: 'Invoice downloaded' }));
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Invoice download failed' }));
    } finally {
      setBusy(false);
    }
  };

  const updateStatus = async () => {
    if (!status) return;
    setBusy(true);
    try {
      const data = await adminService.updateOrderStatus(id, {
        status,
        note: statusNote,
        notifyCustomer: true,
      });
      setOrder(data);
      setStatus(data.nextStatuses?.[0] || data.status);
      setStatusNote('');
      dispatch(pushToast({ type: 'success', message: 'Order status updated and customer notified' }));
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Status update failed' }));
    } finally {
      setBusy(false);
    }
  };

  const addNote = async () => {
    if (!note.trim()) return;
    setBusy(true);
    try {
      const data = await adminService.addOrderNote(id, note.trim());
      setOrder(data);
      setNote('');
      dispatch(pushToast({ type: 'success', message: 'Note added' }));
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Could not add note' }));
    } finally {
      setBusy(false);
    }
  };

  const emailCustomer = async () => {
    setBusy(true);
    try {
      await adminService.emailOrderCustomer(id, { subject: emailSubject, body: emailBody });
      dispatch(pushToast({ type: 'success', message: 'Email queued/logged for customer' }));
      await load();
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Email failed' }));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className='text-sm text-text-muted'>Loading order…</p>;
  if (!order) return <p className='text-sm text-danger'>Order not found</p>;

  const customer = customerLabel(order);
  const address = order.shippingAddress || {};

  return (
    <div>
      <div className='mb-6 flex flex-wrap items-start justify-between gap-3'>
        <div>
          <Link to={ROUTES.ORDERS} className='text-sm font-semibold text-warning'>
            ← Back to orders
          </Link>
          <h1 className='mt-2 text-2xl font-extrabold text-text-primary'>{order.orderNumber}</h1>
          <p className='text-sm text-text-muted'>Placed {formatDate(order.createdAt)}</p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusBadgeClass(order.status)}`}>
            {order.status}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(order.paymentStatus || 'pending')}`}>
            payment: {order.paymentStatus || 'pending'}
          </span>
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
          <button type='button' disabled={busy} onClick={printInvoice} className='rounded-xl border border-border px-4 py-2 text-sm font-semibold'>
            Print invoice
          </button>
          <button type='button' disabled={busy} onClick={downloadInvoice} className='rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white'>
            Download invoice
          </button>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 xl:grid-cols-3'>
        <div className={`${panelClass} xl:col-span-2 space-y-4`}>
          <section>
            <h2 className='mb-3 text-sm font-bold uppercase tracking-wide text-text-muted'>Order items</h2>
            <div className='space-y-3'>
              {(order.items || []).map((item, index) => (
                <div key={`${item.productId}-${index}`} className='flex gap-3 border-b border-border pb-3 last:border-0'>
                  {item.image ? (
                    <img src={item.image} alt='' className='h-14 w-14 rounded-lg object-cover' />
                  ) : (
                    <div className='flex h-14 w-14 items-center justify-center rounded-lg bg-background text-xs text-text-muted'>No img</div>
                  )}
                  <div className='flex-1'>
                    <p className='font-semibold'>{item.title}</p>
                    <p className='text-xs text-text-muted'>
                      {item.sku ? `SKU ${item.sku}` : ''}
                      {item.variantName ? ` · ${item.variantName}` : ''}
                      {item.variantSku ? ` (${item.variantSku})` : ''}
                      {item.isCombo ? ' · Combo' : ''}
                    </p>
                    {item.isCombo && Array.isArray(item.comboItems) && item.comboItems.length > 0 && (
                      <ul className='mt-1 text-xs text-text-muted'>
                        {item.comboItems.map((combo, comboIndex) => (
                          <li key={comboIndex}>
                            {combo.title || combo.productId} × {combo.quantity || 1}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className='text-right text-sm'>
                    <p>×{item.quantity}</p>
                    <p className='font-semibold'>{money(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className='mt-4 space-y-1 text-sm'>
              <div className='flex justify-between'><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
              <div className='flex justify-between'><span>Shipping</span><span>{money(order.shippingFee)}</span></div>
              <div className='flex justify-between font-bold'><span>Total</span><span>{money(order.total)}</span></div>
            </div>
          </section>

          <section>
            <h2 className='mb-3 text-sm font-bold uppercase tracking-wide text-text-muted'>Timeline</h2>
            <ol className='space-y-3'>
              {(order.timeline || []).length === 0 && <li className='text-sm text-text-muted'>No timeline events yet</li>}
              {[...(order.timeline || [])].reverse().map((entry) => (
                <li key={entry._id || `${entry.status}-${entry.createdAt}`} className='border-l-2 border-warning pl-3'>
                  <p className='text-sm font-semibold capitalize'>{entry.status}</p>
                  <p className='text-xs text-text-muted'>{formatDate(entry.createdAt)} · {entry.actorName || 'System'}</p>
                  {entry.note && <p className='text-sm'>{entry.note}</p>}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className='space-y-4'>
          <section className={panelClass}>
            <h2 className='mb-3 text-sm font-bold uppercase tracking-wide text-text-muted'>Customer</h2>
            <p className='font-semibold'>{customer.name}</p>
            <p className='text-sm'>{customer.email}</p>
            <p className='text-sm'>{customer.phone}</p>
            <p className='mt-2 text-sm text-text-muted'>
              {address.address}
              {address.city ? `, ${address.city}` : ''}
              {address.postalCode ? ` ${address.postalCode}` : ''}
            </p>
            {order.customer?._id && (
              <Link to={ROUTES.USERS_DETAIL.replace(':id', order.customer._id)} className='mt-3 inline-block text-sm font-semibold text-warning'>
                View user profile
              </Link>
            )}
          </section>

          <section className={panelClass}>
            <h2 className='mb-3 text-sm font-bold uppercase tracking-wide text-text-muted'>Payment</h2>
            <p className='text-sm'>Method: <strong className='uppercase'>{order.paymentMethod || 'cod'}</strong></p>
            <p className='text-sm'>Status: <strong>{order.paymentStatus || 'pending'}</strong></p>
            <p className='text-sm'>Transaction: <strong>{order.transactionId || '—'}</strong></p>
          </section>

          <section className={panelClass}>
            <h2 className='mb-3 text-sm font-bold uppercase tracking-wide text-text-muted'>Update status</h2>
            {(order.nextStatuses || []).length === 0 ? (
              <p className='text-sm text-text-muted'>No further transitions available.</p>
            ) : (
              <>
                <HeadlessSelect
                  aria-label='New status'
                  className='mb-2'
                  value={status}
                  options={(order.nextStatuses || []).map((value) => ({
                    value,
                    label: value.charAt(0).toUpperCase() + value.slice(1),
                  }))}
                  onChange={setStatus}
                />
                <input
                  value={statusNote}
                  onChange={(event) => setStatusNote(event.target.value)}
                  placeholder='Optional note'
                  className={`${controlClass} mb-2 w-full`}
                />
                <button
                  type='button'
                  disabled={busy}
                  onClick={updateStatus}
                  className='w-full rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'
                >
                  Save & email customer
                </button>
              </>
            )}
          </section>

          <section className={panelClass}>
            <h2 className='mb-3 text-sm font-bold uppercase tracking-wide text-text-muted'>Notes</h2>
            <div className='mb-3 space-y-2'>
              {(order.notes || []).length === 0 && <p className='text-sm text-text-muted'>No notes yet</p>}
              {(order.notes || []).map((entry) => (
                <div key={entry._id || entry.createdAt} className='rounded-xl bg-background p-3 text-sm'>
                  <p>{entry.body}</p>
                  <p className='mt-1 text-xs text-text-muted'>{entry.actorName} · {formatDate(entry.createdAt)}</p>
                </div>
              ))}
            </div>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} className={`${controlClass} mb-2 w-full`} placeholder='Add internal note' />
            <button type='button' disabled={busy || !note.trim()} onClick={addNote} className='rounded-xl border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50'>
              Add note
            </button>
          </section>

          <section className={panelClass}>
            <h2 className='mb-3 text-sm font-bold uppercase tracking-wide text-text-muted'>Email customer</h2>
            <input value={emailSubject} onChange={(event) => setEmailSubject(event.target.value)} className={`${controlClass} mb-2 w-full`} placeholder='Subject' />
            <textarea value={emailBody} onChange={(event) => setEmailBody(event.target.value)} rows={4} className={`${controlClass} mb-2 w-full`} />
            <button type='button' disabled={busy} onClick={emailCustomer} className='w-full rounded-xl border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50'>
              Send email
            </button>
            {(order.emailLog || []).length > 0 && (
              <div className='mt-3 space-y-1 text-xs text-text-muted'>
                {order.emailLog.slice(-3).map((entry) => (
                  <p key={entry._id || entry.createdAt}>
                    {formatDate(entry.createdAt)} · {entry.subject} ({entry.kind})
                  </p>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
