import { QueryClient } from '@tanstack/react-query';

export const queryKeys = {
  categories: {
    all: ['categories'],
    tree: ['categories', 'tree'],
    nav: ['categories', 'nav'],
    footer: ['categories', 'footer'],
  },
  products: {
    all: ['products'],
    featured: ['products', 'featured'],
    newArrivals: ['products', 'new'],
    detail: (id) => ['products', 'detail', id],
  },
};

export const createAppQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: 1,
      },
    },
  });
