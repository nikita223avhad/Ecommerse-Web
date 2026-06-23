import { API_BASE_URL, ENDPOINTS } from "../config/api-config.js";
import { authHeaders, getUser } from "../utils/auth.js";

export async function getOrders() {
  try {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.orders}`, { headers: authHeaders() });
    if (!response.ok) throw new Error("Orders unavailable");
    const data = await response.json();
    return Array.isArray(data) ? data : data.orders || [];
  } catch {
    return [
      { id: "NX-10482", user_id: 1, total_price: 189, status: "Out for delivery", product_id: 1 },
      { id: "NX-10411", user_id: 1, total_price: 129, status: "Delivered", product_id: 3 },
    ];
  }
}

export async function createOrder(payload) {
  const user = getUser();
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.orders}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ user_id: user?.id || 1, status: "Placed", ...payload }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}
