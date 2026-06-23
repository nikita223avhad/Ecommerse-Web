import { getUser, isLoggedIn, logout } from "./auth.js";

export function toast(message, type = "info") {
  const el = document.body.appendChild(document.createElement("div"));
  el.className = `toast ${type}`;
  el.textContent = message;
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => el.remove(), 2800);
}

export function setLoading(target, message = "Loading...") {
  if (target) target.innerHTML = `<div class="empty-state">${message}</div>`;
}

export function setEmpty(target, message = "No data found.") {
  if (target) target.innerHTML = `<div class="empty-state">${message}</div>`;
}

export function initLayout() {
  hydrateHeader();
  injectFooter();
}

function hydrateHeader() {
  const header = document.querySelector(".topbar");
  if (!header) return;

  let nav = header.querySelector("nav");
  if (!nav) {
    nav = document.createElement("nav");
    header.appendChild(nav);
  }

  if (!header.querySelector(".menu-toggle")) {
    const button = document.createElement("button");
    button.className = "menu-toggle";
    button.type = "button";
    button.setAttribute("aria-label", "Open menu");
    button.textContent = "Menu";
    button.addEventListener("click", () => header.classList.toggle("nav-open"));
    header.insertBefore(button, nav);
  }

  const user = getUser();
  const loggedIn = isLoggedIn();
  const isAdmin = Boolean(user?.is_admin || user?.isAdmin || user?.role === "admin");
  const current = location.pathname.split("/").pop() || "index.html";
  const adminPage = current.startsWith("admin") || current.includes("product") && header.classList.contains("admin-top");
  const baseLinks = adminPage
    ? [
        ["admin-dashboard.html", "Dashboard"],
        ["admin-products.html", "Products"],
        ["admin-orders.html", "Orders"],
        ["admin-users.html", "Users"],
        ["index.html", "Store"],
      ]
    : [
        ["index.html", "Home"],
        ["products.html", "Products"],
        ["orders.html", "Orders"],
        ["cart.html", "Cart"],
      ];

  const links = baseLinks
    .map(([href, label]) => `<a class="${current === href ? "active" : ""}" href="${href}">${label}</a>`)
    .join("");

  nav.innerHTML = `${links}${
    loggedIn
      ? `<a class="${current === "profile.html" ? "active" : ""}" href="profile.html">Profile</a><button class="nav-button link-button" data-logout type="button">Logout</button>`
      : `<a href="login.html">Login</a><a class="nav-button" href="register.html">Register</a>`
  }${isAdmin && !adminPage ? `<a class="admin-link" href="admin-dashboard.html">Admin</a>` : ""}`;

  nav.querySelector("[data-logout]")?.addEventListener("click", logout);
}

function injectFooter() {
  if (document.querySelector(".site-footer") || document.body.classList.contains("no-footer")) return;
  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="footer-grid">
      <section><h3>Nexora</h3><a href="#">About Us</a><a href="#">Contact Us</a><a href="#">Careers</a></section>
      <section><h3>Quick Links</h3><a href="index.html">Home</a><a href="products.html">Products</a><a href="cart.html">Cart</a><a href="orders.html">Orders</a></section>
      <section><h3>Customer Support</h3><a href="#">Help Center</a><a href="#">Returns</a><a href="#">FAQs</a></section>
      <section><h3>Admin</h3><a href="admin-login.html">Admin Login</a><a href="admin-dashboard.html">Dashboard</a></section>
      <section><h3>Social</h3><div class="social-links"><a href="#" aria-label="LinkedIn">in</a><a href="#" aria-label="GitHub">GH</a><a href="#" aria-label="Instagram">IG</a><a href="#" aria-label="Twitter">X</a></div></section>
    </div>
    <div class="copyright">Copyright ${new Date().getFullYear()} Nexora Commerce. All rights reserved.</div>
  `;
  document.body.appendChild(footer);
}
