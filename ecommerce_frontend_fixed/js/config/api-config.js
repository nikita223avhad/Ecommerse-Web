export const API_BASE_URL = localStorage.getItem("apiBaseUrl") || "http://127.0.0.1:8000";

export const ENDPOINTS = {
  login: "/auth/login",
  register: "/auth/register",
  products: "/products",
  categories: "/categories",
  cart: "/cart",
  orders: "/orders",
  users: "/users",
  chatbot: "/chatbot/ask",
};
