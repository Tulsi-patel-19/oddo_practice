/* Frontend/js/script.js
   Vanilla JavaScript for the Inventory Management System.
   Organized into small functions. No frameworks, no libraries. */

/* ============================================================
   SHARED UI HELPERS
   ============================================================ */

/* Sidebar toggle (mobile) */
function initSidebar() {
  const sidebar = document.getElementById("sidebar")
  const hamburger = document.getElementById("hamburger")
  const backdrop = document.getElementById("backdrop")
  if (!sidebar || !hamburger) return

  const open = () => {
    sidebar.classList.add("open")
    backdrop.classList.add("open")
  }
  const close = () => {
    sidebar.classList.remove("open")
    backdrop.classList.remove("open")
  }

  hamburger.addEventListener("click", () => {
    sidebar.classList.contains("open") ? close() : open()
  })
  backdrop.addEventListener("click", close)
}

/* Toast notifications */
function toast(message, type = "success") {
  let wrap = document.querySelector(".toast-wrap")
  if (!wrap) {
    wrap = document.createElement("div")
    wrap.className = "toast-wrap"
    document.body.appendChild(wrap)
  }
  const icons = { success: "fa-circle-check", error: "fa-circle-exclamation", info: "fa-circle-info" }
  const el = document.createElement("div")
  el.className = `toast ${type}`
  el.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span></span>`
  el.querySelector("span").textContent = message
  wrap.appendChild(el)
  setTimeout(() => {
    el.style.opacity = "0"
    el.style.transform = "translateX(30px)"
    el.style.transition = "all 0.25s"
    setTimeout(() => el.remove(), 250)
  }, 3000)
}

/* Modal open/close */
function openModal(id) {
  const m = document.getElementById(id)
  if (m) m.classList.add("open")
}
function closeModal(id) {
  const m = document.getElementById(id)
  if (m) m.classList.remove("open")
}

/* Close modal on overlay click + Escape key */
function initModalDismiss() {
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("mousedown", (e) => {
      if (e.target === overlay) overlay.classList.remove("open")
    })
  })
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay.open").forEach((m) => m.classList.remove("open"))
    }
  })
}

/* Confirmation dialog (returns a Promise<boolean>) */
function confirmDialog(message) {
  return new Promise((resolve) => {
    const overlay = document.getElementById("confirmModal")
    const msgEl = document.getElementById("confirmMessage")
    const yesBtn = document.getElementById("confirmYes")
    const noBtn = document.getElementById("confirmNo")
    if (!overlay) return resolve(window.confirm(message))

    msgEl.textContent = message
    overlay.classList.add("open")

    const cleanup = () => {
      overlay.classList.remove("open")
      yesBtn.removeEventListener("click", onYes)
      noBtn.removeEventListener("click", onNo)
    }
    const onYes = () => {
      cleanup()
      resolve(true)
    }
    const onNo = () => {
      cleanup()
      resolve(false)
    }
    yesBtn.addEventListener("click", onYes)
    noBtn.addEventListener("click", onNo)
  })
}

/* Live search filter over a table body */
function initTableSearch(inputId, tbodyId) {
  const input = document.getElementById(inputId)
  const tbody = document.getElementById(tbodyId)
  if (!input || !tbody) return
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase()
    let visible = 0
    tbody.querySelectorAll("tr[data-row]").forEach((tr) => {
      const match = tr.textContent.toLowerCase().includes(q)
      tr.style.display = match ? "" : "none"
      if (match) visible++
    })
    const emptyRow = tbody.querySelector("tr[data-search-empty]")
    if (emptyRow) emptyRow.remove()
    if (visible === 0 && q) {
      const cols = tbody.closest("table").querySelectorAll("thead th").length
      const tr = document.createElement("tr")
      tr.setAttribute("data-search-empty", "")
      tr.className = "state-row"
      tr.innerHTML = `<td colspan="${cols}">No results found for "${escapeHtml(q)}"</td>`
      tbody.appendChild(tr)
    }
  })
}

/* Small helpers */
function escapeHtml(str) {
  if (str === null || str === undefined) return ""
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function money(n) {
  const num = Number(n) || 0
  return "$" + num.toFixed(2)
}

function stockPill(stock) {
  const s = Number(stock)
  if (s <= 0) return `<span class="pill pill-red"><i class="fa-solid fa-ban"></i> Out</span>`
  if (s < 10) return `<span class="pill pill-amber"><i class="fa-solid fa-triangle-exclamation"></i> ${s} low</span>`
  return `<span class="pill pill-green"><i class="fa-solid fa-check"></i> ${s}</span>`
}

function loadingRow(tbodyId, cols) {
  const tbody = document.getElementById(tbodyId)
  if (tbody) tbody.innerHTML = `<tr class="state-row"><td colspan="${cols}"><span class="spinner"></span></td></tr>`
}

function errorRow(tbodyId, cols, msg) {
  const tbody = document.getElementById(tbodyId)
  if (tbody)
    tbody.innerHTML = `<tr class="state-row"><td colspan="${cols}"><i class="fa-solid fa-plug-circle-xmark"></i> ${escapeHtml(
      msg
    )}</td></tr>`
}

function emptyRow(tbodyId, cols, msg) {
  const tbody = document.getElementById(tbodyId)
  if (tbody) tbody.innerHTML = `<tr class="state-row"><td colspan="${cols}">${escapeHtml(msg)}</td></tr>`
}

/* Form validation helpers */
function clearErrors(form) {
  form.querySelectorAll(".field-error").forEach((e) => (e.textContent = ""))
  form.querySelectorAll(".invalid").forEach((e) => e.classList.remove("invalid"))
}

function setError(form, field, message) {
  const input = form.querySelector(`[name="${field}"]`)
  if (input) {
    input.classList.add("invalid")
    const err = input.parentElement.querySelector(".field-error")
    if (err) err.textContent = message
  }
}

/* ============================================================
   PAGE: DASHBOARD
   ============================================================ */

async function initDashboard() {
  try {
    const stats = await ProductsAPI.stats()
    countUp("statProducts", stats.totalProducts)
    countUp("statCategories", stats.totalCategories)
    countUp("statSuppliers", stats.totalSuppliers)
    countUp("statLowStock", stats.lowStock)
    const badge = document.getElementById("notifBadge")
    if (badge) badge.textContent = stats.lowStock
  } catch (e) {
    toast("Could not load dashboard stats", "error")
  }

  // Low stock table
  try {
    loadingRow("lowStockBody", 4)
    const products = await ProductsAPI.list()
    const low = products.filter((p) => Number(p.stock) < 10).sort((a, b) => a.stock - b.stock)
    const tbody = document.getElementById("lowStockBody")
    if (!low.length) {
      emptyRow("lowStockBody", 4, "All products are well stocked.")
      return
    }
    tbody.innerHTML = low
      .map(
        (p) => `
      <tr data-row>
        <td class="cell-strong">${escapeHtml(p.name)}</td>
        <td><span class="pill pill-blue">${escapeHtml(p.category_name || "-")}</span></td>
        <td>${money(p.price)}</td>
        <td>${stockPill(p.stock)}</td>
      </tr>`
      )
      .join("")
  } catch (e) {
    errorRow("lowStockBody", 4, "Failed to load products. Is the backend running?")
  }
}

function setText(id, value) {
  const el = document.getElementById(id)
  if (el) el.textContent = value
}

/* Animated count-up (nice touch, pure JS) */
function countUp(id, target) {
  const el = document.getElementById(id)
  if (!el) return
  const end = Number(target) || 0
  const dur = 600
  const start = performance.now()
  function frame(now) {
    const p = Math.min((now - start) / dur, 1)
    el.textContent = Math.round(p * end)
    if (p < 1) requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

/* ============================================================
   PAGE: PRODUCTS
   ============================================================ */

let productCategories = []
let productSuppliers = []

async function initProducts() {
  initTableSearch("searchInput", "productsBody")

  document.getElementById("addBtn").addEventListener("click", () => openProductForm())
  document.getElementById("productForm").addEventListener("submit", submitProduct)

  // Load reference data for the dropdowns
  try {
    ;[productCategories, productSuppliers] = await Promise.all([CategoriesAPI.list(), SuppliersAPI.list()])
    fillSelect("p_category_id", productCategories, "Select category")
    fillSelect("p_supplier_id", productSuppliers, "Select supplier")
  } catch (e) {
    /* handled on table load */
  }

  await loadProducts()
}

function fillSelect(id, items, placeholder) {
  const sel = document.getElementById(id)
  if (!sel) return
  sel.innerHTML =
    `<option value="">${placeholder}</option>` +
    items.map((i) => `<option value="${i.id}">${escapeHtml(i.name)}</option>`).join("")
}

async function loadProducts() {
  loadingRow("productsBody", 6)
  try {
    const products = await ProductsAPI.list()
    const tbody = document.getElementById("productsBody")
    if (!products.length) {
      emptyRow("productsBody", 6, "No products yet. Click \u201cAdd Product\u201d to create one.")
      return
    }
    tbody.innerHTML = products
      .map(
        (p) => `
      <tr data-row>
        <td class="cell-strong">${escapeHtml(p.name)}</td>
        <td>${money(p.price)}</td>
        <td>${stockPill(p.stock)}</td>
        <td><span class="pill pill-blue">${escapeHtml(p.category_name || "-")}</span></td>
        <td class="muted">${escapeHtml(p.supplier_name || "-")}</td>
        <td>
          <div class="actions">
            <button class="action-btn view" title="View" onclick="viewProduct(${p.id})"><i class="fa-solid fa-eye"></i></button>
            <button class="action-btn edit" title="Edit" onclick="editProduct(${p.id})"><i class="fa-solid fa-pen"></i></button>
            <button class="action-btn delete" title="Delete" onclick="deleteProduct(${p.id})"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>`
      )
      .join("")
  } catch (e) {
    errorRow("productsBody", 6, "Failed to load products. Is the backend running?")
  }
}

function openProductForm(product) {
  const form = document.getElementById("productForm")
  form.reset()
  clearErrors(form)
  document.getElementById("productModalTitle").textContent = product ? "Edit Product" : "Add Product"
  document.getElementById("p_id").value = product ? product.id : ""
  if (product) {
    form.name.value = product.name
    form.price.value = product.price
    form.stock.value = product.stock
    form.category_id.value = product.category_id || ""
    form.supplier_id.value = product.supplier_id || ""
  }
  openModal("productModal")
  setTimeout(() => form.name.focus(), 50)
}

function validateProductForm(form) {
  clearErrors(form)
  let ok = true
  if (!form.name.value.trim()) {
    setError(form, "name", "Product name is required")
    ok = false
  }
  if (form.price.value === "" || Number(form.price.value) < 0 || isNaN(Number(form.price.value))) {
    setError(form, "price", "Enter a valid price")
    ok = false
  }
  if (form.stock.value === "" || Number(form.stock.value) < 0 || isNaN(Number(form.stock.value))) {
    setError(form, "stock", "Enter a valid stock quantity")
    ok = false
  }
  return ok
}

async function submitProduct(e) {
  e.preventDefault()
  const form = e.target
  if (!validateProductForm(form)) return

  const id = form.id.value
  const body = {
    name: form.name.value.trim(),
    price: Number(form.price.value),
    stock: Number(form.stock.value),
    category_id: form.category_id.value || null,
    supplier_id: form.supplier_id.value || null,
  }

  const btn = form.querySelector("[type=submit]")
  btn.disabled = true
  try {
    if (id) {
      await ProductsAPI.update(id, body)
      toast("Product updated")
    } else {
      await ProductsAPI.create(body)
      toast("Product added")
    }
    closeModal("productModal")
    await loadProducts()
  } catch (err) {
    toast(err.message || "Save failed", "error")
  } finally {
    btn.disabled = false
  }
}

async function editProduct(id) {
  try {
    const product = await ProductsAPI.get(id)
    openProductForm(product)
  } catch (e) {
    toast("Could not load product", "error")
  }
}

async function viewProduct(id) {
  try {
    const p = await ProductsAPI.get(id)
    const body = document.getElementById("viewBody")
    body.innerHTML = `
      <div class="form-group"><label>Product Name</label><div class="cell-strong">${escapeHtml(p.name)}</div></div>
      <div class="form-row">
        <div class="form-group"><label>Price</label><div>${money(p.price)}</div></div>
        <div class="form-group"><label>Stock</label><div>${stockPill(p.stock)}</div></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Category</label><div>${escapeHtml(p.category_name || "-")}</div></div>
        <div class="form-group"><label>Supplier</label><div>${escapeHtml(p.supplier_name || "-")}</div></div>
      </div>`
    openModal("viewModal")
  } catch (e) {
    toast("Could not load product", "error")
  }
}

async function deleteProduct(id) {
  const ok = await confirmDialog("Are you sure you want to delete this product? This cannot be undone.")
  if (!ok) return
  try {
    await ProductsAPI.remove(id)
    toast("Product deleted")
    await loadProducts()
  } catch (e) {
    toast("Delete failed", "error")
  }
}

/* ============================================================
   PAGE: CATEGORIES
   ============================================================ */

async function initCategories() {
  initTableSearch("searchInput", "categoriesBody")
  document.getElementById("addBtn").addEventListener("click", () => openCategoryForm())
  document.getElementById("categoryForm").addEventListener("submit", submitCategory)
  await loadCategories()
}

async function loadCategories() {
  loadingRow("categoriesBody", 4)
  try {
    const items = await CategoriesAPI.list()
    const tbody = document.getElementById("categoriesBody")
    if (!items.length) {
      emptyRow("categoriesBody", 4, "No categories yet. Click \u201cAdd Category\u201d to create one.")
      return
    }
    tbody.innerHTML = items
      .map(
        (c) => `
      <tr data-row>
        <td class="muted">#${c.id}</td>
        <td class="cell-strong">${escapeHtml(c.name)}</td>
        <td class="muted">${escapeHtml(c.description || "-")}</td>
        <td>
          <div class="actions">
            <button class="action-btn edit" title="Edit" onclick="editCategory(${c.id})"><i class="fa-solid fa-pen"></i></button>
            <button class="action-btn delete" title="Delete" onclick="deleteCategory(${c.id})"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>`
      )
      .join("")
  } catch (e) {
    errorRow("categoriesBody", 4, "Failed to load categories. Is the backend running?")
  }
}

function openCategoryForm(cat) {
  const form = document.getElementById("categoryForm")
  form.reset()
  clearErrors(form)
  document.getElementById("categoryModalTitle").textContent = cat ? "Edit Category" : "Add Category"
  document.getElementById("c_id").value = cat ? cat.id : ""
  if (cat) {
    form.name.value = cat.name
    form.description.value = cat.description || ""
  }
  openModal("categoryModal")
  setTimeout(() => form.name.focus(), 50)
}

async function submitCategory(e) {
  e.preventDefault()
  const form = e.target
  clearErrors(form)
  if (!form.name.value.trim()) {
    setError(form, "name", "Category name is required")
    return
  }
  const id = form.id.value
  const body = { name: form.name.value.trim(), description: form.description.value.trim() }
  const btn = form.querySelector("[type=submit]")
  btn.disabled = true
  try {
    if (id) {
      await CategoriesAPI.update(id, body)
      toast("Category updated")
    } else {
      await CategoriesAPI.create(body)
      toast("Category added")
    }
    closeModal("categoryModal")
    await loadCategories()
  } catch (err) {
    toast(err.message || "Save failed", "error")
  } finally {
    btn.disabled = false
  }
}

async function editCategory(id) {
  try {
    const cat = await CategoriesAPI.get(id)
    openCategoryForm(cat)
  } catch (e) {
    toast("Could not load category", "error")
  }
}

async function deleteCategory(id) {
  const ok = await confirmDialog("Delete this category? Products may reference it.")
  if (!ok) return
  try {
    await CategoriesAPI.remove(id)
    toast("Category deleted")
    await loadCategories()
  } catch (e) {
    toast("Delete failed", "error")
  }
}

/* ============================================================
   PAGE: SUPPLIERS
   ============================================================ */

async function initSuppliers() {
  initTableSearch("searchInput", "suppliersBody")
  document.getElementById("addBtn").addEventListener("click", () => openSupplierForm())
  document.getElementById("supplierForm").addEventListener("submit", submitSupplier)
  await loadSuppliers()
}

async function loadSuppliers() {
  loadingRow("suppliersBody", 5)
  try {
    const items = await SuppliersAPI.list()
    const tbody = document.getElementById("suppliersBody")
    if (!items.length) {
      emptyRow("suppliersBody", 5, "No suppliers yet. Click \u201cAdd Supplier\u201d to create one.")
      return
    }
    tbody.innerHTML = items
      .map(
        (s) => `
      <tr data-row>
        <td class="cell-strong">${escapeHtml(s.name)}</td>
        <td class="muted">${escapeHtml(s.email || "-")}</td>
        <td class="muted">${escapeHtml(s.phone || "-")}</td>
        <td class="muted">${escapeHtml(s.address || "-")}</td>
        <td>
          <div class="actions">
            <button class="action-btn edit" title="Edit" onclick="editSupplier(${s.id})"><i class="fa-solid fa-pen"></i></button>
            <button class="action-btn delete" title="Delete" onclick="deleteSupplier(${s.id})"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>`
      )
      .join("")
  } catch (e) {
    errorRow("suppliersBody", 5, "Failed to load suppliers. Is the backend running?")
  }
}

function openSupplierForm(sup) {
  const form = document.getElementById("supplierForm")
  form.reset()
  clearErrors(form)
  document.getElementById("supplierModalTitle").textContent = sup ? "Edit Supplier" : "Add Supplier"
  document.getElementById("s_id").value = sup ? sup.id : ""
  if (sup) {
    form.name.value = sup.name
    form.email.value = sup.email || ""
    form.phone.value = sup.phone || ""
    form.address.value = sup.address || ""
  }
  openModal("supplierModal")
  setTimeout(() => form.name.focus(), 50)
}

async function submitSupplier(e) {
  e.preventDefault()
  const form = e.target
  clearErrors(form)
  let ok = true
  if (!form.name.value.trim()) {
    setError(form, "name", "Supplier name is required")
    ok = false
  }
  if (form.email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.value)) {
    setError(form, "email", "Enter a valid email")
    ok = false
  }
  if (!ok) return

  const id = form.id.value
  const body = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    address: form.address.value.trim(),
  }
  const btn = form.querySelector("[type=submit]")
  btn.disabled = true
  try {
    if (id) {
      await SuppliersAPI.update(id, body)
      toast("Supplier updated")
    } else {
      await SuppliersAPI.create(body)
      toast("Supplier added")
    }
    closeModal("supplierModal")
    await loadSuppliers()
  } catch (err) {
    toast(err.message || "Save failed", "error")
  } finally {
    btn.disabled = false
  }
}

async function editSupplier(id) {
  try {
    const sup = await SuppliersAPI.get(id)
    openSupplierForm(sup)
  } catch (e) {
    toast("Could not load supplier", "error")
  }
}

async function deleteSupplier(id) {
  const ok = await confirmDialog("Delete this supplier?")
  if (!ok) return
  try {
    await SuppliersAPI.remove(id)
    toast("Supplier deleted")
    await loadSuppliers()
  } catch (e) {
    toast("Delete failed", "error")
  }
}

/* ============================================================
   BOOTSTRAP (router by body[data-page])
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  initSidebar()
  initModalDismiss()

  const page = document.body.dataset.page
  if (page === "dashboard") initDashboard()
  else if (page === "products") initProducts()
  else if (page === "categories") initCategories()
  else if (page === "suppliers") initSuppliers()
})

/* Expose row-action handlers to inline onclick */
window.viewProduct = viewProduct
window.editProduct = editProduct
window.deleteProduct = deleteProduct
window.editCategory = editCategory
window.deleteCategory = deleteCategory
window.editSupplier = editSupplier
window.deleteSupplier = deleteSupplier
