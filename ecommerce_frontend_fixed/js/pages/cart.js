import { getProducts } from "../services/productService.js";
import {
  getServerCart,
  removeLocalCart,
  updateLocalQuantity
} from "../services/cartService.js";

import { escapeHtml, productImage } from "../utils/images.js";
import { initLayout } from "../utils/ui.js";

initLayout();

const products = await getProducts();

let serverCart = [];

let selectedIds = JSON.parse(
  localStorage.getItem("selectedCheckoutItems") || "[]"
);

try {
  serverCart = await getServerCart();
} catch (error) {
  console.error(error);
}

render();

// Handle checkbox selection
document.addEventListener("change", (event) => {
  if (!event.target.matches(".checkout-item")) return;

  const productId = Number(event.target.dataset.productId);

  if (event.target.checked) {
    if (!selectedIds.includes(productId)) {
      selectedIds.push(productId);
    }
  } else {
    selectedIds = selectedIds.filter((id) => id !== productId);
  }

  localStorage.setItem(
    "selectedCheckoutItems",
    JSON.stringify(selectedIds)
  );
});

// Handle buttons
document.addEventListener("click", async (event) => {
  // Remove item
  const removeButton = event.target.closest("[data-remove]");

  if (removeButton) {
    const productId = Number(removeButton.dataset.remove);

    try {
      await removeLocalCart(productId);

      serverCart = serverCart.filter(
        (item) => Number(item.product_id) !== productId
      );

      selectedIds = selectedIds.filter((id) => id !== productId);

      localStorage.setItem(
        "selectedCheckoutItems",
        JSON.stringify(selectedIds)
      );

      render();
    } catch (error) {
      console.error(error);
    }

    return;
  }

  // Increase quantity
  const plusButton = event.target.closest("[data-plus]");

  if (plusButton) {
    const itemElement = plusButton.closest("[data-product]");

    const productId = Number(itemElement.dataset.product);

    const cartItem = serverCart.find(
      (item) => Number(item.product_id) === productId
    );

    if (!cartItem) return;

    cartItem.quantity += 1;

    try {
      await updateLocalQuantity(productId, cartItem.quantity);
      render();
    } catch (error) {
      console.error(error);
    }

    return;
  }

  // Decrease quantity
  const minusButton = event.target.closest("[data-minus]");

  if (minusButton) {
    const itemElement = minusButton.closest("[data-product]");

    const productId = Number(itemElement.dataset.product);

    const cartItem = serverCart.find(
      (item) => Number(item.product_id) === productId
    );

    if (!cartItem || cartItem.quantity <= 1) return;

    cartItem.quantity -= 1;

    try {
      await updateLocalQuantity(productId, cartItem.quantity);
      render();
    } catch (error) {
      console.error(error);
    }

    return;
  }

  // Checkout selected
  const checkoutButton = event.target.closest("#checkoutBtn");

  if (checkoutButton) {
    if (!selectedIds.length) {
      alert("Please select at least one product.");
      return;
    }

    localStorage.setItem(
      "selectedCheckoutItems",
      JSON.stringify(selectedIds)
    );

    window.location.href = "./checkout.html";
  }
});

function render() {
  const items = serverCart
    .map((line) => ({
      ...line,
      product: products.find(
        (product) => Number(product.id) === Number(line.product_id)
      ),
    }))
    .filter((line) => line.product);

  const cartList = document.getElementById("cartList");

  cartList.innerHTML =
    items.length > 0
      ? items.map(itemTemplate).join("")
      : `<div class="panel"><p>Your cart is empty.</p></div>`;

  renderSummary(items);
}

function itemTemplate(item) {
  const isChecked = selectedIds.includes(Number(item.product_id));

  return `
    <article class="cart-item" data-product="${item.product_id}">
      <input
        type="checkbox"
        class="checkout-item"
        data-product-id="${item.product_id}"
        ${isChecked ? "checked" : ""}
      >

      <div class="cart-thumb">
        ${productImage(item.product, "cart-image")}
      </div>

      <div>
        <h3>${escapeHtml(item.product.name)}</h3>
        <p class="muted">${escapeHtml(item.product.category || "")}</p>
        <strong>$${item.product.price}</strong>
      </div>

      <div class="qty">
        <button type="button" data-minus>-</button>
        <span>${item.quantity}</span>
        <button type="button" data-plus>+</button>
      </div>

      <button
        type="button"
        class="remove-btn"
        data-remove="${item.product_id}"
      >
        Remove
      </button>
    </article>
  `;
}

function renderSummary(items) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const tax = Math.round(subtotal * 0.05);

  document.getElementById("cartSummary").innerHTML = `
    <h2>Summary</h2>

    <div class="summary-row">
      <span>Subtotal</span>
      <strong>$${subtotal}</strong>
    </div>

    <div class="summary-row">
      <span>Tax</span>
      <strong>$${tax}</strong>
    </div>

    <div class="summary-row total">
      <span>Total</span>
      <strong>$${subtotal + tax}</strong>
    </div>

    <button id="checkoutBtn" class="btn primary" type="button">
      Checkout Selected (${selectedIds.length})
    </button>
  `;
}