import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { adminService } from '../../services';
import { ROUTES } from '../../constants/routes';
import { pushToast } from '../../store/slices/toast-slice';
import HeadlessSelect from '../../components/headless-select';
import { statusBadgeClass } from '../../utils/orders';

const panelClass = 'rounded-2xl border border-border bg-background-secondary p-5';
const controlClass = 'rounded-xl border border-border bg-background px-3 py-2 text-sm';

const TYPE_FILTER_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'single', label: 'Single' },
  { value: 'variable', label: 'Variable' },
  { value: 'combo', label: 'Combo' },
];
const STOCK_FILTER_OPTIONS = [
  { value: 'all', label: 'All stock' },
  { value: 'in_stock', label: 'In stock' },
  { value: 'low_stock', label: 'Low stock' },
  { value: 'out_of_stock', label: 'Out of stock' },
];

export const StockPage = () => {
  const dispatch = useDispatch();
  const [data, setData] = useState({ items: [], total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [productType, setProductType] = useState('all');
  const [stockStatus, setStockStatus] = useState('all');
  const [drafts, setDrafts] = useState({});
  const [busyId, setBusyId] = useState('');

  const load = async (page = 1) => {
    try {
      const result = await adminService.getStock({ search, productType, stockStatus, page, limit: 40 });
      setData(result || { items: [], total: 0, page: 1, totalPages: 1 });
      const nextDrafts = {};
      (result?.items || []).forEach((product) => {
        nextDrafts[product._id] = {
          stock: product.stock,
          variants: (product.variants || []).map((variant) => ({
            sku: variant.sku,
            stock: variant.stock,
          })),
        };
      });
      setDrafts(nextDrafts);
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Failed to load stock' }));
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productType, stockStatus]);

  const saveProduct = async (product) => {
    const draft = drafts[product._id];
    if (!draft) return;
    setBusyId(product._id);
    try {
      const payload =
        product.productType === 'variable' && draft.variants?.length
          ? { variants: draft.variants }
          : { stock: Number(draft.stock) || 0 };
      await adminService.updateStock(product._id, payload);
      dispatch(pushToast({ type: 'success', message: `Stock updated · ${product.name}` }));
      await load(data.page || 1);
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Stock update failed' }));
    } finally {
      setBusyId('');
    }
  };

  return (
    <div>
      <div className='mb-6 flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-extrabold text-text-primary'>Stock management</h1>
          <p className='mt-1 text-sm text-text-muted'>Manage product and variant stock by type.</p>
        </div>
        <Link to={ROUTES.PRODUCTS} className='rounded-xl border border-border px-4 py-2 text-sm font-semibold'>
          Open products
        </Link>
      </div>

      <div className='mb-4 flex flex-wrap gap-2'>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && load(1)}
          placeholder='Search name / SKU / variant'
          className={`${controlClass} min-w-[220px]`}
        />
        <HeadlessSelect aria-label='Product type' value={productType} options={TYPE_FILTER_OPTIONS} onChange={setProductType} />
        <HeadlessSelect aria-label='Stock status' value={stockStatus} options={STOCK_FILTER_OPTIONS} onChange={setStockStatus} />
        <button type='button' onClick={() => load(1)} className='rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white'>
          Search
        </button>
      </div>

      <div className='space-y-3'>
        {(data.items || []).map((product) => {
          const draft = drafts[product._id] || { stock: product.stock, variants: [] };
          return (
            <section key={product._id} className={panelClass}>
              <div className='mb-3 flex flex-wrap items-start justify-between gap-3'>
                <div>
                  <p className='font-bold text-text-primary'>{product.name}</p>
                  <p className='text-xs text-text-muted'>
                    {product.sku ? `SKU ${product.sku} · ` : ''}
                    Type: {product.productType || 'single'}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ${statusBadgeClass(product.stockStatus === 'out_of_stock' ? 'cancelled' : product.stockStatus === 'low_stock' ? 'pending' : 'delivered')}`}>
                  {String(product.stockStatus || '').replace(/_/g, ' ')} · {product.stock}
                </span>
              </div>

              {product.productType === 'variable' && (product.variants || []).length ? (
                <div className='mb-3 space-y-2'>
                  {(draft.variants || []).map((variant, index) => (
                    <div key={variant.sku} className='grid grid-cols-[1fr_120px] items-center gap-2'>
                      <p className='text-sm'>
                        {product.variants[index]?.name || variant.sku}
                        <span className='ml-2 text-xs text-text-muted'>{variant.sku}</span>
                      </p>
                      <input
                        type='number'
                        min={0}
                        className={controlClass}
                        value={variant.stock}
                        onChange={(event) => {
                          const value = event.target.value;
                          setDrafts((current) => ({
                            ...current,
                            [product._id]: {
                              ...current[product._id],
                              variants: current[product._id].variants.map((entry, entryIndex) =>
                                entryIndex === index ? { ...entry, stock: value } : entry,
                              ),
                            },
                          }));
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <label className='mb-3 block max-w-xs text-xs font-semibold text-text-muted'>
                  Stock qty
                  <input
                    type='number'
                    min={0}
                    className={`${controlClass} mt-1 w-full`}
                    value={draft.stock}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [product._id]: { ...current[product._id], stock: event.target.value },
                      }))
                    }
                  />
                </label>
              )}

              <button
                type='button'
                disabled={busyId === product._id}
                onClick={() => saveProduct(product)}
                className='rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'
              >
                Save stock
              </button>
            </section>
          );
        })}
        {!(data.items || []).length ? <p className='text-sm text-text-muted'>No products found</p> : null}
      </div>

      <div className='mt-4 flex items-center justify-between text-sm'>
        <p className='text-text-muted'>
          Page {data.page} of {data.totalPages} · {data.total} items
        </p>
        <div className='flex gap-2'>
          <button type='button' disabled={data.page <= 1} className='rounded-lg border border-border px-3 py-1.5 disabled:opacity-40' onClick={() => load(data.page - 1)}>
            Previous
          </button>
          <button
            type='button'
            disabled={data.page >= data.totalPages}
            className='rounded-lg border border-border px-3 py-1.5 disabled:opacity-40'
            onClick={() => load(data.page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockPage;
