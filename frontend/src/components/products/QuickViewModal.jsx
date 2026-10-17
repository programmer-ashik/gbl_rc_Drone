import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import Icon from "../common/Icon/Icon";
import Button from "../common/Button/Button";
import { addToCart } from "../../store/slices/cartSlice";
import StockAlertButton from "./StockAlertButton";
import { WishlistCompareActions } from "./WishlistCompareActions";
import {
  productBasePrice,
  productImages,
  productPath,
  productPrice,
  productTitle,
  resolveAssetUrl,
  stockState,
  stripHtml,
  parseSpecifications,
} from "../../utils/products";

/** Above sticky header (z-100) and mega menu (z-130). */
const QUICK_VIEW_Z = 200;

export const QuickViewModal = ({ product, open, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const images = useMemo(() => productImages(product), [product]);
  const title = productTitle(product);
  const price = productPrice(product);
  const base = productBasePrice(product);
  const { stock, isOutOfStock, isLowStock } = stockState(product);
  const id = String(product?._id || product?.id || "");
  const specs = useMemo(() => parseSpecifications(product?.specifications || product?.attributes || {}), [product]);

  useEffect(() => {
    if (!open) return undefined;
    setSelectedImage(0);
    setQuantity(1);
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, product?._id]);

  if (!open || !product) return null;

  const discount = base > price ? Math.round(((base - price) / base) * 100) : null;

  const modal = (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 p-4"
      style={{ zIndex: QUICK_VIEW_Z }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Quick view"
    >
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-text-muted">Quick view</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-text-muted hover:bg-background-secondary" aria-label="Close">
            <Icon name="close" size={5} />
          </button>
        </div>

        <div className="grid gap-6 p-5 md:grid-cols-2">
          <div>
            <div className="h-64 overflow-hidden rounded-xl bg-background-secondary sm:h-80">
              {images[selectedImage] ? (
                <img src={images[selectedImage]} alt={title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-text-muted">
                  <Icon name="image" size={10} className="cursor-default" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(index)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${selectedImage === index ? "border-warning" : "border-transparent"}`}
                  >
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-warning">
              {product.category?.replace(/-/g, " ")}
            </p>
            <h3 className="mt-1 text-2xl font-extrabold text-text-primary">{title}</h3>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex text-warning">
                {[...Array(5)].map((_, index) => (
                  <Icon key={index} name="star" size={4} className={`cursor-default ${index < Math.floor(product.rating || 0) ? "fill-warning" : "text-border"}`} />
                ))}
              </div>
              <span className="text-sm font-semibold">{Number(product.rating || 0).toFixed(1)}</span>
              <span className="text-xs text-text-muted">({product.reviewsCount || 0})</span>
            </div>

            <div className="mt-4 flex flex-wrap items-baseline gap-2">
              <span className="text-3xl font-extrabold text-warning">৳{price.toLocaleString()}</span>
              {discount != null && (
                <>
                  <span className="text-sm text-text-muted line-through">৳{base.toLocaleString()}</span>
                  <span className="rounded-md bg-success/10 px-2 py-0.5 text-xs font-bold text-success">-{discount}%</span>
                </>
              )}
            </div>

            <p className={`mt-2 text-sm font-semibold ${isOutOfStock ? "text-red-400" : isLowStock ? "text-warning" : "text-success"}`}>
              {isOutOfStock ? "Out of stock" : isLowStock ? `Low stock — ${stock} left` : `${stock} in stock`}
            </p>

            <p className="mt-4 line-clamp-4 text-sm leading-6 text-text-muted">
              {stripHtml(product.descriptionText || product.description || product.subtitle)}
            </p>

            {specs.length > 0 && (
              <ul className="mt-4 max-h-28 space-y-1 overflow-y-auto text-xs text-text-muted">
                {specs.slice(0, 6).map((row) => (
                  <li key={row.key}><span className="font-semibold text-text">{row.key}:</span> {row.value}</li>
                ))}
              </ul>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <div className="flex h-11 items-center justify-between rounded-xl bg-background-secondary px-1 sm:w-32">
                <button type="button" className="h-9 w-9 rounded-lg hover:bg-background" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1}>
                  <Icon name="minus" size={4} className="mx-auto cursor-default" />
                </button>
                <strong>{quantity}</strong>
                <button type="button" className="h-9 w-9 rounded-lg hover:bg-background" onClick={() => setQuantity((value) => Math.min(stock || 1, value + 1))} disabled={isOutOfStock || quantity >= stock}>
                  <Icon name="plus" size={4} className="mx-auto cursor-default" />
                </button>
              </div>
              <Button
                variant="solid"
                disabled={isOutOfStock}
                className="flex-1 rounded-xl bg-warning text-white"
                onClick={() => dispatch(addToCart({ productId: product._id || product.id, quantity }))}
              >
                Add to cart
              </Button>
            </div>

            <div className="mt-3">
              <WishlistCompareActions product={product} variant="text" onBeforeNavigate={onClose} />
            </div>

            {isOutOfStock ? <StockAlertButton productId={id} className="mt-3" /> : null}

            <button
              type="button"
              className="mt-4 text-sm font-semibold text-warning"
              onClick={() => {
                onClose?.();
                navigate(productPath(product));
              }}
            >
              View full details →
            </button>
            {product.image && !images.length && (
              <img src={resolveAssetUrl(product.image)} alt="" className="hidden" />
            )}
            <Link to={productPath(product)} className="sr-only">
              Full details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modal, document.body) : modal;
};

export default QuickViewModal;
