const ATTR_PREFIX = "attr.";

export const readProductFilters = (searchParams, locked = {}) => {
  const attributes = {};
  searchParams.forEach((value, key) => {
    if (!key.startsWith(ATTR_PREFIX) || !value) return;
    attributes[key.slice(ATTR_PREFIX.length)] = value.split(",").map((item) => item.trim()).filter(Boolean);
  });

  return {
    category: locked.category || searchParams.get("category") || "",
    subCategory: locked.subCategory || searchParams.get("subCategory") || searchParams.get("subcategory") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    rating: searchParams.get("rating") || "",
    inStock: searchParams.get("inStock") || "",
    isFeatured: searchParams.get("isFeatured") || "",
    isNewArrival: searchParams.get("isNewArrival") || "",
    tags: searchParams.get("tags") || "",
    sort: searchParams.get("sort") || "newest",
    page: searchParams.get("page") || "1",
    q: searchParams.get("q") || searchParams.get("search") || "",
    attributes,
  };
};

export const toFilterQuery = (filters) => {
  const query = {
    category: filters.category || undefined,
    subCategory: filters.subCategory || undefined,
    minPrice: filters.minPrice || undefined,
    maxPrice: filters.maxPrice || undefined,
    rating: filters.rating || undefined,
    inStock: filters.inStock || undefined,
    isFeatured: filters.isFeatured || undefined,
    isNewArrival: filters.isNewArrival || undefined,
    tags: filters.tags || undefined,
    sort: filters.sort || "newest",
    page: filters.page || 1,
    q: filters.q || undefined,
  };
  Object.entries(filters.attributes || {}).forEach(([key, values]) => {
    const list = Array.isArray(values) ? values : [values];
    if (list.length) query[`attr.${key}`] = list.join(",");
  });
  return query;
};

export const toFilterSearchParams = (filters, locked = {}) => {
  const next = new URLSearchParams();
  const set = (key, value) => {
    if (value == null || value === "" || value === false) return;
    next.set(key, String(value));
  };
  if (!locked.category) set("category", filters.category);
  if (!locked.subCategory) set("subCategory", filters.subCategory);
  set("minPrice", filters.minPrice);
  set("maxPrice", filters.maxPrice);
  set("rating", filters.rating);
  set("inStock", filters.inStock);
  set("isFeatured", filters.isFeatured);
  set("isNewArrival", filters.isNewArrival);
  set("tags", filters.tags);
  set("sort", filters.sort && filters.sort !== "newest" ? filters.sort : "");
  set("page", filters.page && String(filters.page) !== "1" ? filters.page : "");
  set("q", filters.q);
  Object.entries(filters.attributes || {}).forEach(([key, values]) => {
    const list = Array.isArray(values) ? values : [values];
    if (list.length) next.set(`${ATTR_PREFIX}${key}`, list.join(","));
  });
  return next;
};

export const describeActiveFilters = (filters, facets = {}) => {
  const chips = [];
  if (filters.q) chips.push({ key: "q", label: `Search: ${filters.q}` });
  if (filters.category && !filters.lockedCategory) {
    const name = facets.categories?.find((item) => item.slug === filters.category)?.name || filters.category;
    chips.push({ key: "category", label: name });
  }
  if (filters.subCategory && !filters.lockedSubCategory) {
    const name = facets.subCategories?.find((item) => item.slug === filters.subCategory)?.name || filters.subCategory;
    chips.push({ key: "subCategory", label: name });
  }
  if (filters.minPrice || filters.maxPrice) {
    chips.push({
      key: "price",
      label: `৳${filters.minPrice || 0} – ৳${filters.maxPrice || "max"}`,
    });
  }
  if (filters.rating) chips.push({ key: "rating", label: `${filters.rating}+ stars` });
  if (filters.inStock === "true") chips.push({ key: "inStock", label: "In stock" });
  if (filters.isFeatured === "true") chips.push({ key: "isFeatured", label: "Featured" });
  if (filters.isNewArrival === "true") chips.push({ key: "isNewArrival", label: "New arrivals" });
  if (filters.tags) chips.push({ key: "tags", label: `Tags: ${filters.tags}` });
  Object.entries(filters.attributes || {}).forEach(([key, values]) => {
    const label = facets.attributes?.find((item) => item.key === key)?.label || key;
    (Array.isArray(values) ? values : [values]).forEach((value) => {
      chips.push({ key: `attr.${key}`, value, label: `${label}: ${value}` });
    });
  });
  return chips;
};
