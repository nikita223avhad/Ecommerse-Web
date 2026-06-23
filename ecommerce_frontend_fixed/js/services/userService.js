import { ENDPOINTS } from "../config/api-config.js";
import { normalizeUser } from "../utils/auth.js";
import { apiFetch, firstSuccessful } from "./apiService.js";

export async function getCurrentUser() {
  const data = await firstSuccessful(
    ["/auth/me", "/users/me", `${ENDPOINTS.users}/me`, "/profile"],
    { redirectOnUnauthorized: true },
  );
  return normalizeUser(data?.user || data);
}

export async function getUsers() {
  try {
    const data = await firstSuccessful(["/admin/users", ENDPOINTS.users], { redirectOnUnauthorized: false });
    return Array.isArray(data) ? data : data.users || [];
  } catch {
    return [];
  }
}

export async function updateCurrentUser(payload) {
  return apiFetch(`${ENDPOINTS.users}/me`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
