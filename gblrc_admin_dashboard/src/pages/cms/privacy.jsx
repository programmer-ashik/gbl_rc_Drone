import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { cmsAdminService } from '../../services';
import { ROUTES } from '../../constants/routes';
import { pushToast } from '../../store/slices/toast-slice';
import { RichTextEditor } from '../../components/rich-text-editor';
import HeadlessSelect from '../../components/headless-select';

const controlClass = 'rounded-xl border border-border bg-background px-3 py-2 text-sm w-full';

const STATUS_OPTIONS = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
];

const DEFAULT_CONTENT = `
<h1 style="color:#0f172a;font-weight:800">Privacy Policy</h1>
<p style="font-weight:400">GBLrcDrone respects your privacy. This policy explains what data we collect and how we use it.</p>
<h2 style="color:#f59e0b;font-weight:700">1. Information We Collect</h2>
<p>We may collect identity, contact, order, and technical data needed to process purchases and improve the storefront.</p>
<h2 style="color:#f59e0b;font-weight:700">2. How We Use Data</h2>
<p>Data is used to fulfill orders, provide support, send transactional updates, and keep the platform secure.</p>
<h2 style="color:#f59e0b;font-weight:700">3. Sharing &amp; Security</h2>
<p>We do not sell personal data. Trusted payment and delivery partners only receive what is required to complete your order.</p>
`.trim();

export const CmsPrivacyPage = () => {
  const dispatch = useDispatch();
  const [pageId, setPageId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: 'Privacy Policy',
    slug: 'privacy',
    content: DEFAULT_CONTENT,
    metaTitle: 'Privacy Policy | GBLrcDrone',
    metaDescription: 'Learn how GBLrcDrone collects, uses, and protects your personal data.',
    status: 'published',
    template: 'privacy',
  });

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const pages = await cmsAdminService.listPages();
        if (!active) return;
        const existing = (pages || []).find((page) => page.slug === 'privacy');
        if (existing) {
          setPageId(existing._id);
          setForm({
            title: existing.title || 'Privacy Policy',
            slug: 'privacy',
            content: existing.content || DEFAULT_CONTENT,
            metaTitle: existing.metaTitle || 'Privacy Policy | GBLrcDrone',
            metaDescription: existing.metaDescription || '',
            status: existing.status || 'published',
            template: 'privacy',
          });
        }
      } catch (error) {
        if (!active) return;
        dispatch(pushToast({ type: 'error', message: error.message || 'Failed to load privacy policy' }));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [dispatch]);

  const save = async () => {
    setBusy(true);
    try {
      const payload = {
        ...form,
        slug: 'privacy',
        template: 'privacy',
      };
      if (pageId) {
        await cmsAdminService.updatePage(pageId, payload);
      } else {
        const created = await cmsAdminService.createPage(payload);
        setPageId(created?._id || null);
      }
      dispatch(pushToast({ type: 'success', message: 'Privacy Policy saved' }));
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Save failed' }));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <p className='text-sm text-text-muted'>Loading Privacy Policy…</p>;
  }

  return (
    <div>
      <div className='mb-6 flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-extrabold text-text-primary'>Privacy Policy</h1>
          <p className='text-sm text-text-muted'>
            Edit storefront content at <code className='rounded bg-background px-1'>/privacy</code>. Use H1/H2, font color, family, and weight for a dynamic layout.
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Link to={ROUTES.CMS_PAGES} className='rounded-xl border border-border px-4 py-2 text-sm font-semibold'>
            All CMS pages
          </Link>
          <Link to={ROUTES.CMS_TERMS} className='rounded-xl border border-border px-4 py-2 text-sm font-semibold'>
            Terms & Conditions
          </Link>
          <a
            href={`${import.meta.env.VITE_STOREFRONT_URL || 'http://localhost:5173'}/privacy`}
            target='_blank'
            rel='noreferrer'
            className='rounded-xl border border-border px-4 py-2 text-sm font-semibold'
          >
            Preview storefront
          </a>
          <button
            type='button'
            disabled={busy}
            onClick={save}
            className='rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'
          >
            {busy ? 'Saving…' : 'Save policy'}
          </button>
        </div>
      </div>

      <div className='grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]'>
        <section className='space-y-4 rounded-2xl border border-border bg-background-secondary p-5'>
          <div className='grid gap-3 md:grid-cols-2'>
            <div>
              <label className='mb-1 block text-xs font-semibold text-text-muted'>Title</label>
              <input
                className={controlClass}
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              />
            </div>
            <div>
              <label className='mb-1 block text-xs font-semibold text-text-muted'>Status</label>
              <HeadlessSelect
                aria-label='Status'
                value={form.status}
                options={STATUS_OPTIONS}
                onChange={(status) => setForm((current) => ({ ...current, status }))}
              />
            </div>
            <div>
              <label className='mb-1 block text-xs font-semibold text-text-muted'>Meta title</label>
              <input
                className={controlClass}
                value={form.metaTitle}
                onChange={(event) => setForm((current) => ({ ...current, metaTitle: event.target.value }))}
              />
            </div>
            <div>
              <label className='mb-1 block text-xs font-semibold text-text-muted'>Slug</label>
              <input className={controlClass} value='privacy' disabled />
            </div>
          </div>
          <div>
            <label className='mb-1 block text-xs font-semibold text-text-muted'>Meta description</label>
            <textarea
              className={controlClass}
              rows={2}
              value={form.metaDescription}
              onChange={(event) => setForm((current) => ({ ...current, metaDescription: event.target.value }))}
            />
          </div>
          <div>
            <label className='mb-2 block text-xs font-semibold text-text-muted'>
              Content · H1 / H2 / H3 · color · font · weight
            </label>
            <RichTextEditor
              value={form.content}
              onChange={(content) => setForm((current) => ({ ...current, content }))}
              minHeightClass='min-h-72'
            />
          </div>
        </section>

        <section className='rounded-2xl border border-border bg-background-secondary p-5'>
          <div className='mb-4 flex items-center justify-between gap-2'>
            <h2 className='text-sm font-bold uppercase tracking-wide text-text-muted'>Live preview</h2>
            <span className='rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-warning'>
              {form.status}
            </span>
          </div>
          <article className='rounded-xl border border-border bg-background p-5'>
            <h1 className='mb-4 text-2xl font-extrabold text-text-primary'>{form.title}</h1>
            <div
              className='cms-preview product-editor text-sm leading-7 text-text'
              dangerouslySetInnerHTML={{ __html: form.content || '<p class="text-text-muted">Start writing…</p>' }}
            />
          </article>
        </section>
      </div>
    </div>
  );
};

export default CmsPrivacyPage;
