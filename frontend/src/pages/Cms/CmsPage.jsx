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
    <div className='site-container max-w-4xl py-8 md:py-12'>
      <SeoHead title={page.metaTitle || page.title} description={page.metaDescription} />
      <nav className='mb-6 flex items-center gap-2 text-xs text-text-muted sm:text-sm' aria-label='Breadcrumb'>
        <Link to={ROUTES.HOME} className='transition-colors hover:text-warning'>
          Home
        </Link>
        <Icon name='chevron-right' size={3} className='cursor-default' />
        <span className='font-medium text-text'>{page.title}</span>
      </nav>

      <div className='mb-8 border-b border-border pb-6'>
        <div className='mb-3 inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning'>
          Legal
        </div>
        <h1 className='text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl'>{page.title}</h1>
        {page.updatedAt ? (
          <p className='mt-2 text-sm text-text-muted'>
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
