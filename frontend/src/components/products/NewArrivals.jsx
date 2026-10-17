import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Button from '../common/Button/Button';
import Icon from '../common/Icon/Icon';
import ProductCard from '../../pages/Products/ProductCard';
import { ROUTES } from '../../constants';
import { productService } from '../../services/productService';
import { queryKeys } from '../../lib/queryClient';

export const NewArrivals = () => {
  const { data = [], isLoading, isFetching } = useQuery({
    queryKey: queryKeys.products.newArrivals,
    queryFn: () => productService.newArrivals(),
    placeholderData: (previous) => previous,
  });

  const items = data.slice(0, 10);

  return (
    <section className='site-container py-10 md:py-14'>
      <div className='mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end'>
        <div>
          <div className='mb-2 inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success'>
            <Icon name='lightning' size={4} className='cursor-default' />
            <span>Fresh Drops{isFetching && !isLoading ? ' · refreshing' : ''}</span>
          </div>
          <h2 className='text-2xl font-extrabold tracking-tight text-text sm:text-3xl'>New Arrival Products</h2>
          <p className='mt-1 text-sm text-text-muted'>The 10 latest products added to the GBLrcDrone catalog.</p>
        </div>

        <Link to={ROUTES.NEW_ARRIVALS}>
          <Button
            variant='outline'
            size='sm'
            className='rounded-xl border-border bg-background font-medium text-text transition-all hover:border-warning/50 hover:bg-warning-bg hover:text-warning'
          >
            View All New
            <Icon name='arrow-right' size={4} className='ml-2 cursor-default' />
          </Button>
        </Link>
      </div>

      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'>
        {isLoading && [1, 2, 3, 4, 5].map((item) => <div key={item} className='h-96 animate-pulse rounded-2xl bg-background-secondary' />)}
        {!isLoading && items.map((item) => <ProductCard key={item._id || item.id} product={item} />)}
        {!isLoading && items.length === 0 && (
          <p className='col-span-full py-12 text-center text-sm text-text-muted'>No new arrivals at the moment.</p>
        )}
      </div>
    </section>
  );
};

export default NewArrivals;
