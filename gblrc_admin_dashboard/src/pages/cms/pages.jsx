import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { cmsAdminService } from '../../services';
import { ROUTES } from '../../constants/routes';
import { pushToast } from '../../store/slices/toast-slice';
import { RichTextEditor } from '../../components/rich-text-editor';
import HeadlessSelect from '../../components/headless-select';

const controlClass = 'rounded-xl border border-border bg-background px-3 py-2 text-sm w-full';

const PAGE_STATUS_OPTIONS = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
];
const PAGE_TEMPLATE_OPTIONS = ['about', 'contact', 'faq', 'terms', 'privacy', 'custom'].map((value) => ({
  value,
  label: value === 'faq' ? 'FAQ' : value.charAt(0).toUpperCase() + value.slice(1),
}));

export const CmsPagesPage = () => {
  const dispatch = useDispatch();
  const [pages, setPages] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    status: 'published',
    template: 'custom',
  });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      setPages(await cmsAdminService.listPages());
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Failed to load pages' }));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (page) => {
    setEditing(page);
    setForm({
      title: page.title || '',
      slug: page.slug || '',
      content: page.content || '',
      metaTitle: page.metaTitle || '',
      metaDescription: page.metaDescription || '',
      status: page.status || 'published',
      template: page.template || 'custom',
    });
  };

  const startNew = () => {
    setEditing({ _id: null });
    setForm({
      title: '',
      slug: '',
      content: '',
      metaTitle: '',
      metaDescription: '',
      status: 'published',
      template: 'custom',
    });
  };

  const save = async () => {
    setBusy(true);
    try {
      if (editing?._id) await cmsAdminService.updatePage(editing._id, form);
      else await cmsAdminService.createPage(form);
      dispatch(pushToast({ type: 'success', message: 'Page saved' }));
      setEditing(null);
      await load();
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Save failed' }));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this page?')) return;
    try {
      await cmsAdminService.deletePage(id);
      dispatch(pushToast({ type: 'success', message: 'Page deleted' }));
      await load();
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Delete failed' }));
    }
  };

  return (
    <div>
      <div className='mb-6 flex items-end justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-extrabold text-text-primary'>CMS Pages</h1>
          <p className='text-sm text-text-muted'>
            Homepage content lives under Homepage. Dedicated editors:{' '}
            <Link to={ROUTES.CMS_TERMS} className='font-semibold text-warning'>
              Terms
            </Link>
            {' · '}
            <Link to={ROUTES.CMS_PRIVACY} className='font-semibold text-warning'>
              Privacy Policy
            </Link>
            .
          </p>
        </div>
        <button type='button' onClick={startNew} className='rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white'>
          New page
        </button>
      </div>

      {!editing ? (
        <div className='overflow-hidden rounded-2xl border border-border bg-background-secondary'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-left text-xs uppercase text-text-muted'>
                <th className='px-4 py-3'>Title</th>
                <th className='px-4 py-3'>Slug</th>
                <th className='px-4 py-3'>Status</th>
                <th className='px-4 py-3'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page._id} className='border-t border-border'>
                  <td className='px-4 py-3 font-semibold'>{page.title}</td>
                  <td className='px-4 py-3'>/{page.slug}</td>
                  <td className='px-4 py-3'>{page.status}</td>
                  <td className='px-4 py-3 space-x-3'>
                    <button type='button' className='font-semibold text-warning' onClick={() => startEdit(page)}>
                      Edit
                    </button>
                    <button type='button' className='font-semibold text-danger' onClick={() => remove(page._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className='space-y-4 rounded-2xl border border-border bg-background-secondary p-5'>
          <div className='grid gap-3 md:grid-cols-2'>
            <input className={controlClass} placeholder='Title' value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input className={controlClass} placeholder='Slug' value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            <input className={controlClass} placeholder='Meta title' value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} />
            <HeadlessSelect
              aria-label='Page status'
              value={form.status}
              options={PAGE_STATUS_OPTIONS}
              onChange={(status) => setForm({ ...form, status })}
            />
            <HeadlessSelect
              aria-label='Page template'
              value={form.template}
              options={PAGE_TEMPLATE_OPTIONS}
              onChange={(template) => setForm({ ...form, template })}
            />
          </div>
          <textarea
            className={controlClass}
            rows={3}
            placeholder='Meta description'
            value={form.metaDescription}
            onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
          />
          <RichTextEditor value={form.content} onChange={(content) => setForm({ ...form, content })} />
          <div className='flex gap-2'>
            <button type='button' disabled={busy} onClick={save} className='rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'>
              Save page
            </button>
            <button type='button' onClick={() => setEditing(null)} className='rounded-xl border border-border px-4 py-2 text-sm font-semibold'>
              Cancel
            </button>
            <Link to={ROUTES.CMS_HOMEPAGE} className='rounded-xl border border-border px-4 py-2 text-sm font-semibold'>
              Homepage sections
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CmsPagesPage;
