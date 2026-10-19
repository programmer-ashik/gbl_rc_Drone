import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { ROUTES } from '../../constants';
import Icon from '../../components/common/Icon/Icon';
import Button from '../../components/common/Button/Button';
import { downloadInvoiceHtml, printInvoiceHtml } from '../../utils/invoice';

const money = (value) => `৳${Number(value || 0).toLocaleString()}`;
const formatDate = (value) => (value ? new Date(value).toLocaleString() : '—');

const STEPS = ['pending', 'processing', 'shipped', 'delivered', 'completed'];

export const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState('');

  const load = () => {
    orderService
      .detail(id)
      .then(setOrder)
      .catch((err) => setError(err.message || 'Failed to load order'));
  };

  useEffect(() => {
    load();
    orderService
      .invoiceTemplates()
      .then((data) => {
        const items = Array.isArray(data) ? data : [];
        setTemplates(items);
        const preferred = items.find((item) => item.isDefault) || items[0];
        if (preferred) setTemplateId(preferred.id || preferred._id);
      })
      .catch(() => setTemplates([]));
  }, [id]);

  const cancel = async () => {
    setBusy(true);
    try {
      await orderService.cancel(id);
      load();
    } catch (err) {
      setError(err.message || 'Cancel failed');
    } finally {
      setBusy(false);
    }
  };

  const handleInvoice = async (mode = 'download') => {
    setBusy(true);
    setError('');
    try {
      const invoice = await orderService.invoice(id, templateId ? { templateId } : {});
      if (mode === 'print') printInvoiceHtml(invoice);
      else downloadInvoiceHtml(invoice);
    } catch (err) {
      setError(err.message || 'Invoice failed');
    } finally {
      setBusy(false);
    }
  };

  if (error && !order) return <p className="p-8 text-sm text-red-600">{error}</p>;
  if (!order) return <p className="p-8 text-sm text-text-muted">Loading order…</p>;

  const stepIndex = Math.max(0, STEPS.indexOf(order.status === 'confirmed' ? 'processing' : order.status));

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 md:py-8 lg:px-8">
      <nav className="page-breadcrumb" aria-label="Breadcrumb">
        <Link to={ROUTES.ORDERS}>Orders</Link>
        <Icon name="chevron-right" size={3} />
        <span className="font-medium text-text">{order.orderNumber}</span>
      </nav>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">{order.orderNumber}</h1>
          <p className="text-[13px] capitalize text-text-muted">Status: {order.status}</p>
          {order.estimatedDeliveryDate ? (
            <p className="mt-1 text-sm font-semibold text-warning">Estimated delivery: {formatDate(order.estimatedDeliveryDate)}</p>
          ) : null}
          {order.trackingNumber ? (
            <p className="mt-1 text-sm">
              Tracking: {order.trackingUrl ? <a href={order.trackingUrl} className="text-warning underline">{order.trackingNumber}</a> : order.trackingNumber}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {templates.length > 0 ? (
            <select
              value={templateId}
              onChange={(event) => setTemplateId(event.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
              aria-label="Invoice template"
            >
              {templates.map((template) => (
                <option key={template.id || template._id} value={template.id || template._id}>
                  {template.name}{template.isDefault ? ' (default)' : ''}
                </option>
              ))}
            </select>
          ) : null}
          <Button disabled={busy} onClick={() => handleInvoice('print')} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold">
            Print invoice
          </Button>
          <Button disabled={busy} onClick={() => handleInvoice('download')} className="rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white">
            Download invoice
          </Button>
          {['pending', 'processing', 'confirmed'].includes(order.status) ? (
            <Button disabled={busy} onClick={cancel} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold">
              Cancel order
            </Button>
          ) : null}
        </div>
      </div>

      {error ? <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p> : null}

      <section className="mb-8 rounded-2xl border border-border bg-background-secondary p-5">
        <h2 className="mb-4 text-sm font-bold uppercase text-text-muted">Progress</h2>
        <div className="flex flex-wrap gap-2">
          {STEPS.map((step, index) => (
            <span
              key={step}
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                index <= stepIndex && order.status !== 'cancelled' ? 'bg-warning text-white' : 'bg-background text-text-muted'
              }`}
            >
              {step}
            </span>
          ))}
          {order.status === 'cancelled' ? <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">cancelled</span> : null}
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-border p-5">
        <h2 className="mb-4 text-sm font-bold uppercase text-text-muted">Timeline</h2>
        <ol className="space-y-3">
          {(order.timeline || []).map((entry, index) => (
            <li key={entry._id || index} className="flex gap-3 border-b border-border pb-3 last:border-0">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-warning" />
              <div>
                <p className="text-sm font-semibold capitalize">{entry.status}</p>
                <p className="text-xs text-text-muted">{entry.note || entry.actorName}</p>
                <p className="text-xs text-text-muted">{formatDate(entry.createdAt)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-border p-5">
        <h2 className="mb-4 text-sm font-bold uppercase text-text-muted">Items · {money(order.total)}</h2>
        <div className="space-y-3">
          {(order.items || []).map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="h-14 w-14 overflow-hidden rounded-lg bg-background-secondary">
                {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="text-xs text-text-muted">
                  Qty {item.quantity}
                  {item.variantName ? ` · ${item.variantName}` : ''}
                </p>
              </div>
              <p className="text-sm font-bold">{money(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default OrderDetailPage;
