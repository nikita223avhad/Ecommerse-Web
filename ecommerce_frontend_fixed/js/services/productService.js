import { API_BASE_URL, ENDPOINTS } from "../config/api-config.js";
import { authHeaders } from "../utils/auth.js";
import { apiFetch } from "./apiService.js";

export const fallbackProducts = [
  { id: 1, name: "PulseWave Pro Headphones", description: "Adaptive noise control and spatial audio.", price: 189, category: "Electronics", stock: 18, image: "Headphones", rating: 4.8 },
  { id: 2, name: "Orbit Fit Smartwatch", description: "GPS, sleep insights, and sapphire display.", price: 249, category: "Electronics", stock: 14, image: "Watch", rating: 4.7 },
  { id: 3, name: "EchoDock Studio Speaker", description: "Premium voice-enabled home audio.", price: 129, category: "Home", stock: 24, image: "Speaker", rating: 4.9 },
  { id: 4, name: "LumaDesk Smart Lamp", description: "Adaptive lighting with focus modes.", price: 72, category: "Home", stock: 31, image: "Lamp", rating: 4.6 },
  { id: 5, name: "AeroPack Travel Bag", description: "Weatherproof, compact, and office-ready.", price: 96, category: "Fashion", stock: 20, image: "Bag", rating: 4.5 },
  { id: 6, name: "VividCam Mini", description: "Portable 4K camera for creators.", price: 299, category: "Electronics", stock: 9, image: "Camera", rating: 4.7 },
];

export async function getProducts() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.products}`, { signal: controller.signal });
    clearTimeout(timer);
    if (!response.ok) throw new Error("Products unavailable");
    const data = await response.json();
    const local = JSON.parse(localStorage.getItem("admin_products") || "[]");
    const apiProducts = Array.isArray(data) ? data : data.products || [];
    return [...apiProducts, ...local];
  } catch {
    return fallbackProducts;
  }
}

export async function getProduct(id) {
  const products = await getProducts();
  return products.find((product) => Number(product.id) === Number(id)) || products[0];
}


export async function createProduct(formData) {
    const response = await fetch("http://127.0.0.1:8000/products/", {
        method: "POST",
        body: formData
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
    }

    return await response.json();
}

export async function updateProduct(id, payload) {
  const isForm = payload instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.products}/${id}`, {
    method: "PUT",
    headers: { ...(isForm ? {} : { "Content-Type": "application/json" }), ...authHeaders() },
    body: isForm ? payload : JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}


export async function deleteProduct(id) {
  try {
    return await apiFetch(`${ENDPOINTS.products}/${id}`, { method: "DELETE" });
  } catch {
    const products = JSON.parse(localStorage.getItem("admin_products") || "[]");
    const filtered = products.filter(p => Number(p.id) !== Number(id));
    localStorage.setItem("admin_products", JSON.stringify(filtered));
    return true;
  }
}


export function getCategories(products) {
  return [...new Set(products.map((product) => product.category).filter(Boolean))];
}
