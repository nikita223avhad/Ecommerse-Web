import { register } from "../services/authService.js";
import { toast } from "../utils/ui.js";

document.getElementById("registerForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(event.target).entries());
  try {
    await register(payload);
    location.href = "products.html";
  } catch (error) {
    toast(`Register failed: ${error.message}`, "error");
  }
});
