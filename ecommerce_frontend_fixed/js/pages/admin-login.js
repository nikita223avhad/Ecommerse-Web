import { login } from "../services/authService.js";
import { isAdmin, getUser } from "../utils/auth.js";
import { toast } from "../utils/ui.js";

document
  .getElementById("adminLoginForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = Object.fromEntries(
      new FormData(event.target).entries()
    );

    try {
      await login(payload);

      const user = getUser();

        console.log("LOGGED USER:", user);

        const ADMIN_EMAILS = [
          "admin@test.com",
          "rohan12@gamil.com"
        ];

        if (!ADMIN_EMAILS.includes((user?.email || "").toLowerCase())) {
          toast("This account does not have admin permission.", "error");
          return;
        }

      location.href = "admin-dashboard.html";

    } catch (err) {
      toast(`Login failed: ${err.message}`, "error");
    }
  });