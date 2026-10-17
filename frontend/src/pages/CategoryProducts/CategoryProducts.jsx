import React from "react";
import { useParams } from "react-router-dom";
import Products from "../Products/Products";

export const CategoryProducts = () => {
  const { slug, subslug, nested } = useParams();
  const lockedSubCategory = nested || subslug || "";
  const formattedTitle = lockedSubCategory
    ? `${slug.replace(/-/g, " ")} › ${lockedSubCategory.replace(/-/g, " ")}`
    : slug?.replace(/-/g, " ");

  return (
    <Products
      lockedCategory={slug}
      lockedSubCategory={lockedSubCategory}
      title={formattedTitle}
    />
  );
};

export default CategoryProducts;
