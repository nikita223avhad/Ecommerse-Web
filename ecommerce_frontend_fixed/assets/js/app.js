const API_BASE_URL = localStorage.getItem("apiBaseUrl") || "http://127.0.0.1:8000";

const state = {
  products: [],
  cart: readStore("nexoraCart", []),
  user: readStore("nexoraUser", null),
  token: localStorage.getItem("nexoraToken") || "",
};

const sampleProducts = [
  {
    id: 1,
    name: "PulseWave Pro Headphones",
    description: "Adaptive noise control and spatial audio.",
    price: 189,
    category: "Electronics",
    stock: 18,
    image: "headphones",
    rating: 4.8,
  },
  {
    id: 2,
    name: "Orbit Fit Smartwatch",
    description: "GPS, sleep insights, and sapphire display.",
    price: 249,
    category: "Electronics",
    stock: 14,
    image: "watch",
    rating: 4.7,
  },
  {
    id: 3,
    name: "EchoDock Studio Speaker",
    description: "Premium voice-enabled home audio.",
    price: 129,
    category: "Home",
    stock: 24,
    image: "speaker",
    rating: 4.9,
  },
  {
    id: 4,
    name: "LumaDesk Smart Lamp",
    description: "Adaptive lighting with focus modes.",
    price: 72,
    category: "Home",
    stock: 31,
    image: "lamp",
    rating: 4.6,
  },
  {
    id: 5,
    name: "AeroPack Travel Bag",
    description: "Weatherproof, compact, and office-ready.",
    price: 96,
    category: "Fashion",
    stock: 20,
    image: "bag",
    rating: 4.5,
  },
  {
    id: 6,
    name: "VividCam Mini",
    description: "Portable 4K camera for creators.",
    price: 299,
    category: "Electronics",
    stock: 9,
    image: "camera",
    rating: 4.7,
  },
];

document.addEventListener("DOMContentLoaded", async () => {
  updateAuthLinks();
  bindSearch();
  bindChatbot();
  bindAuthForms();
  bindCheckout();

  state.products = sampleProducts;

  renderHomeProducts();
  renderListing();
  renderProductDetails();
  renderCart();
  updateSummary();
  renderOrders();
  bindStaticAddButtons();

  refreshProductsFromApi();
});

async function refreshProductsFromApi() {
  const products = await getProducts();
  state.products = products.length ? products : sampleProducts;
  renderHomeProducts();
  renderListing();
  renderProductDetails();
  renderCart();
  updateSummary();
}

async function apiRequest(path, options = {}) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${normalized}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json") ? response.json() : response.text();
}

async function apiGetAny(paths) {
  for (const path of paths) {
    try {
      return await apiRequest(path);
    } catch (error) {
      if (!String(error.message).includes("404")) {
        throw error;
      }
    }
  }

  throw new Error("Endpoint not found");
}

async function getProducts() {
  try {
    const result = await apiGetAny(["/products", "/products/"]);
    return Array.isArray(result) ? result : result.products || sampleProducts;
  } catch {
    return sampleProducts;
  }
}

function renderHomeProducts() {
  const grid = document.querySelector("#featured .product-grid");
  if (!grid) return;
  grid.innerHTML = state.products.slice(0, 3).map(productCard).join("");
}

function renderListing() {
  const grid = document.querySelector(".product-grid.listing");
  if (!grid) return;

  const params = new URLSearchParams(window.location.search);
  const searchTerm = (params.get("q") || "").toLowerCase();
  const filtered = state.products.filter((product) => {
    const text = `${product.name} ${product.description} ${product.category}`.toLowerCase();
    return text.includes(searchTerm);
  });

  grid.innerHTML = (filtered.length ? filtered : state.products).map(productCard).join("");
}

function renderProductDetails() {
  const info = document.querySelector(".detail-info");
  const media = document.querySelector(".detail-media");
  if (!info || !media) return;

  const id = Number(new URLSearchParams(window.location.search).get("id")) || 1;
  const product = state.products.find((item) => Number(item.id) === id) || state.products[0];
  media.className = `detail-media product-media ${productImageClass(product)}`;
  info.innerHTML = `
    <p class="eyebrow">AI recommended</p>
    <h1>${escapeHtml(product.name)}</h1>
    <div class="rating">${product.rating || 4.7} rating | Stock ${product.stock ?? "available"}</div>
    <p class="detail-description">${escapeHtml(product.description || "Premium ecommerce product selected by Nexora AI.")}</p>
    <div class="detail-price">${formatPrice(product.price)} <span>${formatPrice(Number(product.price || 0) + 40)}</span></div>
    <div class="button-row">
      <button class="button primary" type="button" data-add-product="${product.id}">Add to cart</button>
      <button class="button secondary" type="button">Save item</button>
    </div>
    <div class="insight-box">
      <strong>AI shopping insight</strong>
      <p>This item is a strong match for quality, price, and current stock availability.</p>
    </div>
  `;
}

