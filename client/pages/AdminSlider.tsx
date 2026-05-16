import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import {
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle,
  X
} from "lucide-react";
import { adminSliderAPI } from "../services/adminApi";
import Swal from "sweetalert2";

interface SliderItem {
  id: number;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  image: string | null;
  background_color: string;
  text_color: string;
  button1_text: string | null;
  button1_link: string | null;
  button1_color: string;
  button2_text: string | null;
  button2_link: string | null;
  button2_color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const AdminSlider = () => {
  const [sliderItems, setSliderItems] = useState<SliderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<SliderItem | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    image: null as File | null,
    imagePreview: "",
    background_color: "from-emerald-900 via-emerald-800 to-teal-900",
    text_color: "text-white",
    button1_text: "",
    button1_link: "",
    button1_color: "bg-white text-emerald-900",
    button2_text: "",
    button2_link: "",
    button2_color: "border-2 border-white text-white",
    sort_order: 0,
    is_active: true,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    fetchSliderItems();
  }, [navigate]);

  const fetchSliderItems = async () => {
    try {
      setLoading(true);
      const data = await adminSliderAPI.getSliderItems();
      setSliderItems(data.data || []);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "فشل في تحميل عناصر السلايدر");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'سيتم حذف هذا العنصر نهائياً. لا يمكن التراجع عن هذا الإجراء.',
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
        await adminSliderAPI.deleteSliderItem(id.toString());
        setSliderItems(sliderItems.filter(item => item.id !== id));
        Swal.fire({
          icon: 'success',
          title: 'تم الحذف',
          text: 'تم حذف العنصر بنجاح',
          confirmButtonText: 'حسناً'
        });
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'خطأ',
          text: err.response?.data?.message || 'فشل في حذف العنصر',
          confirmButtonText: 'حسناً'
        });
      }
    }
  };

  const handleEdit = (item: SliderItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title || "",
      subtitle: item.subtitle || "",
      description: item.description || "",
      image: null,
      imagePreview: item.image || "",
      background_color: item.background_color || "",
      text_color: item.text_color || "text-white",
      button1_text: item.button1_text || "",
      button1_link: item.button1_link || "",
      button1_color: item.button1_color || "bg-white text-emerald-900",
      button2_text: item.button2_text || "",
      button2_link: item.button2_link || "",
      button2_color: item.button2_color || "border-2 border-white text-white",
      sort_order: item.sort_order || 0,
      is_active: item.is_active ?? true,
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      title: "",
      subtitle: "",
      description: "",
      image: null,
      imagePreview: "",
      background_color: "",
      text_color: "text-white",
      button1_text: "",
      button1_link: "",
      button1_color: "bg-white text-emerald-900",
      button2_text: "",
      button2_link: "",
      button2_color: "border-2 border-white text-white",
      sort_order: 0,
      is_active: true,
    });
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({
        ...formData,
        image: file,
        imagePreview: URL.createObjectURL(file)
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('subtitle', formData.subtitle);
      submitData.append('description', formData.description);
      if (formData.image) {
        submitData.append('image', formData.image);
      }
      if (formData.background_color) {
        submitData.append('background_color', formData.background_color);
      } else {
        submitData.append('background_color', '');
      }
      submitData.append('text_color', formData.text_color);
      submitData.append('button1_text', formData.button1_text);
      submitData.append('button1_link', formData.button1_link);
      submitData.append('button1_color', formData.button1_color);
      submitData.append('button2_text', formData.button2_text);
      submitData.append('button2_link', formData.button2_link);
      submitData.append('button2_color', formData.button2_color);
      submitData.append('sort_order', formData.sort_order.toString());
      submitData.append('is_active', formData.is_active ? '1' : '0');
      
      // Only append existing fields if editing (don't send empty strings for null values)
      if (editingItem) {
        // If not uploading new image and imagePreview exists, keep the existing image
        if (!formData.image && formData.imagePreview) {
          // Don't append image field - let backend keep existing image
        }
      }

      if (editingItem) {
        await adminSliderAPI.updateSliderItem(editingItem.id.toString(), submitData);
        Swal.fire({
          icon: 'success',
          title: 'تم التحديث',
          text: 'تم تحديث العنصر بنجاح',
          confirmButtonText: 'حسناً'
        });
      } else {
        await adminSliderAPI.createSliderItem(submitData);
        Swal.fire({
          icon: 'success',
          title: 'تم الإنشاء',
          text: 'تم إنشاء العنصر بنجاح',
          confirmButtonText: 'حسناً'
        });
      }
      setShowModal(false);
      fetchSliderItems();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: err.response?.data?.message || 'فشل في حفظ العنصر',
        confirmButtonText: 'حسناً'
      });
    }
  };

  const handleSort = async (id: number, direction: 'up' | 'down') => {
    const item = sliderItems.find(i => i.id === id);
    if (!item) return;

    const currentIndex = sliderItems.findIndex(i => i.id === id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= sliderItems.length) return;

    const otherItem = sliderItems[newIndex];
    const newSortOrder = otherItem.sort_order;
    const otherSortOrder = item.sort_order;

    try {
      // Update both items
      const formData1 = new FormData();
      formData1.append('sort_order', newSortOrder.toString());
      formData1.append('_method', 'PUT');

      const formData2 = new FormData();
      formData2.append('sort_order', otherSortOrder.toString());
      formData2.append('_method', 'PUT');

      await Promise.all([
        adminSliderAPI.updateSliderItem(id.toString(), formData1),
        adminSliderAPI.updateSliderItem(otherItem.id.toString(), formData2)
      ]);

      fetchSliderItems();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: 'فشل في تحديث الترتيب',
        confirmButtonText: 'حسناً'
      });
    }
  };

  if (loading && sliderItems.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">جاري تحميل عناصر السلايدر...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">إدارة السلايدر الرئيسي</h1>
            <p className="text-gray-600">عرض وإدارة شرائح السلايدر الرئيسي في الموقع</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة شريحة</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {sliderItems.length === 0 ? (
          <div className="text-center py-16">
            <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">لا توجد شرائح</h3>
            <p className="text-gray-600 mb-4">لم يتم إضافة أي شرائح للسلايدر بعد</p>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              إضافة شريحة جديدة
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sliderItems.map((item, index) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Preview */}
                <div
                  className={`h-48 bg-gradient-to-r ${item.background_color} relative overflow-hidden`}
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title || 'Slider item'}
                      className="w-full h-full object-cover opacity-50"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white px-4">
                      <h3 className="text-lg font-bold mb-2">{item.title || 'بدون عنوان'}</h3>
                      {item.subtitle && (
                        <p className="text-sm opacity-90">{item.subtitle}</p>
                      )}
                    </div>
                  </div>
                  <div className="absolute top-2 left-2">
                    {item.is_active ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        نشط
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-500 text-white">
                        <XCircle className="w-3 h-3 mr-1" />
                        غير نشط
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {item.description || 'لا يوجد وصف'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>الترتيب: {item.sort_order}</span>
                    <span>
                      {new Date(item.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleSort(item.id, 'up')}
                        disabled={index === 0}
                        className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        title="نقل للأعلى"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSort(item.id, 'down')}
                        disabled={index === sliderItems.length - 1}
                        className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        title="نقل للأسفل"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-emerald-600 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg"
                        title="تعديل"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingItem ? 'تعديل شريحة' : 'إضافة شريحة جديدة'}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      صورة الخلفية
                    </label>
                    <div className="mt-1 flex items-center space-x-4 space-x-reverse">
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                        />
                      </div>
                      {formData.imagePreview && (
                        <div className="w-32 h-20 rounded-lg overflow-hidden border border-gray-300">
                          <img
                            src={formData.imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        العنوان الرئيسي
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        العنوان الفرعي
                      </label>
                      <input
                        type="text"
                        value={formData.subtitle}
                        onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الوصف
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Background Color & Overlay */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الطبقة الشفافة فوق الصورة (Gradient Overlay)
                    </label>
                    <input
                      type="text"
                      value={formData.background_color}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value || "" })}
                      placeholder="لإضافة طبقة بيضاء اكتب: from-white/60 via-white/20 to-transparent"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      أمثلة للتحكم بالطبقة:
                      <br/>- طبقة بيضاء لليسار: <code className="bg-gray-100 p-0.5 rounded">from-white/80 via-white/40 to-transparent</code>
                      <br/>- طبقة داكنة لليسار: <code className="bg-gray-100 p-0.5 rounded">from-black/70 via-black/30 to-transparent</code>
                      <br/>- بدون طبقة (ألوان الصورة الطبيعية): <strong>اترك الحقل فارغاً</strong>
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        الزر الأول
                      </label>
                      <input
                        type="text"
                        value={formData.button1_text}
                        onChange={(e) => setFormData({ ...formData, button1_text: e.target.value })}
                        placeholder="نص الزر"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <input
                        type="text"
                        value={formData.button1_link}
                        onChange={(e) => setFormData({ ...formData, button1_link: e.target.value })}
                        placeholder="رابط الزر"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <input
                        type="text"
                        value={formData.button1_color}
                        onChange={(e) => setFormData({ ...formData, button1_color: e.target.value })}
                        placeholder="ألوان الزر"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        الزر الثاني
                      </label>
                      <input
                        type="text"
                        value={formData.button2_text}
                        onChange={(e) => setFormData({ ...formData, button2_text: e.target.value })}
                        placeholder="نص الزر"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <input
                        type="text"
                        value={formData.button2_link}
                        onChange={(e) => setFormData({ ...formData, button2_link: e.target.value })}
                        placeholder="رابط الزر"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <input
                        type="text"
                        value={formData.button2_color}
                        onChange={(e) => setFormData({ ...formData, button2_color: e.target.value })}
                        placeholder="ألوان الزر"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Sort Order & Active */}
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
                      {editingItem ? 'تحديث' : 'إنشاء'}
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

export default AdminSlider;

