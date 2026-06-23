import { API_BASE_URL } from "../config/api-config.js";

export const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 480'%3E%3Crect width='640' height='480' fill='%23eef4f4'/%3E%3Cpath d='M96 344l116-128 78 84 54-64 200 108H96z' fill='%23c8d8dc'/%3E%3Ccircle cx='450' cy='154' r='46' fill='%23f0a37e'/%3E%3Ctext x='320' y='420' text-anchor='middle' font-family='Arial,sans-serif' font-size='30' font-weight='700' fill='%23176b87'%3EProduct image%3C/text%3E%3C/svg%3E";

function joinUrl(base, path) {
  return `${base.replace(/\/+$/, "")}/${String(path).replace(/^\/+/, "")}`;
}

export function getProductImageUrl(product = {}) {
  const raw =
    product.image_url ||
    product.imageUrl ||
    product.image_path ||
    product.imagePath ||
    product.image ||
    product.thumbnail ||
    "";

  const value = String(raw).replace(/\\+/g, "/").replace(/%5C/gi, "/");
  if (!value || /^[A-Za-z ]+$/.test(value)) return FALLBACK_IMAGE;
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;
  return joinUrl(API_BASE_URL, value);
}

export function productImage(product, className = "product-image") {
  const alt = product?.name ? `${product.name} product image` : "Product image";
  return `<img class="${className}" src="${getProductImageUrl(product)}" alt="${escapeHtml(alt)}" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'" />`;
}

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
