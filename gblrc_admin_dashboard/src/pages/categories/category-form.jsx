import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { categoryService } from '../../services';
import { ROUTES } from '../../constants/routes';
import {
  descendantIds,
  ICON_OPTIONS,
  makeSlug,
  resolveAssetUrl,
} from '../../utils/categories';
import { fetchCategories, saveCategory, selectCategories } from '../../store/slices/category-slice';
import { pushToast } from '../../store/slices/toast-slice';
import HeadlessSelect from '../../components/headless-select';

const EMPTY_FORM = {
  name: '',
  slug: '',
  parentId: '',
  icon: '',
  image: '',
  metaTitle: '',
  metaDescription: '',
  displayOrder: 0,
  isActive: true,
  isNavVisible: true,
  isFooterVisible: false,
};

const Toggle = ({ label, checked, onChange }) => (
  <label className='flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm'>
    <span>{label}</span>
    <button
      type='button'
      role='switch'
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-warning' : 'bg-slate-200'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'left-5' : 'left-0.5'}`} />
    </button>
  </label>
);

const NavPreview = ({ form, parent }) => (
  <div className='rounded-2xl border border-border bg-background p-4'>
    <p className='text-xs font-semibold uppercase tracking-[0.16em] text-text-muted'>Navigation preview</p>
    <div className='mt-3 rounded-xl bg-background-secondary p-3'>
      <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${form.isNavVisible && form.isActive ? 'bg-amber-50 text-warning' : 'text-text-muted'}`}>
        <span className='flex h-8 w-8 items-center justify-center rounded-lg bg-background text-xs font-bold uppercase'>
          {(form.icon || form.name || 'C').slice(0, 2)}
        </span>
        <div>
          <p className='font-semibold'>{form.name || 'Category name'}</p>
          <p className='text-xs'>/{form.slug || 'slug'}</p>
        </div>
      </div>
      {parent && <p className='mt-2 px-3 text-xs text-text-muted'>Nested under {parent.name}</p>}
      {!form.isActive && <p className='mt-2 text-xs text-danger'>Hidden from the catalog because it is inactive.</p>}
      {form.isActive && !form.isNavVisible && (
        <p className='mt-2 text-xs text-text-muted'>Active, but not shown in the main menu.</p>
      )}
      {form.isFooterVisible && <p className='mt-2 text-xs text-success'>Also listed in the footer.</p>}
    </div>
    {form.image && (
      <img src={resolveAssetUrl(form.image)} alt='' className='mt-3 h-24 w-full rounded-xl object-cover' />
    )}
  </div>
);

export const CategoryFormPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, loading, saving } = useSelector(selectCategories);
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    parentId: searchParams.get('parentId') || '',
  });
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (!id || !items.length) return;
    const current = items.find((item) => item._id === id);
    if (!current) return;
    setForm({
      name: current.name || '',
      slug: current.slug || '',
      parentId: current.parentId || '',
      icon: current.icon || '',
      image: current.image || '',
      metaTitle: current.metaTitle || '',
      metaDescription: current.metaDescription || '',
      displayOrder: current.displayOrder || 0,
      isActive: current.isActive ?? true,
      isNavVisible: current.isNavVisible ?? true,
      isFooterVisible: current.isFooterVisible ?? false,
    });
    setSlugTouched(true);
  }, [id, items]);

  const blockedIds = useMemo(() => (id ? descendantIds(items, id) : new Set()), [id, items]);
  const parents = items.filter(
    (item) =>
      item.level < 3 &&
      item._id !== id &&
      !blockedIds.has(item._id) &&
      (item.isActive || item._id === form.parentId),
  );
  const parent = items.find((item) => item._id === form.parentId);
  const level = parent ? Math.min(3, (parent.level || 1) + 1) : 1;

  const setField = (name, value) => {
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === 'name' && !slugTouched) next.slug = makeSlug(value);
      return next;
    });
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Category name is required';
    const slug = makeSlug(form.slug || form.name);
    if (!slug) nextErrors.slug = 'A valid slug is required';
    const duplicate = items.find((item) => makeSlug(item.slug) === slug && item._id !== id);
    if (duplicate) nextErrors.slug = 'Category slug already exists';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await categoryService.uploadImage(file);
      setField('image', result.url);
      dispatch(pushToast({ type: 'success', message: 'Banner image uploaded' }));
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Image upload failed' }));
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    const payload = {
      ...form,
      slug: makeSlug(form.slug || form.name),
      parentId: form.parentId || null,
      displayOrder: Number(form.displayOrder) || 0,
    };
    const result = await dispatch(saveCategory({ id, payload }));
    if (!result.error) navigate(ROUTES.CATEGORIES);
  };

  if (loading && id && !items.length) {
    return <div className='text-sm text-text-muted'>Loading category...</div>;
  }

  return (
    <div className='max-w-5xl'>
      <div className='mb-6'>
        <Link to={ROUTES.CATEGORIES} className='text-sm text-warning'>
          ← Back to list
        </Link>
        <h1 className='mt-2 text-2xl font-extrabold text-text-primary'>{id ? 'Edit category' : 'Add category'}</h1>
      </div>

      <form onSubmit={submit} className='grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]'>
        <div className='space-y-4 rounded-2xl border border-border bg-background-secondary p-5'>
          <label className='block text-xs font-semibold'>Name</label>
          <input
            value={form.name}
            onChange={(event) => setField('name', event.target.value)}
            className='w-full rounded-xl border border-border px-3 py-2 text-sm'
            placeholder='Drones'
          />
          {errors.name && <p className='text-xs text-danger'>{errors.name}</p>}

          <label className='block text-xs font-semibold'>Slug</label>
          <input
            value={form.slug}
            onChange={(event) => {
              setSlugTouched(true);
              setField('slug', makeSlug(event.target.value));
            }}
            className='w-full rounded-xl border border-border px-3 py-2 text-sm'
          />
          {errors.slug && <p className='text-xs text-danger'>{errors.slug}</p>}

          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <div>
              <label htmlFor='category-parent' className='block text-xs font-semibold'>Parent category</label>
              <HeadlessSelect
                id='category-parent'
                className='mt-1'
                value={form.parentId}
                options={[
                  { value: '', label: 'Top level' },
                  ...parents.map((item) => ({ value: item._id, label: `${item.name} (L${item.level})` })),
                ]}
                onChange={(parentId) => setField('parentId', parentId)}
              />
            </div>
            <div>
              <label className='block text-xs font-semibold'>Level</label>
              <input value={level} readOnly className='mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text-muted' />
            </div>
          </div>

          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <div>
              <label className='block text-xs font-semibold'>Display order</label>
              <input
                type='number'
                min='0'
                value={form.displayOrder}
                onChange={(event) => setField('displayOrder', event.target.value)}
                className='mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm'
              />
            </div>
            <div>
              <label htmlFor='category-icon' className='block text-xs font-semibold'>Icon</label>
              <HeadlessSelect
                id='category-icon'
                className='mt-1'
                value={form.icon}
                options={[{ value: '', label: 'None' }, ...ICON_OPTIONS.map((icon) => ({ value: icon, label: icon }))]}
                onChange={(icon) => setField('icon', icon)}
              />
            </div>
          </div>

          <div>
            <label className='block text-xs font-semibold'>Banner image</label>
            <input
              value={form.image}
              onChange={(event) => setField('image', event.target.value)}
              placeholder='https://... or upload a file'
              className='mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm'
            />
            <input type='file' accept='image/png,image/jpeg,image/webp,image/gif' className='mt-2 text-xs' onChange={onUpload} />
            {uploading && <p className='mt-1 text-xs text-text-muted'>Uploading...</p>}
          </div>

          <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
            <Toggle label='Active' checked={form.isActive} onChange={(value) => setField('isActive', value)} />
            <Toggle label='Show in nav' checked={form.isNavVisible} onChange={(value) => setField('isNavVisible', value)} />
            <Toggle label='Show in footer' checked={form.isFooterVisible} onChange={(value) => setField('isFooterVisible', value)} />
          </div>

          <label className='block text-xs font-semibold'>SEO title</label>
          <input
            value={form.metaTitle}
            onChange={(event) => setField('metaTitle', event.target.value)}
            className='w-full rounded-xl border border-border px-3 py-2 text-sm'
          />
          <label className='block text-xs font-semibold'>SEO description</label>
          <textarea
            value={form.metaDescription}
            onChange={(event) => setField('metaDescription', event.target.value)}
            className='min-h-24 w-full rounded-xl border border-border px-3 py-2 text-sm'
          />

          <div className='flex gap-2'>
            <button type='submit' disabled={saving} className='rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white'>
              {saving ? 'Saving...' : id ? 'Update category' : 'Create category'}
            </button>
            <Link to={ROUTES.CATEGORIES} className='rounded-xl border border-border px-4 py-2 text-sm'>
              Cancel
            </Link>
          </div>
        </div>

        <NavPreview form={{ ...form, slug: makeSlug(form.slug || form.name) }} parent={parent} />
      </form>
    </div>
  );
};

export default CategoryFormPage;
