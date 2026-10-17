// src/components/layout/Layout.jsx
import React, { useEffect, useRef } from "react";
import { matchPath, Outlet, useLocation, useOutletContext } from "react-router-dom";
import { Header } from "./Header/Header";
import Footer from "./Footer/Footer";
import { useSidebar } from "../../hooks/useSidebar";
import { ROUTES } from "../../constants";
import { cn } from "../../utils/cn";
import RecentlyViewed from "../products/RecentlyViewed";
import LiveChatWidget from "../support/LiveChatWidget";

export const Layout = () => {
  const { isOpen, closeSidebar } = useSidebar();
  const location = useLocation();
  const headerRef = useRef(null);
  const [pageTitle, setPageTitle] = React.useState("GBLrcDrone");
  const [pageDescription, setPageDescription] = React.useState(
    "Your Ultimate RC & Robotics Hub",
  );

  // Sticky elements below the header offset themselves by --header-h
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return undefined;
    const root = document.documentElement;
    const update = () => {
      root.style.setProperty("--header-h", `${Math.round(header.getBoundingClientRect().height)}px`);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    closeSidebar();
  }, [location.pathname, closeSidebar]);

  // Update document title
  useEffect(() => {
    document.title = pageTitle;
    if (pageDescription) {
      const metaDescription = document.querySelector(
        'meta[name="description"]',
      );
      if (metaDescription) {
        metaDescription.setAttribute("content", pageDescription);
      }
    }
  }, [pageTitle, pageDescription]);

  // Check if current route is home page
  const isHomePage = location.pathname === "/";
  // Check if current route is auth page
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";
  // Product details renders its own Recently Viewed (excluding the current product)
  const isProductDetailPage = [ROUTES.PRODUCT_DETAIL, ROUTES.PRODUCT_SLUG].some((pattern) =>
    matchPath(pattern, location.pathname),
  );

  return (
    <div className='min-h-screen flex flex-col bg-background text-text w-full'>
      {/* Sticky Header */}
      <div ref={headerRef} className="sticky top-0 z-[100] isolate bg-background">
        <Header />
      </div>
      <div className='flex flex-1 relative overflow-x-hidden'>
        {/* Sidebar - Only show on home page */}

        {/* Mobile Overlay - Only show on home page */}
        {isHomePage && isOpen && !isAuthPage && (
          <div
            className='fixed inset-0 z-30 bg-black/50 lg:hidden'
            onClick={closeSidebar}
          />
        )}

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 min-w-0 min-h-[calc(100vh-var(--header-h,64px))]",
            "transition-all duration-300",
            "bg-background",
            isHomePage && isOpen ? "lg:ml-0" : "lg:ml-0",
          )}
        >
          <div className='w-full mx-auto'>
            <Outlet context={{ setPageTitle, setPageDescription }} />
            {!isAuthPage && !isProductDetailPage && (
              <div className='site-container pb-8'>
                <RecentlyViewed />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />
      {!isAuthPage && <LiveChatWidget />}
    </div>
  );
};

// Hook to use layout context
export const useLayoutContext = () => {
  return useOutletContext();
};
