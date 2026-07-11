/* Frontend/js/api.js
   All communication with the backend REST API using the Fetch API.

   The frontend is served by the same Express server that exposes the API,
   so we use a relative base URL ("/api"). If you instead open the frontend
   with Live Server on a different port, change API_BASE to the full URL,
   e.g. "http://localhost:3000/api".
*/

const API_BASE = "/api"

/* Generic request helper built on the Fetch API */
async function request(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })

  let data = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch (e) {
      data = text
    }
  }

  if (!res.ok) {
    const message = (data && data.message) || "Request failed"
    const error = new Error(message)
    error.status = res.status
    error.details = data && data.errors ? data.errors : null
    throw error
  }

  return data
}

/* -------- Products -------- */
const ProductsAPI = {
  list: () => request("/products"),
  get: (id) => request(`/products/${id}`),
  create: (body) => request("/products", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => request(`/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id) => request(`/products/${id}`, { method: "DELETE" }),
  stats: () => request("/products/stats"),
}

/* -------- Categories -------- */
const CategoriesAPI = {
  list: () => request("/categories"),
  get: (id) => request(`/categories/${id}`),
  create: (body) => request("/categories", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => request(`/categories/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id) => request(`/categories/${id}`, { method: "DELETE" }),
}

/* -------- Suppliers -------- */
const SuppliersAPI = {
  list: () => request("/suppliers"),
  get: (id) => request(`/suppliers/${id}`),
  create: (body) => request("/suppliers", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => request(`/suppliers/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id) => request(`/suppliers/${id}`, { method: "DELETE" }),
}
