import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  Check,
  AlertCircle,
  Filter,
  Link,
  ChevronRight
} from "lucide-react";
import { adminCategoriesAPI, adminFiltersAPI } from "../services/adminApi";
import AdminLayout from "../components/AdminLayout";

interface FilterEntity {
  id: number;
  name: string;
  type: string;
  options?: string[];
  required?: boolean;
}

interface Category {
  id: number;
  name: string;
  filters?: any[]; // This will now contain the linked filter entities if loaded correctly
}

const AdminCategoryFilters = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [availableGlobalFilters, setAvailableGlobalFilters] = useState<FilterEntity[]>([]);
  const [selectedFilterIds, setSelectedFilterIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoryRes, globalFiltersRes] = await Promise.all([
        adminCategoriesAPI.getCategory(id!),
        adminFiltersAPI.getFilters()
      ]);
      
      const catData = categoryRes.data || categoryRes;
      setCategory(catData);
      
      // If we have linked filters from relation, set them
      const linkedFilters = catData.filters || [];
      const linkedIds = linkedFilters
        .filter((f: any) => f.id) // Only take entities with ID
        .map((f: any) => f.id);
      
      setSelectedFilterIds(linkedIds);
      setAvailableGlobalFilters(globalFiltersRes.data || globalFiltersRes);
      
    } catch (err: any) {
      setError("فشل في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFilter = (filterId: number) => {
    setSelectedFilterIds(prev => 
      prev.includes(filterId) 
        ? prev.filter(fid => fid !== filterId) 
        : [...prev, filterId]
    );
  };

  const handleSaveSync = async () => {
    try {
      setSaving(true);
      setError("");
      await adminCategoriesAPI.syncFilters(id!, selectedFilterIds);
      setSuccess("تم ربط الفلاتر بنجاح");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError("فشل في ربط الفلاتر");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLayout><div className="p-10 text-center">جاري التحميل...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate("/admin/categories")} className="p-2 hover:bg-white rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
              <div>
                <h1 className="text-2xl font-black text-gray-900">ربط الفلاتر للفئة</h1>
                <p className="text-gray-500 flex items-center gap-1">
                  الفئة: <span className="font-bold text-gray-900">{category?.name}</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleSaveSync}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? "جاري الحفظ..." : "حفظ الربط"}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border-r-4 border-red-500 p-4 rounded-lg flex items-center text-red-700">
              <AlertCircle className="w-5 h-5 ml-3" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border-r-4 border-emerald-500 p-4 rounded-lg flex items-center text-emerald-700">
              <Check className="w-5 h-5 ml-3" />
              <span>{success}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Filter Selection Panel */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="font-bold text-gray-800">الفلاتر العالمية المتاحة</h2>
                  <button 
                    onClick={() => navigate('/admin/filters')}
                    className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    إدارة الفلاتر <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                  {availableGlobalFilters.map(filter => {
                    const isSelected = selectedFilterIds.includes(filter.id);
                    return (
                      <div 
                        key={filter.id}
                        onClick={() => handleToggleFilter(filter.id)}
                        className={`p-4 flex items-center gap-4 cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50/50' : 'hover:bg-gray-50'}`}
                      >
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-emerald-600 border-emerald-600' : 'border-gray-200 bg-white'}`}>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{filter.name}</h3>
                          <p className="text-xs text-gray-500">النوع: {filter.type} {filter.required ? '(مطلوب)' : ''}</p>
                        </div>
                        <div className="flex gap-1">
                          {filter.options?.slice(0, 3).map((opt, i) => (
                            <span key={i} className="text-[10px] bg-white border border-gray-100 px-1.5 py-0.5 rounded text-gray-400">
                              {opt}
                            </span>
                          ))}
                          {(filter.options?.length || 0) > 3 && <span className="text-[10px] text-gray-300">...</span>}
                        </div>
                      </div>
                    );
                  })}
                  {availableGlobalFilters.length === 0 && (
                    <div className="p-10 text-center">
                      <p className="text-gray-400">لا توجد فلاتر عالمية معرفة حالياً</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Summary Panel */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-gray-900 flex items-center gap-2">
                    <Link className="w-5 h-5 text-emerald-600" />
                    الفلاتر المختارة ({selectedFilterIds.length})
                  </h3>
                  {selectedFilterIds.length > 0 && (
                    <button 
                      onClick={() => {
                        if (window.confirm("هل أنت متأكد من حذف ربط جميع الفلاتر بهذه الفئة؟")) {
                          setSelectedFilterIds([]);
                        }
                      }}
                      className="text-[10px] font-bold text-red-500 hover:text-red-700 hover:underline px-2 py-1 rounded-md transition-colors"
                    >
                      حذف الكل
                    </button>
                  )}
                </div>
                
                <div className="space-y-3">
                  {selectedFilterIds.map(fid => {
                    const filter = availableGlobalFilters.find(f => f.id === fid);
                    if (!filter) return null;
                    return (
                      <div key={fid} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                        <span className="font-bold text-gray-700 text-sm">{filter.name}</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleToggleFilter(fid); }}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                  {selectedFilterIds.length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-xs text-gray-400">لم يتم اختيار أي فلتر لهذه الفئة</p>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col gap-3">
                   <button 
                    onClick={handleSaveSync}
                    disabled={saving}
                    className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
                   >
                     <Save className="w-4 h-4" />
                     حفظ التغييرات
                   </button>
                   <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest font-bold">
                     سيتم تطبيق هذه الفلاتر عند إضافة منتجات جديدة لهذه الفئة
                   </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCategoryFilters;
