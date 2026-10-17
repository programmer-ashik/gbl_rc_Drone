import React, { useMemo } from "react";
import HeadlessSelect from "../common/HeadlessSelect/HeadlessSelect";

export const ProductFilters = ({
  filters,
  facets = {},
  categories = [],
  lockedCategory = "",
  onChange,
  className = "",
}) => {
  const categoryOptions = useMemo(() => {
    const source = facets.categories?.length ? facets.categories : categories;
    return [
      { value: "", label: "All categories" },
      ...source.map((item) => ({
        value: item.slug,
        label: item.name || item.label,
        count: item.count,
      })),
    ];
  }, [facets.categories, categories]);

  if (lockedCategory) return null;

  return (
    <HeadlessSelect
      label="Category"
      value={filters.category}
      options={categoryOptions}
      placeholder="All categories"
      onChange={(next) => onChange({ ...filters, category: next, subCategory: "", page: 1 })}
      className={className}
      buttonClassName="bg-background-secondary"
    />
  );
};

export default ProductFilters;
