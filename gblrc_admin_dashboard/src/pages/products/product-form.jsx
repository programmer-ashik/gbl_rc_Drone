import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ROUTES } from '../../constants/routes';
import { fetchCategories, selectCategories } from '../../store/slices/category-slice';
import { fetchProduct, saveProduct, selectProducts } from '../../store/slices/product-slice';
import { pushToast } from '../../store/slices/toast-slice';
import { productService } from '../../services';
import { RichTextEditor } from '../../components/rich-text-editor';
import { ProductImages } from '../../components/product-images';
import { ProductPreview } from '../../components/product-preview';
import HeadlessSelect from '../../components/headless-select';
import {
  COMPATIBLE_TYPES,
  SPEC_TEMPLATES,
  calculateFinalPrice,
  makeSlug,
  pairsFromSpecs,
  specsFromPairs,
  stripHtml,
} from '../../utils/products';

const EMPTY = {
  name: '',
  slug: '',
  sku: '',
  productType: 'single',
  categoryId: '',
  subCategoryId: '',
  basePrice: 0,
  discount: 0,
  finalPrice: 0,
  stock: 0,
  stockAlertThreshold: 5,
  description: '',
  seoTitle: '',
  seoDescription: '',
  tags: '',
  isActive: true,
  isFeatured: false,
  isBestSeller: false,
  isNewArrival: false,
  photos: [],
  specPairs: [{ key: 'Origin', value: 'Imported' }, { key: 'Warranty', value: '7 days checking' }],
  variants: [{ sku: '', name: '', price: '', stock: 0, attributes: { color: '', size: '' } }],
  comboItems: [],
  compatibleWith: [{ productType: 'motor', productIds: [], search: '', results: [] }],
};

const Toggle = ({ label, checked, onChange }) => (
  <label className='flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm'>
    <span>{label}</span>
    <button type='button' role='switch' aria-checked={checked} onClick={() => onChange(!checked)} className={`relative h-6 w-11 rounded-full ${checked ? 'bg-warning' : 'bg-slate-200'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'left-5' : 'left-0.5'}`} />
    </button>
  </label>
);

const idOf = (value) => (value && typeof value === 'object' ? value._id : value);

