import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Globe,
  Calendar,
  Package,
  Tag,
  CheckCircle,
  XCircle
} from "lucide-react";
import { adminBrandsAPI } from "@/services/adminApi";

interface Brand {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  is_active: boolean;
  sort_order: number;
  meta_title?: string;
  meta_description?: string;
  products_count?: number;
  created_at: string;
  updated_at: string;
}

const AdminBrandView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    if (id) {
      fetchBrand(id);
    }
  }, [id, navigate]);

  const fetchBrand = async (brandId: string) => {
    try {
      setLoading(true);
      const data = await adminBrandsAPI.getBrand(brandId);
      setBrand(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "فشل في تحميل العلامة التجارية");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">جاري تحميل العلامة التجارية...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-gray-600">{error}</p>
          <button
            onClick={() => navigate("/admin/brands")}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            العودة للعلامات التجارية
          </button>
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-gray-600">العلامة التجارية غير موجودة</p>
          <button
            onClick={() => navigate("/admin/brands")}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            العودة للعلامات التجارية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <button
                onClick={() => navigate("/admin/brands")}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{brand.name}</h1>
                <p className="text-sm text-gray-500">عرض تفاصيل العلامة التجارية</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 space-x-reverse">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  brand.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {brand.is_active ? "نشط" : "غير نشط"}
              </span>

              <button
                onClick={() => navigate(`/admin/brands/${brand.id}/edit`)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                تعديل
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Overview */}
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
            {/* Logo */}
            <div className="md:col-span-1">
              <div className="border border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 aspect-square">
                {brand.logo ? (
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="max-w-full max-h-full object-contain p-4"
                  />
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <Tag className="w-10 h-10 mb-2" />
                    <span className="text-sm">لا يوجد شعار</span>
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-sm text-gray-500">الرابط المختصر</p>
                  <p className="mt-1 font-medium text-gray-900 ltr">{brand.slug}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-sm text-gray-500">عدد المنتجات المرتبطة</p>
                  <div className="mt-1 flex items-center gap-2 text-gray-900 font-medium">
                    <Package className="w-4 h-4 text-emerald-500" />
                    {brand.products_count ?? 0} منتج
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-sm text-gray-500">ترتيب العرض</p>
                  <p className="mt-1 font-medium text-gray-900">{brand.sort_order}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-sm text-gray-500">الموقع الإلكتروني</p>
                  {brand.website ? (
                    <a
                      href={brand.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-800 font-medium"
                    >
                      <Globe className="w-4 h-4" />
                      {brand.website}
                    </a>
                  ) : (
                    <span className="mt-1 text-gray-400 text-sm">لا يوجد موقع</span>
                  )}
                </div>
              </div>

              {brand.description && (
                <div className="p-4 bg-white border border-gray-100 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">الوصف</h3>
                  <p className="text-gray-700 leading-relaxed">{brand.description}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SEO & Metadata */}
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">إعدادات SEO</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
                <p className="text-sm text-gray-500">عنوان SEO</p>
                <p className="mt-1 text-gray-800">
                  {brand.meta_title || <span className="text-gray-400 text-sm">غير محدد</span>}
                </p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
                <p className="text-sm text-gray-500">وصف SEO</p>
                <p className="mt-1 text-gray-800 leading-relaxed">
                  {brand.meta_description || <span className="text-gray-400 text-sm">غير محدد</span>}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Timestamps */}
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-sm text-gray-500">تاريخ الإنشاء</p>
                <p className="font-medium text-gray-900">{new Date(brand.created_at).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-sm text-gray-500">آخر تحديث</p>
                <p className="font-medium text-gray-900">{new Date(brand.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Status Block */}
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-6 flex items-center gap-4">
            {brand.is_active ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <XCircle className="w-6 h-6 text-red-500" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">حالة العلامة التجارية</h3>
              <p className="text-gray-600">
                {brand.is_active
                  ? "هذه العلامة التجارية نشطة ومفعّلة للعرض في واجهة الموقع."
                  : "هذه العلامة التجارية غير نشطة ولن تظهر في واجهة الموقع حتى يتم تفعيلها."}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminBrandView;

