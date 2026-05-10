import axios from "axios";

/**
 * Vercel/dashboard mistakes often paste the whole `.env` line as the value, e.g.
 * `VITE_API_BASE_URL=https://api.example.com/api`. Strip that prefix so requests
 * hit the real origin instead of `/VITE_API_BASE_URL=https://...` on the static host.
 * @param {string | undefined} raw
 */
function normalizeApiBaseUrl(raw) {
  if (raw == null || typeof raw !== "string") return "";
  let s = raw.trim().replace(/\/$/, "");
  if (!s) return "";
  const m = /^VITE_API_BASE_URL\s*=\s*(.+)$/i.exec(s);
  if (m) s = m[1].trim().replace(/\/$/, "");
  return s;
}

function toErrorMessage(value) {
  if (value == null) return "Request failed";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    if (typeof value.message === "string") return value.message;
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

const fromEnv = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
// Local dev: default Express API. Production (e.g. Vercel): set VITE_API_BASE_URL
// to your deployed API (e.g. https://api.example.com/api), or serve /api via proxy.
const baseURL =
  fromEnv ||
  (import.meta.env.DEV ? "http://localhost:4000/api" : "/api");

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

/**
 * @param {string} path
 */
async function unwrap(path, promise) {
  try {
    const { data } = await promise;
    return data;
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const msg = toErrorMessage(
        e.response?.data?.error ??
          e.response?.data?.message ??
          e.message ??
          "Request failed"
      );
      const err = new Error(msg);
      err.statusCode = e.response?.status;
      err.details = e.response?.data?.details;
      throw err;
    }
    throw e;
  }
}

export const signalsApi = {
  /** @returns {Promise<{ success: boolean, data: object }>} */
  list: () => unwrap("GET /signals", api.get("/signals")),

  /** @returns {Promise<{ success: boolean, data: object }>} */
  create: (payload) =>
    unwrap("POST /signals", api.post("/signals", payload)),

  /** @returns {Promise<void>} */
  remove: (id) => api.delete(`/signals/${id}`),

  /** @returns {Promise<{ success: boolean, data: object }>} */
  patch: (id, payload) =>
    unwrap("PATCH /signals/:id", api.patch(`/signals/${id}`, payload)),

  /** @returns {Promise<{ success: boolean, data: object }>} */
  getById: (id) => unwrap("GET /signals/:id", api.get(`/signals/${id}`)),

  /** @returns {Promise<{ success: boolean, signal: object, meta?: object }>} */
  getStatus: (id) =>
    unwrap("GET /signals/:id/status", api.get(`/signals/${id}/status`)),
};
