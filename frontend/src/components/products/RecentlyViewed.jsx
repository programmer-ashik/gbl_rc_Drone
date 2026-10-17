import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRecentlyViewed } from '../../utils/recentlyViewed';
import { productPath } from '../../utils/products';

export const RecentlyViewed = ({ excludeId, className = '' }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(getRecentlyViewed().filter((item) => String(item._id) !== String(excludeId || '')));
  }, [excludeId]);

  if (!items.length) return null;

  return (
    <section className={`rounded-2xl border border-border bg-background-secondary p-4 ${className}`}>
      <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-text-muted">Recently viewed</h2>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
        {items.slice(0, 8).map((item) => (
          <Link
            key={item._id}
            to={item.path || productPath(item)}
            className="w-28 shrink-0 rounded-xl border border-border bg-background p-2 transition hover:border-warning"
          >
            <div className="mb-2 h-20 overflow-hidden rounded-lg bg-background-secondary">
              {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : null}
            </div>
            <p className="line-clamp-2 text-[11px] font-semibold text-text">{item.title}</p>
            <p className="mt-1 text-xs font-bold text-warning">৳{Number(item.price || 0).toLocaleString()}</p>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewed;
