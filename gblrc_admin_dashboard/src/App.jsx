import React, { useEffect } from "react";
import { Provider, useDispatch } from "react-redux";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { STORAGE_KEYS } from "./constants/api";
import { ROUTES } from "./constants/routes";
import { setAuthFromStorage, store } from "./store";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CategoryListPage from './pages/categories/category-list';
import CategoryFormPage from './pages/categories/category-form';
import CategoryTreePage from './pages/categories/category-tree';
import ProductListPage from './pages/products/product-list';
import ProductFormPage from './pages/products/product-form';
import ProductImportPage from './pages/products/product-import';
import OrderListPage from './pages/orders/order-list';
import OrderDetailPage from './pages/orders/order-detail';
import UserListPage from './pages/users/user-list';
import UserDetailPage from './pages/users/user-detail';
import CmsPagesPage from './pages/cms/pages';
import CmsTermsPage from './pages/cms/terms';
import CmsPrivacyPage from './pages/cms/privacy';
import CmsHomepagePage from './pages/cms/homepage';
import CmsSeoPage from './pages/cms/seo';
import CmsRedirectsPage from './pages/cms/redirects';
import CmsTestimonialsPage from './pages/cms/testimonials';
import SystemSettingsPage from './pages/settings/system-settings';
import SecuritySettingsPage from './pages/settings/security';
import ActivityLogsPage from './pages/settings/activity-logs';
import MaintenancePage from './pages/settings/maintenance';
import LiveChatPage from './pages/chat/live-chat';
import InvoiceTemplatesPage from './pages/invoices/invoice-templates';
import StockPage from './pages/stock/stock-page';

const Bootstrap = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (!raw) return;
    try {
      dispatch(setAuthFromStorage(JSON.parse(raw)));
    } catch {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
    }
  }, [dispatch]);

  useEffect(() => {
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
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
            <Route path={ROUTES.CATEGORIES} element={<CategoryListPage />} />
            <Route path={ROUTES.CATEGORIES_NEW} element={<CategoryFormPage />} />
            <Route path={ROUTES.CATEGORIES_EDIT} element={<CategoryFormPage />} />
            <Route path={ROUTES.CATEGORIES_TREE} element={<CategoryTreePage />} />
            <Route path={ROUTES.PRODUCTS} element={<ProductListPage />} />
            <Route path={ROUTES.PRODUCTS_NEW} element={<ProductFormPage />} />
            <Route path={ROUTES.PRODUCTS_IMPORT} element={<ProductImportPage />} />
            <Route path={ROUTES.PRODUCTS_EDIT} element={<ProductFormPage />} />
            <Route path={ROUTES.STOCK} element={<StockPage />} />
            <Route path={ROUTES.ORDERS} element={<OrderListPage />} />
            <Route path={ROUTES.ORDERS_DETAIL} element={<OrderDetailPage />} />
            <Route path={ROUTES.INVOICES} element={<InvoiceTemplatesPage />} />
            <Route path={ROUTES.USERS} element={<UserListPage />} />
            <Route path={ROUTES.USERS_DETAIL} element={<UserDetailPage />} />
            <Route path={ROUTES.CMS_PAGES} element={<CmsPagesPage />} />
            <Route path={ROUTES.CMS_TERMS} element={<CmsTermsPage />} />
            <Route path={ROUTES.CMS_PRIVACY} element={<CmsPrivacyPage />} />
            <Route path={ROUTES.CMS_HOMEPAGE} element={<CmsHomepagePage />} />
            <Route path={ROUTES.CMS_SEO} element={<CmsSeoPage />} />
            <Route path={ROUTES.CMS_REDIRECTS} element={<CmsRedirectsPage />} />
            <Route path={ROUTES.CMS_TESTIMONIALS} element={<CmsTestimonialsPage />} />
            <Route path={ROUTES.SETTINGS} element={<SystemSettingsPage />} />
            <Route path={ROUTES.SECURITY} element={<SecuritySettingsPage />} />
            <Route path={ROUTES.ACTIVITY_LOGS} element={<ActivityLogsPage />} />
            <Route path={ROUTES.MAINTENANCE} element={<MaintenancePage />} />
            <Route path={ROUTES.LIVE_CHAT} element={<LiveChatPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <Bootstrap />
    </Provider>
  );
}
