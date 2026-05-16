import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Filter,
  Check,
  AlertCircle
} from "lucide-react";
import { adminFiltersAPI } from "../services/adminApi";
import AdminLayout from "../components/AdminLayout";

interface FilterEntity {
  id: number;
  name: string;
  type: 'select' | 'checkbox' | 'range' | 'text';
  options?: string[];
  required?: boolean;
  show_in_frontend?: boolean;
}

const AdminFilters = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newFilter, setNewFilter] = useState<Partial<FilterEntity>>({
    name: "",
    type: "select",
    options: [],
    required: false,
    show_in_frontend: true
  });

  useEffect(() => {
    fetchFilters();
  }, []);

  const fetchFilters = async () => {
    try {
      setLoading(true);
      const response = await adminFiltersAPI.getFilters();
      setFilters(response.data || response);
    } catch (err: any) {
      setError("فشل في تحميل الفلاتر");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFilter = async () => {
    if (!newFilter.name?.trim()) return;
    try {
      setSaving(true);
      await adminFiltersAPI.createFilter(newFilter);
      setSuccess("تم إنشاء الفلتر بنجاح");
      setShowAddForm(false);
      setNewFilter({ name: "", type: "select", options: [], required: false, show_in_frontend: true });
      fetchFilters();
    } catch (err: any) {
      setError(err.response?.data?.message || "فشل في إنشاء الفلتر");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateFilter = async (id: number, data: any) => {
    try {
      setSaving(true);
      await adminFiltersAPI.updateFilter(id.toString(), data);
      setSuccess("تم تحديث الفلتر بنجاح");
      setEditingId(null);
      fetchFilters();
    } catch (err: any) {
      setError("فشل في تحديث الفلتر");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFilter = async (id: number) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الفلتر نهائياً؟ سيتم إزالته من جميع الفئات المرتبطة به.")) {
      try {
        await adminFiltersAPI.deleteFilter(id.toString());
        setSuccess("تم حذف الفلتر");
        fetchFilters();
      } catch (err: any) {
        setError("فشل في حذف الفلتر");
      }
    }
  };

  if (loading) return (
    <AdminLayout>
      <div className="p-10 text-center text-gray-500">جاري التحميل...</div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">إدارة الفلاتر العالمية</h1>
              <p className="text-gray-500 mt-1">قم بتعريف الفلاتر مرة واحدة واربطها بعدة فئات</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg flex items-center font-medium"
            >
              {showAddForm ? <X className="w-5 h-5 ml-2" /> : <Plus className="w-5 h-5 ml-2" />}
              {showAddForm ? "إلغاء الإضافة" : "إضافة فلتر عالمي"}
            </button>
          </header>

          {error && (
            <div className="mb-6 bg-red-50 border-r-4 border-red-500 p-4 rounded-lg flex items-center text-red-700 shadow-sm">
              <AlertCircle className="w-5 h-5 ml-3" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-emerald-50 border-r-4 border-emerald-500 p-4 rounded-lg flex items-center text-emerald-700 shadow-sm">
              <Check className="w-5 h-5 ml-3" />
              <span>{success}</span>
            </div>
          )}

          {showAddForm && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-10 animate-in fade-in slide-in-from-top-4">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <Plus className="w-5 h-5 ml-2 text-emerald-600" />
                تعريف فلتر جديد
              </h2>
              <FilterForm
                data={newFilter}
                onChange={setNewFilter}
                onSave={handleCreateFilter}
                onCancel={() => setShowAddForm(false)}
                saving={saving}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filters.map(filter => (
              <div key={filter.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 p-6 transition-all group">
                {editingId === filter.id ? (
                  <FilterForm
                    data={filter}
                    onSave={() => handleUpdateFilter(filter.id, filter)}
                    onCancel={() => setEditingId(null)}
                    saving={saving}
                    onChange={(updated: any) => {
                      const newFilters = filters.map(f => f.id === filter.id ? { ...f, ...updated } : f);
                      setFilters(newFilters);
                    }}
                  />
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                        <Filter className="w-6 h-6" />
                      </div>
                      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setEditingId(filter.id)}
                          className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteFilter(filter.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{filter.name}</h3>
                    <div className="flex gap-2 mb-4">
                      <span className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full font-medium">
                        {filter.type}
                      </span>
                      {filter.required && (
                        <span className="bg-red-50 text-red-600 text-xs px-2.5 py-1 rounded-full font-medium">
                          مطلوب
                        </span>
                      )}
                      {filter.show_in_frontend ? (
                        <span className="bg-blue-50 text-blue-600 text-xs px-2.5 py-1 rounded-full font-medium">
                          ظاهر للعملاء
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-500 text-xs px-2.5 py-1 rounded-full font-medium">
                          مخفي للعملاء
                        </span>
                      )}
                    </div>
                    
                    {filter.options && filter.options.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">الخيارات:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {filter.options.map((opt, i) => (
                            <span key={i} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-md border border-gray-100">
                              {opt}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
            {filters.length === 0 && !showAddForm && (
              <div className="col-span-full py-20 text-center bg-gray-100 rounded-3xl border-2 border-dashed border-gray-200">
                <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">لا توجد فلاتر معرفة بعد</p>
                <button 
                  onClick={() => setShowAddForm(true)}
                  className="mt-4 text-emerald-600 font-bold hover:underline"
                >
                  أنشئ أول فلتر عالمي الآن
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

const FilterForm = ({ data, onChange, onSave, onCancel, saving }: any) => {
  const [newOption, setNewOption] = useState("");

  const addOption = () => {
    if (newOption.trim()) {
      onChange({ ...data, options: [...(data.options || []), newOption.trim()] });
      setNewOption("");
    }
  };

  const removeOption = (index: number) => {
    onChange({ ...data, options: (data.options || []).filter((_: any, i: number) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 text-right">اسم الفلتر</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none text-right"
            placeholder="مثال: المقاس، اللون، الخامة"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 text-right">نوع الفلتر</label>
          <select
            value={data.type}
            onChange={(e) => onChange({ ...data, type: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none text-right"
            dir="rtl"
          >
            <option value="select">قائمة منسدلة (متعدد الخيارات)</option>
            <option value="checkbox">خانة اختيار (نعم/لا)</option>
            <option value="text">حقل نص</option>
            <option value="range">نطاق أرقام</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-end gap-6 py-2">
        <label className="flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            checked={data.required} 
            onChange={(e) => onChange({ ...data, required: e.target.checked })}
            className="sr-only peer" 
          />
          <div className="relative w-11 h-6 shrink-0 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          <span className="mr-3 text-sm font-bold text-gray-700">مطلوب عند إنشاء المنتج</span>
        </label>
        
        <label className="flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            checked={data.show_in_frontend ?? true} 
            onChange={(e) => onChange({ ...data, show_in_frontend: e.target.checked })}
            className="sr-only peer" 
          />
          <div className="relative w-11 h-6 shrink-0 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          <span className="mr-3 text-sm font-bold text-gray-700">إظهار للعملاء في قسم الفلترة</span>
        </label>
      </div>

      {(data.type === 'select' || data.type === 'checkbox') && (
        <div className="bg-gray-50 rounded-2xl p-6">
          <label className="block text-sm font-bold text-gray-700 mb-4 text-right">الخيارات المتاحة</label>
          <div className="flex flex-wrap gap-2 mb-4 justify-end">
            {data.options?.map((opt: string, i: number) => (
              <span key={i} className="bg-white text-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 flex items-center shadow-sm">
                {opt}
                <button onClick={() => removeOption(i)} className="mr-2 text-red-400 hover:text-red-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={addOption}
              type="button"
              className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors shadow-md"
            >
              <Plus className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-right"
              placeholder="أدخل خياراً جديداً..."
            />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <button onClick={onCancel} className="px-6 py-2.5 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors">
          إلغاء
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg transition-all disabled:opacity-50"
        >
          {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
      </div>
    </div>
  );
};

export default AdminFilters;
