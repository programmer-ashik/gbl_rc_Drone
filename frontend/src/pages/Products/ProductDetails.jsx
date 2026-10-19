import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { ROUTES } from "../../constants";
import Icon from "../../components/common/Icon/Icon";
import Button from "../../components/common/Button/Button";
import ProductCard from "./ProductCard";
import QuickViewModal from "../../components/products/QuickViewModal";
import ProductReviews from "../../components/products/ProductReviews";
import StockAlertButton from "../../components/products/StockAlertButton";
import RecentlyViewed from "../../components/products/RecentlyViewed";
import { WishlistCompareActions } from "../../components/products/WishlistCompareActions";
import { productService } from "../../services/productService";
import { addToCart } from "../../store/slices/cartSlice";
import { trackProductView } from "../../utils/recentlyViewed";
import { queryKeys } from "../../lib/queryClient";
import { SeoHead } from "../../components/seo/SeoHead";
import { API_CONFIG } from "../../constants/api";
import {
  isHtmlContent,
  parseSpecifications,
  productBasePrice,
  productImages,
  productPath,
  productPrice,
  productTitle,
  resolveAssetUrl,
  stockState,
  stripHtml,
} from "../../utils/products";

const Gallery = ({
  images,
  title,
  selected,
  onSelect,
  lightbox,
  setLightbox,
}) => (
  <div>
    <button
      type='button'
      className='relative h-80 w-full overflow-hidden rounded-2xl bg-background-secondary shadow-sm sm:h-[480px]'
      onClick={() => images.length && setLightbox(selected)}
      aria-label='Open image lightbox'
    >
      {images.length ? (
        <img
          src={images[selected] || images[0]}
          alt={title}
          className='h-full w-full object-cover transition-transform hover:scale-[1.02]'
        />
      ) : (
        <div className='flex h-full items-center justify-center text-text-muted'>
          <Icon name='image' size={12} className='cursor-default' />
        </div>
      )}
      {images.length > 0 && (
        <span className='absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white'>
          Click to zoom
        </span>
      )}
    </button>
    {images.length > 1 && (
      <div className='mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5'>
        {images.map((image, index) => (
          <button
            key={`${image}-${index}`}
            type='button'
            onClick={() => onSelect(index)}
            className={`h-16 overflow-hidden rounded-xl border-2 bg-background-secondary sm:h-20 ${selected === index ? "border-warning shadow-md" : "border-transparent opacity-70 hover:opacity-100"}`}
          >
            <img
              src={image}
              alt={`${title} ${index + 1}`}
              className='h-full w-full object-cover'
            />
          </button>
        ))}
      </div>
    )}
    {lightbox != null && (
      <div
        className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4'
        onClick={() => setLightbox(null)}
        role='dialog'
        aria-modal='true'
      >
        <button
          type='button'
          className='absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white'
          onClick={() => setLightbox(null)}
          aria-label='Close lightbox'
        >
          <Icon name='close' size={6} />
        </button>
        <button
          type='button'
          className='absolute left-4 rounded-full bg-white/10 p-3 text-white disabled:opacity-30'
          disabled={lightbox <= 0}
          onClick={(event) => {
            event.stopPropagation();
            setLightbox((value) => Math.max(0, value - 1));
          }}
        >
          <Icon name='chevron-left' size={5} />
        </button>
        <img
          src={images[lightbox]}
          alt={title}
          className='max-h-[85vh] max-w-full rounded-xl object-contain'
          onClick={(event) => event.stopPropagation()}
        />
        <button
          type='button'
          className='absolute right-4 rounded-full bg-white/10 p-3 text-white disabled:opacity-30'
          disabled={lightbox >= images.length - 1}
          onClick={(event) => {
            event.stopPropagation();
            setLightbox((value) => Math.min(images.length - 1, value + 1));
          }}
        >
          <Icon name='chevron-right' size={5} />
        </button>
      </div>
    )}
  </div>
);

