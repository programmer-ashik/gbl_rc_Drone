import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ROUTES } from '../../constants/routes';
import { fetchCategories, selectCategories } from '../../store/slices/category-slice';
import { bulkUpdateProducts, fetchProducts, quickEditProduct, removeProduct, selectProducts } from '../../store/slices/product-slice';
import { productService } from '../../services';
import { pushToast } from '../../store/slices/toast-slice';
import HeadlessSelect from '../../components/headless-select';
import { downloadTextFile, productTypeOf, resolveAssetUrl, stockLabel } from '../../utils/products';

const controlClass = 'rounded-xl border border-border bg-background px-3 py-2 text-sm';

const TYPE_FILTER_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'single', label: 'Single' },
  { value: 'variable', label: 'Variable' },
  { value: 'combo', label: 'Combo' },
];
const STOCK_FILTER_OPTIONS = [
  { value: '', label: 'All stock' },
  { value: 'in_stock', label: 'In stock' },
  { value: 'low_stock', label: 'Low stock' },
  { value: 'out_of_stock', label: 'Out of stock' },
];
const PRODUCT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];
const STATUS_FILTER_OPTIONS = [{ value: 'all', label: 'All status' }, ...PRODUCT_STATUS_OPTIONS];
const BULK_ACTION_OPTIONS = [
  { value: 'status', label: 'Change status' },
  { value: 'category', label: 'Update category' },
  { value: 'delete', label: 'Archive' },
];