function renderCart() {
  const cartSection = document.querySelector(".checkout-layout > section");
  if (!cartSection || !location.pathname.endsWith("cart.html")) return;

  const cartItems = getCartItems();
  cartSection.innerHTML = `
    <div class="section-header compact"><div><p class="eyebrow">Shopping Cart</p><h1>Your selected items</h1></div></div>
    <div class="cart-list">
      ${
        cartItems.length
          ? cartItems.map(cartItemTemplate).join("")
          : '<div class="empty-state">Your cart is empty. Add products from the listing page.</div>'
      }
    </div>
  `;

  updateSummary();
}

function renderOrders() {
  const list = document.querySelector(".orders-list");
  if (!list) return;

  const fallbackOrders = [
    { id: "NX-10482", status: "Out for delivery", total_price: 189, product_id: 1 },
    { id: "NX-10411", status: "Delivered", total_price: 129, product_id: 3 },
    { id: "NX-10391", status: "Refund processing", total_price: 96, product_id: 5 },
  ];

  apiGetAny(["/orders", "/orders/"])
    .then((orders) => {
      const data = Array.isArray(orders) ? orders : fallbackOrders;
      list.innerHTML = data.map(orderTemplate).join("");
    })
    .catch(() => {
      list.innerHTML = fallbackOrders.map(orderTemplate).join("");
    });
}

function productCard(product) {
  return `
    <article class="product-card">
      <a href="product-details.html?id=${product.id}" class="product-media ${productImageClass(product)}"></a>
      <div class="product-body">
        <div class="rating">${product.rating || 4.6} rating</div>
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(product.description || "Quality product ready to ship.")}</p>
        <div class="price-row">
          <strong>${formatPrice(product.price)}</strong>
          <button type="button" data-add-product="${product.id}">Add</button>
        </div>
      </div>
    </article>
  `;
}

function cartItemTemplate(item) {
  return `
    <article class="cart-item" data-cart-product="${item.product.id}">
      <div class="cart-thumb ${productImageClass(item.product)}"></div>
      <div>
        <h3>${escapeHtml(item.product.name)}</h3>
        <p>${escapeHtml(item.product.category || "Product")} | Quantity ${item.quantity}</p>
        <strong>${formatPrice(item.product.price)}</strong>
      </div>
      <div class="quantity">
        <button type="button" data-qty="-1">-</button>
        <span>${item.quantity}</span>
        <button type="button" data-qty="1">+</button>
      </div>
      <button class="remove" type="button" data-remove-product="${item.product.id}">Remove</button>
    </article>
  `;
}

function orderTemplate(order) {
  const product = state.products.find((item) => Number(item.id) === Number(order.product_id));
  const status = order.status || "Processing";
  const statusClass = status.toLowerCase().includes("deliver") ? "delivered" : status.toLowerCase().includes("refund") ? "pending" : "shipped";
  return `
    <article class="order-card">
      <div><strong>#${escapeHtml(String(order.id))}</strong><p>${escapeHtml(product?.name || "Order item")} | ${escapeHtml(status)}</p></div>
      <span class="status ${statusClass}">${escapeHtml(status)}</span>
      <div class="timeline"><span class="done"></span><span class="done"></span><span class="active-step"></span><span></span></div>
    </article>
  `;
}

function bindStaticAddButtons() {
  document.addEventListener("click", async (event) => {
    const addButton = event.target.closest("[data-add-product]");
    const removeButton = event.target.closest("[data-remove-product]");
    const qtyButton = event.target.closest("[data-qty]");

    if (addButton) {
      await addToCart(Number(addButton.dataset.addProduct));
    }

    if (removeButton) {
      removeFromCart(Number(removeButton.dataset.removeProduct));
    }

    if (qtyButton) {
      const item = qtyButton.closest("[data-cart-product]");
      changeQuantity(Number(item.dataset.cartProduct), Number(qtyButton.dataset.qty));
    }
  });
}

async function addToCart(productId) {
  const product = state.products.find((item) => Number(item.id) === Number(productId));
  if (!product) return;

  const existing = state.cart.find((item) => Number(item.product_id) === Number(productId));
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ product_id: productId, quantity: 1 });
  }

  writeStore("nexoraCart", state.cart);
  updateSummary();
  showToast(`${product.name} added to cart`);

  try {
    await apiRequest("/cart", {
      method: "POST",
      body: JSON.stringify({
        user_id: state.user?.id || 1,
        product_id: productId,
        quantity: existing?.quantity || 1,
      }),
    });
  } catch {
    showToast("Saved locally. Start FastAPI to sync cart.");
  }
}

function removeFromCart(productId) {
  state.cart = state.cart.filter((item) => Number(item.product_id) !== Number(productId));
  writeStore("nexoraCart", state.cart);
  renderCart();
}

function changeQuantity(productId, delta) {
  const item = state.cart.find((cartItem) => Number(cartItem.product_id) === Number(productId));
  if (!item) return;
  item.quantity = Math.max(1, item.quantity + delta);
  writeStore("nexoraCart", state.cart);
  renderCart();
}

function getCartItems() {
  return state.cart
    .map((item) => ({
      ...item,
      product: state.products.find((product) => Number(product.id) === Number(item.product_id)),
    }))
    .filter((item) => item.product);
}

