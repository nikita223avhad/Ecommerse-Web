import { getCategories, getProducts } from "../services/productService.js";
import { addLocalCart, syncCartItem } from "../services/cartService.js";
import { escapeHtml, productImage } from "../utils/images.js";
import { initLayout, toast } from "../utils/ui.js";

const products = await getProducts();
initLayout();
bindSearch();

document.getElementById("categoryGrid").innerHTML = getCategories(products)
  .map((category) => `<a class="category-card" href="products.html?category=${encodeURIComponent(category)}"><strong>${escapeHtml(category)}</strong><span class="muted">Explore products</span></a>`)
  .join("");

document.getElementById("featuredProducts").innerHTML = products
  .slice(0, 3)
  .map((product) => `<div class="mini-item"><strong>${product.name}</strong><p class="muted">$${product.price}</p></div>`)
  .join("");

document.getElementById("productGrid").innerHTML = products.slice(0, 6).map(productCard).join("");

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-add]");
  if (!button) return;
  const productId = Number(button.dataset.add);
  addLocalCart(productId);
  try {
    await syncCartItem(productId);
    toast("Added to cart and synced");
  } catch {
    toast("Added to cart locally");
  }
});

function productCard(product) {
  return `<article class="product-card">
    <a class="product-media" href="product-details.html?id=${product.id}">${productImage(product)}</a>
    <div class="product-body"><div class="rating">${product.rating || 4.5} rating</div><h3>${escapeHtml(product.name)}</h3><p>${escapeHtml(product.description || "")}</p>
    <div class="price-row"><strong class="price">$${product.price}</strong><button class="btn primary" data-add="${product.id}">Add</button></div></div>
  </article>`;
}

function bindSearch() {
  document.querySelector("[data-search-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    const q = new FormData(event.target).get("q") || "";
    window.location.href = `products.html?q=${encodeURIComponent(q)}`;
  });
}
