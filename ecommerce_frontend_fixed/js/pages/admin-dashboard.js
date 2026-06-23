import { getProducts } from "../services/productService.js";
import { getOrders } from "../services/orderService.js";
import { getUsers } from "../services/userService.js";
import { requireAdmin } from "../utils/auth.js";
import { initLayout } from "../utils/ui.js";

if (!requireAdmin()) throw new Error("Admin access required");
initLayout();
const [products, orders, users] = await Promise.all([getProducts(), getOrders(), getUsers()]);
const revenue = orders.reduce((sum, order) => sum + Number(order.total_price || 0), 0);

document.getElementById("adminStats").innerHTML = [
  ["Products", products.length],
  ["Orders", orders.length],
  ["Revenue", `$${revenue}`],
  ["Users", users.length],
  ["Low stock", products.filter((product) => Number(product.stock) < 10).length],
]
  .map(([label, value]) => `<article class="stat-card"><span>${label}</span><strong>${value}</strong></article>`)
  .join("");

document.getElementById("recentActivity").innerHTML = orders
  .slice(0, 4)
  .map((order) => `<p><strong>#${order.id}</strong> ${order.status} - $${order.total_price}</p>`)
  .join("");
