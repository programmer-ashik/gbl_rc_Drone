import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../constants";
import ProductCard from "../Products/ProductCard";
import Icon from "../../components/common/Icon/Icon";
import Button from "../../components/common/Button/Button";
import { productService } from "../../services/productService";
import { useCatalog } from "../../contexts/CatalogContext";

const Salse = () => {
  const { categories } = useCatalog();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("discount");

  useEffect(() => {
    let active = true;
    productService.onSale()
      .then((data) => active && setProducts(data.filter((product) => product.onSale || product.discountPrice != null)))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const visibleCategories = categories.filter((category) => products.some((product) => product.category === category.slug));
  const filteredProducts = useMemo(() => {
    const result = selectedCategory === "all" ? [...products] : products.filter((product) => product.category === selectedCategory);
    if (sortBy === "price-low") result.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
    else if (sortBy === "price-high") result.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
    else if (sortBy === "rating") result.sort((a, b) => b.rating - a.rating);
    else result.sort((a, b) => ((b.price - (b.discountPrice ?? b.price)) / b.price) - ((a.price - (a.discountPrice ?? a.price)) / a.price));
    return result;
  }, [products, selectedCategory, sortBy]);

  const resetFilters = () => {
    setSelectedCategory("all");
    setSortBy("discount");
  };

  return (
    <div className="site-container bg-background py-5 text-text md:py-8">
      <nav className="page-breadcrumb" aria-label="Breadcrumb">
        <Link to={ROUTES.HOME} className="transition-colors hover:text-warning">Home</Link>
        <Icon name="chevron-right" size={3} className="cursor-default" />
        <span className="font-medium text-text">Sale &amp; Clearance</span>
      </nav>

      <section className="mb-5 flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-r from-warning/20 via-warning/10 to-background p-5 sm:p-6 md:flex-row md:items-center">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-warning px-2.5 py-0.5 text-[12px] font-bold text-white">
            <Icon name="lightning" size={3.5} className="cursor-default" />
            ACTIVE OFFERS
          </div>
          <h1 className="page-title">Sale &amp; Discounts</h1>
          <p className="mt-1 max-w-xl text-[13px] leading-5 text-text-muted">Discounted RC, drone, electronics, battery, and workshop products while available.</p>
        </div>
        <div className="flex shrink-0 items-center gap-3 rounded-2xl bg-background/80 p-4 shadow-sm">
          <Icon name="tag" size={6} className="cursor-default text-warning" />
          <div><span className="block text-xs font-semibold text-text-muted">Active Deals</span><strong className="text-lg text-text-primary">{products.length} products</strong></div>
        </div>
      </section>

      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
        <p className="text-sm text-text-muted">Showing <span className="font-bold text-warning">{filteredProducts.length}</span> discounted products</p>
        <div className="flex flex-col gap-3 min-[460px]:flex-row">
          <select aria-label="Filter sale products by category" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="rounded-xl border border-border bg-background-secondary px-4 py-2.5 text-sm text-text outline-none focus:border-warning">
            <option value="all">All categories</option>
            {visibleCategories.map((category) => <option key={category.slug} value={category.slug}>{category.label}</option>)}
          </select>
          <select aria-label="Sort sale products" value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-xl border border-border bg-background-secondary px-4 py-2.5 text-sm text-text outline-none focus:border-warning">
            <option value="discount">Biggest Discount</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-96 animate-pulse rounded-2xl bg-background-secondary" />)}</div>
      ) : filteredProducts.length ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((product) => <ProductCard key={product._id || product.id} product={product} />)}
        </div>
      ) : (
        <div className="rounded-2xl bg-background-secondary py-16 text-center">
          <Icon name="search" size={8} className="mx-auto mb-3 cursor-default text-warning" />
          <h2 className="font-bold text-text-primary">No sale products match this filter</h2>
          <Button variant="solid" size="sm" onClick={resetFilters} className="mt-4 bg-warning text-white">Reset filters</Button>
        </div>
      )}
    </div>
  );
};

export default Salse;
