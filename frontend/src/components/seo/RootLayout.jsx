import React from "react";
import { Outlet } from "react-router-dom";
import { RedirectWatcher } from "./RedirectWatcher";
import { ScrollToTop } from "./ScrollToTop";

/** Provides router context for global watchers (redirects, scroll, etc.). */
export const RootLayout = () => (
  <>
    <ScrollToTop />
    <RedirectWatcher />
    <Outlet />
  </>
);

export default RootLayout;
