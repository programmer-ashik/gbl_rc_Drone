import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import ProductCard from '../Products/ProductCard';
import { ROUTES } from '../../constants';
import Button from '../../components/common/Button/Button';
import Icon from '../../components/common/Icon/Icon';
import { productService } from '../../services/productService';
import { queryKeys } from '../../lib/queryClient';

export const BestSelling = () => {
  const { data = [], isLoading, isFetching } = useQuery({
    queryKey: queryKeys.products.featured,
    queryFn: () => productService.featured(),
    placeholderData: (previous) => previous,
  });

  const items = React.useMemo(() => {
    const established = data.filter((product) => !product.isNewArrival);
    const newest = data.filter((product) => product.isNewArrival);
    return [...established, ...newest].slice(0, 4);
  }, [data]);

  return (
    <section className='site-container py-10 md:py-16'>
      <div className='mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end'>
        <div>
          <div className='mb-1.5 inline-flex items-center gap-2 rounded-full bg-warning/10 px-2.5 py-0.5 text-[12px] font-semibold text-warning'>
            <Icon name='fire' size={3.5} className='cursor-default' />
            <span>Top Picks{isFetching && !isLoading ? ' · refreshing' : ''}</span>
          </div>
          <h2 className='page-title'>Best Selling Products</h2>
          <p className='mt-1 text-[13px] text-text-muted'>Popular RC systems, drone parts, electronics, and control gear.</p>
        </div>

        <Link to={`${ROUTES.PRODUCTS}?isBestSeller=true`}>
          <Button
            variant='outline'
            size='sm'
            className='rounded-xl border-border bg-background font-medium text-text transition-all hover:border-warning/50 hover:bg-warning-bg hover:text-warning'
          >
            View Best Sellers
            <Icon name='arrow-right' size={4} className='ml-2 cursor-default' />
          </Button>
        </Link>
      </div>

      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4'>
        {isLoading && [1, 2, 3, 4].map((item) => <div key={item} className='h-96 animate-pulse rounded-2xl bg-background-secondary' />)}
        {!isLoading && items.map((product) => <ProductCard key={product._id || product.id} product={product} />)}
        {!isLoading && items.length === 0 && (
          <p className='col-span-full py-12 text-center text-sm text-text-muted'>No best-selling products available.</p>
        )}
      </div>
    </section>
  );
};

export default BestSelling;
