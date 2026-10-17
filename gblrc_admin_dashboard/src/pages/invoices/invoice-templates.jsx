import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { adminService } from '../../services';
import { pushToast } from '../../store/slices/toast-slice';

const panelClass = 'rounded-2xl border border-border bg-background-secondary p-5';
const controlClass = 'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm';

const emptyForm = {
  name: '',
  companyName: 'GBLrcDrone',
  logo: '',
  address: '',
  phone: '',
  email: '',
  accentColor: '#f59e0b',
  currencySymbol: '৳',
  headerNote: 'Tax Invoice / Receipt',
  footerNote: 'Thank you for shopping with us.',
  terms: 'Goods once sold are subject to our return policy.',
  showSku: true,
  showPayment: true,
  isDefault: false,
  isActive: true,
};

export const InvoiceTemplatesPage = () => {
  const dispatch = useDispatch();
  const [templates, setTemplates] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const data = await adminService.listInvoiceTemplates();
      const list = Array.isArray(data) ? data : [];
      setTemplates(list);
      if (!selectedId && list[0]) {
        setSelectedId(list[0]._id);
        setForm({ ...emptyForm, ...list[0] });
      }
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Failed to load templates' }));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectTemplate = (template) => {
    setSelectedId(template._id);
    setForm({ ...emptyForm, ...template });
  };

  const save = async () => {
    setBusy(true);
    try {
      const payload = {
        name: form.name,
        companyName: form.companyName,
        logo: form.logo,
        address: form.address,
        phone: form.phone,
        email: form.email,
        accentColor: form.accentColor,
        currencySymbol: form.currencySymbol,
        headerNote: form.headerNote,
        footerNote: form.footerNote,
        terms: form.terms,
        showSku: Boolean(form.showSku),
        showPayment: Boolean(form.showPayment),
        isDefault: Boolean(form.isDefault),
        isActive: Boolean(form.isActive),
      };
      if (selectedId) {
        const updated = await adminService.updateInvoiceTemplate(selectedId, payload);
        dispatch(pushToast({ type: 'success', message: 'Template updated' }));
        setForm({ ...emptyForm, ...updated });
      } else {
        const created = await adminService.createInvoiceTemplate(payload);
        dispatch(pushToast({ type: 'success', message: 'Template created' }));
        setSelectedId(created._id);
        setForm({ ...emptyForm, ...created });
      }
      await load();
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Save failed' }));
    } finally {
      setBusy(false);
    }
  };

  const createNew = () => {
    setSelectedId('');
    setForm({ ...emptyForm, name: 'New template' });
  };

  const remove = async () => {
    if (!selectedId) return;
    if (!window.confirm('Delete this invoice template?')) return;
    setBusy(true);
    try {
      await adminService.deleteInvoiceTemplate(selectedId);
      dispatch(pushToast({ type: 'success', message: 'Template deleted' }));
      setSelectedId('');
      setForm(emptyForm);
      await load();
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Delete failed' }));
    } finally {
      setBusy(false);
    }
  };

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div>
      <div className='mb-6 flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-extrabold text-text-primary'>Invoice management</h1>
          <p className='mt-1 text-sm text-text-muted'>Choose and edit templates used for admin and customer invoices.</p>
        </div>
        <button type='button' onClick={createNew} className='rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white'>
          New template
        </button>
      </div>

      <div className='grid grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)]'>
        <aside className={`${panelClass} space-y-2`}>
          <p className='text-xs font-bold uppercase tracking-wide text-text-muted'>Templates</p>
          {templates.map((template) => (
            <button
              key={template._id}
              type='button'
              onClick={() => selectTemplate(template)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${
                selectedId === template._id ? 'bg-warning text-white' : 'hover:bg-background'
              }`}
            >
              <span className='font-semibold'>{template.name}</span>
              {template.isDefault ? <span className='text-[10px] uppercase'>Default</span> : null}
            </button>
          ))}
          {!templates.length ? <p className='text-sm text-text-muted'>No templates yet</p> : null}
        </aside>

        <section className={`${panelClass} space-y-4`}>
          <div className='grid gap-3 md:grid-cols-2'>
            {[
              ['name', 'Template name'],
              ['companyName', 'Company name'],
              ['email', 'Email'],
              ['phone', 'Phone'],
              ['currencySymbol', 'Currency'],
              ['accentColor', 'Accent color'],
              ['headerNote', 'Header note'],
              ['logo', 'Logo URL'],
            ].map(([key, label]) => (
              <label key={key} className='block text-xs font-semibold text-text-muted'>
                {label}
                <input className={`${controlClass} mt-1`} value={form[key] || ''} onChange={(event) => setField(key, event.target.value)} />
              </label>
            ))}
          </div>
          <label className='block text-xs font-semibold text-text-muted'>
            Address
            <textarea className={`${controlClass} mt-1`} rows={2} value={form.address || ''} onChange={(event) => setField('address', event.target.value)} />
          </label>
          <label className='block text-xs font-semibold text-text-muted'>
            Footer note
            <textarea className={`${controlClass} mt-1`} rows={2} value={form.footerNote || ''} onChange={(event) => setField('footerNote', event.target.value)} />
          </label>
          <label className='block text-xs font-semibold text-text-muted'>
            Terms
            <textarea className={`${controlClass} mt-1`} rows={2} value={form.terms || ''} onChange={(event) => setField('terms', event.target.value)} />
          </label>
          <div className='flex flex-wrap gap-4 text-sm'>
            <label className='inline-flex items-center gap-2'>
              <input type='checkbox' checked={Boolean(form.showSku)} onChange={(event) => setField('showSku', event.target.checked)} />
              Show SKU
            </label>
            <label className='inline-flex items-center gap-2'>
              <input type='checkbox' checked={Boolean(form.showPayment)} onChange={(event) => setField('showPayment', event.target.checked)} />
              Show payment
            </label>
            <label className='inline-flex items-center gap-2'>
              <input type='checkbox' checked={Boolean(form.isDefault)} onChange={(event) => setField('isDefault', event.target.checked)} />
              Default template
            </label>
            <label className='inline-flex items-center gap-2'>
              <input type='checkbox' checked={Boolean(form.isActive)} onChange={(event) => setField('isActive', event.target.checked)} />
              Active
            </label>
          </div>
          <div className='flex flex-wrap gap-2'>
            <button type='button' disabled={busy} onClick={save} className='rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'>
              Save template
            </button>
            {selectedId ? (
              <button type='button' disabled={busy} onClick={remove} className='rounded-xl border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50'>
                Delete
              </button>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
};

export default InvoiceTemplatesPage;
