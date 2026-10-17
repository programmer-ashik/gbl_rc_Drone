import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Icon } from "../../common/Icon/Icon";
import {
  ROUTES,
  generateProductRoute,
  generateSearchRoute,
} from "../../../constants";
import { productService } from "../../../services/productService";

export const ProductSearchForm = ({ className = "", onSearch }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const onSearchPage =
      location.pathname === ROUTES.SEARCH ||
      location.pathname === ROUTES.PRODUCTS;
    setSearch(onSearchPage ? query.get("q") || query.get("search") || "" : "");
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (search.trim().length < 2) {
      setSuggestions([]);
      return undefined;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      productService
        .search({ q: search.trim(), limit: 6, suggest: "true" })
        .then((data) => active && setSuggestions(data?.suggestions || []))
        .catch(() => active && setSuggestions([]));
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [search]);

  useEffect(() => {
    const onClick = (event) => {
      if (!boxRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const goToResults = (term = search) => {
    navigate(generateSearchRoute(term.trim()));
    setOpen(false);
    onSearch?.();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    goToResults();
  };

  const openSuggestion = (item) => {
    if (item.type === "product") navigate(generateProductRoute(item.slug));
    else if (item.type === "category") navigate(`/category/${item.slug}`);
    else goToResults(item.text);
    setOpen(false);
    onSearch?.();
  };

  return (
    <form
      onSubmit={handleSubmit}
      role='search'
      className={`relative z-20 ${className}`}
      ref={boxRef}
    >
      <label
        htmlFor={`product-search-${className.includes("mobile") ? "mobile" : "desktop"}`}
        className='sr-only'
      >
        Search products
      </label>
      <input
        id={`product-search-${className.includes("mobile") ? "mobile" : "desktop"}`}
        type='search'
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder='Search products...'
        autoComplete='off'
        className='w-full rounded-lg bg-background-secondary py-2.5 pl-10 pr-12 text-sm text-text placeholder-text-muted transition-all focus:outline-none focus:ring-2 focus:ring-warning'
      />
      <Icon
        name='search'
        className='pointer-events-none absolute left-3 top-2.5 text-text-muted'
        size={5}
      />
      <button
        type='submit'
        className='absolute right-1.5 top-1.5 rounded-md px-2 py-1 text-xs font-semibold text-warning transition-colors hover:bg-warning-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning'
      >
        Go
      </button>
      {open && suggestions.length > 0 && (
        <ul className='absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-border bg-background-secondary shadow-lg'>
          {suggestions.map((item, index) => (
            <li key={`${item.type}-${item.slug || item.text}-${index}`}>
              <button
                type='button'
                onClick={() => openSuggestion(item)}
                className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-background'
              >
                <span className='rounded-md bg-warning-bg px-1.5 py-0.5 text-[10px] font-bold uppercase text-warning'>
                  {item.type}
                </span>
                <span>{item.text}</span>
              </button>
            </li>
          ))}
          <li>
            <Link
              to={generateSearchRoute(search.trim())}
              className='block px-3 py-2 text-xs font-semibold text-warning'
              onClick={() => {
                setOpen(false);
                onSearch?.();
              }}
            >
              View all results
            </Link>
          </li>
        </ul>
      )}
    </form>
  );
};

export default ProductSearchForm;
