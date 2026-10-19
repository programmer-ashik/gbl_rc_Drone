import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ROUTES } from '../../constants';
import Button from '../../components/common/Button/Button';
import Icon from '../../components/common/Icon/Icon';
import { addToCart } from '../../store/slices/cartSlice';
import { clearCompare, getCompareItems, removeFromCompare, subscribeCompare } from '../../utils/compare';

export const ComparePage = () => {
  const dispatch = useDispatch();
  const [items, setItems] = useState(getCompareItems());

  useEffect(() => subscribeCompare(setItems), []);

  const keys = useMemo(() => {
    const set = new Set();
    items.forEach((item) => Object.keys(item.specs || {}).forEach((key) => set.add(key)));
    return Array.from(set);
  }, [items]);

  if (!items.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="page-title justify-self-center">Compare products</h1>
        <p className="mt-2 text-[13px] text-text-muted">Select up to 4 products from listings using the compare button.</p>
        <Link to={ROUTES.PRODUCTS} className="mt-6 inline-block rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="site-container py-5 md:py-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Product comparison</h1>
          <p className="text-[13px] text-text-muted">{items.length} of 4 selected</p>
        </div>
        <button type="button" onClick={() => clearCompare()} className="rounded-xl border border-border px-3 py-2 text-sm font-semibold">
          Clear all
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-background-secondary">
              <th className="p-3 text-left font-semibold text-text-muted">Feature</th>
              {items.map((item) => (
                <th key={item._id} className="min-w-[180px] p-3 text-left">
                  <div className="relative">
                    <button type="button" className="absolute right-0 top-0 text-text-muted" onClick={() => removeFromCompare(item._id)} aria-label="Remove">
                      <Icon name="close" size={4} />
                    </button>
                    <div className="mb-2 h-28 overflow-hidden rounded-xl bg-background">
                      {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : null}
                    </div>
                    <Link to={item.path} className="font-bold text-text hover:text-warning">
                      {item.title}
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="p-3 font-semibold">Price</td>
              {items.map((item) => (
                <td key={item._id} className="p-3 font-bold text-warning">
                  ৳{Number(item.price || 0).toLocaleString()}
                </td>
              ))}
            </tr>
            <tr className="border-b border-border">
              <td className="p-3 font-semibold">Rating</td>
              {items.map((item) => (
                <td key={item._id} className="p-3">
                  {Number(item.rating || 0).toFixed(1)} ★
                </td>
              ))}
            </tr>
            <tr className="border-b border-border">
              <td className="p-3 font-semibold">Stock</td>
              {items.map((item) => (
                <td key={item._id} className="p-3">
                  {item.stock > 0 ? `${item.stock} available` : 'Out of stock'}
                </td>
              ))}
            </tr>
            <tr className="border-b border-border">
              <td className="p-3 font-semibold">Category</td>
              {items.map((item) => (
                <td key={item._id} className="p-3 capitalize">
                  {String(item.category || '—').replace(/-/g, ' ')}
                </td>
              ))}
            </tr>
            {keys.map((key) => (
              <tr key={key} className="border-b border-border">
                <td className="p-3 font-semibold">{key}</td>
                {items.map((item) => (
                  <td key={item._id} className="p-3 text-text-muted">
                    {item.specs?.[key] || '—'}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="p-3 font-semibold">Add to cart</td>
              {items.map((item) => (
                <td key={item._id} className="p-3">
                  <Button
                    disabled={!(item.stock > 0)}
                    className="rounded-xl bg-warning px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                    onClick={() => dispatch(addToCart({ productId: item._id, quantity: 1 }))}
                  >
                    Add to cart
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparePage;
