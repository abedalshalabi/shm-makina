import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import {
  ArrowLeft,
  Package,
  User,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Edit,
  Save,
  X,
  Search,
  Trash2
} from "lucide-react";
import { adminCitiesAPI, adminOrdersAPI, adminProductsAPI } from "../services/adminApi";
import { getStorageUrl } from "../config/env";
import Swal from "sweetalert2";

interface OrderItem {
  id: number;
  product_id?: number;
  product_variant_id?: number | null;
  product_name: string;
  product_sku: string;
  quantity: number;
  price: number;
  original_price?: number;
  discount_amount?: number;
  total: number;
  variant_values?: Record<string, string>;
  product?: {
    id: number;
    name: string;
    slug: string;
    image?: string;
  };
}

type City = {
  id: number;
  name: string;
  shipping_cost: number;
  free_shipping_threshold?: number | null;
  is_active: boolean;
};

type Variant = {
  id: number;
  sku?: string;
  price: number;
  stock_quantity: number;
  variant_values?: Record<string, string>;
  images?: Array<{ image_url?: string; image_path?: string }>;
};

type ProductSummary = {
  id: number;
  name: string;
  sku?: string;
  price: number;
  discount_percentage?: number;
  stock_status?: string;
  stock_quantity?: number;
  images?: Array<{ image_url?: string; image_path?: string; alt_text?: string }>;
  variants?: Variant[];
};

type EditableOrderLine = {
  rowId: string;
  sourceItemId?: number;
  product: ProductSummary;
  quantity: number;
  selectedVariantId?: number;
  originalQuantity?: number;
  originalVariantId?: number | null;
};

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_city: string;
  customer_district: string;
  customer_street?: string;
  customer_building?: string;
  customer_additional_info?: string;
  subtotal: number;
  shipping_cost: number;
  discount_type?: string | null;
  discount_value?: number | string | null;
  discount_amount?: number | string | null;
  force_free_shipping?: boolean;
  total: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

