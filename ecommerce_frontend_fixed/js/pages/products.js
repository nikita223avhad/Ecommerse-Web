import { getCategories, getProducts } from "../services/productService.js";
import { addLocalCart, syncCartItem } from "../services/cartService.js";
import { initLayout, toast } from "../utils/ui.js";
import { escapeHtml, productImage } from "../utils/images.js";

let products = await getProducts();
const params = new URLSearchParams(location.search);
const grid = document.getElementById("productGrid");
const categoryFilter = document.getElementById("categoryFilter");
const searchInput = document.querySelector("[name='q']");
const priceFilter = document.getElementById("priceFilter");
const priceValue = document.getElementById("priceValue");

initLayout();
bindSearch();
getCategories(products).forEach((category) => categoryFilter.insertAdjacentHTML("beforeend", `<option value="${category}">${category}</option>`));
if (params.get("category")) categoryFilter.value = params.get("category");
if (params.get("q") && searchInput) searchInput.value = params.get("q");
const highestPrice = Math.max(1000, ...products.map((product) => Number(product.price) || 0));
priceFilter.max = String(Math.ceil(highestPrice));
priceFilter.value = String(Math.ceil(highestPrice));
render();

document.querySelectorAll("#categoryFilter,#priceFilter,#ratingFilter,#stockFilter,#sortProducts,[name='q']").forEach((input) => input.addEventListener("input", render));
document.getElementById("resetFilters").addEventListener("click", () => {
  categoryFilter.value = "";
  if (searchInput) searchInput.value = "";
  priceFilter.value = priceFilter.max;
  document.getElementById("ratingFilter").value = "";
  document.getElementById("stockFilter").checked = false;
  document.getElementById("sortProducts").value = "newest";
  render();
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-add]");
  if (!button) return;
  const productId = Number(button.dataset.add);
  addLocalCart(productId);
  try {
    await syncCartItem(productId);
    toast("Added to cart");
  } catch {
    toast("Added locally. Backend not running.");
  }
});

function render() {
  const q = (searchInput?.value || params.get("q") || "").toLowerCase().trim();
  const max = Number(priceFilter.value);
  if (priceValue) priceValue.textContent = `$${max}`;
  const minRating = Number(document.getElementById("ratingFilter").value || 0);
  const inStock = document.getElementById("stockFilter").checked;
  const sort = document.getElementById("sortProducts").value;
  let data = products.filter((product) => {
    const text = `${product.name} ${product.description} ${product.category}`.toLowerCase();
    return (!q || text.includes(q)) && (!categoryFilter.value || product.category === categoryFilter.value) && Number(product.price) <= max && Number(product.rating || 4.5) >= minRating && (!inStock || Number(product.stock) > 0);
  });
  if (sort === "price-low") data.sort((a, b) => a.price - b.price);
  if (sort === "price-high") data.sort((a, b) => b.price - a.price);
  if (sort === "newest") data.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
  grid.innerHTML = data.map(productCard).join("") || `<div class="panel"><p>No products found.</p></div>`;
}
function productCard(product) {
  const stock = Number(product.stock || 0);
  return `<article class="product-card">
    <a class="product-media" href="product-details.html?id=${product.id}">${productImage(product)}</a>
    <div class="product-body"><div class="product-badges"><span>${stock > 0 ? "In stock" : "Out of stock"}</span><span>${escapeHtml(product.category || "General")}</span></div><div class="rating">${product.rating || 4.5} rating</div><h3>${escapeHtml(product.name)}</h3><p>${escapeHtml(product.description || "")}</p>
    <div class="price-row"><strong class="price">$${product.price}</strong><button class="btn primary" data-add="${product.id}" ${stock <= 0 ? "disabled" : ""}>Add</button></div></div>
  </article>`;
}
function bindSearch() {
  document.querySelector("[data-search-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });
}
