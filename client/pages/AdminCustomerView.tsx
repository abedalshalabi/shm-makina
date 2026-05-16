import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Eye,
  Heart,
  Lock,
  Mail,
  Package,
  Phone,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  User,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminCustomersAPI } from "@/services/adminApi";
import { toast } from "@/hooks/use-toast";

interface ProductVariant {
  id: number;
  price: number | string;
}

interface ProductSummary {
  id: number;
  name: string;
  slug?: string;
  image?: string;
  cover_image?: string | null;
  images?: Array<string | { image_url?: string; url?: string; path?: string }>;
  price?: number | string;
  discount_percentage?: number | string | null;
  brand?: {
    name: string;
  };
  variants?: ProductVariant[];
}

interface OrderSummary {
  id: number;
  order_number: string;
  created_at: string;
  order_status: string;
  order_status_label?: string;
  total: number;
}

interface CartItem {
  id: number;
  quantity: number;
  product?: ProductSummary;
  variant?: {
    price: number | string;
    size?: string;
    color?: string;
  };
}

interface WishlistItem {
  id: number;
  product_id: number;
  product?: ProductSummary;
}

interface CustomerDetail {
  id: number;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  city?: string;
  district?: string;
  street?: string;
  building?: string;
  orders: OrderSummary[];
  cart_items: CartItem[];
  wishlist_items: WishlistItem[];
  stats: {
    total_orders: number;
    total_spent: number;
    cart_items_count: number;
    cart_total: number;
    wishlist_items_count: number;
  };
}

const STORAGE_URL = (import.meta.env.VITE_STORAGE_URL || "").replace(/\/$/, "");

const toNumber = (value: unknown): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const formatPrice = (value: number): string => `${value.toFixed(2)} ₪`;

