import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import HeroSlider from '../../components/common/Hero/HeroSlider';
import ProductCard from '../Products/ProductCard';
import cn from '../../utils/cn';
import Sidebar from '../../components/layout/Sidebar/Sidebar';
import { cmsService } from '../../services/cmsService';
import { SeoHead } from '../../components/seo/SeoHead';
import { ROUTES, generateCategoryRoute } from '../../constants';
import { resolveAssetUrl } from '../../utils/products';

const SectionHeader = ({ title, subtitle, to, linkLabel }) => (
  <div className='mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end'>
    <div>
      <h2 className='page-title'>{title}</h2>
      {subtitle ? <p className='mt-1 text-[13px] text-text-muted'>{subtitle}</p> : null}
    </div>
    {to ? (
      <Link to={to} className='text-[13px] font-semibold text-warning'>
        {linkLabel || 'View all'}
      </Link>
    ) : null}
  </div>
);

const FULL_WIDTH_GRID = 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5';
const WITH_SIDEBAR_GRID = 'sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4';

const ProductGrid = ({ items, empty, columns = FULL_WIDTH_GRID }) => (
  <div className={cn('grid grid-cols-1 gap-6', columns)}>
    {(items || []).map((product) => (
      <ProductCard key={product._id || product.id} product={product} />
    ))}
    {!(items || []).length ? <p className='col-span-full py-8 text-center text-sm text-text-muted'>{empty}</p> : null}
  </div>
);

const Home = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['cms', 'homepage'],
    queryFn: () => cmsService.homepage(),
    placeholderData: (previous) => previous,
  });

  const sectionMap = Object.fromEntries((data?.sections || []).map((section) => [section.key, section]));
  const enabled = (key) => sectionMap[key]?.enabled !== false && Boolean(sectionMap[key] || data?.heroSlides);

  return (
    <div>
      <SeoHead
        title={data?.seo?.metaTitle}
        description={data?.seo?.metaDescription}
        image={data?.seo?.ogImage}
      />

      {enabled('hero') !== false && (
        <div>
          <HeroSlider slides={data?.heroSlides} loading={isLoading && !data} />
        </div>
      )}

      {sectionMap.featuredCategories?.enabled !== false && (data?.featuredCategories || []).length > 0 && (
        <section className='site-container py-10'>
          <SectionHeader
            title={sectionMap.featuredCategories?.title || 'Featured Categories'}
            subtitle={sectionMap.featuredCategories?.subtitle}
          />
          <div className='grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6'>
            {data.featuredCategories.map((category) => (
              <Link
                key={category._id || category.slug}
                to={generateCategoryRoute(category.slug)}
                className='group overflow-hidden rounded-2xl border border-border bg-background-secondary'
              >
                <div className='aspect-[4/3] overflow-hidden bg-background'>
                  {category.image ? (
                    <img
                      src={resolveAssetUrl(category.image)}
                      alt={category.name}
                      className='h-full w-full object-cover transition group-hover:scale-105'
                    />
                  ) : (
                    <div className='flex h-full items-center justify-center text-xs text-text-muted'>No image</div>
                  )}
                </div>
                <p className='px-3 py-3 text-center text-sm font-semibold'>{category.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className='site-container flex items-start gap-8'>
        <aside className='no-scrollbar sticky top-(--header-h) hidden h-[calc(100vh-var(--header-h))] w-64 shrink-0 overflow-y-auto overflow-x-hidden bg-background lg:block'>
          <Sidebar />
        </aside>
        <div className='min-w-0 flex-1'>
          {sectionMap.bestSellers?.enabled !== false && (
            <section className='py-10 md:py-16'>
              <SectionHeader
                title={sectionMap.bestSellers?.title || 'Best Selling Products'}
                subtitle={sectionMap.bestSellers?.subtitle}
                to={`${ROUTES.PRODUCTS}?isBestSeller=true`}
                linkLabel='View Best Sellers'
              />
              <ProductGrid items={data?.bestSellers} empty='No best sellers yet.' columns={WITH_SIDEBAR_GRID} />
            </section>
          )}
        </div>
      </div>

      {sectionMap.newArrivals?.enabled !== false && (
        <section className='site-container py-10 md:py-14'>
          <SectionHeader
            title={sectionMap.newArrivals?.title || 'New Arrivals'}
            subtitle={sectionMap.newArrivals?.subtitle}
            to={ROUTES.NEW_ARRIVALS}
            linkLabel='View All New'
          />
          <ProductGrid items={data?.newArrivals} empty='No new arrivals.' />
        </section>
      )}

      {sectionMap.specialOffers?.enabled !== false && (
        <section className='site-container py-10'>
          <SectionHeader
            title={sectionMap.specialOffers?.title || 'Special Offers'}
            subtitle={sectionMap.specialOffers?.subtitle}
            to={ROUTES.SALE}
            linkLabel='View sale'
          />
          <ProductGrid items={data?.specialOffers} empty='No special offers right now.' />
        </section>
      )}

      {sectionMap.testimonials?.enabled !== false && (data?.testimonials || []).length > 0 && (
        <section className='site-container py-12'>
          <SectionHeader
            title={sectionMap.testimonials?.title || 'What Pilots Say'}
            subtitle={sectionMap.testimonials?.subtitle}
          />
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {data.testimonials.map((item) => (
              <blockquote key={item._id} className='rounded-2xl border border-border bg-background-secondary p-5'>
                <p className='text-sm text-text'>"{item.quote}"</p>
                <footer className='mt-4 text-sm font-semibold'>
                  {item.name}
                  {item.role ? <span className='font-normal text-text-muted'> · {item.role}</span> : null}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
