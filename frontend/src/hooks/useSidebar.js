// src/hooks/useSidebar.js
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

export const useSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Auto-open sidebar on desktop for home page
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isHomePage) {
        setIsOpen(true);
      } else if (window.innerWidth >= 1024 && !isHomePage) {
        setIsOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isHomePage]);

  const openSidebar = () => setIsOpen(true);
  const closeSidebar = () => setIsOpen(false);
  const toggleSidebar = () => setIsOpen((prev) => !prev);

  return {
    isOpen,
    openSidebar,
    closeSidebar,
    toggleSidebar,
  };
};
