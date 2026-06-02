import axios from "axios";

/** Normalize path so requests always hit site root `/api/...` (Vite proxy + preview). */
function normalizeApiPath(path) {
  if (!path) return "/";
  const s = String(path).trim();
  if (/^https?:\/\//i.test(s)) return s;
  return s.startsWith("/") ? s : `/${s}`;
}

/** Use full backend URL only when set to http(s). Empty / invalid → same-origin (dev proxy). */
function resolveBaseURL() {
  const raw = String(import.meta.env.VITE_API_BASE_URL ?? "").trim();
  if (!raw || raw === '""') return undefined;
  if (/^https?:\/\//i.test(raw)) return raw.replace(/\/+$/, "");
  return undefined;
}

const api = axios.create({
  baseURL: resolveBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
});

export async function apiRequest(path, options = {}, retries = 2) {
  const url = normalizeApiPath(path);
  let attempt = 0;
  while (attempt <= retries) {
    try {
      const response = await api.request({
        url,
        method: options.method || "GET",
        data: options.body ? JSON.parse(options.body) : undefined,
        headers: options.headers,
      });

      return response.data ?? null;
    } catch (error) {
      attempt++;
      const status = error.response?.status;
      if (error.response && status >= 400 && status < 500 && status !== 429) {
        let message = error?.response?.data?.error || error?.message || "Request failed";
        if (status === 404 && import.meta.env.DEV) {
          message =
            "API route not found (404). Run the server in /server (port 5000) or set VITE_API_BASE_URL to your API URL.";
        }
        throw new Error(message);
      }
      if (attempt > retries) {
        const message = error?.response?.data?.error || error?.message || "Request failed after multiple attempts";
        throw new Error(message);
      }
      await new Promise((res) => setTimeout(res, 1000));
    }
  }
}
