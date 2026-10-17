import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { productService } from "../../services/productService";
import {
  productImages,
  productPath,
  productPrice,
  productTitle,
} from "../../utils/products";
import { LazyImage } from "../common/Skeleton/Skeleton";
import Icon from "../common/Icon/Icon";

export const YouMayLike = ({ excludeIds = [], limit = 6 }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const excludeKey = useMemo(
    () => excludeIds.map(String).sort().join(","),
    [excludeIds],
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    productService
      .featured()
      .then((data) => {
        if (!active) return;
        const exclude = new Set(excludeIds.map(String));
        const next = (Array.isArray(data) ? data : [])
          .filter((item) => !exclude.has(String(item._id || item.id)))
          .slice(0, limit);
        setItems(next);
      })
      .catch(() => {
        if (!active) return;
        setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [excludeKey, limit]);

  return (
    <aside className="rounded-2xl border border-border bg-background-secondary p-4">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-text-muted">
        You may like
      </h2>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-16 animate-pulse rounded-xl bg-background" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-text-muted">No suggestions right now.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((product) => {
            const id = product._id || product.id;
            const title = productTitle(product);
            const path = productPath(product);
            const image = productImages(product)[0];
            const price = productPrice(product);
            return (
              <li key={id}>
                <Link
                  to={path}
                  className="group flex min-w-0 items-center gap-3 rounded-xl border border-transparent p-1.5 transition-colors hover:border-border hover:bg-background"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-background">
                    {image ? (
                      <LazyImage
                        src={image}
                        alt={title}
                        wrapperClassName="h-full w-full"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-text-muted">
                        <Icon name="image" size={5} className="cursor-default" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold text-text group-hover:text-warning">
                      {title}
                    </p>
                    <p className="mt-0.5 truncate text-sm font-bold text-warning">
                      ৳{Number(price || 0).toLocaleString()}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
};

export default YouMayLike;
