// src/pages/ComboPackages/ComboPackages.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../constants";
import ProductCard from "../Products/ProductCard";
import Icon from "../../components/common/Icon/Icon";
import Button from "../../components/common/Button/Button";
import { productService } from "../../services/productService";

export const Combo_Packages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("default");

  useEffect(() => {
    const run = async () => {
      try {
        const response = await productService.comboPackages({ limit: 100 });
        setPackages(response.items || []);
      } catch {
        const fallback = await productService.list({ isCombo: "true", limit: 100 });
        setPackages(fallback.items || []);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  // Filter and sort combo packages
  const filteredPackages = useMemo(() => {
    let result = [...packages];

    if (selectedCategory !== "all") {
      result = result.filter((item) => item.category === selectedCategory);
    }

    if (sortBy === "price-low") {
      result.sort(
        (a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price),
      );
    } else if (sortBy === "price-high") {
      result.sort(
        (a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price),
      );
    } else if (sortBy === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [packages, selectedCategory, sortBy]);

  return (
    <div className='site-container py-8 md:py-12 bg-background text-text'>
      {/* Breadcrumb Navigation */}
      <nav className='flex items-center gap-2 text-xs sm:text-sm text-text-muted mb-6'>
        <Link to={ROUTES.HOME} className='hover:text-warning transition-colors'>
          Home
        </Link>
        <Icon name='chevron-right' size={3} />
        <span className='text-text font-medium'>Combo Packages</span>
      </nav>

      {/* Page Header */}
      <div className='flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-border gap-4'>
        <div>
          <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warning/10 border border-warning/30 text-warning text-xs font-semibold mb-2'>
            <span>🎁 Value Bundles</span>
          </div>
          <h1 className='text-2xl sm:text-4xl font-extrabold text-text tracking-tight mb-2'>
            Combo Packages
          </h1>
          <p className='text-sm text-text-muted'>
            Showing{" "}
            <span className='font-bold text-warning'>
              {filteredPackages.length}
            </span>{" "}
            of {packages.length} total discount bundles available
          </p>
          <Link
            to={ROUTES.COMBO_BUILDER}
            className='mt-3 inline-flex rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white'
          >
            Open combo builder
          </Link>
        </div>

        {/* Filter and Sort Options Header */}
        <div className='flex flex-wrap items-center gap-3'>
          {/* Category Filter Buttons */}
          <div className='flex items-center gap-1.5 bg-background-secondary p-1 rounded-xl border border-border'>
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === "all"
                  ? "bg-warning text-white shadow-sm"
                  : "text-text-muted hover:text-text"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedCategory("drones")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === "drones"
                  ? "bg-warning text-white shadow-sm"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Drones
            </button>
            <button
              onClick={() => setSelectedCategory("fpv-racing")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === "fpv-racing"
                  ? "bg-warning text-white shadow-sm"
                  : "text-text-muted hover:text-text"
              }`}
            >
              FPV
            </button>
            <button
              onClick={() => setSelectedCategory("accessories")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === "accessories"
                  ? "bg-warning text-white shadow-sm"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Accessories
            </button>
          </div>

          {/* Sort Dropdown Selector */}
          <div className='relative'>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className='bg-background-secondary border border-border text-text text-xs sm:text-sm rounded-xl px-4 py-2.5 outline-none focus:border-warning transition-colors cursor-pointer'
            >
              <option value='default'>Sort by: Featured</option>
              <option value='price-low'>Price: Low to High</option>
              <option value='price-high'>Price: High to Low</option>
              <option value='rating'>Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className='py-20 text-center text-text-muted'>Loading combo packages...</div>
      ) : filteredPackages.length > 0 ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
          {filteredPackages.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
            />
          ))}
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center py-20 text-center bg-background-secondary rounded-2xl border border-border'>
          <div className='bg-warning/10 text-warning p-4 rounded-full mb-4'>
            <Icon name='search' size={8} />
          </div>
          <h3 className='text-lg font-bold text-text mb-1'>
            No combo packages found
          </h3>
          <p className='text-sm text-text-muted mb-6'>
            Try changing your filter category to see more bundle offers.
          </p>
          <Button
            variant='solid'
            size='sm'
            onClick={() => setSelectedCategory("all")}
            className='bg-warning text-white hover:bg-warning/90'
          >
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default Combo_Packages;
