import { API_BASE_URL, ENDPOINTS } from "../config/api-config.js";
import { getItem, setItem } from "../utils/storage.js";
import { authHeaders, getUser } from "../utils/auth.js";

// ---------- LOCAL CART ----------

export function getLocalCart() {
  return getItem("cart", []);
}

export function saveLocalCart(cart) {
  setItem("cart", cart);
}

export function addLocalCart(productId, quantity = 1) {
  const cart = getLocalCart();

  const found = cart.find(
    (item) => Number(item.product_id) === Number(productId)
  );

  if (found) {
    found.quantity += quantity;
  } else {
    cart.push({
      product_id: Number(productId),
      quantity: Number(quantity),
    });
  }

  saveLocalCart(cart);
  return cart;
}

export function updateLocalQuantity(productId, delta) {
  const cart = getLocalCart().map((item) =>
    Number(item.product_id) === Number(productId)
      ? {
          ...item,
          quantity: Math.max(1, item.quantity + delta),
        }
      : item
  );

  saveLocalCart(cart);
  return cart;
}

export function removeLocalCart(productId) {
  const cart = getLocalCart().filter(
    (item) => Number(item.product_id) !== Number(productId)
  );

  saveLocalCart(cart);
  return cart;
}

// ---------- USER VALIDATION ----------

function getValidUserId() {
  const user = getUser();

  console.log("Current user:", user);

  if (!user || !user.id) {
    throw new Error("Please log in again.");
  }

  const userId = Number(user.id);

  if (isNaN(userId)) {
    throw new Error("Invalid user ID. Please log in again.");
  }

  return userId;
}

// ---------- SERVER CART ----------

export async function syncCartItem(productId, quantity = 1) {
  const userId = getValidUserId();

  const payload = {
    user_id: userId,
    product_id: Number(productId),
    quantity: Number(quantity),
  };

  console.log("Cart payload:", payload);

  const response = await fetch(
    `${API_BASE_URL}${ENDPOINTS.cart}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error(error);
    throw new Error(error);
  }

  return response.json();
}

export async function getServerCart() {
  const userId = getValidUserId();

  const response = await fetch(
    `${API_BASE_URL}${ENDPOINTS.cart}/user/${userId}`,
    {
      headers: authHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error(error);
    throw new Error(error);
  }

  return response.json();
}