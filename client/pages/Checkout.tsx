import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Phone, User, CreditCard, Truck } from "lucide-react";
import { useCart } from "../context/CartContext";
import { ordersAPI, citiesAPI } from "../services/api";
import { getStorageUrl } from "../config/env";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";

interface City {
  id: number;
  name: string;
  name_en?: string;
  shipping_cost: number;
  delivery_time_days: number;
  is_active: boolean;
  free_shipping_threshold?: number | string | null;
}

const Checkout = () => {
  const { state, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    city: "",
    district: "",
    additionalInfo: "",
    paymentMethod: "cod",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [loadingCities, setLoadingCities] = useState(true);

  // Pre-fill user data if logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      const nameParts = (user.name || "").split(' ');
      const fName = nameParts[0] || "";
      const lName = nameParts.slice(1).join(' ') || "";

      setFormData(prev => ({
        ...prev,
        firstName: prev.firstName || fName,
        lastName: prev.lastName || lName,
        phone: prev.phone || user.phone || "",
        email: prev.email || user.email || "",
        city: prev.city || user.city || "",
        district: prev.district || user.district || "",
      }));
    }
  }, [isAuthenticated, user, cities]);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoadingCities(true);
        const response = await citiesAPI.getCities();
        setCities(response.data || []);
      } catch (error) {
        console.error("Error fetching cities:", error);
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, []);

  useEffect(() => {
    if (formData.city && cities.length > 0) {
      const city = cities.find(c => c.name === formData.city);
      setSelectedCity(city || null);
    } else {
      setSelectedCity(null);
    }
  }, [formData.city, cities]);

  // Calculate subtotal from items to ensure accuracy
  const subtotal = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingCost = (selectedCity && selectedCity.free_shipping_threshold && subtotal >= Number(selectedCity.free_shipping_threshold)) ? 0 : (selectedCity ? Number(selectedCity.shipping_cost) : null);
  const finalTotal = Number(subtotal) + Number(shippingCost ?? 0);
  const canSubmitOrder = !isSubmitting && !!selectedCity;
  const isFreeShippingAchieved = !!(selectedCity && selectedCity.free_shipping_threshold && subtotal >= Number(selectedCity.free_shipping_threshold));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCity) {
      alert("يرجى اختيار المنطقة لحساب تكلفة الشحن قبل تأكيد الطلب.");
      return;
    }

    // Phone validation: 10 digits, starts with 05
    const phoneRegex = /^05\d{8}$/;
    if (!phoneRegex.test(formData.phone)) {
      alert("رقم الجوال غير صحيح. يجب أن يتكون من 10 أرقام ويبدأ بـ 05.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare order items from cart
      const orderItems = state.items.map(item => ({
        product_id: item.id,
        product_variant_id: item.variant_id,
        variant_values: item.selected_options,
        quantity: item.quantity,
        price: item.price,
        original_price: item.original_price,
        type: item.type || 'product',
      }));

      // Create order
      const response = await ordersAPI.createOrder({
        customer_name: `${formData.firstName} ${formData.lastName}`,
        customer_email: formData.email || `${formData.phone}@temp.com`,
        customer_phone: formData.phone,
        customer_city: formData.city,
        customer_district: formData.district,
        customer_additional_info: formData.additionalInfo || undefined,
        payment_method: formData.paymentMethod,
        items: orderItems,
      });

      // Clear cart and redirect to success page with order data
      clearCart();
      navigate("/order-success", {
        state: {
          order: response.data,
          orderNumber: response.data?.order_number
        }
      });
    } catch (error: any) {
      console.error("Error creating order:", error);
      alert(error.message || 'حدث خطأ أثناء إنشاء الطلب. يرجى المحاولة مرة أخرى.');
      setIsSubmitting(false);
    }
  };

  if (state.items.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 arabic">
      <Header
        showSearch={true}
        showActions={true}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">إتمام الطلب</h1>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-3 space-y-6">
              {/* Personal Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  البيانات الشخصية
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الاسم الأول *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الاسم الأخير *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      رقم الجوال *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="05xxxxxxxx"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  عنوان التوصيل
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      المنطقة *
                    </label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      disabled={loadingCities}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">{loadingCities ? 'جاري تحميل المناطق...' : 'اختر المنطقة'}</option>
                      {cities.map(city => (
                        <option key={city.id} value={city.name}>
                          {city.name} {selectedCity?.id === city.id && `(${city.shipping_cost} شيكل - ${city.delivery_time_days} يوم)`}
                        </option>
                      ))}
                    </select>
                    {selectedCity && (
                      <div className="mt-1 space-y-1">
                        <p className="text-sm text-gray-600">
                          تكلفة الشحن: {selectedCity.shipping_cost} شيكل | وقت التوصيل: {selectedCity.delivery_time_days} {selectedCity.delivery_time_days === 1 ? 'يوم' : 'أيام'}
                        </p>
                        {selectedCity.free_shipping_threshold && Number(selectedCity.free_shipping_threshold) > 0 && (
                          <p className={`text-xs font-bold ${isFreeShippingAchieved ? "text-green-600" : "text-emerald-600"}`}>
                            {isFreeShippingAchieved 
                              ? "🎉 مبروك! لقد حصلت على توصيل مجاني" 
                              : `توصيل مجاني للطلبات بقيمة ${selectedCity.free_shipping_threshold} شيكل أو أكثر (تحتاج ${Number(selectedCity.free_shipping_threshold) - subtotal} شيكل إضافية)`}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      المدينة / العنوان الكامل *
                    </label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      معلومات إضافية
                    </label>
                    <textarea
                      name="additionalInfo"
                      value={formData.additionalInfo}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="تفاصيل إضافية لتسهيل الوصول..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  طريقة الدفع
                </h2>

                <div className="space-y-3">
                  <label className="flex items-center p-4 border border-brand-yellow bg-brand-yellow bg-opacity-10 rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === "cod"}
                      onChange={handleInputChange}
                      className="ml-3"
                    />
                    <div className="flex items-center gap-3">
                      <Truck className="w-5 h-5 text-brand-blue" />
                      <div>
                        <div className="font-semibold">الدفع عند الاستلام</div>
                        <div className="text-sm text-gray-600">ادفع نقداً عند وصول طلبك</div>
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer opacity-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      disabled
                      className="ml-3"
                    />
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="font-semibold">البطاقة الائتمانية</div>
                        <div className="text-sm text-gray-600">قريباً...</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-8 sticky top-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-8">ملخص الطلب</h2>

                {/* Order Items */}
                <div className="space-y-6 mb-8">
                  {state.items.map((item) => (
                    <div key={`${item.id}-${item.variant_id || ''}`} className="flex gap-4 p-4 bg-gray-50 rounded-xl relative border border-gray-100">
                      <Link to={`/product/${item.id}`} className="shrink-0">
                        <img
                          src={getStorageUrl(item.image) || "/placeholder.svg"}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg bg-white border border-gray-100 hover:opacity-90 transition-opacity"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg";
                          }}
                        />
                      </Link>
                      <div className="flex-1">
                        <Link
                          to={`/product/${item.id}`}
                          className="font-bold text-gray-900 mb-1 hover:text-brand-blue transition-colors inline-block"
                        >
                          {item.name}
                        </Link>
                        {item.selected_options && Object.keys(item.selected_options).length > 0 && (
                          <div className="text-xs text-gray-500 mb-2 flex flex-wrap gap-2">
                            {Object.entries(item.selected_options).map(([k, v]) => (
                              <span key={k} className="bg-white px-1.5 py-0.5 rounded border border-gray-200">{k}: {v}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-auto">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-600 font-medium">الكمية: {item.quantity}</div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-bold text-brand-blue">{item.price.toLocaleString()} شيكل</div>
                              {item.original_price && item.original_price > item.price && (
                                <>
                                  <div className="text-xs text-gray-400 line-through">{item.original_price.toLocaleString()} شيكل</div>
                                  <div className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">وفر {(item.original_price - item.price).toLocaleString()} شيكل</div>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-xl text-gray-900">{(item.price * item.quantity).toLocaleString()}</div>
                            <div className="text-xs text-gray-500">شيكل</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-4 mb-8 border-t pt-6">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-base font-medium text-gray-700">المجموع الفرعي</span>
                    <span className="text-base font-semibold text-gray-900">{subtotal.toLocaleString()} شيكل</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-base font-medium text-gray-700">الشحن</span>
                    <span className={`text-base font-semibold ${shippingCost === 0 ? "text-green-600" : "text-gray-900"}`}>
                      {shippingCost === null ? "يتم احتسابه عند اختيار المنطقة" : (shippingCost === 0 ? "مجاني" : `${shippingCost.toLocaleString()} شيكل`)}
                    </span>
                  </div>
                  <div className="border-t-2 border-gray-300 pt-4 mt-4 flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900">المجموع الكلي</span>
                    <span className="text-2xl font-bold text-green-600">{finalTotal.toLocaleString()} شيكل</span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!canSubmitOrder}
                  className="w-full bg-brand-blue text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "جاري إتمام الطلب..." : (selectedCity ? "تأكيد الطلب" : "اختر المنطقة أولاً")}
                </button>

                {/* Security Notice */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                  🔒 بياناتك محمية ومشفرة بأعلى معايير الأمان
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
