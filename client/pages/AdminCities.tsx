import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MapPin,
  ArrowLeft,
  ArrowRight,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { adminCitiesAPI } from "../services/adminApi";
import Swal from "sweetalert2";

interface City {
  id: number;
  name: string;
  name_en?: string;
  shipping_cost: number;
  delivery_time_days: number;
  is_active: boolean;
  sort_order: number;
  free_shipping_threshold?: number;
  created_at: string;
  updated_at: string;
}

const AdminCities = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    name_en: "",
    shipping_cost: 0,
    delivery_time_days: 1,
    is_active: true,
    sort_order: 0,
    free_shipping_threshold: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    fetchCities();
  }, [navigate, searchQuery, currentPage]);

  const fetchCities = async () => {
    try {
      setLoading(true);
      const filters: Record<string, any> = {
        search: searchQuery || undefined,
        page: currentPage,
        per_page: 20
      };
      
      const data = await adminCitiesAPI.getCities(filters);
      setCities(data.data || []);
      setTotalPages(data.meta?.last_page || 1);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "فشل في تحميل المدن");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCity = async (id: number) => {
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'سيتم حذف هذه المدينة نهائياً. لا يمكن التراجع عن هذا الإجراء.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        await adminCitiesAPI.deleteCity(id.toString());
        setCities(cities.filter(c => c.id !== id));
        Swal.fire({
          icon: 'success',
          title: 'تم الحذف',
          text: 'تم حذف المدينة بنجاح',
          confirmButtonText: 'حسناً'
        });
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'خطأ',
          text: err.response?.data?.message || 'فشل في حذف المدينة',
          confirmButtonText: 'حسناً'
        });
      }
    }
  };

  const handleEdit = (city: City) => {
    setEditingCity(city);
    setFormData({
      name: city.name,
      name_en: city.name_en || "",
      shipping_cost: city.shipping_cost,
      delivery_time_days: city.delivery_time_days,
      is_active: city.is_active,
      sort_order: city.sort_order,
      free_shipping_threshold: city.free_shipping_threshold || 0,
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingCity(null);
    setFormData({
      name: "",
      name_en: "",
      shipping_cost: 0,
      delivery_time_days: 1,
      is_active: true,
      sort_order: 0,
      free_shipping_threshold: 0,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCity) {
        await adminCitiesAPI.updateCity(editingCity.id.toString(), formData);
        Swal.fire({
          icon: 'success',
          title: 'تم التحديث',
          text: 'تم تحديث المدينة بنجاح',
          confirmButtonText: 'حسناً'
        });
      } else {
        await adminCitiesAPI.createCity(formData);
        Swal.fire({
          icon: 'success',
          title: 'تم الإنشاء',
          text: 'تم إنشاء المدينة بنجاح',
          confirmButtonText: 'حسناً'
        });
      }
      setShowModal(false);
      fetchCities();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: err.response?.data?.message || 'فشل في حفظ المدينة',
        confirmButtonText: 'حسناً'
      });
    }
  };

  if (loading && cities.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">جاري تحميل المدن...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة المدن</h1>
            <p className="text-gray-600">عرض وإدارة المدن وتكاليف الشحن</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة مدينة</span>
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث في المدن..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Cities Table */}
        {cities.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">لا توجد مدن</h3>
            <p className="text-gray-600">لم يتم العثور على مدن تطابق معايير البحث</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المدينة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تكلفة الشحن
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      وقت التوصيل
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      سقف الشحن المجاني
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الترتيب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cities.map((city) => (
                    <tr key={city.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {city.name}
                            </div>
                            {city.name_en && (
                              <div className="text-sm text-gray-500">
                                {city.name_en}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DollarSign className="w-5 h-5 text-gray-400 mr-3" />
                          <span className="text-sm font-medium text-gray-900">
                            {city.shipping_cost.toLocaleString()} شيكل
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock className="w-5 h-5 text-gray-400 mr-3" />
                          <span className="text-sm font-medium text-gray-900">
                            {city.delivery_time_days} {city.delivery_time_days === 1 ? 'يوم' : 'أيام'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          {city.free_shipping_threshold && city.free_shipping_threshold > 0 
                            ? `${city.free_shipping_threshold.toLocaleString()} شيكل`
                            : "غير محدد"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {city.is_active ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            نشط
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="w-4 h-4 mr-1" />
                            غير نشط
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {city.sort_order}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button
                            onClick={() => handleEdit(city)}
                            className="text-emerald-600 hover:text-emerald-900 p-2 hover:bg-emerald-50 rounded-lg"
                            title="تعديل"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCity(city.id)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center mt-8">
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg ${
                    currentPage === page
                      ? "bg-emerald-600 text-white"
                      : "border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingCity ? 'تعديل مدينة' : 'إضافة مدينة جديدة'}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      اسم المدينة (عربي) *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      اسم المدينة (إنجليزي)
                    </label>
                    <input
                      type="text"
                      value={formData.name_en}
                      onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        تكلفة الشحن (شيكل) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.shipping_cost}
                        onChange={(e) => setFormData({ ...formData, shipping_cost: parseFloat(e.target.value) || 0 })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        وقت التوصيل (أيام) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.delivery_time_days}
                        onChange={(e) => setFormData({ ...formData, delivery_time_days: parseInt(e.target.value) || 1 })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      سقف التوصيل المجاني (شيكل) - اتركه 0 لإلغاء الميزة
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.free_shipping_threshold}
                      onChange={(e) => setFormData({ ...formData, free_shipping_threshold: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ترتيب العرض
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.sort_order}
                        onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="flex items-center space-x-2 space-x-reverse mt-6">
                        <input
                          type="checkbox"
                          checked={formData.is_active}
                          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                          className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <span className="text-sm font-medium text-gray-700">نشط</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 space-x-reverse pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      {editingCity ? 'تحديث' : 'إنشاء'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCities;

