import React from 'react';
import { resolveAssetUrl, stripHtml } from '../utils/products';

export const ProductPreview = ({ form, device = 'desktop' }) => {
  const image = form.photos?.find((photo) => photo.isPrimary)?.url || form.photos?.[0]?.url || form.image;
  const price = Number(form.finalPrice || 0);
  const base = Number(form.basePrice || 0);
  const specs = (form.specifications || []).filter(Boolean).slice(0, 6);

  return (
    <div className={`mx-auto overflow-hidden rounded-[28px] border border-border bg-slate-900 p-2 ${device === 'mobile' ? 'w-[340px]' : 'w-full max-w-3xl'}`}>
      <div className='overflow-hidden rounded-[22px] bg-white'>
        <div className='bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400'>
          {device === 'mobile' ? 'Mobile storefront' : 'Desktop storefront'}
        </div>
        <div className={device === 'mobile' ? 'p-4' : 'grid grid-cols-[280px_minmax(0,1fr)] gap-6 p-6'}>
          <div className='overflow-hidden rounded-2xl bg-slate-100'>
            {image ? (
              <img src={resolveAssetUrl(image)} alt='' className={`w-full object-cover ${device === 'mobile' ? 'h-48' : 'h-64'}`} />
            ) : (
              <div className={`flex items-center justify-center text-xs text-slate-400 ${device === 'mobile' ? 'h-48' : 'h-64'}`}>
                Product image
              </div>
            )}
          </div>
          <div>
            <p className='text-[11px] uppercase tracking-[0.16em] text-amber-500'>{form.category || 'Category'}</p>
            <h3 className='mt-1 text-xl font-extrabold text-slate-900'>{form.name || 'Product name'}</h3>
            <div className='mt-2 flex items-baseline gap-2'>
              <span className='text-lg font-extrabold text-amber-500'>৳{price.toLocaleString()}</span>
              {base > price && <span className='text-sm text-slate-400 line-through'>৳{base.toLocaleString()}</span>}
            </div>
            <p className='mt-3 line-clamp-4 text-sm leading-6 text-slate-500'>
              {stripHtml(form.description) || 'Product description will appear here.'}
            </p>
            {specs.length > 0 && (
              <ul className='mt-3 space-y-1 text-xs text-slate-600'>
                {specs.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            )}
            <div className='mt-4 flex gap-2'>
              {form.isNewArrival && <span className='rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-600'>New</span>}
              {form.isFeatured && <span className='rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-600'>Featured</span>}
              {form.isBestSeller && <span className='rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600'>Best seller</span>}
              {!form.isActive && <span className='rounded-full bg-red-50 px-2 py-0.5 text-[11px] text-red-500'>Hidden</span>}
            </div>
            <button type='button' className='mt-4 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white'>
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPreview;
