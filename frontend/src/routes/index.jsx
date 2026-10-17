import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Layout } from "../components/layout/Layout";
import { RootLayout } from "../components/seo/RootLayout";
import { PrivateRoute } from "./PrivateRoute";
import { RouteErrorBoundary } from "./RouteErrorBoundary";
import { ROUTES } from "../constants";
import Home from "../pages/Home/Home";
import Products from "../pages/Products/Products";
import Cart from "../pages/Cart/Cart";
import NewArrivals from "../pages/NewArrivals/NewArrivals";
import Salse from "../pages/salse/Salse";
import ProductDetails from "../pages/Products/ProductDetails";
import Combo_Packages from "../pages/Combo_Packages/Combo_Packages";
import ComboBuilder from "../pages/ComboBuilder/ComboBuilder";
import CategoryProducts from "../pages/CategoryProducts/CategoryProducts";
import SearchResults from "../pages/Search/SearchResults";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import WishlistPage from "../pages/Wishlist/WishlistPage";
import ComparePage from "../pages/Compare/ComparePage";
import OrdersPage from "../pages/Orders/OrdersPage";
import OrderDetailPage from "../pages/Orders/OrderDetailPage";
import NotFound from "../pages/NotFound/NotFound";
import Checkout from "../pages/Checkout/Checkout";
import AdminDashboard from "../pages/Admin/AdminDashboard";
import AdminProducts from "../pages/Admin/AdminProducts";
import AdminOrders from "../pages/Admin/AdminOrders";
import AdminUsers from "../pages/Admin/AdminUsers";
import AdminCategories from "../pages/Admin/AdminCategories";
import HelpSupport from "../pages/Help/HelpSupport";
import Contact from "../pages/Contact/Contact";
import About from "../pages/About/About";
import FAQ from "../pages/FAQ/FAQ";
import Terms from "../pages/Terms/Terms";
import PrivacyPolicy from "../pages/Privacy/PrivacyPolicy";
import CmsPage from "../pages/Cms/CmsPage";
// Loading component
const PageLoader = () => (
  <div className='flex items-center justify-center min-h-screen'>
    <div className='text-center'>
      <div className='w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto'></div>
      <p className='mt-4 text-gray-600 dark:text-gray-400'>Loading...</p>
    </div>
  </div>
);

// Wrap lazy component with Suspense
const withSuspense = (Component) => (props) => (
  <Suspense fallback={<PageLoader />}>
    <Component {...props} />
  </Suspense>
);

