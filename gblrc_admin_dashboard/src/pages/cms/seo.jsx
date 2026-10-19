import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { cmsAdminService } from '../../services';
import { pushToast } from '../../store/slices/toast-slice';
import { API_CONFIG } from '../../constants/api';

const controlClass = 'rounded-xl border border-border bg-background px-3 py-2 text-sm w-full';

export const CmsSeoPage = () => {
  const dispatch = useDispatch();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    cmsAdminService
      .getSeo()
      .then(setForm)
      .catch((error) => dispatch(pushToast({ type: 'error', message: error.message || 'Load failed' })));
  }, [dispatch]);

  if (!form) return <p className='text-sm text-text-muted'>Loading SEO settings…</p>;

  const save = async () => {
    setBusy(true);
    try {
      const saved = await cmsAdminService.saveSeo(form);
      setForm(saved);
      dispatch(pushToast({ type: 'success', message: 'SEO settings saved' }));
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Save failed' }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-end justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-extrabold text-text-primary'>SEO & URL settings</h1>
          <p className='text-sm text-text-muted'>
            Sitemap: <a className='text-warning' href={`${API_CONFIG.BASE_URL}/sitemap.xml`} target='_blank' rel='noreferrer'>/sitemap.xml</a>
            {' · '}
            Robots: <a className='text-warning' href={`${API_CONFIG.BASE_URL}/robots.txt`} target='_blank' rel='noreferrer'>/robots.txt</a>
          </p>
        </div>
        <button type='button' disabled={busy} onClick={save} className='rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'>
          Save
        </button>
      </div>

      <div className='grid gap-3 rounded-2xl border border-border bg-background-secondary p-5 md:grid-cols-2'>
        {[
          ['siteName', 'Site name'],
          ['siteUrl', 'Site URL'],
          ['defaultMetaTitle', 'Default meta title'],
          ['defaultMetaDescription', 'Default meta description'],
          ['productTitlePattern', 'Product title pattern ({productName})'],
          ['productUrlPattern', 'Product URL pattern'],
          ['categoryUrlPattern', 'Category URL pattern'],
          ['ogImage', 'Default OG image URL'],
        ].map(([key, label]) => (
          <label key={key} className='text-sm'>
            <span className='mb-1 block text-text-muted'>{label}</span>
            <input className={controlClass} value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
          </label>
        ))}
        <label className='text-sm md:col-span-2'>
          <span className='mb-1 block text-text-muted'>robots.txt</span>
          <textarea className={controlClass} rows={8} value={form.robotsTxt || ''} onChange={(e) => setForm({ ...form, robotsTxt: e.target.value })} />
        </label>
      </div>
    </div>
  );
};

export default CmsSeoPage;
