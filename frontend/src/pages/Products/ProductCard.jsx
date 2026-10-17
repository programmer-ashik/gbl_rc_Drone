import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import Icon from "../../components/common/Icon/Icon";
import Button from "../../components/common/Button/Button";
import { LazyImage } from "../../components/common/Skeleton/Skeleton";
import { WishlistCompareActions } from "../../components/products/WishlistCompareActions";
import { addToCart } from "../../store/slices/cartSlice";
import {
  productBasePrice,
  productImages,
  productPath,
  productPrice,
  productTitle,
  stockState,
} from "../../utils/products";

export const ProductCard = ({ product, onQuickView, compact = false }) => {
  const dispatch = useDispatch();
  const titleRef = useRef(null);
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);
  const [isTitleOverflowing, setIsTitleOverflowing] = useState(false);
  const titleText = product ? productTitle(product) : "";

  useEffect(() => {
    setIsTitleExpanded(false);
  }, [titleText]);

  useEffect(() => {
    const element = titleRef.current;
    if (!element || isTitleExpanded) return undefined;
    const measure = () => {
      setIsTitleOverflowing(element.scrollHeight > element.clientHeight + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [titleText, isTitleExpanded, compact]);

  if (!product) return null;

  const title = titleText;
  const path = product.path || productPath(product);
  const images = productImages(product);
  const primaryImage = images[0];
  const price = productPrice(product);
  const base = productBasePrice(product);
  const { stock, isOutOfStock, isLowStock } = stockState(product);
  const discountPercentage =
    base > price ? Math.round(((base - price) / base) * 100) : null;
  const rating = Number(product.rating || 0);

  return (
    <article
      data-product-card
      data-new-arrival={product.isNewArrival ? "true" : "false"}
      className='group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-warning/50 hover:shadow-xl'
    >
      <div
        className={`relative w-full overflow-hidden bg-background-secondary ${
          compact ? "h-36 sm:h-40" : "h-48 sm:h-52"
        }`}
      >
        <div className='absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5'>
          {product.isBestSeller && (
            <span className='inline-flex items-center gap-1 rounded-full bg-warning px-2.5 py-1 text-[11px] font-bold text-white shadow-md'>
              <Icon name='star' size={3} className='cursor-default' />
              Best Seller
            </span>
          )}
          {product.isNewArrival && (
            <span className='rounded-full bg-success px-2.5 py-1 text-[11px] font-bold text-white shadow-md'>
              New Arrival
            </span>
          )}
        </div>

        <div className='absolute right-3 top-3 z-10'>
          <WishlistCompareActions product={product} />
        </div>

        <div className='absolute right-3 top-[5.25rem] z-10 flex flex-col items-end gap-1.5'>
          {discountPercentage != null && (
            <span className='rounded-md bg-success px-2 py-1 text-[11px] font-bold text-white shadow-sm'>
              -{discountPercentage}%
            </span>
          )}
          {isOutOfStock && (
            <span className='rounded-md bg-red-500 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white'>
              Stock out
            </span>
          )}
        </div>

        <Link
          to={path}
          className='block h-full w-full cursor-pointer'
          aria-label={`View ${title}`}
        >
          {primaryImage ? (
            <LazyImage
              src={primaryImage}
              alt={title}
              wrapperClassName='h-full w-full'
              className={`transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? "grayscale" : ""}`}
            />
          ) : (
            <div className='flex h-full items-center justify-center text-text-muted'>
              <Icon name='image' size={10} className='cursor-default' />
            </div>
          )}
        </Link>

        {onQuickView && (
          <button
            type='button'
            onClick={() => onQuickView(product)}
            className='absolute bottom-3 left-1/2 z-10 -translate-x-1/2 cursor-pointer rounded-full bg-background/95 px-3 py-1.5 text-xs font-semibold text-text opacity-0 shadow outline-none transition-opacity group-hover:opacity-100 focus:outline-none'
          >
            <span className='inline-flex items-center gap-1'>
              <Icon name='eye' size={3.5} className='cursor-pointer' />
              Quick view
            </span>
          </button>
        )}
      </div>

      <div className={`flex min-w-0 flex-grow flex-col ${compact ? "p-2" : "p-1 sm:p-2"}`}>
        <div className='mb-1.5 flex min-w-0 items-center justify-between gap-2'>
          <span className='truncate text-[10px] font-semibold uppercase tracking-wide text-text-muted sm:text-[11px]'>
            {product.category?.replace(/-/g, " ")}
          </span>
          {isLowStock && !isOutOfStock && (
            <span className='shrink-0 truncate text-[10px] font-bold text-warning sm:text-[11px]'>
              Only {stock} left
            </span>
          )}
        </div>

        <div className='mb-1.5 flex min-w-0 items-center gap-1 overflow-hidden'>
          <div
            className='flex shrink-0 items-start text-warning'
            aria-label={`${rating} out of 5 stars`}
          >
            {[...Array(5)].map((_, index) => (
              <Icon
                key={index}
                name='star'
                size={compact ? 3 : 3.5}
                className={`cursor-default ${index < Math.floor(rating) ? "fill-warning" : "text-border"}`}
              />
            ))}
          </div>
          <span className='truncate text-[11px] font-semibold text-text sm:text-xs'>
            {rating.toFixed(1)}
            <span className='font-normal text-text-muted'> ({product.reviewsCount || 0})</span>
          </span>
        </div>

        <div className='mb-1.5 min-w-0'>
          <Link to={path} className='cursor-pointer'>
            <h3
              ref={titleRef}
              title={title}
              className={`break-words text-xs font-medium leading-snug text-text transition-colors group-hover:text-warning sm:text-sm [&_mark]:rounded-sm [&_mark]:bg-warning/30 [&_mark]:px-0.5 [&_mark]:text-inherit ${
                isTitleExpanded ? "" : "line-clamp-2"
              }`}
            >
              {product.highlights?.name || product.highlights?.title ? (
                <span
                  dangerouslySetInnerHTML={{
                    __html: product.highlights.name || product.highlights.title,
                  }}
                />
              ) : (
                title
              )}
            </h3>
          </Link>
          {(isTitleOverflowing || isTitleExpanded) && (
            <button
              type='button'
              onClick={() => setIsTitleExpanded((expanded) => !expanded)}
              aria-expanded={isTitleExpanded}
              className='mt-0.5 cursor-pointer text-[11px] font-semibold text-warning hover:underline focus:outline-none focus-visible:underline'
            >
              {isTitleExpanded ? "See less" : "See more"}
            </button>
          )}
        </div>

        <div className='mt-auto flex min-w-0 items-center justify-between gap-2 border-t border-border pt-2'>
          <div className='min-w-0 overflow-hidden'>
            <div className='flex min-w-0 flex-wrap items-baseline gap-x-1.5'>
              <span className='truncate text-sm font-extrabold text-warning sm:text-base'>
                ৳{price.toLocaleString()}
              </span>
              {discountPercentage != null && (
                <span className='truncate text-[10px] font-medium text-text-muted line-through sm:text-xs'>
                  ৳{base.toLocaleString()}
                </span>
              )}
            </div>
            <span
              className={`block truncate text-[10px] font-semibold sm:text-[11px] ${isOutOfStock ? "text-red-400" : "text-success"}`}
            >
              {isOutOfStock ? "Unavailable" : `${stock} in stock`}
            </span>
          </div>

          <Button
            variant='solid'
            size='sm'
            disabled={isOutOfStock}
            className='shrink-0 cursor-pointer rounded-xl border border-border bg-background-secondary p-2 text-text transition-all hover:border-warning hover:bg-warning hover:text-white disabled:cursor-not-allowed disabled:opacity-45'
            aria-label={
              isOutOfStock ? `${title} is out of stock` : `Add ${title} to cart`
            }
            onClick={() =>
              !isOutOfStock &&
              dispatch(
                addToCart({
                  productId: product._id || product.id,
                  quantity: 1,
                }),
              )
            }
          >
            <Icon name='shopping-cart' size={4} className='cursor-pointer' />
          </Button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
