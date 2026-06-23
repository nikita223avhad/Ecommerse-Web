import { getUser, logout, requireAuth } from "../utils/auth.js";
import { getOrders } from "../services/orderService.js";
import { getCurrentUser } from "../services/userService.js";
import { escapeHtml } from "../utils/images.js";
import { initLayout, toast } from "../utils/ui.js";

if (!requireAuth()) throw new Error("Authentication required");
initLayout();

let user = getUser();
try {
  user = await getCurrentUser();
  localStorage.setItem("user", JSON.stringify(user));
} catch {
  toast("Using saved profile. Backend profile endpoint was not available.");
}

const orders = await getOrders();
const initials = String(user?.name || user?.username || user?.email || "U")
  .split(/\s+/)
  .map((part) => part[0])
  .join("")
  .slice(0, 2)
  .toUpperCase();

document.getElementById("profileInfo").innerHTML = `
  <div class="profile-card">
    <div class="avatar">${escapeHtml(initials)}</div>
    <div>
      <p class="eyebrow">Customer Dashboard</p>
      <h1>${escapeHtml(user?.name || user?.username || "Customer")}</h1>
      <p class="muted">${escapeHtml(user?.email || "Email not available")}</p>
    </div>
  </div>
  <div class="profile-details">
    <article><span>Name</span><strong>${escapeHtml(user?.name || user?.username || "Customer")}</strong></article>
    <article><span>Email</span><strong>${escapeHtml(user?.email || "Not available")}</strong></article>
    <article><span>Phone</span><strong>${escapeHtml(user?.phone || "Not added")}</strong></article>
    <article><span>Address</span><strong>${escapeHtml(user?.address || "Not added")}</strong></article>
  </div>
  <div class="profile-actions">
    <button class="btn ghost" type="button">Edit Profile</button>
    <button class="btn ghost" type="button">Change Password</button>
    <button class="btn primary" id="logoutInline" type="button">Logout</button>
  </div>
`;

document.getElementById("orderHistory").innerHTML = orders.length
  ? orders
      .slice(0, 6)
      .map((order) => `<article class="history-item"><strong>#${escapeHtml(order.id)}</strong><span>${escapeHtml(order.status || "Placed")}</span><span>$${order.total_price || 0}</span></article>`)
      .join("")
  : `<div class="empty-state">No orders yet.</div>`;

document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("logoutInline").addEventListener("click", logout);
