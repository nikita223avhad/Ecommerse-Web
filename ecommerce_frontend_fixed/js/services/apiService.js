import { API_BASE_URL } from "../config/api-config.js";
import { authHeaders, logout } from "../utils/auth.js";

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  if (response.status === 401 || response.status === 403) {
    if (options.redirectOnUnauthorized !== false) logout();
    throw new Error("Unauthorized request");
  }

  if (!response.ok) throw new Error(await response.text());
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function firstSuccessful(paths, options = {}) {
  let lastError;
  for (const path of paths) {
    try {
      return await apiFetch(path, options);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("No endpoint responded");
}