function updateSummary() {
  const summary = document.querySelector(".summary-card");
  if (!summary) return;

  const subtotal = getCartItems().reduce((total, item) => total + Number(item.product.price || 0) * item.quantity, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;
  const isCheckout = location.pathname.endsWith("checkout.html");

  summary.innerHTML = `
    <h2>Order summary</h2>
    <div><span>${isCheckout ? "Items" : "Subtotal"}</span><strong>${formatPrice(subtotal)}</strong></div>
    <div><span>Shipping</span><strong>Free</strong></div>
    <div><span>Tax</span><strong>${formatPrice(tax)}</strong></div>
    <div class="summary-total"><span>Total</span><strong>${formatPrice(total)}</strong></div>
    ${isCheckout ? "" : '<a class="button primary full" href="checkout.html">Checkout</a>'}
  `;
}

function bindAuthForms() {
  const form = document.querySelector(".auth-form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    const isRegister = location.pathname.endsWith("register.html");
    const fallbackValues = readInputs(form);

    try {
      const result = await apiRequest(isRegister ? "/auth/register" : "/auth/login", {
        method: "POST",
        body: JSON.stringify({ ...fallbackValues, ...values }),
      });

      state.user = result.user || result;
      state.token = result.access_token || result.token || "";
      writeStore("nexoraUser", state.user);
      if (state.token) localStorage.setItem("nexoraToken", state.token);
      showToast(isRegister ? "Registration successful" : "Login successful");
      setTimeout(() => (window.location.href = "products.html"), 600);
    } catch (error) {
      showToast(`Backend error: ${friendlyError(error)}`);
    }
  });
}

function bindCheckout() {
  const form = document.querySelector(".checkout-form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const total = getCartItems().reduce((sum, item) => sum + Number(item.product.price || 0) * item.quantity, 0);
    const firstProduct = state.cart[0];

    try {
      await apiRequest("/orders", {
        method: "POST",
        body: JSON.stringify({
          user_id: state.user?.id || 1,
          total_price: total,
          status: "Placed",
          product_id: firstProduct?.product_id || 1,
        }),
      });
      state.cart = [];
      writeStore("nexoraCart", state.cart);
      showToast("Order placed successfully");
      setTimeout(() => (window.location.href = "orders.html"), 700);
    } catch (error) {
      showToast(`Order saved locally. Backend says: ${friendlyError(error)}`);
    }
  });
}

function bindSearch() {
  document.querySelectorAll(".search-bar").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const query = form.querySelector("input")?.value.trim() || "";
      window.location.href = `products.html?q=${encodeURIComponent(query)}`;
    });
  });
}

function bindChatbot() {
  document.querySelectorAll(".chat-input").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = form.querySelector("input");
      const message = input.value.trim();

      if (!message) return;

      const messages = form.closest(".chat-window").querySelector(".chat-messages");
      messages.insertAdjacentHTML("beforeend", `<p class="user">${escapeHtml(message)}</p>`);
      messages.insertAdjacentHTML("beforeend", `<p class="bot">${getAiReply(message)}</p>`);
      input.value = "";
      messages.scrollTop = messages.scrollHeight;
    });
  });
}

function getAiReply(message) {
  const text = message.toLowerCase();

  if (text.includes("track") || text.includes("order")) {
    return "Give me an order id like NX-10482. I can call the orders API when your FastAPI server is running.";
  }

  if (text.includes("place") || text.includes("buy")) {
    return "I can prepare the order from your cart and send you to checkout for final confirmation.";
  }

  if (text.includes("recommend") || text.includes("suggest")) {
    return "Based on rating and stock, PulseWave Pro Headphones and EchoDock Studio Speaker are strong recommendations.";
  }

  return "I can help with product recommendations, order tracking, and natural language checkout.";
}

function updateAuthLinks() {
  const login = document.querySelector(".nav-cta");
  if (login && state.user) {
    login.textContent = state.user.username || "Account";
    login.href = "orders.html";
  }
}

function productImageClass(product) {
  const image = String(product.image || product.name || "").toLowerCase();
  if (image.includes("watch")) return "watch";
  if (image.includes("speaker")) return "speaker";
  if (image.includes("lamp")) return "lamp";
  if (image.includes("bag")) return "bag";
  if (image.includes("camera")) return "camera";
  return "headphones";
}

function readInputs(form) {
  const inputs = [...form.querySelectorAll("input, select")];
  const keys = ["username", "email", "password"];
  return inputs.reduce((values, input, index) => {
    values[input.name || keys[index] || `field_${index}`] = input.value;
    return values;
  }, {});
}

function readStore(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatPrice(value) {
  return `$${Number(value || 0).toFixed(0)}`;
}

function showToast(message) {
  const toast = document.querySelector(".toast") || document.body.appendChild(document.createElement("div"));
  toast.className = "toast";
  toast.textContent = message;
  requestAnimationFrame(() => toast.classList.add("show"));
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 3000);
}

function friendlyError(error) {
  return String(error.message || error).slice(0, 140);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
