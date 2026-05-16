import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Star,
  Package,
  DollarSign,
  ShoppingCart,
  Eye,
  TrendingUp,
  Calendar,
  Tag,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Filter
} from "lucide-react";
import { adminProductsAPI } from "../services/adminApi";

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  original_price?: number;
  compare_price?: number;
  cost_price?: number;
  discount_percentage?: number;
  stock_quantity: number;
  in_stock: boolean;
  is_featured: boolean;
  is_active: boolean;
  description: string;
  short_description?: string;
  sku: string;
  weight?: number;
  dimensions?: string;
  warranty?: string;
  delivery_time?: string;
  features?: string[];
  specifications?: string[];
  filter_values?: Record<string, string | string[]>;
  rating?: number;
  reviews_count?: number;
  views_count?: number;
  sales_count?: number;
  created_at: string;
  updated_at: string;
  category?: {
    id: number;
    name: string;
  };
  brand?: {
    id: number;
    name: string;
  };
  images?: Array<{
    id: number;
    image_path: string;
    image_url: string;
    alt_text?: string;
    is_primary: boolean;
    sort_order: number;
  }>;
}

const AdminProductView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    if (id) {
      fetchProduct();
    }
  }, [id, navigate]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      console.log('Fetching product with ID:', id);
      const response = await adminProductsAPI.getProduct(id!);
      console.log('API Response:', response);
      console.log('Product data:', response.data);
      console.log('Product name:', response.data?.name);
      console.log('Product price:', response.data?.price);
      console.log('Product filter_values:', response.data?.filter_values);
      console.log('Filter values type:', typeof response.data?.filter_values);
      console.log('Filter values length:', response.data?.filter_values?.length);
      setProduct(response.data);
    } catch (err: any) {
      console.error('Error fetching product:', err);
      setError(err.response?.data?.message || "فشل في تحميل المنتج");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      try {
        await adminProductsAPI.deleteProduct(id!);
        navigate("/admin/products");
      } catch (err: any) {
        console.error('Error deleting product:', err);
        alert("فشل في حذف المنتج");
      }
    }
  };

  const getStockStatus = (product: Product) => {
    if (!product.in_stock) return { status: 'out', label: 'نفد المخزون', color: 'text-red-600' };
    if ((product.stock_quantity || 0) <= 5) return { status: 'low', label: 'مخزون منخفض', color: 'text-orange-600' };
    return { status: 'in', label: 'متوفر', color: 'text-green-600' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">جاري تحميل المنتج...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-gray-600">{error}</p>
          <button
            onClick={() => navigate("/admin/products")}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            العودة للمنتجات
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-gray-600">المنتج غير موجود</p>
          <button
            onClick={() => navigate("/admin/products")}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            العودة للمنتجات
          </button>
        </div>
      </div>
    );
  }

  const stockStatus = getStockStatus(product);
  const hasDiscount = product.original_price && product.price && product.original_price > product.price;
  const discountPercentage = hasDiscount 
    ? Math.round(((product.original_price! - product.price!) / product.original_price!) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <button
                onClick={() => navigate("/admin/products")}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                <p className="text-sm text-gray-500">عرض تفاصيل المنتج</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 space-x-reverse">
              <button
                onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center space-x-2 space-x-reverse"
              >
                <Edit className="w-4 h-4" />
                <span>تعديل</span>
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2 space-x-reverse"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filter Values Display */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">فلاتر المنتج</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center space-x-2 space-x-reverse"
          >
            <Filter className="w-4 h-4" />
            <span>{showFilters ? 'إخفاء الفلاتر' : 'إظهار الفلاتر'}</span>
          </button>
        </div>
        
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {(() => {
              // Handle both array and object formats
              let filterValues = product.filter_values;
              
              // If it's a string, try to parse it as JSON
              if (typeof filterValues === 'string') {
                try {
                  filterValues = JSON.parse(filterValues);
                } catch (e) {
                  console.error('Error parsing filter_values JSON:', e);
                  filterValues = null;
                }
              }
              
              // If it's an object, display as input fields
              if (filterValues && typeof filterValues === 'object' && !Array.isArray(filterValues)) {
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(filterValues).map(([key, value], index) => {
                      // Handle both string and array values
                      const values = Array.isArray(value) ? value : (typeof value === 'string' && value ? [value] : []);
                      return (
                        <div key={index} className="bg-emerald-50 rounded-lg p-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {key}
                          </label>
                          {values.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {values.map((val, i) => (
                                <span key={i} className="inline-flex items-center bg-emerald-100 text-emerald-800 text-sm px-3 py-1 rounded-full font-medium">
                                  {String(val)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">لا توجد قيمة</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              } else if (Array.isArray(filterValues) && filterValues.length > 0) {
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filterValues.map((filterValue, index) => (
                      <div key={index} className="bg-emerald-50 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          الفلتر {index + 1}
                        </label>
                        <input
                          type="text"
                          value={String(filterValue)}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium"
                        />
                      </div>
                    ))}
                  </div>
                );
              } else {
                return (
                  <div className="text-center py-8">
                    <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">لا توجد فلاتر متاحة لهذا المنتج</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Debug: filter_values = {JSON.stringify(product.filter_values)}
                    </p>
                  </div>
                );
              }
            })()}
          </div>
        )}
      </div>

      <div className="px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">صور المنتج</h2>
            {product.images && product.images.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {product.images.map((image, index) => (
                  <div key={image.id} className="relative">
                    <img
                      src={image.image_url}
                      alt={image.alt_text || product.name}
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                    {image.is_primary && (
                      <span className="absolute top-2 right-2 bg-emerald-600 text-white text-xs px-2 py-1 rounded">
                        رئيسية
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">المعلومات الأساسية</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">الاسم:</span>
                  <span className="font-medium">{product.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">SKU:</span>
                  <span className="font-medium">{product.sku}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الفئة:</span>
                  <span className="font-medium">{product.category?.name || 'غير محدد'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الماركة:</span>
                  <span className="font-medium">{product.brand?.name || 'غير محدد'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الحالة:</span>
                  <span className={`font-medium ${product.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {product.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">مميز:</span>
                  <span className={`font-medium ${product.is_featured ? 'text-yellow-600' : 'text-gray-600'}`}>
                    {product.is_featured ? 'نعم' : 'لا'}
                  </span>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">التسعير</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">السعر:</span>
                  <span className="font-medium text-lg">{product.price?.toLocaleString() || 'غير محدد'} شيكل</span>
                </div>
                {product.original_price && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">السعر الأصلي:</span>
                    <span className="font-medium text-gray-500 line-through">
                      {product.original_price?.toLocaleString() || 'غير محدد'} شيكل
                    </span>
                  </div>
                )}
                {hasDiscount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">الخصم:</span>
                    <span className="font-medium text-red-600">-{discountPercentage}%</span>
                  </div>
                )}
                {product.cost_price && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">سعر التكلفة:</span>
                    <span className="font-medium">{product.cost_price?.toLocaleString() || 'غير محدد'} شيكل</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stock Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">المخزون</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">الكمية:</span>
                  <span className="font-medium">{product.stock_quantity || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الحالة:</span>
                  <span className={`font-medium ${stockStatus.color}`}>
                    {stockStatus.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">الإحصائيات</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Eye className="w-4 h-4 text-emerald-600 ml-1" />
                    <span className="text-lg font-medium">{product.views_count || 0}</span>
                  </div>
                  <div className="text-xs text-gray-500">مشاهدة</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <ShoppingCart className="w-4 h-4 text-green-600 ml-1" />
                    <span className="text-lg font-medium">{product.sales_count || 0}</span>
                  </div>
                  <div className="text-xs text-gray-500">مبيعات</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Star className="w-4 h-4 text-yellow-600 ml-1" />
                    <span className="text-lg font-medium">{product.rating || 0}</span>
                  </div>
                  <div className="text-xs text-gray-500">تقييم</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <TrendingUp className="w-4 h-4 text-purple-600 ml-1" />
                    <span className="text-lg font-medium">{product.reviews_count || 0}</span>
                  </div>
                  <div className="text-xs text-gray-500">مراجعات</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">الوصف</h2>
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
          </div>
        )}

        {/* Features */}
        {product.features && product.features.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">المميزات</h2>
            <ul className="space-y-2">
              {product.features.map((feature, index) => (
                <li key={index} className="flex items-start space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Specifications */}
        {product.specifications && product.specifications.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">المواصفات</h2>
            <div className="space-y-3">
              {product.specifications.map((spec, index) => (
                <div key={index} className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">{spec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {product.weight && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">الوزن</h3>
              <p className="text-gray-600">{product.weight} كيلو</p>
            </div>
          )}
          
          {product.dimensions && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">الأبعاد</h3>
              <p className="text-gray-600">{product.dimensions}</p>
            </div>
          )}
          
          {product.warranty && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">الضمان</h3>
              <p className="text-gray-600">{product.warranty}</p>
            </div>
          )}
          
          {product.delivery_time && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">وقت التسليم</h3>
              <p className="text-gray-600">{product.delivery_time}</p>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">التواريخ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">تاريخ الإنشاء:</span>
              <span className="font-medium">{new Date(product.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">آخر تحديث:</span>
              <span className="font-medium">{new Date(product.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProductView;
