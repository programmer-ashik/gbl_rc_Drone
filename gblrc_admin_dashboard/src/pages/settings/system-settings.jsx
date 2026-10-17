import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { settingsService } from '../../services';
import { pushToast } from '../../store/slices/toast-slice';
import { ROUTES } from '../../constants/routes';

const controlClass = 'rounded-xl border border-border bg-background px-3 py-2 text-sm w-full';
const panelClass = 'rounded-2xl border border-border bg-background-secondary p-5';

export const SystemSettingsPage = () => {
  const dispatch = useDispatch();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('general');

  useEffect(() => {
    settingsService
      .get()
      .then(setForm)
      .catch((error) => dispatch(pushToast({ type: 'error', message: error.message || 'Load failed' })));
  }, [dispatch]);

  if (!form) return <p className='text-sm text-text-muted'>Loading settings…</p>;

  const patch = (section, key, value) => {
    setForm((current) => ({
      ...current,
      [section]: { ...(current[section] || {}), [key]: value },
    }));
  };

  const patchMethod = (key, value) => {
    setForm((current) => ({
      ...current,
      payment: {
        ...(current.payment || {}),
        methods: { ...(current.payment?.methods || {}), [key]: value },
      },
    }));
  };

  const save = async () => {
    setBusy(true);
    try {
      const saved = await settingsService.save({
        general: form.general,
        payment: form.payment,
        shipping: form.shipping,
        tax: form.tax,
        email: form.email,
        seo: form.seo,
      });
      setForm(saved);
      dispatch(pushToast({ type: 'success', message: 'Settings saved' }));
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Save failed' }));
    } finally {
      setBusy(false);
    }
  };

  const tabs = [
    ['general', 'General'],
    ['payment', 'Payment'],
    ['shipping', 'Shipping'],
    ['tax', 'Tax'],
    ['email', 'Email'],
    ['seo', 'SEO'],
  ];

  return (
    <div>
      <div className='mb-6 flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-extrabold text-text-primary'>System settings</h1>
          <p className='text-sm text-text-muted'>Store configuration for payments, shipping, tax, and email</p>
        </div>
        <div className='flex gap-2'>
          <Link to={ROUTES.SECURITY} className='rounded-xl border border-border px-4 py-2 text-sm font-semibold'>
            Security
          </Link>
          <Link to={ROUTES.MAINTENANCE} className='rounded-xl border border-border px-4 py-2 text-sm font-semibold'>
            Maintenance
          </Link>
          <button type='button' disabled={busy} onClick={save} className='rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'>
            Save settings
          </button>
        </div>
      </div>

      <div className='mb-4 flex flex-wrap gap-2'>
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type='button'
            onClick={() => setTab(key)}
            className={`rounded-xl px-3 py-1.5 text-sm font-semibold ${tab === key ? 'bg-warning text-white' : 'border border-border'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <section className={`${panelClass} grid gap-3 md:grid-cols-2`}>
          {[['siteName', 'Site name'], ['logo', 'Logo URL'], ['favicon', 'Favicon URL'], ['contactEmail', 'Contact email'], ['phone', 'Phone'], ['address', 'Address']].map(
            ([key, label]) => (
              <label key={key} className='text-sm'>
                <span className='mb-1 block text-text-muted'>{label}</span>
                <input className={controlClass} value={form.general?.[key] || ''} onChange={(e) => patch('general', key, e.target.value)} />
              </label>
            ),
          )}
        </section>
      )}

      {tab === 'payment' && (
        <section className={`${panelClass} space-y-4`}>
          <div className='grid gap-3 md:grid-cols-4'>
            {['cod', 'bkash', 'nagad', 'card'].map((method) => (
              <label key={method} className='flex items-center gap-2 rounded-xl bg-background p-3 text-sm font-semibold uppercase'>
                <input
                  type='checkbox'
                  checked={Boolean(form.payment?.methods?.[method])}
                  onChange={(e) => patchMethod(method, e.target.checked)}
                />
                {method}
              </label>
            ))}
          </div>
          <div className='grid gap-3 md:grid-cols-2'>
            <label className='text-sm'>
              <span className='mb-1 block text-text-muted'>bKash number</span>
              <input className={controlClass} value={form.payment?.bkashNumber || ''} onChange={(e) => patch('payment', 'bkashNumber', e.target.value)} />
            </label>
            <label className='text-sm'>
              <span className='mb-1 block text-text-muted'>Nagad number</span>
              <input className={controlClass} value={form.payment?.nagadNumber || ''} onChange={(e) => patch('payment', 'nagadNumber', e.target.value)} />
            </label>
          </div>
        </section>
      )}

      {tab === 'shipping' && (
        <section className={`${panelClass} space-y-4`}>
          <div className='grid gap-3 md:grid-cols-2'>
            <label className='text-sm'>
              <span className='mb-1 block text-text-muted'>Default shipping rate</span>
              <input
                type='number'
                className={controlClass}
                value={form.shipping?.defaultRate ?? 100}
                onChange={(e) => patch('shipping', 'defaultRate', Number(e.target.value))}
              />
            </label>
            <label className='text-sm'>
              <span className='mb-1 block text-text-muted'>Free shipping threshold</span>
              <input
                type='number'
                className={controlClass}
                value={form.shipping?.freeShippingThreshold ?? 0}
                onChange={(e) => patch('shipping', 'freeShippingThreshold', Number(e.target.value))}
              />
            </label>
          </div>
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-bold uppercase text-text-muted'>Zones</h3>
              <button
                type='button'
                className='rounded-xl border border-border px-3 py-1.5 text-sm font-semibold'
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    shipping: {
                      ...current.shipping,
                      zones: [...(current.shipping?.zones || []), { name: 'New zone', areas: '', rate: 100, estimatedDays: '2-5' }],
                    },
                  }))
                }
              >
                Add zone
              </button>
            </div>
            {(form.shipping?.zones || []).map((zone, index) => (
              <div key={zone._id || index} className='grid gap-2 rounded-xl bg-background p-3 md:grid-cols-4'>
                <input
                  className={controlClass}
                  value={zone.name}
                  onChange={(e) => {
                    const zones = [...(form.shipping?.zones || [])];
                    zones[index] = { ...zones[index], name: e.target.value };
                    patch('shipping', 'zones', zones);
                  }}
                  placeholder='Zone name'
                />
                <input
                  className={controlClass}
                  value={zone.areas || ''}
                  onChange={(e) => {
                    const zones = [...(form.shipping?.zones || [])];
                    zones[index] = { ...zones[index], areas: e.target.value };
                    patch('shipping', 'zones', zones);
                  }}
                  placeholder='Areas'
                />
                <input
                  type='number'
                  className={controlClass}
                  value={zone.rate}
                  onChange={(e) => {
                    const zones = [...(form.shipping?.zones || [])];
                    zones[index] = { ...zones[index], rate: Number(e.target.value) };
                    patch('shipping', 'zones', zones);
                  }}
                  placeholder='Rate'
                />
                <input
                  className={controlClass}
                  value={zone.estimatedDays || ''}
                  onChange={(e) => {
                    const zones = [...(form.shipping?.zones || [])];
                    zones[index] = { ...zones[index], estimatedDays: e.target.value };
                    patch('shipping', 'zones', zones);
                  }}
                  placeholder='Days'
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'tax' && (
        <section className={`${panelClass} grid gap-3 md:grid-cols-3`}>
          <label className='flex items-center gap-2 text-sm font-semibold'>
            <input type='checkbox' checked={Boolean(form.tax?.enabled)} onChange={(e) => patch('tax', 'enabled', e.target.checked)} />
            Enable tax
          </label>
          <label className='text-sm'>
            <span className='mb-1 block text-text-muted'>Tax rate %</span>
            <input type='number' className={controlClass} value={form.tax?.rate ?? 0} onChange={(e) => patch('tax', 'rate', Number(e.target.value))} />
          </label>
          <label className='text-sm'>
            <span className='mb-1 block text-text-muted'>Tax label</span>
            <input className={controlClass} value={form.tax?.label || ''} onChange={(e) => patch('tax', 'label', e.target.value)} />
          </label>
        </section>
      )}

      {tab === 'email' && (
        <section className={`${panelClass} grid gap-3 md:grid-cols-2`}>
          {[
            ['smtpHost', 'SMTP host'],
            ['smtpPort', 'SMTP port'],
            ['smtpUser', 'SMTP user'],
            ['smtpPass', 'SMTP password'],
            ['fromEmail', 'From email'],
            ['fromName', 'From name'],
          ].map(([key, label]) => (
            <label key={key} className='text-sm'>
              <span className='mb-1 block text-text-muted'>{label}</span>
              <input
                className={controlClass}
                type={key === 'smtpPass' ? 'password' : 'text'}
                value={form.email?.[key] ?? ''}
                onChange={(e) => patch('email', key, key === 'smtpPort' ? Number(e.target.value) : e.target.value)}
              />
            </label>
          ))}
          <label className='text-sm md:col-span-2'>
            <span className='mb-1 block text-text-muted'>Order email template</span>
            <textarea className={controlClass} rows={3} value={form.email?.orderTemplate || ''} onChange={(e) => patch('email', 'orderTemplate', e.target.value)} />
          </label>
          <label className='text-sm md:col-span-2'>
            <span className='mb-1 block text-text-muted'>Welcome email template</span>
            <textarea className={controlClass} rows={3} value={form.email?.welcomeTemplate || ''} onChange={(e) => patch('email', 'welcomeTemplate', e.target.value)} />
          </label>
        </section>
      )}

      {tab === 'seo' && (
        <section className={`${panelClass} grid gap-3 md:grid-cols-2`}>
          {[
            ['defaultMetaTitle', 'Default meta title'],
            ['defaultMetaDescription', 'Default meta description'],
            ['googleAnalyticsId', 'Google Analytics ID'],
            ['facebookPixelId', 'Facebook Pixel ID'],
          ].map(([key, label]) => (
            <label key={key} className='text-sm'>
              <span className='mb-1 block text-text-muted'>{label}</span>
              <input className={controlClass} value={form.seo?.[key] || ''} onChange={(e) => patch('seo', key, e.target.value)} />
            </label>
          ))}
        </section>
      )}
    </div>
  );
};

export default SystemSettingsPage;