// Main router configuration
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: "/",
        element: <Layout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          // Public Routes
          {
            index: true,
            element: <Home />,
          },
          {
            path: ROUTES.PRODUCTS,
            element: withSuspense(Products)(),
          },
          {
            path: ROUTES.SEARCH,
            element: withSuspense(SearchResults)(),
          },
          {
            path: ROUTES.PRODUCT_DETAIL,
            element: withSuspense(ProductDetails)(),
          },
          {
            path: ROUTES.PRODUCT_SLUG,
            element: withSuspense(ProductDetails)(),
          },
          {
            path: ROUTES.CART,
            element: withSuspense(Cart)(),
          },
          {
            path: ROUTES.ABOUT,
            element: withSuspense(() => <About slug='about' />)(),
          },
          {
            path: ROUTES.CONTACT,
            element: withSuspense(() => <Contact slug='contact' />)(),
          },
          {
            path: ROUTES.FAQ,
            element: withSuspense(() => <FAQ slug='faq' />)(),
          },
          {
            path: ROUTES.TERMS,
            element: withSuspense(() => <CmsPage slug='terms' />)(),
          },
          {
            path: ROUTES.PRIVACY,
            element: withSuspense(() => <CmsPage slug='privacy' />)(),
          },
          {
            path: ROUTES.HELP,
            element: withSuspense(HelpSupport)(),
          },
          {
            path: ROUTES.RETURNS,
            element: withSuspense(() => <CmsPage slug='returns' />)(),
          },
          {
            path: ROUTES.NEW_ARRIVALS,
            element: withSuspense(NewArrivals)(),
          },
          {
            path: ROUTES.SALE,
            element: withSuspense(Salse)(),
          },
          {
            path: ROUTES.COMBO_PACKAGES,
            element: withSuspense(Combo_Packages)(),
          },
          {
            path: ROUTES.COMBO_BUILDER,
            element: withSuspense(ComboBuilder)(),
          },
          {
            path: "/category/:slug",
            element: withSuspense(CategoryProducts)(),
          },
          {
            path: "/category/:slug/:subslug/:nested",
            element: withSuspense(CategoryProducts)(),
          },
          {
            path: "/category/:slug/:subslug",
            element: withSuspense(CategoryProducts)(),
          },
          // // Protected Routes
          {
            path: ROUTES.CHECKOUT,
            element: <PrivateRoute>{withSuspense(Checkout)()}</PrivateRoute>,
          },
          // {
          //   path: ROUTES.PROFILE,
          //   element: <PrivateRoute>{withSuspense(Profile)()}</PrivateRoute>,
          // },
          // {
          //   path: ROUTES.ORDERS,
          //   element: <PrivateRoute>{withSuspense(Orders)()}</PrivateRoute>,
          // },
          {
            path: ROUTES.WISHLIST,
            element: (
              <PrivateRoute>{withSuspense(WishlistPage)()}</PrivateRoute>
            ),
          },
          {
            path: ROUTES.COMPARE,
            element: withSuspense(ComparePage)(),
          },
          {
            path: ROUTES.ORDERS,
            element: <PrivateRoute>{withSuspense(OrdersPage)()}</PrivateRoute>,
          },
          {
            path: ROUTES.ORDER_DETAIL,
            element: (
              <PrivateRoute>{withSuspense(OrderDetailPage)()}</PrivateRoute>
            ),
          },
          // Admin Routes (Role-based)
          {
            path: ROUTES.ADMIN,
            element: (
              <PrivateRoute
                requiredRole={[
                  "store_admin",
                  "platform_admin",
                  "platform_super_admin",
                ]}
              >
                {withSuspense(AdminDashboard)()}
              </PrivateRoute>
            ),
          },
          {
            path: ROUTES.ADMIN_PRODUCTS,
            element: (
              <PrivateRoute
                requiredRole={[
                  "store_admin",
                  "platform_admin",
                  "platform_super_admin",
                ]}
              >
                {withSuspense(AdminProducts)()}
              </PrivateRoute>
            ),
          },
          {
            path: ROUTES.ADMIN_ORDERS,
            element: (
              <PrivateRoute
                requiredRole={[
                  "store_admin",
                  "platform_admin",
                  "platform_super_admin",
                ]}
              >
                {withSuspense(AdminOrders)()}
              </PrivateRoute>
            ),
          },
          {
            path: ROUTES.ADMIN_USERS,
            element: (
              <PrivateRoute
                requiredRole={[
                  "store_admin",
                  "platform_admin",
                  "platform_super_admin",
                ]}
              >
                {withSuspense(AdminUsers)()}
              </PrivateRoute>
            ),
          },
          {
            path: ROUTES.ADMIN_CATEGORIES,
            element: (
              <PrivateRoute
                requiredRole={[
                  "store_admin",
                  "platform_admin",
                  "platform_super_admin",
                ]}
              >
                {withSuspense(AdminCategories)()}
              </PrivateRoute>
            ),
          },
        ],
      },
      // Auth Routes (without Layout)
      {
        path: ROUTES.LOGIN,
        element: withSuspense(Login)(),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: ROUTES.REGISTER,
        element: withSuspense(Register)(),
        errorElement: <RouteErrorBoundary />,
      },
      // 404 Route
      {
        path: "*",
        element: withSuspense(NotFound)(),
      },
    ],
  },
]);

// Helper to navigate programmatically
export const navigate = router.navigate;
