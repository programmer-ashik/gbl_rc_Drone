const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const resolveAssetUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("blob:") || value.startsWith("data:")) return value;
  return `${API_BASE}${value.startsWith("/") ? value : `/${value}`}`;
};

export const productTitle = (product) => product?.name || product?.title || "Product";

export const productPrice = (product, variant) => {
  if (variant?.price != null && variant.price !== "") return Number(variant.price);
  return Number(product?.finalPrice ?? product?.discountPrice ?? product?.price ?? 0);
};

export const productBasePrice = (product) =>
  Number(product?.basePrice ?? product?.price ?? 0);

export const productImages = (product) => {
  if (!product) return [];
  const photos = product.photos?.length
    ? [...product.photos]
        .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
        .map((photo) => resolveAssetUrl(photo.url))
        .filter(Boolean)
    : [];
  if (photos.length) return photos;
  const images = (product.images || []).map(resolveAssetUrl).filter(Boolean);
  if (images.length) return images;
  return product.image ? [resolveAssetUrl(product.image)] : [];
};

export const parseSpecifications = (specifications = []) => {
  if (specifications && typeof specifications === 'object' && !Array.isArray(specifications)) {
    return Object.entries(specifications)
      .map(([key, value]) => ({ key: String(key), value: String(value ?? '') }))
      .filter((item) => item.key);
  }
  return (Array.isArray(specifications) ? specifications : [])
    .map((entry) => {
      const text = String(entry || '');
      const separator = text.indexOf(':');
      if (separator <= 0) return { key: text, value: '' };
      return { key: text.slice(0, separator).trim(), value: text.slice(separator + 1).trim() };
    })
    .filter((item) => item.key);
};

export const isHtmlContent = (value) => /<\/?[a-z][\s\S]*>/i.test(String(value || ""));

export const stripHtml = (value) =>
  String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const productPath = (product) =>
  `/product/${product?.slug || product?._id || product?.id}`;

export const stockState = (product, variant) => {
  const stock = variant ? Number(variant.stock || 0) : Number(product?.stock || 0);
  const threshold = Number(product?.stockAlertThreshold || product?.lowStockThreshold || 5);
  const status = variant
    ? stock <= 0
      ? "out_of_stock"
      : stock <= threshold
        ? "low_stock"
        : "in_stock"
    : product?.stockStatus || (stock <= 0 ? "out_of_stock" : stock <= threshold ? "low_stock" : "in_stock");
  return {
    stock,
    status,
    isOutOfStock: status === "out_of_stock" || stock <= 0,
    isLowStock: status === "low_stock" || (!status && stock > 0 && stock <= threshold),
  };
};

export const estimateFlightMinutes = ({ motors = 0, batteryMah = 0, propellerInch = 0 }) => {
  if (!motors || !batteryMah) return null;
  const drainPerMotor = propellerInch >= 6 ? 18 : propellerInch >= 5 ? 14 : 10;
  const totalDrain = Math.max(1, motors * drainPerMotor);
  return Math.max(1, Math.round((batteryMah / totalDrain) * 0.65));
};
