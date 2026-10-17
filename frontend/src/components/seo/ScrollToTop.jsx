import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Scroll window (and any nested scroll roots) to top on every route change. */
export const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const reset = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      document.querySelectorAll("[data-scroll-root]").forEach((node) => {
        if (node instanceof HTMLElement) node.scrollTop = 0;
      });
    };

    reset();
    // Catch late layout shifts (images/fonts) that re-push scroll
    const frame = window.requestAnimationFrame(reset);
    const timer = window.setTimeout(reset, 50);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;