export const ProductFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items: categories } = useSelector(selectCategories);
  const { current, saving } = useSelector(selectProducts);
  const [form, setForm] = useState(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [device, setDevice] = useState('desktop');
  const [picker, setPicker] = useState({ query: '', results: [] });

  useEffect(() => {
    dispatch(fetchCategories());
    if (id) dispatch(fetchProduct(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (!id || !current || current._id !== id) return;
    setSlugTouched(true);
    setForm({
      name: current.name || current.title || '',
      slug: current.slug || '',
      sku: current.sku || '',
      productType: current.productType || (current.isCombo ? 'combo' : current.variants?.length ? 'variable' : 'single'),
      categoryId: current.categoryId ? String(current.categoryId) : '',
      subCategoryId: current.subCategoryId ? String(current.subCategoryId) : '',
      basePrice: current.basePrice ?? current.price ?? 0,
      discount: current.discount || 0,
      finalPrice: current.finalPrice ?? current.discountPrice ?? current.price ?? 0,
      stock: current.stock || 0,
      stockAlertThreshold: current.stockAlertThreshold || current.lowStockThreshold || 5,
      description: current.description || '',
      seoTitle: current.seoTitle || '',
      seoDescription: current.seoDescription || '',
      tags: (current.tags || []).join(', '),
      isActive: current.isActive ?? current.status === 'active',
      isFeatured: Boolean(current.isFeatured),
      isBestSeller: Boolean(current.isBestSeller),
      isNewArrival: Boolean(current.isNewArrival),
      photos: (current.photos?.length ? current.photos : current.image ? [{ url: current.image, isPrimary: true }] : []).map((photo, index) => ({
        ...photo,
        id: photo._id || photo.url || `photo-${index}`,
      })),
      specPairs: pairsFromSpecs(current.specifications),
      variants: current.variants?.length
        ? current.variants.map((item) => ({ sku: item.sku, name: item.name || '', price: item.price ?? '', stock: item.stock || 0, attributes: item.attributes || {} }))
        : EMPTY.variants,
      comboItems: (current.comboItems || []).map((item) => ({
        productId: idOf(item.productId),
        quantity: item.quantity || 1,
        label: item.productId?.title || item.productId?.name || '',
      })),
      compatibleWith: current.compatibleWith?.length
        ? current.compatibleWith.map((entry) => ({
            productType: entry.productType,
            productIds: (entry.productIds || []).map(idOf),
            search: '',
            results: [],
            labels: (entry.productIds || []).map((item) => item?.title || item?.name || ''),
          }))
        : EMPTY.compatibleWith,
    });
  }, [id, current]);

  const parents = categories.filter((item) => !item.parentId || item.level === 1);
  const children = categories.filter((item) => String(item.parentId || '') === String(form.categoryId));
  const selectedCategory = categories.find((item) => item._id === form.categoryId);
  const setField = (name, value) => setForm((currentForm) => ({ ...currentForm, [name]: value }));

  const setPrice = (field, value) => {
    setForm((currentForm) => {
      const next = { ...currentForm, [field]: value };
      const base = Number(field === 'basePrice' ? value : next.basePrice) || 0;
      if (field === 'finalPrice' && base > 0) {
        const finalPrice = Math.min(base, Math.max(0, Number(value) || 0));
        next.finalPrice = finalPrice;
        next.discount = Math.round(((base - finalPrice) / base) * 10000) / 100;
      } else {
        next.discount = field === 'discount' ? value : next.discount;
        next.finalPrice = calculateFinalPrice(base, next.discount);
      }
      return next;
    });
  };

  const applyTemplate = () => {
    const slug = selectedCategory?.slug || 'default';
    const keys = SPEC_TEMPLATES[slug] || SPEC_TEMPLATES.default;
    setField('specPairs', keys.map((key) => ({ key, value: form.specPairs.find((item) => item.key === key)?.value || '' })));
  };

  const uploadPhotos = async (files) => {
    setUploading(true);
    try {
      const result = await productService.uploadImages(files);
      const uploaded = (result.items || [{ url: result.url }]).map((item, index) => ({
        url: item.url,
        alt: form.name,
        isPrimary: form.photos.length === 0 && index === 0,
        id: item.url,
      }));
      setForm((currentForm) => ({ ...currentForm, photos: [...currentForm.photos, ...uploaded] }));
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Upload failed' }));
    } finally {
      setUploading(false);
    }
  };

  const searchProducts = async (term, onResults) => {
    if (!term.trim()) return onResults([]);
    try {
      const data = await productService.manage({ search: term.trim(), status: 'active', limit: 8 });
      onResults(data.items || []);
    } catch {
      onResults([]);
    }
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Product name is required';
    if (!form.categoryId) next.categoryId = 'Category is required';
    if (!stripHtml(form.description) && !form.description.includes('<img') && !form.description.includes('<iframe')) next.description = 'Description is required';
    if (form.productType === 'combo' && form.comboItems.length < 2) next.comboItems = 'A combo needs at least two products';
    if (form.productType === 'variable' && !form.variants.some((item) => item.sku.trim())) next.variants = 'Add at least one variant SKU';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    const payload = {
      name: form.name.trim(),
      slug: makeSlug(form.slug || form.name),
      sku: form.sku.trim(),
      productType: form.productType,
      isCombo: form.productType === 'combo',
      categoryId: form.categoryId,
      subCategoryId: form.subCategoryId || null,
      basePrice: Number(form.basePrice) || 0,
      price: Number(form.basePrice) || 0,
      discount: Number(form.discount) || 0,
      finalPrice: Number(form.finalPrice) || 0,
      stock: Number(form.stock) || 0,
      stockAlertThreshold: Number(form.stockAlertThreshold) || 5,
      description: form.description || form.name,
      descriptionText: stripHtml(form.description) || form.name,
      seoTitle: form.seoTitle,
      seoDescription: form.seoDescription,
      tags: form.tags.split(',').map((item) => item.trim()).filter(Boolean),
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      isBestSeller: form.isBestSeller,
      isNewArrival: form.isNewArrival,
      status: form.isActive ? 'active' : 'draft',
      photos: form.photos.map((photo, index) => ({ url: photo.url, alt: photo.alt || form.name, isPrimary: Boolean(photo.isPrimary) || index === 0 })),
      specifications: specsFromPairs(form.specPairs),
      variants: form.productType === 'variable'
        ? form.variants.filter((item) => item.sku.trim()).map((item) => ({
            sku: item.sku.trim(),
            name: item.name,
            price: item.price === '' ? undefined : Number(item.price),
            stock: Number(item.stock) || 0,
            attributes: item.attributes,
          }))
        : [],
      comboItems: form.productType === 'combo'
        ? form.comboItems.map((item) => ({ productId: item.productId, quantity: Number(item.quantity) || 1 }))
        : [],
      compatibleWith: form.compatibleWith
        .filter((entry) => entry.productIds.length)
        .map((entry) => ({ productType: entry.productType, productIds: entry.productIds })),
    };
    const result = await dispatch(saveProduct({ id, payload }));
    if (!result.error) navigate(ROUTES.PRODUCTS);
  };

  const previewForm = useMemo(
    () => ({
      ...form,
      category: selectedCategory?.name || selectedCategory?.slug,
      specifications: specsFromPairs(form.specPairs),
    }),
    [form, selectedCategory],
  );

  return (
    <div className='max-w-6xl'>
      <Link to={ROUTES.PRODUCTS} className='text-sm text-warning'>← Back to products</Link>
      <h1 className='mt-2 text-2xl font-extrabold text-text-primary'>{id ? 'Edit product' : 'Add product'}</h1>

      <form onSubmit={submit} className='mt-6 space-y-6'>
        <section className='rounded-2xl border border-border bg-background-secondary p-5'>
          <h2 className='mb-4 text-sm font-bold uppercase tracking-[0.16em] text-text-muted'>Basic info</h2>
          <label className='block text-xs font-semibold'>Name</label>
          <input value={form.name} onChange={(event) => { if (!slugTouched) setField('slug', makeSlug(event.target.value)); setField('name', event.target.value); }} className='mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm' />
          {errors.name && <p className='text-xs text-danger'>{errors.name}</p>}
          <div className='mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3'>
            <div>
              <label htmlFor='product-category' className='block text-xs font-semibold'>Category</label>
              <HeadlessSelect
                id='product-category'
                className='mt-1'
                value={form.categoryId}
                placeholder='Select category'
                options={parents.map((item) => ({ value: item._id, label: item.name }))}
                onChange={(categoryId) => setForm((currentForm) => ({ ...currentForm, categoryId, subCategoryId: '' }))}
              />
              {errors.categoryId && <p className='text-xs text-danger'>{errors.categoryId}</p>}
            </div>
            <div>
              <label htmlFor='product-subcategory' className='block text-xs font-semibold'>Sub-category</label>
              <HeadlessSelect
                id='product-subcategory'
                className='mt-1'
                value={form.subCategoryId}
                options={[{ value: '', label: 'None' }, ...children.map((item) => ({ value: item._id, label: item.name }))]}
                onChange={(subCategoryId) => setField('subCategoryId', subCategoryId)}
              />
            </div>
            <div>
              <label className='block text-xs font-semibold'>SKU</label>
              <input value={form.sku} onChange={(event) => setField('sku', event.target.value)} className='mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm' />
            </div>
          </div>
        </section>

        <section className='rounded-2xl border border-border bg-background-secondary p-5'>
          <h2 className='mb-4 text-sm font-bold uppercase tracking-[0.16em] text-text-muted'>Product type</h2>
          <div className='flex gap-2'>
            {['single', 'variable', 'combo'].map((type) => (
              <button key={type} type='button' onClick={() => setField('productType', type)} className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize ${form.productType === type ? 'bg-warning text-white' : 'border border-border'}`}>
                {type}
              </button>
            ))}
          </div>
          {form.productType !== 'variable' && (
            <div className='mt-4 grid grid-cols-2 gap-3'>
              <div>
                <label className='block text-xs font-semibold'>Stock</label>
                <input type='number' min='0' value={form.stock} onChange={(event) => setField('stock', event.target.value)} className='mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm' />
              </div>
              <div>
                <label className='block text-xs font-semibold'>Low stock alert</label>
                <input type='number' min='1' value={form.stockAlertThreshold} onChange={(event) => setField('stockAlertThreshold', event.target.value)} className='mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm' />
              </div>
            </div>
          )}
          {form.productType === 'variable' && (
            <div className='mt-4 space-y-2'>
              {form.variants.map((variant, index) => (
                <div key={index} className='grid grid-cols-2 gap-2 rounded-xl border border-border p-3 sm:grid-cols-6'>
                  <input placeholder='SKU' value={variant.sku} onChange={(event) => setField('variants', form.variants.map((item, current) => current === index ? { ...item, sku: event.target.value } : item))} className='rounded-lg border border-border px-2 py-1.5 text-sm' />
                  <input placeholder='Name' value={variant.name} onChange={(event) => setField('variants', form.variants.map((item, current) => current === index ? { ...item, name: event.target.value } : item))} className='rounded-lg border border-border px-2 py-1.5 text-sm' />
                  <input type='number' placeholder='Price' value={variant.price} onChange={(event) => setField('variants', form.variants.map((item, current) => current === index ? { ...item, price: event.target.value } : item))} className='rounded-lg border border-border px-2 py-1.5 text-sm' />
                  <input type='number' placeholder='Stock' value={variant.stock} onChange={(event) => setField('variants', form.variants.map((item, current) => current === index ? { ...item, stock: event.target.value } : item))} className='rounded-lg border border-border px-2 py-1.5 text-sm' />
                  <input placeholder='Color' value={variant.attributes?.color || ''} onChange={(event) => setField('variants', form.variants.map((item, current) => current === index ? { ...item, attributes: { ...item.attributes, color: event.target.value } } : item))} className='rounded-lg border border-border px-2 py-1.5 text-sm' />
                  <button type='button' className='text-xs text-danger' onClick={() => setField('variants', form.variants.filter((_, current) => current !== index))}>Remove</button>
                </div>
              ))}
              {errors.variants && <p className='text-xs text-danger'>{errors.variants}</p>}
              <button type='button' className='text-sm font-semibold text-warning' onClick={() => setField('variants', [...form.variants, { sku: '', name: '', price: '', stock: 0, attributes: { color: '', size: '' } }])}>+ Add variant</button>
            </div>
          )}
          {form.productType === 'combo' && (
            <div className='mt-4 space-y-2'>
              <input
                placeholder='Search products to add'
                value={picker.query}
                onChange={(event) => {
                  setPicker((currentPicker) => ({ ...currentPicker, query: event.target.value }));
                  searchProducts(event.target.value, (results) => setPicker((currentPicker) => ({ ...currentPicker, results })));
                }}
                className='w-full rounded-xl border border-border px-3 py-2 text-sm'
              />
              {picker.results.map((item) => (
                <button
                  key={item._id}
                  type='button'
                  className='block w-full rounded-lg px-3 py-1.5 text-left text-sm hover:bg-background'
                  onClick={() => {
                    if (form.comboItems.some((entry) => entry.productId === item._id) || item._id === id) return;
                    setField('comboItems', [...form.comboItems, { productId: item._id, quantity: 1, label: item.name || item.title }]);
                    setPicker({ query: '', results: [] });
                  }}
                >
                  {item.name || item.title}
                </button>
              ))}
              {form.comboItems.map((item, index) => (
                <div key={item.productId} className='flex items-center gap-2 text-sm'>
                  <span className='flex-1'>{item.label || item.productId}</span>
                  <input type='number' min='1' value={item.quantity} onChange={(event) => setField('comboItems', form.comboItems.map((entry, current) => current === index ? { ...entry, quantity: event.target.value } : entry))} className='w-20 rounded-lg border border-border px-2 py-1' />
                  <button type='button' className='text-danger' onClick={() => setField('comboItems', form.comboItems.filter((_, current) => current !== index))}>Remove</button>
                </div>
              ))}
              {errors.comboItems && <p className='text-xs text-danger'>{errors.comboItems}</p>}
            </div>
          )}
        </section>

        <section className='rounded-2xl border border-border bg-background-secondary p-5'>
          <h2 className='mb-4 text-sm font-bold uppercase tracking-[0.16em] text-text-muted'>Pricing</h2>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
            <div>
              <label className='block text-xs font-semibold'>Base price</label>
              <input type='number' min='0' value={form.basePrice} onChange={(event) => setPrice('basePrice', event.target.value)} className='mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm' />
            </div>
            <div>
              <label className='block text-xs font-semibold'>Discount %</label>
              <input type='number' min='0' max='100' value={form.discount} onChange={(event) => setPrice('discount', event.target.value)} className='mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm' />
            </div>
            <div>
              <label className='block text-xs font-semibold'>Final price</label>
              <input type='number' min='0' value={form.finalPrice} onChange={(event) => setPrice('finalPrice', event.target.value)} className='mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm' />
            </div>
          </div>
        </section>

        <section className='rounded-2xl border border-border bg-background-secondary p-5'>
          <h2 className='mb-4 text-sm font-bold uppercase tracking-[0.16em] text-text-muted'>Images</h2>
          <ProductImages photos={form.photos} onChange={(photos) => setField('photos', photos)} onUpload={uploadPhotos} uploading={uploading} />
        </section>

        <section className='rounded-2xl border border-border bg-background-secondary p-5'>
          <h2 className='mb-4 text-sm font-bold uppercase tracking-[0.16em] text-text-muted'>Description</h2>
          <RichTextEditor value={form.description} onChange={(value) => setField('description', value)} />
          {errors.description && <p className='mt-1 text-xs text-danger'>{errors.description}</p>}
        </section>

        <section className='rounded-2xl border border-border bg-background-secondary p-5'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-sm font-bold uppercase tracking-[0.16em] text-text-muted'>Specifications</h2>
            <button type='button' className='text-xs font-semibold text-warning' onClick={applyTemplate}>Load category template</button>
          </div>
          {form.specPairs.map((pair, index) => (
            <div key={index} className='mb-2 grid grid-cols-[1fr_1fr_auto] gap-2'>
              <input placeholder='Key' value={pair.key} onChange={(event) => setField('specPairs', form.specPairs.map((item, current) => current === index ? { ...item, key: event.target.value } : item))} className='rounded-xl border border-border px-3 py-2 text-sm' />
              <input placeholder='Value' value={pair.value} onChange={(event) => setField('specPairs', form.specPairs.map((item, current) => current === index ? { ...item, value: event.target.value } : item))} className='rounded-xl border border-border px-3 py-2 text-sm' />
              <button type='button' className='text-xs text-danger' onClick={() => setField('specPairs', form.specPairs.filter((_, current) => current !== index))}>Remove</button>
            </div>
          ))}
          <button type='button' className='text-sm font-semibold text-warning' onClick={() => setField('specPairs', [...form.specPairs, { key: '', value: '' }])}>+ Add row</button>
        </section>

        <section className='rounded-2xl border border-border bg-background-secondary p-5'>
          <h2 className='mb-4 text-sm font-bold uppercase tracking-[0.16em] text-text-muted'>SEO & visibility</h2>
          <label className='block text-xs font-semibold'>Slug</label>
          <input value={form.slug} onChange={(event) => { setSlugTouched(true); setField('slug', makeSlug(event.target.value)); }} className='mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm' />
          <label className='mt-3 block text-xs font-semibold'>Meta title</label>
          <input value={form.seoTitle} onChange={(event) => setField('seoTitle', event.target.value)} className='mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm' />
          <label className='mt-3 block text-xs font-semibold'>Meta description</label>
          <textarea value={form.seoDescription} onChange={(event) => setField('seoDescription', event.target.value)} className='mt-1 min-h-20 w-full rounded-xl border border-border px-3 py-2 text-sm' />
          <label className='mt-3 block text-xs font-semibold'>Tags</label>
          <input value={form.tags} onChange={(event) => setField('tags', event.target.value)} placeholder='fpv, racing' className='mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm' />
          <div className='mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            <Toggle label='Active' checked={form.isActive} onChange={(value) => setField('isActive', value)} />
            <Toggle label='Featured' checked={form.isFeatured} onChange={(value) => setField('isFeatured', value)} />
            <Toggle label='Best seller' checked={form.isBestSeller} onChange={(value) => setField('isBestSeller', value)} />
            <Toggle label='New arrival' checked={form.isNewArrival} onChange={(value) => setField('isNewArrival', value)} />
          </div>
        </section>

        <section className='rounded-2xl border border-border bg-background-secondary p-5'>
          <h2 className='mb-4 text-sm font-bold uppercase tracking-[0.16em] text-text-muted'>Compatibility</h2>
          {form.compatibleWith.map((entry, index) => (
            <div key={index} className='mb-3 rounded-xl border border-border p-3'>
              <div className='mb-2 flex gap-2'>
                <HeadlessSelect
                  aria-label='Compatible product type'
                  className='w-48'
                  value={entry.productType}
                  options={COMPATIBLE_TYPES.map((type) => ({ value: type, label: type }))}
                  onChange={(productType) => setField('compatibleWith', form.compatibleWith.map((item, current) => current === index ? { ...item, productType } : item))}
                />
                <button type='button' className='text-xs text-danger' onClick={() => setField('compatibleWith', form.compatibleWith.filter((_, current) => current !== index))}>Remove</button>
              </div>
              <input
                placeholder={`Search ${entry.productType} products`}
                value={entry.search}
                onChange={(event) => {
                  const search = event.target.value;
                  setField('compatibleWith', form.compatibleWith.map((item, current) => current === index ? { ...item, search } : item));
                  searchProducts(search, (results) => setField('compatibleWith', form.compatibleWith.map((item, current) => current === index ? { ...item, search, results } : item)));
                }}
                className='w-full rounded-xl border border-border px-3 py-2 text-sm'
              />
              {(entry.results || []).map((item) => (
                <button
                  key={item._id}
                  type='button'
                  className='mt-1 block w-full rounded-lg px-2 py-1 text-left text-sm hover:bg-background'
                  onClick={() => setField('compatibleWith', form.compatibleWith.map((row, current) => current === index && !row.productIds.includes(item._id)
                    ? { ...row, productIds: [...row.productIds, item._id], labels: [...(row.labels || []), item.name || item.title], search: '', results: [] }
                    : row))}
                >
                  {item.name || item.title}
                </button>
              ))}
              <p className='mt-2 text-xs text-text-muted'>{(entry.labels || []).join(', ') || 'No products selected'}</p>
            </div>
          ))}
          <button type='button' className='text-sm font-semibold text-warning' onClick={() => setField('compatibleWith', [...form.compatibleWith, { productType: 'esc', productIds: [], search: '', results: [], labels: [] }])}>+ Add compatibility group</button>
        </section>

        <section className='rounded-2xl border border-border bg-background-secondary p-5'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-sm font-bold uppercase tracking-[0.16em] text-text-muted'>Storefront preview</h2>
            <div className='flex gap-2'>
              <button type='button' onClick={() => setDevice('desktop')} className={`rounded-lg px-3 py-1 text-xs font-semibold ${device === 'desktop' ? 'bg-warning text-white' : 'border border-border'}`}>Desktop</button>
              <button type='button' onClick={() => setDevice('mobile')} className={`rounded-lg px-3 py-1 text-xs font-semibold ${device === 'mobile' ? 'bg-warning text-white' : 'border border-border'}`}>Mobile</button>
            </div>
          </div>
          <ProductPreview form={previewForm} device={device} />
        </section>

        <div className='flex gap-2'>
          <button type='submit' disabled={saving} className='rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white'>
            {saving ? 'Saving...' : id ? 'Update product' : 'Create product'}
          </button>
          <Link to={ROUTES.PRODUCTS} className='rounded-xl border border-border px-4 py-2 text-sm'>Cancel</Link>
        </div>
      </form>
    </div>
  );
};

export default ProductFormPage;