const AdminOrderView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<ProductSummary[]>([]);
  const [editableItems, setEditableItems] = useState<EditableOrderLine[]>([]);
  const [editData, setEditData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_city: "",
    customer_district: "",
    customer_street: "",
    customer_building: "",
    customer_additional_info: "",
    payment_method: "cod",
    order_status: "",
    payment_status: "",
    notes: "",
    discount_type: "",
    discount_value: "",
    force_free_shipping: false,
  });

  const getOrderItemProductLink = (item: OrderItem) => {
    const productId = item.product?.id;
    return productId ? `/product/${productId}` : null;
  };

  const getOrderItemImage = (item: OrderItem) => {
    const rawImage =
      item.product?.image ||
      (item as any).product?.cover_image ||
      (item as any).product_image ||
      (item as any).image ||
      "";

    return getStorageUrl(rawImage) || "/placeholder.svg";
  };

  const randomRowId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const getImageUrl = (image?: { image_url?: string; image_path?: string } | null) => {
    if (!image) return "/placeholder.svg";
    const raw = image.image_url || image.image_path || "";
    return getStorageUrl(raw) || "/placeholder.svg";
  };

  const getSelectedVariant = (line: EditableOrderLine) =>
    (line.product.variants || []).find((v) => v.id === line.selectedVariantId);

  const getLineImage = (line: EditableOrderLine) => {
    const selectedVariant = getSelectedVariant(line);
    const variantImage = selectedVariant?.images?.[0];
    if (variantImage) return getImageUrl(variantImage);
    return getImageUrl(line.product.images?.[0]);
  };

  const formatVariantValues = (variant?: Variant) => {
    if (!variant) return "";
    const entries = Object.entries(variant.variant_values || {}).filter(([, value]) => Boolean(value));
    if (entries.length === 0) return variant.sku ? `SKU: ${variant.sku}` : "بدون تفاصيل";
    return entries.map(([key, value]) => `${key}: ${value}`).join(" - ");
  };

  const getBaseUnitPrice = (line: EditableOrderLine) => {
    const variant = getSelectedVariant(line);
    return Number(variant ? variant.price : line.product.price || 0);
  };

  const getUnitPrice = (line: EditableOrderLine) => {
    const base = getBaseUnitPrice(line);
    const pct = Number(line.product.discount_percentage || 0);
    if (pct > 0) return Number((base * (1 - pct / 100)).toFixed(2));
    return base;
  };

  const getStockLimit = (line: EditableOrderLine) => {
    const variant = getSelectedVariant(line);
    if (variant) return Number(variant.stock_quantity || 0);
    return Number(line.product.stock_quantity || 0);
  };

  const getMaxAllowedQuantity = (line: EditableOrderLine) => {
    const liveStock = getStockLimit(line);
    const originalQty = Number(line.originalQuantity || 0);
    const sameOriginalVariant =
      Boolean(line.sourceItemId) && (line.originalVariantId ?? null) === (line.selectedVariantId ?? null);
    if (sameOriginalVariant) return Math.max(0, liveStock + originalQty);
    return Math.max(0, liveStock);
  };

  const normalizeValue = (value: unknown) => String(value ?? "").trim().toLowerCase();

  const variantValuesMatch = (a?: Record<string, string>, b?: Record<string, string>) => {
    const aEntries = Object.entries(a || {})
      .map(([key, value]) => [normalizeValue(key), normalizeValue(value)] as const)
      .filter(([, value]) => value.length > 0)
      .sort(([aKey], [bKey]) => aKey.localeCompare(bKey));
    const bEntries = Object.entries(b || {})
      .map(([key, value]) => [normalizeValue(key), normalizeValue(value)] as const)
      .filter(([, value]) => value.length > 0)
      .sort(([aKey], [bKey]) => aKey.localeCompare(bKey));
    if (aEntries.length === 0 || bEntries.length === 0 || aEntries.length !== bEntries.length) return false;
    return aEntries.every(([aKey, aValue], idx) => {
      const [bKey, bValue] = bEntries[idx];
      return aKey === bKey && aValue === bValue;
    });
  };

  const getDiscountPercent = (line: EditableOrderLine) => {
    const pct = Number(line.product.discount_percentage || 0);
    return Number.isFinite(pct) ? Math.max(0, pct) : 0;
  };

  const getUnitDiscountValue = (line: EditableOrderLine) => {
    const base = getBaseUnitPrice(line);
    const unit = getUnitPrice(line);
    return Number(Math.max(0, base - unit).toFixed(2));
  };

  const getLineDiscountValue = (line: EditableOrderLine) =>
    Number((getUnitDiscountValue(line) * line.quantity).toFixed(2));

  const selectedCity = cities.find((c) => c.name === editData.customer_city);
  const subtotal = editableItems.reduce((sum, line) => sum + getUnitPrice(line) * line.quantity, 0);
  const orderDiscountAmount = (() => {
    const value = Number(editData.discount_value || 0);
    if (!editData.discount_type || value <= 0) return 0;
    if (editData.discount_type === "percentage") {
      return Number((subtotal * Math.min(100, value) / 100).toFixed(2));
    }
    return Math.min(subtotal, value);
  })();
  const subtotalAfterDiscount = Math.max(0, subtotal - orderDiscountAmount);
  const shippingCost = (() => {
    if (editData.force_free_shipping) return 0;
    const base = Number(selectedCity?.shipping_cost || 0);
    const threshold = Number(selectedCity?.free_shipping_threshold || 0);
    if (threshold > 0 && subtotal >= threshold) return 0;
    return base;
  })();
  const grandTotal = subtotalAfterDiscount + shippingCost;

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    fetchOrder();
  }, [id, navigate]);

  useEffect(() => {
    const loadCities = async () => {
      try {
        const response = await adminCitiesAPI.getCities({ per_page: 200 });
        setCities((response?.data || []).filter((c: City) => c.is_active !== false));
      } catch (e) {
        console.error("Failed to load cities:", e);
      }
    };
    loadCities();
  }, []);

  useEffect(() => {
    const keyword = productSearch.trim();
    if (keyword.length < 2) {
      setProductResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const response = await adminProductsAPI.getProducts({
          search: keyword,
          per_page: 15,
          status: "active",
        });
        setProductResults(response?.data || []);
      } catch (e) {
        console.error("Failed product search:", e);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [productSearch]);

  const applyOrderToEditState = (orderData: Order) => {
    setEditData({
      customer_name: orderData.customer_name || "",
      customer_email: orderData.customer_email || "",
      customer_phone: orderData.customer_phone || "",
      customer_city: orderData.customer_city || "",
      customer_district: orderData.customer_district || "",
      customer_street: orderData.customer_street || "",
      customer_building: orderData.customer_building || "",
      customer_additional_info: orderData.customer_additional_info || "",
      payment_method: orderData.payment_method || "cod",
      order_status: orderData.order_status,
      payment_status: orderData.payment_status,
      notes: orderData.notes || "",
      discount_type: orderData.discount_type || "",
      discount_value: orderData.discount_type ? String(orderData.discount_value || "") : "",
      force_free_shipping: !!orderData.force_free_shipping,
    });
  };

  const mapOrderItemsForEdit = async (orderData: Order): Promise<EditableOrderLine[]> => {
    const productIds = Array.from(
      new Set(
        (orderData.items || [])
          .map((item: any) => Number(item.product_id || item.product?.id))
          .filter((pid) => Number.isFinite(pid) && pid > 0)
      )
    );

    const productMap = new Map<number, any>();
    await Promise.all(
      productIds.map(async (productId) => {
        try {
          const productResponse = await adminProductsAPI.getProduct(String(productId));
          if (productResponse?.data) {
            productMap.set(productId, productResponse.data);
          }
        } catch {
          // Keep fallback item data when product request fails
        }
      })
    );

    return (orderData.items || []).map((item: any) => {
      const productId = Number(item.product_id || item.product?.id || 0);
      const fullProduct = productMap.get(productId);
      const variants: Variant[] = (fullProduct?.variants || []).map((v: any) => ({
        id: v.id,
        sku: v.sku,
        price: Number(v.price || 0),
        stock_quantity: Number(v.stock_quantity || 0),
        variant_values: v.variant_values || {},
        images: (v.images || []).map((img: any) => ({
          image_url: img.image_url,
          image_path: img.image_path,
        })),
      }));

      const explicitVariantId = item.product_variant_id ? Number(item.product_variant_id) : undefined;
      const variantFromId =
        explicitVariantId && variants.some((v) => v.id === explicitVariantId) ? explicitVariantId : undefined;
      const matchedVariant =
        !variantFromId && item.variant_values
          ? variants.find((variant) => variantValuesMatch(variant.variant_values, item.variant_values))
          : undefined;
      const selectedVariantId = variantFromId || matchedVariant?.id;

      return {
        rowId: randomRowId(),
        sourceItemId: item.id,
        product: {
          id: productId,
          name: fullProduct?.name || item.product_name,
          sku: fullProduct?.sku || item.product_sku,
          price: Number(fullProduct?.price || item.original_price || item.price || 0),
          discount_percentage: Number(fullProduct?.discount_percentage || 0),
          stock_status: fullProduct?.stock_status || "stock_based",
          stock_quantity: Number(fullProduct?.stock_quantity || item.quantity || 0),
          images: fullProduct?.images || (item.product?.image ? [{ image_url: item.product.image }] : []),
          variants,
        },
        quantity: Number(item.quantity || 1),
        selectedVariantId,
        originalQuantity: Number(item.quantity || 1),
        originalVariantId: selectedVariantId ?? null,
      };
    });
  };

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await adminOrdersAPI.getOrder(id!);
      const orderData = response.data;
      setOrder(orderData);
      applyOrderToEditState(orderData);
      setEditableItems(await mapOrderItemsForEdit(orderData));
    } catch (err: any) {
      setError(err.response?.data?.message || "فشل في تحميل الطلب");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const normalizedItems = editableItems.map((line) => {
        const variants = line.product.variants || [];
        const hasVariants = variants.length > 0;
        const resolvedVariantId = hasVariants ? line.selectedVariantId || null : null;

        return {
          productName: line.product.name,
          hasVariants,
          resolvedVariantId,
          payload: {
            product_id: line.product.id,
            product_variant_id: resolvedVariantId,
            quantity: line.quantity,
          },
        };
      });

      const missingVariant = normalizedItems.find((item) => item.hasVariants && !item.resolvedVariantId);
      if (missingVariant) {
        Swal.fire({
          icon: "error",
          title: "خطأ",
          text: `يرجى اختيار الفارينت للمنتج: ${missingVariant.productName}`,
          confirmButtonText: "حسنًا",
        });
        return;
      }

      const payload = {
        ...editData,
        discount_type: editData.discount_type || null,
        discount_value: editData.discount_type ? Number(editData.discount_value || 0) : 0,
        force_free_shipping: !!editData.force_free_shipping,
        items: normalizedItems.map((item) => item.payload),
      };
      await adminOrdersAPI.updateOrder(id!, payload);
      await fetchOrder();
      setIsEditing(false);
      Swal.fire({
        icon: "success",
        title: "تم التحديث",
        text: "تم تحديث الطلب بنجاح",
        confirmButtonText: "حسناً"
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: err.response?.data?.message || "فشل في تحديث الطلب",
        confirmButtonText: "حسناً"
      });
    }
  };

  const addProductToOrder = async (productId: number) => {
    try {
      const response = await adminProductsAPI.getProduct(String(productId));
      const product = response?.data;
      if (!product) return;

      const variants: Variant[] = (product.variants || []).map((v: any) => ({
        id: v.id,
        sku: v.sku,
        price: Number(v.price || 0),
        stock_quantity: Number(v.stock_quantity || 0),
        variant_values: v.variant_values || {},
        images: (v.images || []).map((img: any) => ({
          image_url: img.image_url,
          image_path: img.image_path,
        })),
      }));
      const defaultVariant = variants.find((v) => Number(v.stock_quantity) > 0) || variants[0];

      setEditableItems((prev) => [
        ...prev,
        {
          rowId: randomRowId(),
          product: {
            id: product.id,
            name: product.name,
            sku: product.sku,
            price: Number(product.price || 0),
            discount_percentage: Number(product.discount_percentage || 0),
            stock_status: product.stock_status,
            stock_quantity: Number(product.stock_quantity || 0),
            images: (product.images || []).map((img: any) => ({
              image_url: img.image_url,
              image_path: img.image_path,
              alt_text: img.alt_text,
            })),
            variants,
          },
          quantity: 1,
          selectedVariantId: defaultVariant?.id,
        },
      ]);

      setProductSearch("");
      setProductResults([]);
    } catch (e) {
      console.error("Failed to add product:", e);
    }
  };

  const updateLine = (rowId: string, updates: Partial<EditableOrderLine>) => {
    setEditableItems((prev) =>
      prev.map((line) => {
        if (line.rowId !== rowId) return line;
        const next = { ...line, ...updates };
        const maxAllowed = getMaxAllowedQuantity(next);
        if (maxAllowed > 0 && next.quantity > maxAllowed) next.quantity = maxAllowed;
        if (maxAllowed <= 0) next.quantity = Math.max(1, Number(next.originalQuantity || 1));
        if (next.quantity < 1) next.quantity = 1;
        return next;
      })
    );
  };

  const removeLine = (rowId: string) => {
    setEditableItems((prev) => prev.filter((line) => line.rowId !== rowId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "processing": return "bg-emerald-100 text-emerald-800";
      case "shipped": return "bg-purple-100 text-purple-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4" />;
      case "processing": return <Package className="w-4 h-4" />;
      case "shipped": return <Truck className="w-4 h-4" />;
      case "delivered": return <CheckCircle className="w-4 h-4" />;
      case "cancelled": return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "معلق",
      processing: "قيد المعالجة",
      shipped: "تم الشحن",
      delivered: "تم التسليم",
      cancelled: "ملغي"
    };
    return labels[status] || status;
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      case "refunded": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      paid: "مدفوع",
      pending: "معلق",
      failed: "فشل",
      refunded: "مسترد"
    };
    return labels[status] || status;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cod: "الدفع عند الاستلام",
      bank_transfer: "تحويل بنكي",
      credit_card: "بطاقة ائتمانية",
      online: "دفع إلكتروني"
    };
    return labels[method] || method;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">جاري تحميل الطلب...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !order) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">خطأ</h3>
            <p className="text-gray-600">{error || "الطلب غير موجود"}</p>
            <button
              onClick={() => navigate("/admin/orders")}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              العودة إلى الطلبات
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <button
              onClick={() => navigate("/admin/orders")}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">تفاصيل الطلب</h1>
              <p className="text-gray-600">#{order.order_number}</p>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              <Edit className="w-4 h-4" />
              <span>تعديل</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">عناصر الطلب</h2>
              {isEditing && (
                <div className="mb-4 space-y-4">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      className="w-full border rounded-lg pr-10 pl-3 py-2"
                      placeholder="ابحث عن منتج لإضافته"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                    {productResults.length > 0 && (
                      <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {productResults.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => addProductToOrder(product.id)}
                            className="w-full text-right px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={getImageUrl(product.images?.[0])}
                                alt={product.name}
                                className="w-16 h-16 rounded-md object-cover bg-gray-100 border border-gray-200"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="font-medium truncate">{product.name}</div>
                                <div className="text-xs text-gray-500">
                                  SKU: {product.sku || "-"} - {Number(product.price || 0).toLocaleString()} شيكل
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {editableItems.map((line) => {
                    const variants = line.product.variants || [];
                    const hasVariants = variants.length > 0;
                    const stockLimit = getStockLimit(line);
                    const maxAllowedQuantity = getMaxAllowedQuantity(line);
                    const lineTotal = getUnitPrice(line) * line.quantity;
                    const unitDiscountValue = getUnitDiscountValue(line);
                    const lineDiscountValue = getLineDiscountValue(line);
                    const discountPercent = getDiscountPercent(line);
                    return (
                      <div key={line.rowId} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <button
                              type="button"
                              onClick={() => window.open(`/product/${line.product.id}`, "_blank")}
                              className="mb-2 inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              title="Open product page on storefront"
                            >
                              <img
                                src={getLineImage(line)}
                                alt={line.product.name}
                                className="w-20 h-20 rounded-md object-cover bg-gray-100 border border-gray-200 cursor-pointer"
                              />
                            </button>
                            <div className="font-semibold">{line.product.name}</div>
                            {discountPercent > 0 && (
                              <div className="mt-1 inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                                خصم {discountPercent}% (-{unitDiscountValue.toLocaleString()} شيكل للوحدة)
                              </div>
                            )}
                            <div className="text-xs text-gray-500">SKU: {line.product.sku || "-"}</div>
                            {hasVariants && (
                              <select
                                className="mt-2 w-full border rounded-lg px-3 py-2 text-sm"
                                value={line.selectedVariantId || ""}
                                onChange={(e) => updateLine(line.rowId, { selectedVariantId: e.target.value ? Number(e.target.value) : undefined, quantity: 1 })}
                              >
                                <option value="">اختر الفارينت</option>
                                {variants.map((v) => {
                                  const isSelected = line.selectedVariantId === v.id;
                                  const isAvailable =
                                    line.product.stock_status === "in_stock" || Number(v.stock_quantity) > 0;
                                  return (
                                    <option key={v.id} value={v.id} disabled={!isAvailable && !isSelected}>
                                      {Object.entries(v.variant_values || {}).map(([k, val]) => `${k}: ${val}`).join(" | ")}
                                    </option>
                                  );
                                })}
                              </select>
                            )}
                            {hasVariants && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-gray-600 mb-2">اختر الفارينت:</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {variants.map((variant) => {
                                    const isSelected = line.selectedVariantId === variant.id;
                                    const isAvailable =
                                      line.product.stock_status === "in_stock" || Number(variant.stock_quantity) > 0;

                                    return (
                                      <button
                                        key={variant.id}
                                        type="button"
                                        onClick={() => updateLine(line.rowId, { selectedVariantId: variant.id, quantity: 1 })}
                                        disabled={!isAvailable && !isSelected}
                                        className={`rounded-lg border px-3 py-2 text-right transition ${
                                          isSelected
                                            ? "border-emerald-500 bg-emerald-50"
                                            : isAvailable
                                              ? "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                              : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                                        }`}
                                      >
                                        <div className="text-xs font-semibold">{formatVariantValues(variant)}</div>
                                        <div className="text-[11px] mt-1">السعر: {Number(variant.price || 0).toLocaleString()} شيكل</div>
                                        <div className="text-[11px]">المخزون: {variant.stock_quantity}</div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            {hasVariants && line.selectedVariantId && (
                              <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                                <div className="font-semibold">الفارينت المختار</div>
                                <div className="mt-1">{formatVariantValues(getSelectedVariant(line))}</div>
                              </div>
                            )}
                          </div>
                          <button type="button" onClick={() => removeLine(line.rowId)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <div className="flex items-center border rounded-lg">
                            <button type="button" className="px-3 py-1" onClick={() => updateLine(line.rowId, { quantity: line.quantity - 1 })}>-</button>
                            <input className="w-16 text-center border-x py-1" type="number" min={1} max={maxAllowedQuantity > 0 ? maxAllowedQuantity : undefined} value={line.quantity} onChange={(e) => updateLine(line.rowId, { quantity: Number(e.target.value || 1) })} />
                            <button type="button" className="px-3 py-1 disabled:text-gray-300" disabled={maxAllowedQuantity <= 0 || line.quantity >= maxAllowedQuantity} onClick={() => updateLine(line.rowId, { quantity: line.quantity + 1 })}>+</button>
                          </div>
                          <span className="text-sm text-gray-600">المخزون المتاح: {stockLimit}</span>
                          <span className="text-sm text-gray-600">الحد الأقصى المسموح: {maxAllowedQuantity}</span>
                          {discountPercent > 0 && (
                            <span className="text-sm text-gray-500">
                              السعر قبل الخصم: <span className="line-through">{getBaseUnitPrice(line).toLocaleString()} شيكل</span>
                            </span>
                          )}
                          {lineDiscountValue > 0 && (
                            <span className="text-sm font-medium text-red-600">قيمة الخصم: -{lineDiscountValue.toLocaleString()} شيكل</span>
                          )}
                          <span className="text-sm font-semibold text-emerald-700">سعر الوحدة: {getUnitPrice(line).toLocaleString()} شيكل</span>
                          <span className="text-sm font-bold">الإجمالي: {lineTotal.toLocaleString()} شيكل</span>
                        </div>
                      </div>
                    );
                  })}
                  {editableItems.length === 0 && <p className="text-gray-500 text-sm">لم يتم إضافة أي منتج بعد.</p>}
                </div>
              )}

              {!isEditing && (
                <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 space-x-reverse border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                    {getOrderItemProductLink(item) ? (
                      <Link to={getOrderItemProductLink(item)!} className="block hover:opacity-90 transition-opacity">
                        <img
                          src={getOrderItemImage(item)}
                          alt={item.product_name}
                          className="w-16 h-16 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg";
                          }}
                        />
                      </Link>
                    ) : (
                      <img
                        src={getOrderItemImage(item)}
                        alt={item.product_name}
                        className="w-16 h-16 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                    )}
                    <div className="flex-1">
                      {getOrderItemProductLink(item) ? (
                        <Link to={getOrderItemProductLink(item)!} className="font-medium text-gray-900 hover:text-emerald-600 transition-colors">
                          {item.product_name}
                        </Link>
                      ) : (
                        <h3 className="font-medium text-gray-900">{item.product_name}</h3>
                      )}
                      <p className="text-sm text-gray-500">SKU: {item.product_sku}</p>
                      {item.variant_values && Object.keys(item.variant_values).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {Object.entries(item.variant_values).map(([k, v]) => (
                            <span key={k} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                              {k}: {v}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-sm text-gray-500">الكمية: {item.quantity}</p>
                    </div>
                    <div className="text-left min-w-[120px]">
                      <div className="flex flex-col items-end">
                        <p className="font-bold text-emerald-600 text-lg">
                          {Number(item.price).toLocaleString()} شيكل
                        </p>
                        
                        {(Number(item.original_price) > 0 && Number(item.original_price) > Number(item.price)) ? (
                          <div className="text-right mt-1 bg-red-50 p-1 rounded border border-red-100">
                            <p className="text-[11px] text-gray-500">
                              <span className="line-through">{Number(item.original_price).toLocaleString()} شيكل</span>
                              <span className="mr-1">(قبل الخصم)</span>
                            </p>
                            {Number(item.discount_amount) > 0 && (
                              <p className="text-[11px] text-red-600 font-bold">
                                وفر: {(Number(item.original_price) - Number(item.price)).toLocaleString()} شيكل ({Math.round(((Number(item.original_price) - Number(item.price)) / Number(item.original_price)) * 100)}%)
                              </p>
                            )}
                          </div>
                        ) : null}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2 text-right">
                        إجمالي الصنف ({item.quantity} قطع): {Number(item.total).toLocaleString()} شيكل
                      </p>
                    </div>
                  </div>
                ))}
                </div>
              )}
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">معلومات العميل</h2>
              {isEditing && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <input className="border rounded-lg px-3 py-2" placeholder="اسم العميل" value={editData.customer_name} onChange={(e) => setEditData({ ...editData, customer_name: e.target.value })} />
                  <input className="border rounded-lg px-3 py-2" placeholder="البريد الإلكتروني" type="email" value={editData.customer_email} onChange={(e) => setEditData({ ...editData, customer_email: e.target.value })} />
                  <input className="border rounded-lg px-3 py-2" placeholder="رقم الجوال" value={editData.customer_phone} onChange={(e) => setEditData({ ...editData, customer_phone: e.target.value })} />
                  <select className="border rounded-lg px-3 py-2" value={editData.customer_city} onChange={(e) => setEditData({ ...editData, customer_city: e.target.value })}>
                    <option value="">اختر المدينة</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.name}>{city.name}</option>
                    ))}
                  </select>
                  <input className="border rounded-lg px-3 py-2" placeholder="المنطقة / الحي" value={editData.customer_district} onChange={(e) => setEditData({ ...editData, customer_district: e.target.value })} />
                  <input className="border rounded-lg px-3 py-2" placeholder="الشارع" value={editData.customer_street} onChange={(e) => setEditData({ ...editData, customer_street: e.target.value })} />
                  <input className="border rounded-lg px-3 py-2" placeholder="رقم المبنى" value={editData.customer_building} onChange={(e) => setEditData({ ...editData, customer_building: e.target.value })} />
                  <textarea className="border rounded-lg px-3 py-2 md:col-span-2" placeholder="معلومات إضافية" value={editData.customer_additional_info} onChange={(e) => setEditData({ ...editData, customer_additional_info: e.target.value })} />
                </div>
              )}
              {!isEditing && (
                <div className="space-y-3">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">الاسم</p>
                    <p className="font-medium text-gray-900">{order.customer_name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">البريد الإلكتروني</p>
                    <p className="font-medium text-gray-900">{order.customer_email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">الهاتف</p>
                    <p className="font-medium text-gray-900" dir="ltr">{order.customer_phone}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 space-x-reverse">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">العنوان</p>
                    <p className="font-medium text-gray-900">
                      {order.customer_city}، {order.customer_district}
                      {order.customer_street && `، ${order.customer_street}`}
                      {order.customer_building && `، مبنى ${order.customer_building}`}
                    </p>
                    {order.customer_additional_info && (
                      <p className="text-sm text-gray-500 mt-1">{order.customer_additional_info}</p>
                    )}
                  </div>
                </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Order Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">حالة الطلب</h2>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      حالة الطلب
                    </label>
                    <select
                      value={editData.order_status}
                      onChange={(e) => setEditData({ ...editData, order_status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="pending">معلق</option>
                      <option value="processing">قيد المعالجة</option>
                      <option value="shipped">تم الشحن</option>
                      <option value="delivered">تم التسليم</option>
                      <option value="cancelled">ملغي</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      طريقة الدفع
                    </label>
                    <select
                      value={editData.payment_method}
                      onChange={(e) => setEditData({ ...editData, payment_method: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="cod">الدفع عند الاستلام</option>
                      <option value="bank_transfer">تحويل بنكي</option>
                      <option value="credit_card">بطاقة ائتمانية</option>
                      <option value="online">دفع إلكتروني</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        نوع الخصم
                      </label>
                      <select
                        value={editData.discount_type}
                        onChange={(e) => setEditData({ ...editData, discount_type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">بدون خصم</option>
                        <option value="fixed">قيمة ثابتة</option>
                        <option value="percentage">نسبة مئوية</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        قيمة الخصم
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={editData.discount_value}
                        onChange={(e) => setEditData({ ...editData, discount_value: e.target.value })}
                        disabled={!editData.discount_type}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={editData.force_free_shipping}
                      onChange={(e) => setEditData({ ...editData, force_free_shipping: e.target.checked })}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    شحن مجاني لهذا الطلب
                  </label>
                  {(orderDiscountAmount > 0 || editData.force_free_shipping) && (
                    <button
                      type="button"
                      onClick={() =>
                        setEditData({
                          ...editData,
                          discount_type: "",
                          discount_value: "",
                          force_free_shipping: false,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                    >
                      التراجع عن الخصم/الشحن المجاني
                    </button>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      حالة الدفع
                    </label>
                    <select
                      value={editData.payment_status}
                      onChange={(e) => setEditData({ ...editData, payment_status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="pending">معلق</option>
                      <option value="paid">مدفوع</option>
                      <option value="failed">فشل</option>
                      <option value="refunded">مسترد</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ملاحظات
                    </label>
                    <textarea
                      value={editData.notes}
                      onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      onClick={handleSave}
                      className="flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      <Save className="w-4 h-4" />
                      <span>حفظ</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        applyOrderToEditState(order);
                        setProductSearch("");
                        setProductResults([]);
                        mapOrderItemsForEdit(order)
                          .then((items) => setEditableItems(items))
                          .catch(() => {
                            // Keep current rows if reset hydration fails
                          });
                      }}
                      className="flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      <X className="w-4 h-4" />
                      <span>إلغاء</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">حالة الطلب</p>
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(order.order_status)}`}>
                      {getStatusIcon(order.order_status)}
                      <span className="mr-2">{getStatusLabel(order.order_status)}</span>
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">حالة الدفع</p>
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                      {getPaymentStatusLabel(order.payment_status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">طريقة الدفع</p>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <CreditCard className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {getPaymentMethodLabel(order.payment_method)}
                      </span>
                    </div>
                  </div>
                  {order.notes && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">ملاحظات</p>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {order.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">ملخص الطلب</h2>
              <div className="space-y-3">
                {(() => {
                  const totalOriginalPrice = order.items.reduce((sum, item) => sum + (Number(item.original_price || item.price) * item.quantity), 0);
                  const totalDiscount = order.items.reduce((sum, item) => sum + (Number(item.discount_amount || 0)), 0);
                  const displayedSubtotal = isEditing ? subtotal : Number(order.subtotal || 0);
                  const displayedManualDiscount = isEditing ? orderDiscountAmount : Number(order.discount_amount || 0);
                  
                  return (
                    <>
                      {totalDiscount > 0 && (
                        <>
                          <div className="flex justify-between text-gray-500 line-through text-sm">
                            <span>الإجمالي قبل الخصم</span>
                            <span>
                              {totalOriginalPrice.toLocaleString()} شيكل
                            </span>
                          </div>
                          <div className="flex justify-between text-red-600 text-sm">
                            <span>إجمالي الخصم</span>
                            <span>
                              - {totalDiscount.toLocaleString()} شيكل
                            </span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">المجموع الفرعي</span>
                        <span className="font-medium text-gray-900">
                          {displayedSubtotal.toLocaleString()} شيكل
                        </span>
                      </div>
                      {displayedManualDiscount > 0 && (
                        <div className="flex justify-between text-red-600 text-sm">
                          <span>خصم يدوي على الفاتورة</span>
                          <span>- {displayedManualDiscount.toLocaleString()} شيكل</span>
                        </div>
                      )}
                    </>
                  );
                })()}
                <div className="flex justify-between">
                  <span className="text-gray-600">تكلفة الشحن</span>
                  <span className="font-medium text-gray-900">
                    {(isEditing ? shippingCost : order.shipping_cost).toLocaleString()} شيكل
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">الإجمالي</span>
                  <span className="text-lg font-bold text-gray-900">
                    {(isEditing ? grandTotal : order.total).toLocaleString()} شيكل
                  </span>
                </div>
              </div>
            </div>

            {/* Order Date */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">معلومات التاريخ</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">تاريخ الإنشاء</p>
                    <p className="font-medium text-gray-900">
                      {new Date(order.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
                {order.updated_at !== order.created_at && (
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">آخر تحديث</p>
                      <p className="font-medium text-gray-900">
                        {new Date(order.updated_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.updated_at).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOrderView;

