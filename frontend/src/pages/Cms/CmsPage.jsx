import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { cmsService } from '../../services/cmsService';
import { SeoHead } from '../../components/seo/SeoHead';
import Icon from '../../components/common/Icon/Icon';
import { ROUTES } from '../../constants';

export const CmsPage = ({ slug: slugProp }) => {
  const { slug: routeSlug } = useParams();
  const slug = slugProp || routeSlug;
  const { data: page, isLoading, error } = useQuery({
    queryKey: ['cms', 'page', slug],
    queryFn: () => cmsService.page(slug),
    enabled: Boolean(slug),
  });

  if (isLoading) {
    return <div className='site-container py-16 text-sm text-text-muted'>Loading page…</div>;
  }

  if (error || !page) {
    return (
      <div className='site-container py-16'>
        <h1 className='text-2xl font-bold text-text-primary'>Page not found</h1>
        <Link to={ROUTES.HOME} className='mt-4 inline-block text-warning'>
          Back home
        </Link>
      </div>
    );
  }

  return (
    <div className='site-container max-w-4xl py-5 md:py-8'>
      <SeoHead title={page.metaTitle || page.title} description={page.metaDescription} />
      <nav className='page-breadcrumb' aria-label='Breadcrumb'>
        <Link to={ROUTES.HOME} className='transition-colors hover:text-warning'>
          Home
        </Link>
        <Icon name='chevron-right' size={3} className='cursor-default' />
        <span className='font-medium text-text'>{page.title}</span>
      </nav>

      <div className='mb-5 border-b border-border pb-4'>
        <div className='mb-2 inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-[12px] font-semibold text-warning'>
          Legal
        </div>
        <h1 className='page-title'>{page.title}</h1>
        {page.updatedAt ? (
          <p className='mt-1 text-[13px] text-text-muted'>
            Last updated:{' '}
            <span className='font-semibold text-text'>
              {new Date(page.updatedAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </p>
        ) : null}
      </div>

      <article
        className='cms-content rounded-2xl border border-border bg-background-secondary p-5 sm:p-8'
        dangerouslySetInnerHTML={{ __html: page.content || '' }}
      />
    </div>
  );
};

export default CmsPage;
