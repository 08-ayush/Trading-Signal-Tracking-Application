import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:4000/api";

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
      const msg =
        e.response?.data?.error ??
        e.response?.data?.message ??
        e.message ??
        "Request failed";
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
