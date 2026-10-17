import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cmsService } from "../../services/cmsService";

/** Client-side 301/302 redirect handler using CMS redirects collection. */
export const RedirectWatcher = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const path = location.pathname.replace(/\/+$/, "") || "/";
    cmsService
      .lookupRedirect(path)
      .then((redirect) => {
        if (!active || !redirect?.toPath) return;
        if (/^https?:\/\//i.test(redirect.toPath)) {
          window.location.replace(redirect.toPath);
          return;
        }
        navigate(redirect.toPath, { replace: true });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [location.pathname, navigate]);

  return null;
};

export default RedirectWatcher;
