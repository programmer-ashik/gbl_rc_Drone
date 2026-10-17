import React from "react";
import { useSearchParams } from "react-router-dom";
import Products from "../Products/Products";

export const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || searchParams.get("search") || "";

  return (
    <Products
      title={query ? `Search results for “${query}”` : "Search products"}
      hideInlineSearch={false}
      emptyMessage="Try another keyword, or browse categories from the menu."
    />
  );
};

export default SearchResults;
