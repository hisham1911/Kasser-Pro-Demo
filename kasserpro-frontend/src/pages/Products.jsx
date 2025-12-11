import { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { productsApi, categoriesApi } from "../services/api";
import toast from "react-hot-toast";

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [stockUpdate, setStockUpdate] = useState({
    productId: null,
    value: "",
  });
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    categoryId: "",
    isAvailable: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productsApi.getAll(),
        categoriesApi.getAll(),
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch {
      toast.error("فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      price: "",
      stock: "",
      categoryId: "",
      isAvailable: true,
    });
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      categoryId: product.categoryId?.toString() || "",
      isAvailable: product.isAvailable,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const stock = parseInt(formData.stock);
    // لا يمكن تفعيل منتج مخزونه صفر
    const isAvailable = stock <= 0 ? false : formData.isAvailable;

    const productData = {
      name: formData.name,
      price: parseFloat(formData.price),
      stock: stock,
      categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
      isAvailable: isAvailable,
    };

    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.id, {
          ...productData,
          id: editingProduct.id,
        });
        toast.success("تم تحديث المنتج");
      } else {
        await productsApi.create(productData);
        toast.success("تم إضافة المنتج");
      }
      setShowModal(false);
      loadData();
    } catch {
      toast.error("فشل حفظ المنتج");
    }
  };

  const handleDelete = async (product) => {
    if (!confirm(`هل تريد حذف "${product.name}"؟`)) return;

    try {
      await productsApi.delete(product.id);
      toast.success("تم حذف المنتج");
      loadData();
    } catch {
      toast.error("لا يمكن حذف المنتج - قد يكون مرتبط بطلبات");
    }
  };

  const toggleAvailability = async (product) => {
    // لا يمكن تفعيل منتج مخزونه صفر
    if (!product.isAvailable && product.stock <= 0) {
      toast.error("لا يمكن تفعيل منتج مخزونه صفر");
      return;
    }
    try {
      await productsApi.updateAvailability(product.id, !product.isAvailable);
      toast.success(
        product.isAvailable ? "تم إيقاف المنتج" : "تم تفعيل المنتج"
      );
      loadData();
    } catch {
      toast.error("فشل تحديث الحالة");
    }
  };

  const handleQuickStockUpdate = async (productId) => {
    const newStock = parseInt(stockUpdate.value);
    if (isNaN(newStock) || newStock < 0) {
      toast.error("أدخل رقم صحيح");
      return;
    }
    try {
      await productsApi.updateStock(productId, newStock);
      toast.success("تم تحديث المخزون");
      setStockUpdate({ productId: null, value: "" });
      loadData();
    } catch {
      toast.error("فشل تحديث المخزون");
    }
  };

  // فلترة المنتجات
  const filteredProducts = showAvailableOnly
    ? products.filter((p) => p.isAvailable)
    : products;

  return (
    <div className="p-6 bg-gray-900 min-h-[calc(100vh-73px)]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">📦 إدارة المنتجات</h1>
            <p className="text-gray-400">إضافة وتعديل وحذف المنتجات</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showAvailableOnly}
                onChange={(e) => setShowAvailableOnly(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              المتاح فقط
            </label>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              إضافة منتج
            </button>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center text-gray-400 py-20">جاري التحميل...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center text-gray-400 py-20">
            <div className="text-5xl mb-3">📦</div>
            <p>
              {showAvailableOnly ? "لا توجد منتجات متاحة" : "لا توجد منتجات"}
            </p>
            {!showAvailableOnly && (
              <button
                onClick={openAddModal}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg font-bold"
              >
                أضف أول منتج
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`bg-gray-800 rounded-xl p-4 border border-gray-700 ${
                  !product.isAvailable ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: product.categoryColor || "#667eea" }}
                    >
                      <span className="text-xl">
                        {product.categoryIcon || "📦"}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{product.name}</h3>
                      <p className="text-sm text-gray-400">
                        {product.categoryName || "بدون تصنيف"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAvailability(product)}
                    className={`text-xs font-bold px-2 py-1 rounded ${
                      product.isAvailable
                        ? "bg-green-600/20 text-green-400"
                        : "bg-red-600/20 text-red-400"
                    }`}
                  >
                    {product.isAvailable ? "متاح" : "موقف"}
                  </button>
                </div>

                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="text-2xl font-black text-green-400">
                      {parseFloat(product.price).toFixed(0)} ج.م
                    </p>
                    {stockUpdate.productId === product.id ? (
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          type="number"
                          min="0"
                          value={stockUpdate.value}
                          onChange={(e) =>
                            setStockUpdate({
                              ...stockUpdate,
                              value: e.target.value,
                            })
                          }
                          className="w-16 bg-gray-700 text-white text-center border border-gray-600 rounded px-1 py-0.5 text-sm"
                          autoFocus
                        />
                        <button
                          onClick={() => handleQuickStockUpdate(product.id)}
                          className="text-green-400 hover:text-green-300 text-sm"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() =>
                            setStockUpdate({ productId: null, value: "" })
                          }
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          ✗
                        </button>
                      </div>
                    ) : (
                      <p
                        onClick={() =>
                          setStockUpdate({
                            productId: product.id,
                            value: product.stock.toString(),
                          })
                        }
                        className="text-sm text-gray-400 cursor-pointer hover:text-blue-400"
                        title="اضغط لتعديل المخزون"
                      >
                        المخزون: {product.stock} ✏️
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(product)}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl w-full max-w-md mx-4 border border-gray-700">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h3 className="text-lg font-bold text-white">
                {editingProduct ? "تعديل منتج" : "إضافة منتج جديد"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">
                  اسم المنتج
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">
                    السعر
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">
                    المخزون
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">
                  التصنيف
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value })
                  }
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                >
                  <option value="">بدون تصنيف</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onChange={(e) =>
                    setFormData({ ...formData, isAvailable: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="isAvailable" className="text-gray-400">
                  متاح للبيع
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
              >
                {editingProduct ? "حفظ التعديلات" : "إضافة المنتج"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;