const getStorageUrl = (path?: string | null): string => {
  if (!path) {
    return "/placeholder.svg";
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalized = path.replace(/^\/+/, "");
  return STORAGE_URL ? `${STORAGE_URL}/${normalized}` : `/${normalized}`;
};

const getProductImage = (product?: ProductSummary): string => {
  if (!product) {
    return "/placeholder.svg";
  }

  if (product.cover_image) {
    return getStorageUrl(product.cover_image);
  }

  const firstImage = Array.isArray(product.images) ? product.images[0] : undefined;
  if (typeof firstImage === "string" && firstImage.trim()) {
    return getStorageUrl(firstImage);
  }

  if (firstImage && typeof firstImage === "object") {
    if (firstImage.image_url) {
      return firstImage.image_url;
    }
    if (firstImage.url) {
      return firstImage.url;
    }
    if (firstImage.path) {
      return getStorageUrl(firstImage.path);
    }
  }

  if (product.image) {
    return product.image;
  }

  return "/placeholder.svg";
};

const getDiscountedValue = (price: number, discountPercentage: number): number => {
  if (discountPercentage <= 0) {
    return price;
  }

  return price - (price * discountPercentage) / 100;
};

const getProductPriceLabel = (product?: ProductSummary): string => {
  if (!product) {
    return "غير متاح";
  }

  const discountPercentage = toNumber(product.discount_percentage);
  const variantPrices = Array.isArray(product.variants)
    ? product.variants.map((variant) => toNumber(variant.price)).filter((price) => price > 0)
    : [];

  if (variantPrices.length > 0) {
    const discountedPrices = variantPrices.map((price) => getDiscountedValue(price, discountPercentage));
    const minPrice = Math.min(...discountedPrices);
    const maxPrice = Math.max(...discountedPrices);

    if (Math.abs(minPrice - maxPrice) < 0.01) {
      return formatPrice(minPrice);
    }

    return `من ${formatPrice(minPrice)} إلى ${formatPrice(maxPrice)}`;
  }

  const basePrice = toNumber(product.price);
  return formatPrice(getDiscountedValue(basePrice, discountPercentage));
};

const AdminCustomerView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordData, setPasswordData] = useState({
    password: "",
    password_confirmation: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    loadCustomer();
  }, [id]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminCustomersAPI.getCustomer(id!);
      setCustomer(response.data);
    } catch (err) {
      setError("فشل في تحميل بيانات الزبون");
      console.error("Error loading customer:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!id) {
      return;
    }

    if (passwordData.password.length < 8) {
      setPasswordError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }

    if (passwordData.password !== passwordData.password_confirmation) {
      setPasswordError("تأكيد كلمة المرور غير مطابق");
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordError("");
      await adminCustomersAPI.resetPassword(id, passwordData.password, passwordData.password_confirmation);
      setPasswordData({ password: "", password_confirmation: "" });
      toast({
        title: "تم تحديث كلمة المرور",
        description: "تم تعيين كلمة مرور جديدة لهذا الزبون بنجاح.",
      });
    } catch (submitError: any) {
      const message =
        submitError?.response?.data?.message ||
        submitError?.response?.data?.errors?.password?.[0] ||
        "تعذر إعادة تعيين كلمة المرور";
      setPasswordError(message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const customerAgeInDays = useMemo(() => {
    if (!customer?.created_at) {
      return 0;
    }

    const createdAt = new Date(customer.created_at).getTime();
    return Math.max(0, Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24)));
  }, [customer?.created_at]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600" />
            <p className="mt-2 text-gray-600">جاري تحميل بيانات الزبون...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !customer) {
    return (
      <AdminLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-red-600">{error || "الزبون غير موجود"}</p>
            <Button onClick={() => navigate("/admin/customers")}>العودة للزبائن</Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 px-6 py-4" dir="rtl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin/customers")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>العودة</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">تفاصيل الزبون</h1>
              <p className="text-gray-600">{customer.name} | #{customer.id}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card className="border-emerald-100 bg-emerald-50/40">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-emerald-700">إجمالي الطلبات</p>
                <p className="text-2xl font-bold text-gray-900">{customer.stats.total_orders}</p>
              </div>
              <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                <Package className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-blue-50/40">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-blue-700">إجمالي المشتريات</p>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(customer.stats.total_spent)}</p>
              </div>
              <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                <CreditCard className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-100 bg-orange-50/40">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-orange-700">منتجات في السلة</p>
                <p className="text-2xl font-bold text-gray-900">{customer.stats.cart_items_count}</p>
              </div>
              <div className="rounded-lg bg-orange-100 p-2 text-orange-700">
                <ShoppingCart className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-rose-100 bg-rose-50/40">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-rose-700">عناصر المفضلة</p>
                <p className="text-2xl font-bold text-gray-900">{customer.stats.wishlist_items_count}</p>
              </div>
              <div className="rounded-lg bg-rose-100 p-2 text-rose-700">
                <Heart className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 bg-purple-50/40">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-purple-700">قيمة السلة</p>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(customer.stats.cart_total)}</p>
              </div>
              <div className="rounded-lg bg-purple-100 p-2 text-purple-700">
                <TrendingUp className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">معلومات الاتصال والعنوان</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-700">
                    <User className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium">الاسم:</span>
                    <span>{customer.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Mail className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium">البريد:</span>
                    <span>{customer.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Phone className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium">الهاتف:</span>
                    <span>{customer.phone || "غير مسجل"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Calendar className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium">تاريخ التسجيل:</span>
                    <span>{new Date(customer.created_at).toLocaleDateString("ar-SA")}</span>
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <h4 className="mb-2 border-b pb-2 font-bold text-gray-900">عنوان الشحن الافتراضي</h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><span className="font-medium">المدينة:</span> {customer.city || "-"}</p>
                    <p><span className="font-medium">الحي:</span> {customer.district || "-"}</p>
                    <p><span className="font-medium">الشارع:</span> {customer.street || "-"}</p>
                    <p><span className="font-medium">البناية:</span> {customer.building || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">تاريخ الطلبات</CardTitle>
                  <CardDescription>آخر الطلبات التي قام بها هذا الزبون</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {customer.orders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                      <thead className="border-b bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 font-medium">رقم الطلب</th>
                          <th className="px-4 py-3 text-center font-medium">التاريخ</th>
                          <th className="px-4 py-3 text-center font-medium">الحالة</th>
                          <th className="px-4 py-3 text-center font-medium">الإجمالي</th>
                          <th className="px-4 py-3 text-center font-medium">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {customer.orders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-emerald-700">#{order.order_number}</td>
                            <td className="px-4 py-3 text-center text-gray-600">{new Date(order.created_at).toLocaleDateString("ar-EG")}</td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant={order.order_status === "delivered" ? "default" : "secondary"}>
                                {order.order_status_label || order.order_status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center font-bold">{formatPrice(toNumber(order.total))}</td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/admin/orders/${order.id}`)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Package className="mx-auto mb-2 h-12 w-12 text-gray-300" />
                    <p className="text-gray-500">لا يوجد طلبات سابقة</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-slate-200">
              <CardHeader className="bg-slate-50/80">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                  <Lock className="h-5 w-5" />
                  إعادة تعيين كلمة المرور
                </CardTitle>
                <CardDescription>عيّن كلمة مرور جديدة مباشرة لهذا الزبون من لوحة الإدارة.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer-password">كلمة المرور الجديدة</Label>
                    <Input
                      id="customer-password"
                      type="password"
                      value={passwordData.password}
                      onChange={(e) => setPasswordData((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="8 أحرف على الأقل"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer-password-confirmation">تأكيد كلمة المرور</Label>
                    <Input
                      id="customer-password-confirmation"
                      type="password"
                      value={passwordData.password_confirmation}
                      onChange={(e) => setPasswordData((prev) => ({ ...prev, password_confirmation: e.target.value }))}
                      placeholder="أعد إدخال كلمة المرور"
                    />
                  </div>
                  {passwordError && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                      {passwordError}
                    </div>
                  )}
                  <Button type="submit" disabled={passwordLoading} className="w-full">
                    {passwordLoading ? "جارٍ الحفظ..." : "حفظ كلمة المرور الجديدة"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-rose-200">
              <CardHeader className="bg-rose-50/60">
                <CardTitle className="flex items-center gap-2 text-lg text-rose-700">
                  <Heart className="h-5 w-5" />
                  المفضلة
                </CardTitle>
                <CardDescription>المنتجات التي أضافها الزبون إلى قائمته المفضلة.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {customer.wishlist_items.length > 0 ? (
                  <div className="space-y-3">
                    {customer.wishlist_items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 rounded-lg border border-rose-100 p-3 transition-colors hover:border-rose-200">
                        <div className="h-14 w-14 overflow-hidden rounded-lg bg-gray-100">
                          <img src={getProductImage(item.product)} alt={item.product?.name || "منتج"} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-gray-900">{item.product?.name || "منتج محذوف"}</p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                            {item.product?.brand?.name && <span>{item.product.brand.name}</span>}
                            {item.product?.brand?.name && <span>•</span>}
                            <span>{getProductPriceLabel(item.product)}</span>
                          </div>
                        </div>
                        {item.product?.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/products/${item.product?.id}/edit`)}
                          >
                            عرض
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Heart className="mx-auto mb-2 h-12 w-12 text-rose-200" />
                    <p className="text-gray-500">لا توجد عناصر في المفضلة</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-orange-200">
              <CardHeader className="bg-orange-50/60">
                <CardTitle className="flex items-center gap-2 text-lg text-orange-700">
                  <ShoppingBag className="h-5 w-5" />
                  سلة المشتريات
                </CardTitle>
                <CardDescription>المنتجات الموجودة حاليًا في سلة الزبون.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {customer.cart_items.length > 0 ? (
                  <div className="space-y-4">
                    {customer.cart_items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3 transition-all hover:border-orange-300">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded bg-gray-100">
                          {item.product ? (
                            <img src={getProductImage(item.product)} alt={item.product.name} className="h-full w-full object-cover" />
                          ) : (
                            <ShoppingBag className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-gray-900">{item.product?.name || "منتج غير معروف"}</p>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-xs text-gray-500">الكمية: {item.quantity}</span>
                            <span className="text-sm font-bold text-emerald-600">
                              {formatPrice((item.variant ? toNumber(item.variant.price) : toNumber(item.product?.price)) * item.quantity)}
                            </span>
                          </div>
                          {item.variant && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {item.variant.size && <Badge variant="outline" className="px-1 text-[10px]">{item.variant.size}</Badge>}
                              {item.variant.color && <Badge variant="outline" className="px-1 text-[10px]">{item.variant.color}</Badge>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between border-t pt-4 font-bold">
                      <span>إجمالي قيمة السلة:</span>
                      <span className="text-lg font-black text-orange-600">{formatPrice(customer.stats.cart_total)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <ShoppingCart className="mx-auto mb-2 h-12 w-12 text-gray-200" />
                    <p className="text-gray-400">السلة فارغة حاليًا</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-md">ملاحظات سريعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <p>هذا الزبون انضم للموقع منذ {customerAgeInDays} يومًا.</p>
                <p>متوسط قيمة الطلبات: {formatPrice(customer.stats.total_orders > 0 ? customer.stats.total_spent / customer.stats.total_orders : 0)}</p>
                {customer.stats.cart_items_count > 0 && (
                  <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-red-700">
                    تنبيه: يوجد منتجات مضافة إلى السلة ولم تكتمل بعد.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCustomerView;
