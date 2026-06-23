import { getUsers } from "../services/userService.js";
import { requireAdmin } from "../utils/auth.js";
import { escapeHtml } from "../utils/images.js";
import { initLayout } from "../utils/ui.js";

if (!requireAdmin()) throw new Error("Admin access required");
initLayout();

const users = await getUsers();
document.getElementById("adminUsersTable").innerHTML = users
  .map((user) => `<tr><td>${escapeHtml(user.name || user.username || "Customer")}</td><td>${escapeHtml(user.email || "")}</td><td>${escapeHtml(user.phone || "")}</td><td>${escapeHtml(user.role || (user.is_admin ? "admin" : "customer"))}</td></tr>`)
  .join("") || `<tr><td colspan="4">No users found or user endpoint unavailable.</td></tr>`;
