import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle, Home, Package, Phone } from "lucide-react";
import { getStorageUrl } from "../config/env";
import Header from "../components/Header";
import { settingsAPI } from "../services/api";

const OrderSuccess = () => {
  const location = useLocation();
  const orderData = location.state?.order || location.state?.orderData;
  const [headerPhone, setHeaderPhone] = useState<string>("");

  const getOrderItemProductLink = (item: any) => {
    const productId = item?.product?.id || item?.product_id;
    return productId ? `/product/${productId}` : null;
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsResponse = await settingsAPI.getSettings("header");
        if (settingsResponse.data?.header_phone) {
          setHeaderPhone(settingsResponse.data.header_phone);
        }
      } catch (error) {
        console.error("Error fetching header settings:", error);
      }
    };

    fetchSettings();
  }, []);

  console.log("Order Success - Order Data:", orderData);
  console.log("Order Success - Location State:", location.state);

  const orderNumber = orderData?.order_number || `ORD-${Date.now()}`;
  const paymentMethod =
    orderData?.payment_method === "cod"
      ? "الدفع عند الاستلام"
      : orderData?.payment_method || "الدفع عند الاستلام";
  const orderStatus =
    orderData?.order_status === "pending"
      ? "قيد التحضير"
      : orderData?.order_status === "processing"
        ? "قيد المعالجة"
        : orderData?.order_status === "shipped"
          ? "تم الشحن"
          : orderData?.order_status === "delivered"
            ? "تم التسليم"
            : orderData?.order_status === "cancelled"
              ? "ملغي"
              : orderData?.order_status || "قيد التحضير";

  const subtotal = Number(orderData?.subtotal) || 0;
  const shippingCost = Number(orderData?.shipping_cost) || 0;
  const total = Number(orderData?.total) || 0;
  const items = orderData?.items || [];
  const deliveryTime = 2;

  return (
    <div className="min-h-screen bg-gray-50 arabic">
      <Header showSearch={true} showActions={true} />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <CheckCircle className="w-24 h-24 text-brand-green mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">تم تأكيد طلبك بنجاح!</h1>
            <p className="text-lg text-gray-600">شكرًا لك على التسوق معنا</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Package className="w-6 h-6 text-brand-blue" />
              <h2 className="text-xl font-semibold">تفاصيل الطلب</h2>
            </div>

            <div className="space-y-4 text-right">
              <div className="flex justify-between py-3 border-b">
                <span className="font-semibold text-gray-700">رقم الطلب:</span>
                <span className="text-brand-blue font-mono font-bold">{orderNumber}</span>
              </div>

              {orderData?.customer_name && (
                <div className="flex justify-between py-3 border-b">
                  <span className="font-semibold text-gray-700">اسم العميل:</span>
                  <span className="text-gray-900">{orderData.customer_name}</span>
                </div>
              )}

              {orderData?.customer_phone && (
                <div className="flex justify-between py-3 border-b">
                  <span className="font-semibold text-gray-700">رقم الهاتف:</span>
                  <span className="text-gray-900" dir="ltr">{orderData.customer_phone}</span>
                </div>
              )}

              {orderData?.customer_city && (
                <div className="flex justify-between py-3 border-b">
                  <span className="font-semibold text-gray-700">المدينة:</span>
                  <span className="text-gray-900">{orderData.customer_city}</span>
                </div>
              )}

              {items.length > 0 && (
                <div className="py-3 border-b">
                  <span className="font-semibold text-gray-700 block mb-3">عناصر الطلب:</span>
                  <div className="space-y-2">
                    {items.map((item: any, index: number) => {
                      const productLink = getOrderItemProductLink(item);
                      const productName = item.product_name || item.product?.name || "منتج";
                      const imageSrc = getStorageUrl(item.product?.image) || "/placeholder.svg";

                      return (
                        <div
                          key={item.id || index}
                          className="flex items-center justify-between gap-3 text-sm bg-gray-50 p-2 rounded"
                        >
                          <div className="flex items-center gap-3">
                            {productLink ? (
                              <Link
                                to={productLink}
                                className="w-14 h-14 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white block hover:opacity-90 transition-opacity"
                              >
                                <img
                                  src={imageSrc}
                                  alt={productName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = "/placeholder.svg";
                                  }}
                                />
                              </Link>
                            ) : (
                              <div className="w-14 h-14 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
                                <img
                                  src={imageSrc}
                                  alt={productName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = "/placeholder.svg";
                                  }}
                                />
                              </div>
                            )}

                            {productLink ? (
                              <Link
                                to={productLink}
                                className="font-medium hover:text-brand-blue transition-colors"
                              >
                                {productName}
                              </Link>
                            ) : (
                              <span className="font-medium">{productName}</span>
                            )}

                            <span className="text-gray-600 mr-2">× {item.quantity}</span>
                          </div>

                          <div className="flex flex-col items-end">
                            <span className="font-semibold text-brand-green">
                              {(item.price * item.quantity).toLocaleString()} شيكل
                            </span>
                            {item.original_price && item.original_price > item.price && (
                              <div className="text-right mt-1">
                                <div className="text-[10px] text-gray-400">
                                  <span className="line-through">
                                    {(item.original_price * item.quantity).toLocaleString()} ₪
                                  </span>
                                  <span className="mr-1">(السعر قبل الخصم)</span>
                                </div>
                                <span className="text-[10px] text-red-500 font-bold block">
                                  وفرت {((item.original_price - item.price) * item.quantity).toLocaleString()} شيكل في هذا الصنف
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-between py-3 border-b">
                <span className="font-semibold text-gray-700">المجموع الفرعي:</span>
                <span className="text-gray-900">{subtotal.toLocaleString()} شيكل</span>
              </div>

              <div className="flex justify-between py-3 border-b">
                <span className="font-semibold text-gray-700">تكلفة الشحن:</span>
                <div className="text-left flex flex-col items-end">
                  <span className={shippingCost === 0 ? "text-green-600 font-bold" : "text-gray-900"}>
                    {shippingCost === 0 ? "مجاني" : `${shippingCost.toLocaleString()} شيكل`}
                  </span>
                  {shippingCost === 0 && (
                    <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded font-bold mt-1">
                      (هدية من المتجر)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-between py-3 border-b">
                <span className="font-semibold text-gray-700">طريقة الدفع:</span>
                <span className="text-gray-900">{paymentMethod}</span>
              </div>

              <div className="flex justify-between py-3">
                <span className="font-semibold text-gray-700">موعد التوصيل المتوقع:</span>
                <span className="text-gray-900">
                  {deliveryTime} {deliveryTime > 1 ? "أيام" : "يوم"} عمل
                </span>
              </div>

              <div className="flex justify-between py-3">
                <span className="font-semibold text-gray-700">حالة الطلب:</span>
                <span className="text-brand-orange font-semibold">{orderStatus}</span>
              </div>

              {items.some((item: any) => item.original_price && item.original_price > item.price) && (
                <div className="flex justify-between py-3 text-red-600 bg-red-50 px-2 rounded">
                  <span className="font-semibold">إجمالي التوفير:</span>
                  <span className="font-bold">
                    {items
                      .reduce((sum: number, item: any) => {
                        if (item.original_price && item.original_price > item.price) {
                          return sum + ((item.original_price - item.price) * item.quantity);
                        }
                        return sum;
                      }, 0)
                      .toLocaleString()} شيكل
                  </span>
                </div>
              )}

              <div className="flex justify-between py-3 border-t-2 border-gray-300 mt-4 pt-4">
                <span className="text-xl font-bold text-gray-900">المجموع الكلي:</span>
                <span className="text-2xl font-bold text-brand-green">{total.toLocaleString()} شيكل</span>
              </div>
            </div>
          </div>

          <div className="bg-brand-yellow bg-opacity-20 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-brand-blue mb-4">الخطوات التالية</h3>
            <div className="space-y-3 text-right">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-brand-blue text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">1</div>
                <div>
                  <div className="font-medium">تحضير الطلب</div>
                  <div className="text-sm text-gray-600">سنقوم بتحضير طلبك وتعبئته بعناية</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-brand-blue text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">2</div>
                <div>
                  <div className="font-medium">الشحن</div>
                  <div className="text-sm text-gray-600">سيتم شحن طلبك خلال 24 ساعة</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-brand-blue text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">3</div>
                <div>
                  <div className="font-medium">التوصيل</div>
                  <div className="text-sm text-gray-600">سيصلك الطلب في العنوان المحدد خلال 2-3 أيام</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <Phone className="w-8 h-8 text-brand-blue mx-auto mb-3" />
              <h3 className="font-semibold mb-2">تواصل معنا</h3>
              <p className="text-sm text-gray-600 mb-3">لأي استفسارات حول طلبك</p>
              {headerPhone ? (
                <a
                  href={`tel:${headerPhone.replace(/[^0-9+]/g, "")}`}
                  className="font-semibold text-brand-blue hover:text-brand-orange transition-colors block"
                >
                  <span dir="ltr" className="inline-block">{headerPhone}</span>
                </a>
              ) : (
                <p className="font-semibold text-brand-blue">+966 11 234 5678</p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <Package className="w-8 h-8 text-brand-blue mx-auto mb-3" />
              <h3 className="font-semibold mb-2">تتبع الطلب</h3>
              <p className="text-sm text-gray-600 mb-3">تابع حالة طلبك أولًا بأول</p>
              <button className="text-brand-blue hover:text-brand-orange transition-colors font-semibold">
                تتبع الطلب
              </button>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Link
              to="/"
              className="bg-brand-blue text-white px-8 py-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Home className="w-5 h-5" />
              العودة للرئيسية
            </Link>
            <Link
              to="/products"
              className="border border-brand-blue text-brand-blue px-8 py-3 rounded-lg hover:bg-brand-blue hover:text-white transition-colors"
            >
              متابعة التسوق
            </Link>
          </div>

          <div className="mt-12 p-6 bg-gradient-to-l from-brand-blue to-brand-green text-white rounded-lg">
            <h3 className="text-xl font-bold mb-2">شكرًا لثقتك بنا!</h3>
            <p>نقدر اختيارك لنا ونتطلع لخدمتك مرة أخرى</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
