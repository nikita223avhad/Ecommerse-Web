import { getProduct, updateProduct } from "../services/productService.js";
import { requireAdmin } from "../utils/auth.js";
import { initLayout, toast } from "../utils/ui.js";

if (!requireAdmin()) throw new Error("Admin access required");
initLayout();
const id = new URLSearchParams(location.search).get("id") || 1;
const product = await getProduct(id);
const form = document.getElementById("editProductForm");

Object.entries(product).forEach(([key, value]) => {
  const input = form.elements[key];
  if (input) input.value = value;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = new FormData(form);
  try {
    await updateProduct(id, payload);
    toast("Product updated");
    location.href = "admin-products.html";
  } catch (error) {
    toast(`Backend error: ${error.message}`, "error");
  }
});
