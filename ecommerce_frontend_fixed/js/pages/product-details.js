import { getProduct, getProducts } from "../services/productService.js";
import { addLocalCart, syncCartItem } from "../services/cartService.js";
import { escapeHtml, productImage } from "../utils/images.js";
import { initLayout, toast } from "../utils/ui.js";

initLayout();

const id = new URLSearchParams(location.search).get("id") || 1;
const product = await getProduct(id);
const products = await getProducts();

document.getElementById("productDetails").innerHTML = `
<section class="detail-media product-media">${productImage(product, "detail-image")}</section>

<section class="detail-info">
  <p class="eyebrow">${escapeHtml(product.category || "Product")}</p>

  <h1>${escapeHtml(product.name)}</h1>

  <div class="rating">
    ${product.rating || 4.5} rating | Stock ${product.stock}
  </div>

  <p>${escapeHtml(product.description || "")}</p>

  <strong class="price">$${product.price}</strong>

  <div class="detail-actions">
    <button class="btn primary" data-add="${product.id}">
      Add to Cart
    </button>

    <a class="btn ghost" href="cart.html">
      Go to Cart
    </a>
  </div>
</section>
`;

document.getElementById("recommendations").innerHTML = products
  .filter((item) => Number(item.id) !== Number(product.id))
  .slice(0, 3)
  .map(
    (item) => `
      <article class="product-card">
        <a
          class="product-media"
          href="product-details.html?id=${item.id}"
        >${productImage(item)}</a>

        <div class="product-body">
          <h3>${escapeHtml(item.name)}</h3>

          <div class="price-row">
            <strong class="price">$${item.price}</strong>

            <button class="btn primary" data-add="${item.id}">
              Add
            </button>
          </div>
        </div>
      </article>
    `
  )
  .join("");

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-add]");

  if (!button) return;

  const productId = Number(button.dataset.add);

  addLocalCart(productId);

  try {
    await syncCartItem(productId);
  } catch {}

  toast("Product added to cart");
});
