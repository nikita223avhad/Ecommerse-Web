import { API_BASE_URL, ENDPOINTS } from "../config/api-config.js";
import { setSession } from "../utils/auth.js";

async function postAuth(path, payload) {
  let response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok && path.includes("login")) {
    const form = new URLSearchParams();
    form.set("username", payload.email || payload.username || "");
    form.set("password", payload.password || "");
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
  }

  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  setSession(data);
  return data;
}

export function login(payload) {
  return postAuth(ENDPOINTS.login, payload);
}

export function register(payload) {
  return postAuth(ENDPOINTS.register, payload);
}
