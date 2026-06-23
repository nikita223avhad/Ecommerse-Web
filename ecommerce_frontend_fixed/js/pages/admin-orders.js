import { getOrders } from "../services/orderService.js";
import { requireAdmin } from "../utils/auth.js";
import { escapeHtml } from "../utils/images.js";
import { initLayout } from "../utils/ui.js";

if (!requireAdmin()) throw new Error("Admin access required");
initLayout();
const orders = await getOrders();
document.getElementById("adminOrdersTable").innerHTML = orders
  .map((order) => `<tr><td>#${escapeHtml(order.id)}</td><td>${order.user_id || 1}</td><td>$${order.total_price}</td><td><span class="status">${escapeHtml(order.status || "Placed")}</span></td><td>${order.product_id || "-"}</td></tr>`)
  .join("") || `<tr><td colspan="5">No orders found.</td></tr>`;
