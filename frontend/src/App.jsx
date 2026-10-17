// src/App.jsx
import React, { useState } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/index.jsx';
import { ThemeProvider } from './contexts/ThemeContext';
import { store } from './store';
import { setAuthFromStorage } from './store/slices/authSlice';
import { fetchCart } from './store/slices/cartSlice';
import { fetchWishlist } from './store/slices/wishlistSlice';
import { STORAGE_KEYS } from './constants';
import { CatalogProvider } from './contexts/CatalogContext';
import { createAppQueryClient } from './lib/queryClient';
import { RealtimeSync } from './components/RealtimeSync';

const AppBootstrap = () => {
  const dispatch = useDispatch();

  React.useEffect(() => {
    const authRaw = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (authRaw) {
      try {
        dispatch(setAuthFromStorage(JSON.parse(authRaw)));
        dispatch(fetchWishlist());
      } catch {
        localStorage.removeItem(STORAGE_KEYS.AUTH);
      }
    }
    dispatch(fetchCart());
  }, [dispatch]);

  React.useEffect(() => {
    const onTokens = (event) => {
      if (event.detail) dispatch(setAuthFromStorage(event.detail));
    };
    const onExpired = () => {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
    };
    window.addEventListener("auth:tokens-refreshed", onTokens);
    window.addEventListener("auth:session-expired", onExpired);
    return () => {
      window.removeEventListener("auth:tokens-refreshed", onTokens);
      window.removeEventListener("auth:session-expired", onExpired);
    };
  }, [dispatch]);

  return (
    <>
      <RealtimeSync />
      <RouterProvider router={router} />
    </>
  );
};

function App() {
  const [queryClient] = useState(() => createAppQueryClient());
  return (
    <Provider store={store}>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <CatalogProvider>
              <AppBootstrap />
            </CatalogProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </Provider>
  );
}

export default App;
