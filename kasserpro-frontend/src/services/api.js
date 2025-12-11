import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5108/api";

// إعداد Axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============ Categories API ============
export const categoriesApi = {
  // جلب كل التصنيفات
  getAll: () => api.get("/categories"),

  // جلب تصنيف واحد
  getById: (id) => api.get(`/categories/${id}`),

  // إضافة تصنيف جديد
  create: (category) => api.post("/categories", category),

  // تعديل تصنيف
  update: (id, category) => api.put(`/categories/${id}`, category),

  // حذف تصنيف
  delete: (id) => api.delete(`/categories/${id}`),
};

// ============ Products API ============
export const productsApi = {
  // جلب كل المنتجات مع الفلاتر
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.categoryId) query.append("categoryId", params.categoryId);
    if (params.isAvailable !== undefined)
      query.append("isAvailable", params.isAvailable);
    if (params.search) query.append("search", params.search);
    return api.get(`/products?${query.toString()}`);
  },

  // جلب منتج واحد
  getById: (id) => api.get(`/products/${id}`),

  // إضافة منتج جديد
  create: (product) => api.post("/products", product),

  // تعديل منتج
  update: (id, product) => api.put(`/products/${id}`, product),

  // حذف منتج
  delete: (id) => api.delete(`/products/${id}`),

  // تحديث المخزون
  updateStock: (id, stock) => api.patch(`/products/${id}/stock`, stock),

  // تغيير حالة التوفر
  updateAvailability: (id, isAvailable) =>
    api.patch(`/products/${id}/availability`, isAvailable),
};

// ============ Orders API ============
export const ordersApi = {
  // جلب كل الطلبات
  getAll: () => api.get("/orders"),

  // جلب طلب واحد
  getById: (id) => api.get(`/orders/${id}`),

  // إنشاء طلب جديد
  create: (order) => api.post("/orders", order),

  // طباعة فاتورة
  print: (id) => api.get(`/orders/${id}/print`, { responseType: "blob" }),
};

// ============ Settings API ============
export const settingsApi = {
  // جلب الإعدادات
  get: () => api.get("/settings"),

  // تحديث الإعدادات
  update: (settings) => api.put("/settings", settings),

  // تحديث إعدادات الضريبة فقط
  updateTax: (taxSettings) => api.patch("/settings/tax", taxSettings),
};

export default api;
