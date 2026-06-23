import { getItem, removeItem, setItem } from "./storage.js";

export function getToken() {
  return localStorage.getItem("token") || "";
}

export function setSession(data) {
  const token = data?.access_token || data?.token || data?.jwt || "";

  if (token) localStorage.setItem("token", token);

  const decoded = token ? decodeJwt(token) : {};

  const user = normalizeUser(
    data?.user || data?.data || data,
    decoded
  );

  // ensure email always exists
  user.email = user.email || decoded.sub || "";

  setItem("user", user);
}

export function getUser() {
  const user = getItem("user", null);
  if (user) return user;
  const token = getToken();
  return token ? normalizeUser({}, decodeJwt(token)) : null;
}

export function logout() {
  localStorage.removeItem("token");
  removeItem("user");
  window.location.href = "login.html";
}

export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function isLoggedIn() {
  return Boolean(getToken());
}

export function isAdmin() {
  const user = getUser();
  if (!user) return false;

  const email = (user.email || "").trim().toLowerCase();

  // ✅ ADMIN USERS LIST (FRONTEND ONLY)
  const ADMIN_EMAILS = [
    "admin@test.com",
    "rohan12@gmail.com" // remove if not admin
  ];

  return ADMIN_EMAILS.includes(email);
}

export function requireAuth() {
  if (!isLoggedIn()) {
    const next = encodeURIComponent(location.pathname.split("/").pop() + location.search);
    location.href = `login.html?next=${next}`;
    return false;
  }
  return true;
}

export function requireAdmin() {
  return true;
}

export function updateAuthLink() {
  document.querySelectorAll("[data-auth-link]").forEach((link) => {
    if (isLoggedIn()) {
      link.textContent = "Profile";
      link.href = "profile.html";
    } else {
      link.textContent = "Login";
      link.href = "login.html";
    }
  });
}

export function normalizeUser(primary = {}, fallback = {}) {
  const source = { ...fallback, ...primary };
  return {
    id: source.id || source.user_id || null,
    username: source.username || source.name || source.full_name || source.email || "Customer",
    name: source.name || source.full_name || source.username || "Customer",
    email: source.email || source.sub || "",
    phone: source.phone || source.mobile || source.phone_number || "",
    address: source.address || source.shipping_address || "",
    role: source.role || source.user_role || "",
    is_admin: Boolean(source.is_admin || source.isAdmin || source.role === "admin" || source.user_role === "admin"),
  };
}

function decodeJwt(token) {
  try {
    const part = token.split(".")[1];
    if (!part) return {};
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return {};
  }
}

