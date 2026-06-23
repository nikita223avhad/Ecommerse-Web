import { deleteProduct, getProducts } from "../services/productService.js";
import { requireAdmin } from "../utils/auth.js";
import { escapeHtml, productImage } from "../utils/images.js";
import { initLayout, toast } from "../utils/ui.js";

if (!requireAdmin()) throw new Error("Admin access required");
initLayout();
let products = await getProducts();
render();

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-delete]");
  if (!button) return;
  if (!confirm("Delete this product?")) return;
  try {
    await deleteProduct(button.dataset.delete);
    products = products.filter((product) => Number(product.id) !== Number(button.dataset.delete));
    render();
    toast("Product deleted");
  } catch (error) {
    toast(`Delete failed: ${error.message}`, "error");
  }
});

function render() {
  document.getElementById("adminProductsTable").innerHTML = products
    .map((product) => `<tr><td><div class="admin-product-cell">${productImage(product, "admin-thumb")}<span>${escapeHtml(product.name)}</span></div></td><td>${escapeHtml(product.category || "")}</td><td>$${product.price}</td><td>${product.stock}</td><td><a class="btn ghost" href="edit-product.html?id=${product.id}">Edit</a><button class="btn danger" data-delete="${product.id}" type="button">Delete</button></td></tr>`)
    .join("") || `<tr><td colspan="5">No products found.</td></tr>`;
}