const RichDescription = ({ html, fallback }) => {
  if (isHtmlContent(html)) {
    return (
      <div
        className='prose-product mt-4 space-y-3 text-sm leading-7 text-text-secondary [&_a]:text-warning [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-xl [&_img]:rounded-xl [&_img]:max-w-full'
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  return (
    <p className='mt-4 text-sm leading-7 text-text-secondary sm:text-base'>
      {fallback || stripHtml(html)}
    </p>
  );
};

export const ProductDetails = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id, slug } = useParams();
  const productKey = slug || id;
  const productQuery = useQuery({
    queryKey: queryKeys.products.detail(productKey),
    queryFn: () => productService.detail(productKey),
    placeholderData: (previous) => previous,
    enabled: Boolean(productKey),
  });
  const product = productQuery.data || null;
  const [related, setRelated] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightbox, setLightbox] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quickView, setQuickView] = useState(null);

  const loading = productQuery.isLoading && !product;
  const error = productQuery.error?.message || "";
  const productId = String(product?._id || product?.id || "");

  useEffect(() => {
    setSelectedImage(0);
    setQuantity(1);
    setSelectedVariant(null);
  }, [productKey]);

  useEffect(() => {
    if (product) trackProductView(product);
  }, [product?._id]);

  useEffect(() => {
    if (!product) return;
    let active = true;
    if (product?.variants?.length)
      setSelectedVariant((current) => current || product.variants[0]);
    Promise.all([
      productService.related(product._id || product.slug).catch(() => []),
      productService.reviews(product._id || product.slug).catch(() => []),
      productService
        .filter({ sort: "popularity", limit: 6, inStock: "true" })
        .catch(() => ({ items: [] })),
    ]).then(([relatedItems, reviewsData, featured]) => {
      if (!active) return;
      setRelated(relatedItems || []);
      setReviews(
        Array.isArray(reviewsData) ? reviewsData : reviewsData?.items || [],
      );
      setRecommended(
        (featured.items || [])
          .filter((item) => item._id !== product._id)
          .slice(0, 5),
      );
    });
    return () => {
      active = false;
    };
  }, [product?._id]);

  const images = useMemo(() => productImages(product), [product]);
  const title = productTitle(product);
  const specs = useMemo(
    () => parseSpecifications(product?.specifications || []),
    [product],
  );
  const price = productPrice(product, selectedVariant);
  const base =
    selectedVariant?.price != null
      ? Number(selectedVariant.price)
      : productBasePrice(product);
  const { stock, isOutOfStock, isLowStock } = stockState(
    product,
    selectedVariant,
  );
  const discountPercentage =
    base > price ? Math.round(((base - price) / base) * 100) : null;
  const isVariable =
    product?.productType === "variable" || Boolean(product?.variants?.length);
  const compatibleGroups = product?.compatibleWith || [];
  const seoTitle =
    product?.seoTitle ||
    (title ? `${title} - Buy Online at gblrcdrone.com` : "Product");
  const seoDescription =
    product?.seoDescription ||
    stripHtml(product?.description || product?.subtitle || "").slice(0, 320);
  const productImage = images[0]
    ? images[0].startsWith("http")
      ? images[0]
      : `${API_CONFIG.BASE_URL}${images[0]}`
    : undefined;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    description: seoDescription,
    image: images,
    sku: product?.sku || product?.variants?.[0]?.sku,
    offers: {
      "@type": "Offer",
      priceCurrency: "BDT",
      price: price,
      availability: isOutOfStock
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      url: typeof window !== "undefined" ? window.location.href : undefined,
    },
  };

  const addCart = async (buyNow = false) => {
    await dispatch(addToCart({ productId: product._id, quantity }));
    if (buyNow) navigate(ROUTES.CHECKOUT);
  };

  if (loading)
    return (
      <div className='site-container py-20 text-center text-text-muted'>
        Loading product...
      </div>
    );
  if (!product || error) {
    return (
      <div className='site-container py-20 text-center'>
        <Icon
          name='error'
          size={10}
          className='mx-auto mb-4 cursor-default text-red-400'
        />
        <h1 className='text-xl font-bold text-text-primary'>
          Product not found
        </h1>
        <p className='mt-2 text-sm text-text-muted'>{error}</p>
        <Link
          to={ROUTES.PRODUCTS}
          className='mt-5 inline-flex rounded-xl bg-warning px-5 py-2.5 text-sm font-semibold text-white'
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className='site-container bg-background py-5 text-text md:py-8'>
      <SeoHead
        title={seoTitle}
        description={seoDescription}
        image={productImage}
        type='product'
        jsonLd={jsonLd}
      />
      <nav
        className='page-breadcrumb'
        aria-label='Breadcrumb'
      >
        <Link to={ROUTES.HOME} className='transition-colors hover:text-warning'>
          Home
        </Link>
        <Icon name='chevron-right' size={3} className='cursor-default' />
        <Link
          to={ROUTES.PRODUCTS}
          className='transition-colors hover:text-warning'
        >
          Products
        </Link>
        <Icon name='chevron-right' size={3} className='cursor-default' />
        {product.category && (
          <>
            <Link
              to={`/category/${product.category}`}
              className='capitalize transition-colors hover:text-warning'
            >
              {product.category.replace(/-/g, " ")}
            </Link>
            <Icon name='chevron-right' size={3} className='cursor-default' />
          </>
        )}
        <span className='max-w-48 truncate font-medium text-text sm:max-w-none'>
          {title}
        </span>
      </nav>

      <div className='grid gap-10 xl:grid-cols-[minmax(0,1fr)_280px]'>
        <div>
          <section className='mb-16 grid items-start gap-8 lg:grid-cols-2 lg:gap-12'>
            <Gallery
              images={images}
              title={title}
              selected={selectedImage}
              onSelect={setSelectedImage}
              lightbox={lightbox}
              setLightbox={setLightbox}
            />

            <div className='min-w-0'>
              <div className='mb-4 flex flex-wrap gap-2'>
                {product.isBestSeller && (
                  <span className='rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning'>
                    Best Seller
                  </span>
                )}
                {product.isNewArrival && (
                  <span className='rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success'>
                    New Arrival
                  </span>
                )}
                {product.onSale && (
                  <span className='rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning'>
                    On Sale
                  </span>
                )}
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${isOutOfStock ? "bg-red-500/10 text-red-400" : isLowStock ? "bg-warning/10 text-warning" : "bg-success/10 text-success"}`}
                >
                  {isOutOfStock
                    ? "Out of stock"
                    : isLowStock
                      ? `Low stock — ${stock} left`
                      : `${stock} in stock`}
                </span>
              </div>

              <p className='mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-warning'>
                {product.category?.replace(/-/g, " ")}
                {product.subcategory
                  ? ` / ${product.subcategory.replace(/-/g, " ")}`
                  : ""}
              </p>
              <h1 className='page-title'>
                {title}
              </h1>
              {product.subtitle && (
                <p className='mt-2 text-[13px] leading-6 text-text-muted'>
                  {product.subtitle}
                </p>
              )}

              <div className='my-6 flex items-center gap-2 border-b border-border pb-6'>
                <div
                  className='flex text-warning'
                  aria-label={`${product.rating} out of 5 stars`}
                >
                  {[...Array(5)].map((_, index) => (
                    <Icon
                      key={index}
                      name='star'
                      size={4}
                      className={`cursor-default ${index < Math.floor(product.rating || 0) ? "fill-warning" : "text-border"}`}
                    />
                  ))}
                </div>
                <strong className='text-sm text-text'>
                  {Number(product.rating || 0).toFixed(1)}
                </strong>
                <span className='text-xs text-text-muted'>
                  ({product.reviewsCount || reviews.length || 0} reviews)
                </span>
              </div>

              <div className='mb-6 flex flex-wrap items-center gap-3'>
                <span className='text-xl font-bold text-warning sm:text-2xl'>
                  ৳{price.toLocaleString()}
                </span>
                {discountPercentage != null && (
                  <>
                    <span className='text-sm text-text-muted line-through'>
                      ৳{base.toLocaleString()}
                    </span>
                    <span className='rounded-lg bg-success/10 px-2.5 py-1 text-xs font-bold text-success'>
                      Save {discountPercentage}%
                    </span>
                  </>
                )}
              </div>

              {isVariable && (
                <div className='mb-6'>
                  <p className='mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-text-muted'>
                    Variants
                  </p>
                  <div className='flex flex-wrap gap-2'>
                    {(product.variants || []).map((variant) => {
                      const active = selectedVariant?.sku === variant.sku;
                      const out = Number(variant.stock || 0) <= 0;
                      return (
                        <button
                          key={variant.sku}
                          type='button'
                          disabled={out}
                          onClick={() => setSelectedVariant(variant)}
                          className={`rounded-xl border px-3 py-2 text-left text-sm ${active ? "border-warning bg-warning/10 text-warning" : "border-border"} ${out ? "opacity-40" : ""}`}
                        >
                          <span className='block font-semibold'>
                            {variant.name || variant.sku}
                          </span>
                          <span className='text-xs text-text-muted'>
                            {variant.price != null
                              ? `৳${Number(variant.price).toLocaleString()} · `
                              : ""}
                            {out ? "Out of stock" : `${variant.stock} left`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className='mb-8 flex flex-col gap-3 sm:flex-row'>
                <div className='flex h-12 items-center justify-between rounded-xl bg-background-secondary p-1 sm:w-36'>
                  <button
                    type='button'
                    onClick={() =>
                      setQuantity((value) => Math.max(1, value - 1))
                    }
                    disabled={quantity <= 1}
                    className='flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-background disabled:opacity-35'
                  >
                    <Icon name='minus' size={4} className='cursor-default' />
                  </button>
                  <strong>{quantity}</strong>
                  <button
                    type='button'
                    onClick={() =>
                      setQuantity((value) => Math.min(stock || 1, value + 1))
                    }
                    disabled={isOutOfStock || quantity >= stock}
                    className='flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-background disabled:opacity-35'
                  >
                    <Icon name='plus' size={4} className='cursor-default' />
                  </button>
                </div>
                <Button
                  variant='solid'
                  size='xm'
                  disabled={isOutOfStock}
                  onClick={() => addCart(false)}
                  className='flex flex-1 items-center justify-center gap-2 rounded-xl bg-warning px-3 py-3 text-white shadow-lg shadow-warning/20 hover:bg-warning/90 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  <Icon
                    name='shopping-cart'
                    size={5}
                    className='cursor-default'
                  />
                  {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                </Button>
                <Button
                  variant='ghost'
                  size='xm'
                  disabled={isOutOfStock}
                  onClick={() => addCart(true)}
                  className='rounded-xl border border-border px-3 py-3 font-semibold disabled:opacity-50 cursor-pointer'
                >
                  Buy Now
                </Button>
              </div>

              <div className='mb-6'>
                <WishlistCompareActions product={product} variant='text' />
                {isOutOfStock ? (
                  <StockAlertButton productId={productId} className='mt-3' />
                ) : null}
              </div>

              <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
                <div className='rounded-xl bg-background-secondary p-4'>
                  <span className='block text-xs text-text-muted'>SKU</span>
                  <strong className='mt-1 block text-sm text-text'>
                    {selectedVariant?.sku || product.sku || "—"}
                  </strong>
                </div>
                <div className='rounded-xl bg-background-secondary p-4'>
                  <span className='block text-xs text-text-muted'>Type</span>
                  <strong className='mt-1 block text-sm capitalize text-text'>
                    {product.productType ||
                      (product.isCombo ? "combo" : "single")}
                  </strong>
                </div>
                <div className='rounded-xl bg-background-secondary p-4'>
                  <span className='block text-xs text-text-muted'>
                    Available
                  </span>
                  <strong className='mt-1 block text-sm text-text'>
                    {stock} units
                  </strong>
                </div>
              </div>
            </div>
          </section>

          <section className='border-t border-border pt-10'>
            <h2 className='text-2xl font-bold text-text-primary'>
              Description
            </h2>
            <RichDescription
              html={product.description}
              fallback={product.descriptionText || product.description}
            />

            <h2 className='mt-10 text-2xl font-bold text-text-primary'>
              Specifications
            </h2>
            {specs.length ? (
              <div className='mt-5 overflow-hidden rounded-2xl border border-border'>
                <table className='w-full text-sm'>
                  <tbody>
                    {specs.map((item) => (
                      <tr
                        key={`${item.key}-${item.value}`}
                        className='border-t border-border first:border-t-0'
                      >
                        <th className='w-40 bg-background-secondary px-4 py-3 text-left font-semibold text-text'>
                          {item.key}
                        </th>
                        <td className='px-4 py-3 text-text-muted'>
                          {item.value || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className='mt-3 text-sm text-text-muted'>
                No specifications listed.
              </p>
            )}

            {compatibleGroups.some(
              (group) => (group.productIds || []).length,
            ) && (
              <div className='mt-10'>
                <h2 className='text-2xl font-bold text-text-primary'>
                  Compatibility
                </h2>
                <div className='mt-5 space-y-6'>
                  {compatibleGroups.map((group) => (
                    <div key={group.productType}>
                      <p className='mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-text-muted'>
                        {group.productType}
                      </p>
                      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                        {(group.productIds || []).map((item) => {
                          const compatible =
                            typeof item === "object" ? item : null;
                          if (!compatible) return null;
                          return (
                            <Link
                              key={compatible._id}
                              to={productPath(compatible)}
                              className='flex gap-3 rounded-xl border border-border bg-background-secondary p-3 transition-colors hover:border-warning'
                            >
                              <div className='h-16 w-16 overflow-hidden rounded-lg bg-background'>
                                {compatible.image ? (
                                  <img
                                    src={resolveAssetUrl(compatible.image)}
                                    alt=''
                                    className='h-full w-full object-cover'
                                  />
                                ) : null}
                              </div>
                              <div>
                                <p className='text-sm font-semibold text-text'>
                                  {compatible.name || compatible.title}
                                </p>
                                <p className='text-xs text-text-muted capitalize'>
                                  {compatible.slug}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <ProductReviews productId={productId} initialReviews={reviews} />
            <RecentlyViewed excludeId={productId} className='mt-10' />

            {related.length > 0 && (
              <div className='mt-12'>
                <h2 className='mb-5 text-2xl font-bold text-text-primary'>
                  Related Products
                </h2>
                <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                  {related.slice(0, 6).map((item) => (
                    <ProductCard
                      key={item._id}
                      product={item}
                      onQuickView={setQuickView}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className='xl:sticky xl:top-24 xl:self-start'>
          <div className='rounded-2xl border border-border bg-background-secondary p-4'>
            <h2 className='text-sm font-bold uppercase tracking-[0.16em] text-text-muted'>
              May You Like
            </h2>
            <div className='mt-4 space-y-3'>
              {recommended.length ? (
                recommended.map((item) => (
                  <Link
                    key={item._id}
                    to={productPath(item)}
                    className='flex gap-3 rounded-xl bg-background p-2 transition-colors hover:border-warning'
                  >
                    <div className='h-16 w-16 overflow-hidden rounded-lg bg-background-secondary'>
                      {productImages(item)[0] ? (
                        <img
                          src={productImages(item)[0]}
                          alt=''
                          className='h-full w-full object-cover'
                        />
                      ) : null}
                    </div>
                    <div className='min-w-0'>
                      <p className='line-clamp-2 text-sm font-semibold text-text'>
                        {productTitle(item)}
                      </p>
                      <p className='mt-1 text-sm font-bold text-warning'>
                        ৳{productPrice(item).toLocaleString()}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className='text-sm text-text-muted'>
                  Recommendations will appear here.
                </p>
              )}
            </div>
            <Link
              to={ROUTES.COMBO_BUILDER}
              className='mt-4 block rounded-xl bg-warning px-3 py-2 text-center text-sm font-semibold text-white'
            >
              Build a custom combo
            </Link>
          </div>
        </aside>
      </div>

      <QuickViewModal
        product={quickView}
        open={Boolean(quickView)}
        onClose={() => setQuickView(null)}
      />
    </div>
  );
};

export default ProductDetails;
