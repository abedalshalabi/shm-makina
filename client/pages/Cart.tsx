import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";
import { getStorageUrl } from "../config/env";
import Header from "../components/Header";
import Swal from "sweetalert2";

const Cart = () => {
  const { state, updateQuantity, removeItem, clearCart } = useCart();

  const finalTotal = state.total;

  const handleClearCart = async () => {
    const result = await Swal.fire({
      title: "مسح السلة؟",
      text: "سيتم حذف جميع المنتجات من السلة الحالية.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "نعم، مسح السلة",
      cancelButtonText: "إلغاء",
      reverseButtons: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
    });

    if (!result.isConfirmed) {
      return;
    }

    await clearCart();
  };

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 arabic">
        <Header
          showSearch={true}
          showActions={true}
        />

        {/* Empty Cart */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="text-8xl mb-6">🛒</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">السلة فارغة</h1>
            <p className="text-gray-600 mb-8">لم تقم بإضافة أي منتجات إلى السلة بعد</p>
            <Link
              to="/products"
              className="bg-brand-blue text-white px-8 py-3 rounded-lg hover:bg-emerald-700 transition-colors inline-flex items-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              تسوق الآن
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 arabic">
      <Header
        showSearch={true}
        showActions={true}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">سلة التسوق</h1>
                <button
                  onClick={handleClearCart}
                  className="text-red-600 hover:text-red-700 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  مسح السلة
                </button>
              </div>

              <div className="space-y-4">
                {state.items.map((item) => (
                  <div key={`${item.id}-${item.variant_id || ''}`} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex gap-4">
                      <Link to={`/product/${item.id}`} className="shrink-0">
                        <img
                          src={getStorageUrl(item.image) || "/placeholder.svg"}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg";
                          }}
                        />
                      </Link>

                      <div className="flex-1">
                        <Link to={`/product/${item.id}`} className="block group">
                          <h3 className="font-semibold text-gray-800 mb-1 group-hover:text-brand-green group-hover:underline transition-colors">{item.name}</h3>
                        </Link>
                        <p className="text-sm text-gray-600 mb-2">{item.brand}</p>

                        {item.selected_options && Object.keys(item.selected_options).length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {Object.entries(item.selected_options).map(([k, v]) => (
                              <span key={k} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                                {k}: {v}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-lg font-bold text-brand-green">{item.price} ₪</p>
                          {item.original_price && item.original_price > item.price && (
                            <>
                              <p className="text-sm text-gray-500 line-through">{item.original_price} ₪</p>
                              <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">
                                وفر {(item.original_price - item.price).toLocaleString()} شيكل
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-3">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.variant_id)}
                            className="p-2 hover:bg-gray-100 rounded-r-lg"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 py-2 border-r border-l border-gray-300">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.variant_id)}
                            className={`p-2 rounded-l-lg ${item.manage_stock && item.quantity >= (item.stock_quantity || 0) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                            disabled={item.manage_stock && item.quantity >= (item.stock_quantity || 0)}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeItem(item.id, item.variant_id)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Item Total */}
                    <div className="text-left mt-3 pt-3 border-t border-gray-200">
                      <span className="font-semibold">المجموع: {item.price * item.quantity} ₪</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">ملخص الطلب</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>المجموع الفرعي</span>
                  <span>{state.total} شيكل</span>
                </div>
                <div className="flex justify-between">
                  <span>الشحن</span>
                  <span className="text-gray-600 text-sm">
                    يتم احتسابه عند اختيار المدينة
                  </span>
                </div>
                <div className="border-t pt-3 font-bold text-lg flex justify-between">
                  <span>المجموع الكلي</span>
                  <span className="text-brand-green">{finalTotal} شيكل</span>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  to="/checkout"
                  className="w-full bg-brand-blue text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors text-center block font-semibold"
                >
                  إتمام الطلب
                </Link>
                <Link
                  to="/products"
                  className="w-full border border-brand-blue text-brand-blue py-3 rounded-lg hover:bg-brand-blue hover:text-white transition-colors text-center block"
                >
                  متابعة التسوق
                </Link>
              </div>

              {/* Cash on Delivery Notice */}
              <div className="mt-6 p-4 bg-brand-yellow bg-opacity-20 rounded-lg">
                <h3 className="font-semibold text-brand-blue mb-2">الدفع عند الاستلام</h3>
                <p className="text-sm text-gray-700">
                  يمكنك الدفع نقداً عند استلام طلبك في المنزل
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
