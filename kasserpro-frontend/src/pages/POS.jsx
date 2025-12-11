import { useState, useEffect } from "react";
import { PrinterIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import {
  productsApi,
  categoriesApi,
  ordersApi,
  settingsApi,
} from "../services/api";
import toast from "react-hot-toast";

function POS() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [taxRate, setTaxRate] = useState(0.14);
  const [loading, setLoading] = useState(true);

  // تحميل الإعدادات والتصنيفات
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await settingsApi.get();
        setTaxEnabled(res.data.taxEnabled);
        setTaxRate(res.data.taxRate / 100); // تحويل من نسبة مئوية
      } catch {
        console.error("فشل تحميل الإعدادات");
      }
    };
    loadSettings();
  }, []);

  // تحميل التصنيفات
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await categoriesApi.getAll();
        setCategories(res.data);
      } catch {
        toast.error("فشل تحميل التصنيفات");
      }
    };
    loadCategories();
  }, []);

  // تحميل المنتجات
  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await productsApi.getAll({
        categoryId: selectedCategory,
        search: searchQuery,
      });
      setProducts(res.data);
    } catch {
      toast.error("فشل تحميل المنتجات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, searchQuery]);

  // إضافة للسلة
  const addToCart = (product) => {
    if (!product.isAvailable) {
      toast.error("المنتج غير متاح");
      return;
    }

    const exist = cart.find((x) => x.id === product.id);
    if (exist) {
      if (exist.qty >= product.stock) {
        toast.error("الكمية غير متوفرة في المخزون");
        return;
      }
      setCart(
        cart.map((x) => (x.id === product.id ? { ...x, qty: x.qty + 1 } : x))
      );
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
    toast.success(`${product.name} أضيف للسلة`);
  };

  // إزالة من السلة
  const removeFromCart = (product) => {
    const exist = cart.find((x) => x.id === product.id);
    if (exist.qty === 1) {
      setCart(cart.filter((x) => x.id !== product.id));
    } else {
      setCart(
        cart.map((x) => (x.id === product.id ? { ...x, qty: x.qty - 1 } : x))
      );
    }
  };

  // مسح السلة
  const clearCart = () => {
    setCart([]);
    setDiscount(0);
  };

  // الحسابات
  const subtotal = cart.reduce(
    (acc, curr) => acc + parseFloat(curr.price) * curr.qty,
    0
  );
  const validDiscount = Math.min(Math.max(0, discount), subtotal); // الخصم لا يتجاوز المجموع
  const taxAmount = taxEnabled ? (subtotal - validDiscount) * taxRate : 0;
  const total = subtotal - validDiscount + taxAmount;

  // الدفع
  const checkout = async () => {
    if (cart.length === 0) {
      toast.error("السلة فارغة");
      return;
    }

    const order = {
      items: cart.map((item) => ({
        productId: item.id,
        quantity: item.qty,
        priceAtTime: parseFloat(item.price),
      })),
      discount: validDiscount,
      paymentMethod: paymentMethod,
    };

    try {
      const res = await ordersApi.create(order);
      toast.success(`تم الدفع بنجاح! فاتورة: ${res.data.orderNumber}`);
      clearCart();
      loadProducts(); // تحديث المنتجات لتحديث المخزون
    } catch {
      toast.error("فشل إتمام الطلب");
    }
  };

  return (
    <div className="flex h-[calc(100vh-73px)] bg-gray-900">
      {/* المنتجات */}
      <div className="flex-[2] flex flex-col p-6 overflow-hidden">
        {/* البحث */}
        <div className="mb-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث عن منتج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 text-white placeholder-gray-500 border border-gray-700 rounded-lg py-3 pr-10 pl-4 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* الفئات */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-5 py-2 rounded-full font-bold whitespace-nowrap transition-all text-sm ${
              selectedCategory === null
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            🌟 الكل
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2 rounded-full font-bold whitespace-nowrap transition-all text-sm ${
                selectedCategory === cat.id
                  ? "text-white"
                  : "text-gray-400 hover:text-gray-200 bg-gray-700"
              }`}
              style={{
                backgroundColor:
                  selectedCategory === cat.id ? cat.color : undefined,
              }}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* شبكة المنتجات */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400">جاري التحميل...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400">
                <div className="text-5xl mb-3">📦</div>
                <p>لا توجد منتجات</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 content-start">
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={!p.isAvailable}
                  className={`w-[120px] bg-gray-700 rounded-lg flex flex-col items-center p-4 border border-gray-600 hover:border-blue-500 transition-all ${
                    p.isAvailable
                      ? "cursor-pointer"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                    style={{ background: p.categoryColor || "#667eea" }}
                  >
                    <span className="text-2xl">{p.categoryIcon || "📦"}</span>
                  </div>
                  <span className="text-sm text-white font-semibold text-center leading-tight mb-2">
                    {p.name}
                  </span>
                  <span className="text-base font-bold text-green-400">
                    {parseFloat(p.price).toFixed(0)} ج.م
                  </span>
                  {p.stock <= 10 && p.stock > 0 && (
                    <span className="text-xs text-yellow-500 mt-1">
                      متبقي {p.stock}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* السلة */}
      <div className="w-[380px] bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">🛒 السلة</h2>
            <p className="text-sm text-gray-400">
              {cart.length === 0
                ? "فارغة"
                : `${cart.reduce((a, c) => a + c.qty, 0)} عنصر • ${
                    cart.length
                  } صنف`}
            </p>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-red-500 text-sm font-bold hover:text-red-400"
            >
              مسح الكل
            </button>
          )}
        </div>

        {/* العناصر */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="text-5xl mb-3 opacity-30">🛒</div>
              <p className="text-gray-500">اضغط على منتج لإضافته</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="bg-gray-700 rounded-lg p-3 border border-gray-600"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2">
                    <span className="text-xl">{item.categoryIcon || "📦"}</span>
                    <div>
                      <p className="font-bold text-white text-sm">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {parseFloat(item.price).toFixed(0)} ج.م
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setCart(cart.filter((x) => x.id !== item.id))
                    }
                    className="text-red-500 font-bold hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center bg-gray-600 rounded-lg">
                    <button
                      onClick={() => removeFromCart(item)}
                      className="px-3 py-1 text-white font-bold hover:bg-gray-500 rounded-r-lg"
                    >
                      −
                    </button>
                    <span className="px-3 py-1 text-white font-bold">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => addToCart(item)}
                      className="px-3 py-1 text-white font-bold hover:bg-gray-500 rounded-l-lg"
                    >
                      +
                    </button>
                  </div>
                  <p className="font-bold text-green-400">
                    {(parseFloat(item.price) * item.qty).toFixed(0)} ج.م
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* الدفع */}
        <div className="p-4 border-t border-gray-700 bg-gray-900 space-y-3">
          {/* الخصم */}
          <div className="flex items-center gap-2">
            <label className="text-gray-400 text-sm">خصم:</label>
            <input
              type="number"
              min="0"
              max={subtotal}
              value={discount || ""}
              onChange={(e) =>
                setDiscount(
                  e.target.value === "" ? 0 : parseFloat(e.target.value)
                )
              }
              className={`flex-1 bg-gray-800 text-white border rounded px-3 py-1 text-sm focus:outline-none focus:border-blue-500 ${
                discount > subtotal ? "border-red-500" : "border-gray-700"
              }`}
              placeholder="0"
            />
            {discount > subtotal && (
              <span className="text-red-400 text-xs">!</span>
            )}
          </div>

          {/* طريقة الدفع */}
          <div className="flex gap-2">
            {["Cash", "Card", "Wallet"].map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                  paymentMethod === method
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                }`}
              >
                {method === "Cash"
                  ? "💵 كاش"
                  : method === "Card"
                  ? "💳 بطاقة"
                  : "📱 محفظة"}
              </button>
            ))}
          </div>

          {/* الملخص */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>المجموع</span>
              <span>{subtotal.toFixed(2)} ج.م</span>
            </div>
            {validDiscount > 0 && (
              <div className="flex justify-between text-red-400">
                <span>الخصم</span>
                <span>-{validDiscount.toFixed(2)} ج.م</span>
              </div>
            )}
            {taxEnabled && (
              <div className="flex justify-between text-gray-400">
                <button
                  onClick={() => setTaxEnabled(!taxEnabled)}
                  className="flex items-center gap-1 text-gray-400 hover:text-gray-300"
                >
                  <span className="text-xs">✓</span>
                  الضريبة ({(taxRate * 100).toFixed(0)}%)
                </button>
                <span>{taxAmount.toFixed(2)} ج.م</span>
              </div>
            )}
            <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-gray-700">
              <span>الإجمالي</span>
              <span className="text-green-400">{total.toFixed(2)} ج.م</span>
            </div>
          </div>

          {/* زر الدفع */}
          <button
            onClick={checkout}
            disabled={cart.length === 0}
            className={`w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 text-lg transition-all ${
              cart.length > 0
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-700 text-gray-500 cursor-not-allowed"
            }`}
          >
            <PrinterIcon className="h-6 w-6" />
            إتمام الدفع
          </button>
        </div>
      </div>
    </div>
  );
}

export default POS;
