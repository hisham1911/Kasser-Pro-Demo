import { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { categoriesApi, settingsApi } from "../services/api";
import toast from "react-hot-toast";

// ألوان مقترحة
const COLORS = [
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#14B8A6",
  "#06B6D4",
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
];

// أيقونات مقترحة
const ICONS = [
  "🍔",
  "🍕",
  "🥤",
  "🍰",
  "☕",
  "🍟",
  "🥗",
  "🍣",
  "🍜",
  "🧁",
  "🥐",
  "🍩",
];

function Settings() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [taxRate, setTaxRate] = useState(14);
  const [savingTax, setSavingTax] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    color: COLORS[0],
    icon: ICONS[0],
  });

  useEffect(() => {
    loadCategories();
    loadSettings();
  }, []);

  // تحميل الإعدادات من الخادم
  const loadSettings = async () => {
    try {
      const res = await settingsApi.get();
      setTaxEnabled(res.data.taxEnabled);
      setTaxRate(res.data.taxRate);
    } catch {
      console.error("فشل تحميل الإعدادات");
    }
  };

  // حفظ إعدادات الضريبة في الخادم
  const saveTaxSettings = async (enabled, rate) => {
    setSavingTax(true);
    try {
      await settingsApi.updateTax({ taxEnabled: enabled, taxRate: rate });
      toast.success("تم حفظ الإعدادات");
    } catch {
      toast.error("فشل حفظ الإعدادات");
    } finally {
      setSavingTax(false);
    }
  };

  const handleTaxToggle = (enabled) => {
    setTaxEnabled(enabled);
    saveTaxSettings(enabled, taxRate);
  };

  const handleTaxRateChange = (rate) => {
    setTaxRate(rate);
  };

  const handleTaxRateBlur = () => {
    saveTaxSettings(taxEnabled, taxRate);
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await categoriesApi.getAll();
      setCategories(res.data);
    } catch {
      toast.error("فشل تحميل التصنيفات");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: "", color: COLORS[0], icon: ICONS[0] });
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color || COLORS[0],
      icon: category.icon || ICONS[0],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingCategory) {
        await categoriesApi.update(editingCategory.id, {
          ...formData,
          id: editingCategory.id,
        });
        toast.success("تم تحديث التصنيف");
      } else {
        await categoriesApi.create(formData);
        toast.success("تم إضافة التصنيف");
      }
      setShowModal(false);
      loadCategories();
    } catch {
      toast.error("فشل حفظ التصنيف");
    }
  };

  const handleDelete = async (category) => {
    if (!confirm(`هل تريد حذف "${category.name}"؟`)) return;

    try {
      await categoriesApi.delete(category.id);
      toast.success("تم حذف التصنيف");
      loadCategories();
    } catch {
      toast.error("لا يمكن حذف التصنيف - قد يحتوي على منتجات");
    }
  };

  return (
    <div className="p-6 bg-gray-900 min-h-[calc(100vh-73px)]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">⚙️ الإعدادات</h1>
          <p className="text-gray-400">إدارة التصنيفات والإعدادات العامة</p>
        </div>

        {/* التصنيفات */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">🏷️ التصنيفات</h2>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              إضافة تصنيف
            </button>
          </div>

          {loading ? (
            <div className="text-center text-gray-400 py-10">
              جاري التحميل...
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              <p>لا توجد تصنيفات</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between bg-gray-700 rounded-lg p-4 border border-gray-600"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: cat.color }}
                    >
                      <span className="text-2xl">{cat.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{cat.name}</h3>
                      <p className="text-sm text-gray-400">
                        {cat.productsCount || 0} منتج
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* إعدادات الضريبة */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">💰 إعدادات الضريبة</h2>
            {savingTax && (
              <span className="text-sm text-blue-400">جاري الحفظ...</span>
            )}
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">تفعيل الضريبة</p>
                <p className="text-sm text-gray-400">
                  إظهار الضريبة في الفواتير
                </p>
              </div>
              <button
                onClick={() => handleTaxToggle(!taxEnabled)}
                disabled={savingTax}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  taxEnabled ? "bg-green-600" : "bg-gray-600"
                } ${savingTax ? "opacity-50" : ""}`}
              >
                <span
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${
                    taxEnabled ? "right-1" : "right-8"
                  }`}
                />
              </button>
            </div>
            {taxEnabled && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">نسبة الضريبة</p>
                  <p className="text-sm text-gray-400">
                    النسبة المئوية للضريبة
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taxRate}
                    onChange={(e) =>
                      handleTaxRateChange(parseFloat(e.target.value) || 0)
                    }
                    onBlur={handleTaxRateBlur}
                    disabled={savingTax}
                    className="w-20 bg-gray-700 text-white text-center border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-gray-400">%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* معلومات النظام */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            ℹ️ معلومات النظام
          </h2>
          <div className="space-y-3 text-gray-400">
            <div className="flex justify-between">
              <span>الإصدار</span>
              <span className="text-white">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>API</span>
              <span className="text-green-400">http://localhost:5108</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl w-full max-w-md mx-4 border border-gray-700">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h3 className="text-lg font-bold text-white">
                {editingCategory ? "تعديل تصنيف" : "إضافة تصنيف جديد"}
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
                  اسم التصنيف
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

              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  اللون
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color
                          ? "border-white scale-110"
                          : "border-transparent"
                      }`}
                      style={{ background: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  الأيقونة
                </label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                        formData.icon === icon
                          ? "bg-blue-600 border-2 border-blue-400"
                          : "bg-gray-700 border border-gray-600"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="flex items-center gap-3 bg-gray-700 rounded-lg p-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: formData.color }}
                >
                  <span className="text-2xl">{formData.icon}</span>
                </div>
                <span className="text-white font-bold">
                  {formData.name || "اسم التصنيف"}
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
              >
                {editingCategory ? "حفظ التعديلات" : "إضافة التصنيف"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