export const ProductListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, total, page, totalPages, loading, saving } = useSelector(selectProducts);
  const { items: categories } = useSelector(selectCategories);
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState({ search: '', category: '', productType: '', stockStatus: '', status: 'all', page: 1 });
  const [selected, setSelected] = useState([]);
  const [bulkAction, setBulkAction] = useState('status');
  const [bulkStatus, setBulkStatus] = useState('active');
  const [bulkCategoryId, setBulkCategoryId] = useState('');
  const [drafts, setDrafts] = useState({});

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    const onRealtime = (event) => {
      if (['products', 'stock'].includes(event.detail?.type)) {
        dispatch(fetchProducts(query));
      }
    };
    window.addEventListener('admin:realtime', onRealtime);
    return () => window.removeEventListener('admin:realtime', onRealtime);
  }, [dispatch, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery((current) => (current.search === searchInput ? current : { ...current, search: searchInput, page: 1 }));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    dispatch(fetchProducts(query));
    setSelected([]);
  }, [dispatch, query]);

  const parents = categories.filter((item) => item.level === 1);
  const toggle = (id) => {
    setSelected((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  };

  const setDraft = (id, field, value) => {
    setDrafts((current) => ({ ...current, [id]: { stock: '', price: '', ...current[id], [field]: value } }));
  };

  const saveQuick = async (item) => {
    const draft = drafts[item._id];
    if (!draft) return;
    const payload = {};
    if (draft.stock !== '' && Number(draft.stock) !== Number(item.stock)) payload.stock = Number(draft.stock);
    if (draft.price !== '' && Number(draft.price) !== Number(item.basePrice ?? item.price)) payload.basePrice = Number(draft.price);
    if (!Object.keys(payload).length) return;
    await dispatch(quickEditProduct({ id: item._id, payload }));
    setDrafts((current) => ({ ...current, [item._id]: { stock: '', price: '' } }));
  };

  const runBulk = async () => {
    if (!selected.length) return;
    const payload = { ids: selected, action: bulkAction };
    if (bulkAction === 'status') payload.status = bulkStatus;
    if (bulkAction === 'category') payload.categoryId = bulkCategoryId;
    if (bulkAction === 'category' && !bulkCategoryId) {
      dispatch(pushToast({ type: 'error', message: 'Select a category' }));
      return;
    }
    const result = await dispatch(bulkUpdateProducts(payload));
    if (!result.error) {
      setSelected([]);
      dispatch(fetchProducts(query));
    }
  };

  const exportCsv = async () => {
    try {
      const data = await productService.export(query);
      downloadTextFile(data.filename || 'products.csv', data.csv);
      dispatch(pushToast({ type: 'success', message: `Exported ${data.total} products` }));
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Export failed' }));
    }
  };

  return (
    <div>
      <div className='mb-6 flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-extrabold text-text-primary'>Products</h1>
          <p className='text-sm text-text-muted'>{total} items in the catalog</p>
        </div>
        <div className='flex gap-2'>
          <Link to={ROUTES.PRODUCTS_IMPORT} className='rounded-xl border border-border px-4 py-2 text-sm font-semibold'>
            Import
          </Link>
          <button type='button' onClick={exportCsv} className='rounded-xl border border-border px-4 py-2 text-sm font-semibold'>
            Export CSV
          </button>
          <Link to={ROUTES.PRODUCTS_NEW} className='rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white'>
            Add product
          </Link>
        </div>
      </div>

      <div className='mb-4 grid grid-cols-1 gap-3 md:grid-cols-5'>
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder='Search name or SKU'
          className={controlClass}
        />
        <HeadlessSelect
          aria-label='Category'
          value={query.category}
          options={[{ value: '', label: 'All categories' }, ...parents.map((item) => ({ value: item.slug, label: item.name }))]}
          onChange={(category) => setQuery((current) => ({ ...current, category, page: 1 }))}
        />
        <HeadlessSelect
          aria-label='Product type'
          value={query.productType}
          options={TYPE_FILTER_OPTIONS}
          onChange={(productType) => setQuery((current) => ({ ...current, productType, page: 1 }))}
        />
        <HeadlessSelect
          aria-label='Stock status'
          value={query.stockStatus}
          options={STOCK_FILTER_OPTIONS}
          onChange={(stockStatus) => setQuery((current) => ({ ...current, stockStatus, page: 1 }))}
        />
        <HeadlessSelect
          aria-label='Product status'
          value={query.status}
          options={STATUS_FILTER_OPTIONS}
          onChange={(status) => setQuery((current) => ({ ...current, status, page: 1 }))}
        />
      </div>

      {selected.length > 0 && (
        <div className='mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-background-secondary p-3 text-sm'>
          <span className='font-semibold'>{selected.length} selected</span>
          <HeadlessSelect aria-label='Bulk action' value={bulkAction} options={BULK_ACTION_OPTIONS} onChange={setBulkAction} className='w-44' />
          {bulkAction === 'status' && (
            <HeadlessSelect aria-label='New status' value={bulkStatus} options={PRODUCT_STATUS_OPTIONS} onChange={setBulkStatus} className='w-36' />
          )}
          {bulkAction === 'category' && (
            <HeadlessSelect
              aria-label='New category'
              value={bulkCategoryId}
              placeholder='Select category'
              options={parents.map((item) => ({ value: item._id, label: item.name }))}
              onChange={setBulkCategoryId}
              className='w-52'
            />
          )}
          <button type='button' disabled={saving} onClick={runBulk} className='rounded-xl bg-warning px-3 py-2 text-xs font-semibold text-white'>
            Apply
          </button>
        </div>
      )}

      <div className='overflow-hidden rounded-2xl border border-border bg-background-secondary'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-left text-xs uppercase text-text-muted'>
              <th className='px-3 py-3'>
                <input
                  type='checkbox'
                  checked={items.length > 0 && selected.length === items.length}
                  onChange={(event) => setSelected(event.target.checked ? items.map((item) => item._id) : [])}
                />
              </th>
              <th className='px-3 py-3'>Image</th>
              <th className='px-3 py-3'>Name</th>
              <th className='px-3 py-3'>Category</th>
              <th className='px-3 py-3'>Price</th>
              <th className='px-3 py-3'>Stock</th>
              <th className='px-3 py-3'>Status</th>
              <th className='px-3 py-3'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && !items.length ? (
              <tr><td colSpan='8' className='px-4 py-8 text-center text-text-muted'>Loading products...</td></tr>
            ) : items.length ? (
              items.map((item) => {
                const draft = drafts[item._id] || { stock: '', price: '' };
                return (
                  <tr key={item._id} className='border-t border-border'>
                    <td className='px-3 py-3'>
                      <input type='checkbox' checked={selected.includes(item._id)} onChange={() => toggle(item._id)} />
                    </td>
                    <td className='px-3 py-3'>
                      {item.image ? (
                        <img src={resolveAssetUrl(item.image)} alt='' className='h-12 w-12 rounded-lg object-cover' />
                      ) : (
                        <div className='h-12 w-12 rounded-lg bg-background' />
                      )}
                    </td>
                    <td className='px-3 py-3'>
                      <div className='font-semibold text-text-primary'>{item.name || item.title}</div>
                      <div className='text-xs text-text-muted'>{item.sku || item.slug} · {productTypeOf(item)}</div>
                    </td>
                    <td className='px-3 py-3'>{item.category}{item.subcategory ? ` / ${item.subcategory}` : ''}</td>
                    <td className='px-3 py-3'>
                      <input
                        type='number'
                        min='0'
                        value={draft.price === '' ? item.basePrice ?? item.price : draft.price}
                        onChange={(event) => setDraft(item._id, 'price', event.target.value)}
                        onBlur={() => saveQuick(item)}
                        className='w-24 rounded-lg border border-border px-2 py-1 text-sm'
                      />
                    </td>
                    <td className='px-3 py-3'>
                      <input
                        type='number'
                        min='0'
                        value={draft.stock === '' ? item.stock : draft.stock}
                        onChange={(event) => setDraft(item._id, 'stock', event.target.value)}
                        onBlur={() => saveQuick(item)}
                        className='w-20 rounded-lg border border-border px-2 py-1 text-sm'
                      />
                      <div className='text-[11px] text-text-muted'>{stockLabel(item.stockStatus)}</div>
                    </td>
                    <td className='px-3 py-3'>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] ${item.status === 'active' ? 'bg-emerald-50 text-success' : item.status === 'draft' ? 'bg-amber-50 text-warning' : 'bg-slate-100 text-text-muted'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className='px-3 py-3'>
                      <div className='flex gap-2 text-xs font-semibold'>
                        <button type='button' className='text-warning' onClick={() => navigate(`/products/${item._id}/edit`)}>Edit</button>
                        <button
                          type='button'
                          className='text-danger'
                          onClick={async () => {
                            if (!window.confirm(`Archive ${item.name || item.title}?`)) return;
                            await dispatch(removeProduct(item._id));
                            dispatch(fetchProducts(query));
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan='8' className='px-4 py-8 text-center text-text-muted'>No products match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className='mt-4 flex items-center justify-between text-sm'>
        <p className='text-text-muted'>Page {page} of {totalPages}</p>
        <div className='flex gap-2'>
          <button type='button' disabled={page <= 1} className='rounded-lg border border-border px-3 py-1.5 disabled:opacity-40' onClick={() => setQuery((current) => ({ ...current, page: current.page - 1 }))}>
            Previous
          </button>
          <button type='button' disabled={page >= totalPages} className='rounded-lg border border-border px-3 py-1.5 disabled:opacity-40' onClick={() => setQuery((current) => ({ ...current, page: current.page + 1 }))}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductListPage;
