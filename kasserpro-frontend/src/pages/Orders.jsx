import { useState, useEffect } from "react";
import { EyeIcon, PrinterIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { ordersApi } from "../services/api";
import toast from "react-hot-toast";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await ordersApi.getAll();
      setOrders(res.data);
    } catch {
      toast.error("فشل تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case "Cash":
        return "💵 كاش";
      case "Card":
        return "💳 بطاقة";
      case "Wallet":
        return "📱 محفظة";
      default:
        return method;
    }
  };

  const handlePrint = async (order) => {
    try {
      const res = await ordersApi.print(order.id);
      // فتح نافذة الطباعة
      const printWindow = window.open("", "_blank", "width=300,height=600");
      printWindow.document.write(`
        <html dir="rtl">
        <head>
          <title>فاتورة #${order.orderNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
            .header { text-align: center; margin-bottom: 20px; }
            .line { border-top: 1px dashed #000; margin: 10px 0; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { font-weight: bold; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>🧾 KasserPro</h2>
            <p>فاتورة رقم: ${order.orderNumber}</p>
            <p>${formatDate(order.createdAt)}</p>
          </div>
          <div class="line"></div>
          ${order.items
            ?.map(
              (item) => `
            <div class="item">
              <span>${item.product?.name || "منتج"} × ${item.quantity}</span>
              <span>${(item.quantity * item.priceAtTime).toFixed(0)} ج.م</span>
            </div>
          `
            )
            .join("")}
          <div class="line"></div>
          <div class="item"><span>المجموع</span><span>${order.subtotal?.toFixed(
            2
          )} ج.م</span></div>
          ${
            order.discount > 0
              ? `<div class="item"><span>الخصم</span><span>-${order.discount?.toFixed(
                  2
                )} ج.م</span></div>`
              : ""
          }
          <div class="item"><span>الضريبة</span><span>${order.taxAmount?.toFixed(
            2
          )} ج.م</span></div>
          <div class="line"></div>
          <div class="item total"><span>الإجمالي</span><span>${order.total?.toFixed(
            2
          )} ج.م</span></div>
          <div class="line"></div>
          <p style="text-align:center">${getPaymentMethodLabel(
            order.paymentMethod
          )}</p>
          <p style="text-align:center; margin-top:20px">شكراً لزيارتكم ✨</p>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      toast.success("تم إعداد الفاتورة للطباعة");
    } catch {
      toast.error("فشل إعداد الطباعة");
    }
  };

  return (
    <div className="p-6 bg-gray-900 min-h-[calc(100vh-73px)]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">📋 سجل الطلبات</h1>
            <p className="text-gray-400">عرض وإدارة جميع الفواتير</p>
          </div>
          <button
            onClick={loadOrders}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
          >
            🔄 تحديث
          </button>
        </div>

        {/* الجدول */}
        {loading ? (
          <div className="text-center text-gray-400 py-20">جاري التحميل...</div>
        ) : orders.length === 0 ? (
          <div className="text-center text-gray-400 py-20">
            <div className="text-5xl mb-3">📋</div>
            <p>لا توجد طلبات بعد</p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-right text-gray-400 font-semibold py-4 px-6">
                    رقم الفاتورة
                  </th>
                  <th className="text-right text-gray-400 font-semibold py-4 px-6">
                    التاريخ
                  </th>
                  <th className="text-right text-gray-400 font-semibold py-4 px-6">
                    الأصناف / العناصر
                  </th>
                  <th className="text-right text-gray-400 font-semibold py-4 px-6">
                    الإجمالي
                  </th>
                  <th className="text-right text-gray-400 font-semibold py-4 px-6">
                    طريقة الدفع
                  </th>
                  <th className="text-right text-gray-400 font-semibold py-4 px-6">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-t border-gray-700 hover:bg-gray-750"
                  >
                    <td className="py-4 px-6">
                      <span className="text-white font-bold">
                        {order.orderNumber}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-400">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-4 px-6 text-gray-400">
                      {order.items?.length || 0} صنف •{" "}
                      {order.items?.reduce((a, c) => a + c.quantity, 0) || 0}{" "}
                      عنصر
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-green-400 font-bold">
                        {order.total?.toFixed(2)} ج.م
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-400">
                      {getPaymentMethodLabel(order.paymentMethod)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          title="عرض التفاصيل"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handlePrint(order)}
                          className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
                          title="طباعة"
                        >
                          <PrinterIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal تفاصيل الطلب */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-lg border border-gray-700 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-700 shrink-0">
              <h3 className="text-lg font-bold text-white">
                فاتورة #{selectedOrder.orderNumber}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div className="text-sm text-gray-400">
                {formatDate(selectedOrder.createdAt)}
              </div>

              {/* Items */}
              <div className="space-y-2">
                {selectedOrder.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-gray-700 rounded-lg p-3"
                  >
                    <div>
                      <p className="text-white font-semibold">
                        {item.product?.name || "منتج"}
                      </p>
                      <p className="text-sm text-gray-400">
                        {item.quantity} × {item.priceAtTime?.toFixed(0)} ج.م
                      </p>
                    </div>
                    <p className="text-green-400 font-bold">
                      {(item.quantity * item.priceAtTime).toFixed(0)} ج.م
                    </p>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="border-t border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between text-gray-400">
                  <span>المجموع</span>
                  <span>{selectedOrder.subtotal?.toFixed(2)} ج.م</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-red-400">
                    <span>الخصم</span>
                    <span>-{selectedOrder.discount?.toFixed(2)} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-400">
                  <span>الضريبة</span>
                  <span>{selectedOrder.taxAmount?.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between text-white font-bold text-lg">
                  <span>الإجمالي</span>
                  <span className="text-green-400">
                    {selectedOrder.total?.toFixed(2)} ج.م
                  </span>
                </div>
              </div>

              <div className="text-center text-gray-500 text-sm">
                {getPaymentMethodLabel(selectedOrder.paymentMethod)}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-700 flex gap-3 shrink-0">
              <button
                onClick={() => handlePrint(selectedOrder)}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <PrinterIcon className="h-5 w-5" />
                طباعة
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 py-3 bg-gray-700 text-white rounded-lg font-bold hover:bg-gray-600"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
