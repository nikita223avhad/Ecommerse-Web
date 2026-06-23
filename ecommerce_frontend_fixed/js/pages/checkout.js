import { getProducts } from "../services/productService.js";
import {
  getServerCart,
  removeLocalCart
} from "../services/cartService.js";
import { createOrder } from "../services/orderService.js";
import { requireAuth } from "../utils/auth.js";
import { initLayout, toast } from "../utils/ui.js";

if (!requireAuth()) {
  throw new Error("Authentication required");
}

initLayout();

const products = await getProducts();
const cart = await getServerCart();

const selectedIds = JSON.parse(
  localStorage.getItem("selectedCheckoutItems") || "[]"
);

if (!selectedIds.length) {
  toast("Please select products to checkout", "error");
  location.href = "cart.html";
}

const items = cart
  .filter((item) => selectedIds.includes(Number(item.product_id)))
  .map((line) => ({
    ...line,
    product: products.find(
      (product) => Number(product.id) === Number(line.product_id)
    ),
  }))
  .filter((line) => line.product);

if (!items.length) {
  toast("No valid products found", "error");
  location.href = "cart.html";
}

const subtotal = items.reduce(
  (sum, item) => sum + item.product.price * item.quantity,
  0
);

const tax = Math.round(subtotal * 0.05);
const total = subtotal + tax;

document.getElementById("checkoutSummary").innerHTML = `
  <h2>Order summary</h2>

  <div class="summary-row">
    <span>Items</span>
    <strong>$${subtotal}</strong>
  </div>

  <div class="summary-row">
    <span>Shipping</span>
    <strong>Free</strong>
  </div>

  <div class="summary-row">
    <span>Tax</span>
    <strong>$${tax}</strong>
  </div>

  <div class="summary-row total">
    <span>Total</span>
    <strong>$${total}</strong>
  </div>
`;

document
  .getElementById("checkoutForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      for (const item of items) {
        await createOrder({
          product_id: item.product_id,
          total_price: item.product.price * item.quantity,
        });

        await removeLocalCart(item.product_id);
      }

      localStorage.removeItem("selectedCheckoutItems");

      toast("Order placed successfully");

      location.href = "orders.html";
    } catch (error) {
      console.error(error);
      toast(`Backend error: ${error.message}`, "error");
    }
  });