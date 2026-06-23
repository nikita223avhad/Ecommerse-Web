import { login } from "../services/authService.js";
import { toast } from "../utils/ui.js";

document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(event.target).entries());
  try {
    await login(payload);
    const next = new URLSearchParams(location.search).get("next");
    location.href = next || "products.html";
  } catch (error) {
    toast(`Login failed: ${error.message}`, "error");
  }
});
