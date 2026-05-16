import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { adminCitiesAPI, adminOrdersAPI, adminProductsAPI } from "../services/adminApi";
import { getStorageUrl } from "../config/env";
import Swal from "sweetalert2";
import { ArrowLeft, Plus, Search, Trash2 } from "lucide-react";

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
  images?: Array<{
    image_url?: string;
    image_path?: string;
  }>;
};

type ProductImage = {
  image_url?: string;
  image_path?: string;
  alt_text?: string;
};

type ProductSummary = {
  id: number;
  name: string;
  sku?: string;
  price: number;
  discount_percentage?: number;
  stock_status?: string;
  stock_quantity?: number;
  variants?: Variant[];
  images?: ProductImage[];
};

type OrderLine = {
  rowId: string;
  product: ProductSummary;
  quantity: number;
  selectedVariantId?: number;
};

const randomRowId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const getImageUrl = (image?: ProductImage | null) => {
  if (!image) return "/placeholder.svg";
  const raw = image.image_url || image.image_path || "";
  return getStorageUrl(raw) || "/placeholder.svg";
};

const formatVariantValues = (variant?: Variant) => {
  if (!variant) return "";
  const entries = Object.entries(variant.variant_values || {}).filter(([, value]) => Boolean(value));
  if (entries.length === 0) return variant.sku ? `SKU: ${variant.sku}` : "بدون تفاصيل";
  return entries.map(([key, value]) => `${key}: ${value}`).join(" | ");
};

const AdminOrderCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<ProductSummary[]>([]);
  const [items, setItems] = useState<OrderLine[]>([]);

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_city: "",
    customer_district: "",
    customer_street: "",
    customer_building: "",
    customer_additional_info: "",
    payment_method: "cod",
    payment_status: "pending",
    order_status: "pending",
    notes: "",
    discount_type: "",
    discount_value: "",
    force_free_shipping: false,
  });

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    const loadCities = async () => {
      try {
        const response = await adminCitiesAPI.getCities({ per_page: 200 });
        setCities((response?.data || []).filter((c: City) => c.is_active !== false));
      } catch (error) {
        console.error("Failed to load cities:", error);
      }
    };

    loadCities();
  }, [navigate]);

  useEffect(() => {
    const keyword = productSearch.trim();
    if (keyword.length < 2) {
      setProductResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const response = await adminProductsAPI.getProducts({
          search: keyword,
          per_page: 15,
          status: "active",
        });
        setProductResults(response?.data || []);
      } catch (error) {
        console.error("Failed to search products:", error);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [productSearch]);

  const selectedCity = useMemo(
    () => cities.find((city) => city.name === formData.customer_city),
    [cities, formData.customer_city]
  );

  const getSelectedVariant = (line: OrderLine) =>
    (line.product.variants || []).find((v) => v.id === line.selectedVariantId);

  const getLineImage = (line: OrderLine) => {
    const selectedVariant = getSelectedVariant(line);
    const variantImage = selectedVariant?.images?.[0];
    if (variantImage) return getImageUrl(variantImage);
    return getImageUrl(line.product.images?.[0]);
  };

  const getVariantKeys = (line: OrderLine) =>
    Object.keys((line.product.variants || [])[0]?.variant_values || {});

  const getSelectedVariantOptions = (line: OrderLine): Record<string, string> =>
    getSelectedVariant(line)?.variant_values || {};

  const getVariantValuesForKey = (line: OrderLine, key: string): string[] => {
    const unique = new Set<string>();
    (line.product.variants || []).forEach((variant) => {
      const value = variant.variant_values?.[key];
      if (value) unique.add(value);
    });
    return Array.from(unique);
  };

  const isVariantValueAvailable = (
    line: OrderLine,
    key: string,
    value: string,
    keyIndex: number,
    variantKeys: string[],
    selectedOptions: Record<string, string>
  ) => {
    return (line.product.variants || []).some((variant) => {
      if (variant.variant_values?.[key] !== value) return false;
      if (line.product.stock_status !== "in_stock" && Number(variant.stock_quantity) <= 0) return false;

      for (let i = 0; i < keyIndex; i++) {
        const prevKey = variantKeys[i];
        const prevValue = selectedOptions[prevKey];
        if (prevValue && variant.variant_values?.[prevKey] !== prevValue) return false;
      }

      return true;
    });
  };

  const selectVariantOption = (line: OrderLine, key: string, value: string, keyIndex: number) => {
    const variants = line.product.variants || [];
    if (variants.length === 0) return;

    const variantKeys = getVariantKeys(line);
    let newOptions: Record<string, string> = { ...getSelectedVariantOptions(line), [key]: value };

    for (let i = keyIndex + 1; i < variantKeys.length; i++) {
      const nextKey = variantKeys[i];
      const currentNextValue = newOptions[nextKey];

      const hasCurrentNextValue = variants.some((variant) =>
        variant.variant_values?.[nextKey] === currentNextValue &&
        variantKeys.slice(0, i).every((k) => variant.variant_values?.[k] === newOptions[k]) &&
        (line.product.stock_status === "in_stock" || Number(variant.stock_quantity) > 0)
      );

      if (!hasCurrentNextValue) {
        const firstAvailable = variants.find((variant) =>
          variantKeys.slice(0, i).every((k) => variant.variant_values?.[k] === newOptions[k]) &&
          (line.product.stock_status === "in_stock" || Number(variant.stock_quantity) > 0)
        );
        if (firstAvailable) {
          newOptions[nextKey] = firstAvailable.variant_values?.[nextKey];
        }
      }
    }

    const exactMatch = variants.find(
      (variant) =>
        variantKeys.every((k) => variant.variant_values?.[k] === newOptions[k]) &&
        (line.product.stock_status === "in_stock" || Number(variant.stock_quantity) > 0)
    );

    const fallbackMatch = exactMatch || variants.find(
      (variant) =>
        variant.variant_values?.[key] === value &&
        variantKeys.slice(0, keyIndex).every((k) => {
          const selected = newOptions[k];
          return !selected || variant.variant_values?.[k] === selected;
        }) &&
        (line.product.stock_status === "in_stock" || Number(variant.stock_quantity) > 0)
    );

    if (fallbackMatch) {
      updateLine(line.rowId, { selectedVariantId: fallbackMatch.id, quantity: 1 });
    }
  };

  const getUnitPrice = (line: OrderLine) => {
    const basePrice = getBaseUnitPrice(line);
    const pct = Number(line.product.discount_percentage || 0);
    if (pct > 0) return Number((basePrice * (1 - pct / 100)).toFixed(2));
    return basePrice;
  };

  const getBaseUnitPrice = (line: OrderLine) => {
    const variant = getSelectedVariant(line);
    return Number(variant ? variant.price : line.product.price || 0);
  };

  const getUnitDiscountValue = (line: OrderLine) => {
    const basePrice = getBaseUnitPrice(line);
    const finalPrice = getUnitPrice(line);
    return Math.max(0, Number((basePrice - finalPrice).toFixed(2)));
  };

  const getLineDiscountValue = (line: OrderLine) => {
    return Number((getUnitDiscountValue(line) * line.quantity).toFixed(2));
  };

  const getDiscountPercent = (line: OrderLine) => {
    const pct = Number(line.product.discount_percentage || 0);
    return pct > 0 ? pct : 0;
  };

  const getStockLimit = (line: OrderLine) => {
    const variant = getSelectedVariant(line);
    if (variant) return Number(variant.stock_quantity || 0);
    return Number(line.product.stock_quantity || 0);
  };

  const subtotal = useMemo(
    () => items.reduce((sum, line) => sum + getUnitPrice(line) * line.quantity, 0),
    [items]
  );

  const shippingCost = useMemo(() => {
    if (formData.force_free_shipping) return 0;
    const baseShipping = Number(selectedCity?.shipping_cost || 0);
    const threshold = Number(selectedCity?.free_shipping_threshold || 0);
    if (threshold > 0 && subtotal >= threshold) return 0;
    return baseShipping;
  }, [selectedCity, subtotal, formData.force_free_shipping]);

  const manualDiscountAmount = useMemo(() => {
    const rawValue = Number(formData.discount_value || 0);
    const value = Number.isFinite(rawValue) ? Math.max(0, rawValue) : 0;
    if (!formData.discount_type || value <= 0) return 0;
    if (formData.discount_type === "fixed") return Math.min(subtotal, value);
    if (formData.discount_type === "percentage") return Math.min(subtotal, subtotal * (Math.min(100, value) / 100));
    return 0;
  }, [formData.discount_type, formData.discount_value, subtotal]);

  const grandTotal = Math.max(0, subtotal - manualDiscountAmount + shippingCost);

  const addProductToOrder = async (productId: number) => {
    try {
      const response = await adminProductsAPI.getProduct(String(productId));
      const product = response?.data;
      if (!product) return;

      const mappedVariants: Variant[] = (product.variants || []).map((variant: any) => ({
        id: variant.id,
        sku: variant.sku,
        price: Number(variant.price || 0),
        stock_quantity: Number(variant.stock_quantity || 0),
        variant_values: variant.variant_values || {},
        images: (variant.images || []).map((image: any) => ({
          image_url: image.image_url,
          image_path: image.image_path,
        })),
      }));

      const defaultVariant =
        mappedVariants.find((variant) => Number(variant.stock_quantity) > 0) ||
        mappedVariants[0];

      const line: OrderLine = {
        rowId: randomRowId(),
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: Number(product.price || 0),
          discount_percentage: Number(product.discount_percentage || 0),
          stock_status: product.stock_status,
          stock_quantity: Number(product.stock_quantity || 0),
          images: (product.images || []).map((image: any) => ({
            image_url: image.image_url,
            image_path: image.image_path,
            alt_text: image.alt_text,
          })),
          variants: mappedVariants,
        },
        quantity: 1,
        selectedVariantId: defaultVariant?.id,
      };

      setItems((prev) => [...prev, line]);
      setProductSearch("");
      setProductResults([]);
    } catch (error) {
      console.error("Failed to load product details:", error);
    }
  };

  const updateLine = (rowId: string, updates: Partial<OrderLine>) => {
    setItems((prev) =>
      prev.map((line) => {
        if (line.rowId !== rowId) return line;
        const next = { ...line, ...updates };
        const stockLimit = getStockLimit(next);
        if (stockLimit > 0 && next.quantity > stockLimit) {
          next.quantity = stockLimit;
        }
        if (next.quantity < 1) next.quantity = 1;
        return next;
      })
    );
  };

  const removeLine = (rowId: string) => {
    setItems((prev) => prev.filter((line) => line.rowId !== rowId));
  };

  const validateBeforeSubmit = () => {
    if (items.length === 0) {
      return "يجب إضافة منتج واحد على الأقل.";
    }

    for (const line of items) {
      const hasVariants = (line.product.variants || []).length > 0;
      if (hasVariants && !line.selectedVariantId) {
        return `يرجى اختيار الفاريانت للمنتج: ${line.product.name}`;
      }

      const stockLimit = getStockLimit(line);
      if (line.product.stock_status === "stock_based" && stockLimit >= 0 && line.quantity > stockLimit) {
        return `الكمية المطلوبة تتجاوز المخزون المتاح للمنتج: ${line.product.name}`;
      }
    }

    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateBeforeSubmit();
    if (validationError) {
      Swal.fire({ icon: "error", title: "خطأ", text: validationError, confirmButtonText: "حسناً" });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customer_name: formData.customer_name,
        customer_email: formData.customer_email || null,
        customer_phone: formData.customer_phone,
        customer_city: formData.customer_city,
        customer_district: formData.customer_district,
        customer_street: formData.customer_street || null,
        customer_building: formData.customer_building || null,
        customer_additional_info: formData.customer_additional_info || null,
        payment_method: formData.payment_method,
        payment_status: formData.payment_status,
        order_status: formData.order_status,
        notes: formData.notes || null,
        discount_type: formData.discount_type || null,
        discount_value: formData.discount_type ? Number(formData.discount_value || 0) : 0,
        force_free_shipping: !!formData.force_free_shipping,
        items: items.map((line) => ({
          product_id: line.product.id,
          product_variant_id: line.selectedVariantId || null,
          quantity: line.quantity,
        })),
      };

      const response = await adminOrdersAPI.createOrder(payload);
      const orderId = response?.data?.id;

      Swal.fire({
        icon: "success",
        title: "تم إنشاء الطلب",
        text: "تم إنشاء الطلب بنجاح.",
        confirmButtonText: "عرض الطلب",
      }).then(() => {
        if (orderId) {
          navigate(`/admin/orders/${orderId}`);
        } else {
          navigate("/admin/orders");
        }
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "فشل إنشاء الطلب",
        text: err?.response?.data?.message || "حدث خطأ أثناء إنشاء الطلب.",
        confirmButtonText: "حسناً",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إنشاء طلب جديد</h1>
            <p className="text-gray-600">إنشاء طلب يدويًا من لوحة التحكم</p>
          </div>
          <button
            onClick={() => navigate("/admin/orders")}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">بيانات العميل</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="border rounded-lg px-3 py-2" placeholder="اسم العميل" required value={formData.customer_name} onChange={(e) => setFormData((p) => ({ ...p, customer_name: e.target.value }))} />
                <div className="space-y-2">
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="البريد الإلكتروني (اختياري)"
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        customer_email: e.target.value,
                      }))
                    }
                  />
                </div>
                <input className="border rounded-lg px-3 py-2" placeholder="رقم الجوال (05XXXXXXXX)" required value={formData.customer_phone} onChange={(e) => setFormData((p) => ({ ...p, customer_phone: e.target.value }))} />
                <select className="border rounded-lg px-3 py-2" required value={formData.customer_city} onChange={(e) => setFormData((p) => ({ ...p, customer_city: e.target.value }))}>
                  <option value="">اختر المدينة</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.name}>{city.name}</option>
                  ))}
                </select>
                <input className="border rounded-lg px-3 py-2" placeholder="المنطقة / الحي" required value={formData.customer_district} onChange={(e) => setFormData((p) => ({ ...p, customer_district: e.target.value }))} />
                <input className="border rounded-lg px-3 py-2" placeholder="العنوان الكامل" value={formData.customer_street} onChange={(e) => setFormData((p) => ({ ...p, customer_street: e.target.value }))} />
                <input className="border rounded-lg px-3 py-2" placeholder="رقم المبنى (اختياري)" value={formData.customer_building} onChange={(e) => setFormData((p) => ({ ...p, customer_building: e.target.value }))} />
                <textarea className="border rounded-lg px-3 py-2 md:col-span-2" placeholder="ملاحظات العميل / تفاصيل إضافية" value={formData.customer_additional_info} onChange={(e) => setFormData((p) => ({ ...p, customer_additional_info: e.target.value }))} />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">عناصر الطلب</h2>
              <div className="relative mb-4">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className="w-full border rounded-lg pr-10 pl-3 py-2"
                  placeholder="ابحث عن منتج بالاسم أو SKU ثم اختره"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                {productResults.length > 0 && (
                  <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {productResults.map((product) => (
                      <button
                        type="button"
                        key={product.id}
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
                            <div className="text-xs text-gray-500">SKU: {product.sku || "-"} - {Number(product.price || 0).toLocaleString()} شيكل</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {items.map((line) => {
                  const variants = line.product.variants || [];
                  const hasVariants = variants.length > 0;
                  const stockLimit = getStockLimit(line);
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
                            <div className="mt-2 hidden">
                              <p className="text-xs font-medium text-gray-600 mb-2">اختر الفاريانت:</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {variants.map((variant) => {
                                  const isSelected = line.selectedVariantId === variant.id;
                                  const isAvailable =
                                    line.product.stock_status === "in_stock" || Number(variant.stock_quantity) > 0;
                                  return (
                                    <button
                                      key={variant.id}
                                      type="button"
                                      onClick={() =>
                                        updateLine(line.rowId, { selectedVariantId: variant.id, quantity: 1 })
                                      }
                                      disabled={!isAvailable}
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
                          {hasVariants && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-600 mb-2">اختر الفارينت:</p>
                              {getVariantKeys(line).map((variantKey, keyIndex, variantKeys) => {
                                const selectedOptions = getSelectedVariantOptions(line);
                                const optionValues = getVariantValuesForKey(line, variantKey);

                                return (
                                  <div key={variantKey} className="mb-3">
                                    <div className="text-xs font-semibold text-gray-700 mb-1">{variantKey}</div>
                                    <div className="flex flex-wrap gap-2">
                                      {optionValues.map((value) => {
                                        const isSelected = selectedOptions[variantKey] === value;
                                        const isAvailable = isVariantValueAvailable(
                                          line,
                                          variantKey,
                                          value,
                                          keyIndex,
                                          variantKeys,
                                          selectedOptions
                                        );

                                        return (
                                          <button
                                            key={value}
                                            type="button"
                                            onClick={() => selectVariantOption(line, variantKey, value, keyIndex)}
                                            disabled={keyIndex > 0 && !isAvailable && !isSelected}
                                            className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                                              isSelected
                                                ? "bg-emerald-600 text-white border-emerald-600"
                                                : isAvailable
                                                  ? "bg-white text-gray-700 border-gray-300 hover:border-emerald-400 hover:bg-emerald-50"
                                                  : "bg-gray-100 text-gray-400 border-gray-200 opacity-60 cursor-not-allowed"
                                            }`}
                                          >
                                            {value}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
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
                          <input
                            className="w-16 text-center border-x py-1"
                            type="number"
                            min={1}
                            value={line.quantity}
                            onChange={(e) => updateLine(line.rowId, { quantity: Number(e.target.value || 1) })}
                          />
                          <button type="button" className="px-3 py-1" onClick={() => updateLine(line.rowId, { quantity: line.quantity + 1 })}>+</button>
                        </div>
                        <span className="text-sm text-gray-600">المخزون المتاح: {stockLimit}</span>
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
                {items.length === 0 && <p className="text-gray-500 text-sm">لم يتم إضافة أي منتج بعد.</p>}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">إعدادات الطلب</h2>
              <div className="space-y-3">
                <select className="w-full border rounded-lg px-3 py-2" value={formData.payment_method} onChange={(e) => setFormData((p) => ({ ...p, payment_method: e.target.value }))}>
                  <option value="cod">الدفع عند الاستلام</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="credit_card">بطاقة ائتمانية</option>
                  <option value="online">دفع إلكتروني</option>
                  <option value="paypal">PayPal</option>
                </select>
                <select className="w-full border rounded-lg px-3 py-2" value={formData.payment_status} onChange={(e) => setFormData((p) => ({ ...p, payment_status: e.target.value }))}>
                  <option value="pending">الدفع معلق</option>
                  <option value="paid">الدفع مدفوع</option>
                  <option value="failed">الدفع فشل</option>
                  <option value="refunded">الدفع مسترد</option>
                </select>
                <select className="w-full border rounded-lg px-3 py-2" value={formData.order_status} onChange={(e) => setFormData((p) => ({ ...p, order_status: e.target.value }))}>
                  <option value="pending">الطلب معلق</option>
                  <option value="processing">قيد المعالجة</option>
                  <option value="shipped">تم الشحن</option>
                  <option value="delivered">تم التسليم</option>
                  <option value="cancelled">ملغي</option>
                </select>

                <textarea className="w-full border rounded-lg px-3 py-2" rows={4} placeholder="ملاحظات داخلية / ملاحظات الطلب" value={formData.notes} onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))} />
                <div className="border-t pt-3 space-y-3">
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={formData.discount_type}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        discount_type: e.target.value,
                        discount_value: e.target.value ? p.discount_value : "",
                      }))
                    }
                  >
                    <option value="">بدون خصم يدوي</option>
                    <option value="fixed">خصم بقيمة ثابتة</option>
                    <option value="percentage">خصم بنسبة مئوية</option>
                  </select>
                  <input
                    className="w-full border rounded-lg px-3 py-2 disabled:bg-gray-100"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder={formData.discount_type === "percentage" ? "قيمة الخصم (%)" : "قيمة الخصم (شيكل)"}
                    value={formData.discount_value}
                    disabled={!formData.discount_type}
                    onChange={(e) => setFormData((p) => ({ ...p, discount_value: e.target.value }))}
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.force_free_shipping}
                      onChange={(e) => setFormData((p) => ({ ...p, force_free_shipping: e.target.checked }))}
                    />
                    تحويل الشحن إلى مجاني
                  </label>
                  {(manualDiscountAmount > 0 || formData.force_free_shipping) && (
                    <button
                      type="button"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                      onClick={() =>
                        setFormData((p) => ({
                          ...p,
                          discount_type: "",
                          discount_value: "",
                          force_free_shipping: false,
                        }))
                      }
                    >
                      التراجع عن الخصم/الشحن المجاني
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">ملخص الفاتورة</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>المجموع الفرعي</span><span>{subtotal.toLocaleString()} شيكل</span></div>
                {manualDiscountAmount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>خصم يدوي على الفاتورة</span>
                    <span>-{manualDiscountAmount.toLocaleString()} شيكل</span>
                  </div>
                )}
                <div className="flex justify-between"><span>الشحن</span><span>{shippingCost.toLocaleString()} شيكل</span></div>
                <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg"><span>الإجمالي</span><span>{grandTotal.toLocaleString()} شيكل</span></div>
                {formData.notes.trim() !== "" && (
                  <div className="border-t pt-2 mt-2">
                    <div className="text-gray-600 mb-1">ملاحظات الطلب</div>
                    <div className="text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 whitespace-pre-wrap">
                      {formData.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              {loading ? "جاري إنشاء الطلب..." : "إنشاء الطلب"}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminOrderCreate;
