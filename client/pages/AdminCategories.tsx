import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Boxes,
  ArrowLeft,
  ArrowRight,
  MoreHorizontal,
  Grid,
  List,
  SortAsc,
  SortDesc,
  Tag,
  Image,
  Palette
} from "lucide-react";
import { adminCategoriesAPI } from "../services/adminApi";

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon?: string;
  image?: string;
  is_active: boolean;
  sort_order: number;
  products_count: number;
  parent_id?: number;
  level: number;
  filters?: Filter[];
  parent?: Category;
  children?: Category[];
  created_at: string;
  updated_at: string;
}

interface Filter {
  name: string;
  type: 'select' | 'checkbox' | 'range';
  options?: string[];
  required?: boolean;
}

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    fetchCategories();
  }, [navigate, searchQuery, sortBy, sortOrder, currentPage, categoryFilter]);

  const normalizeCategories = (rawCategories: any[]): Category[] => {
    if (!Array.isArray(rawCategories)) {
      return [];
    }

    return rawCategories.map((cat: any) => {
      const normalizedLevel =
        cat?.level !== undefined && cat?.level !== null ? Number(cat.level) : 0;

      const normalizedParentId =
        cat?.parent_id !== undefined && cat?.parent_id !== null
          ? Number(cat.parent_id)
          : null;

      const normalizedChildren = Array.isArray(cat?.children) ? cat.children : [];

      const normalizedParent = cat?.parent && typeof cat.parent === 'object'
        ? {
            ...cat.parent,
            id: Number(cat.parent.id),
          }
        : undefined;

      return {
        ...cat,
        id: Number(cat.id),
        level: normalizedLevel,
        parent_id: normalizedParentId ?? undefined,
        filters: Array.isArray(cat?.filters) ? cat.filters : [],
        children: normalizedChildren,
        parent: normalizedParent,
      };
    });
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const filters = {
        search: searchQuery,
        sort: sortBy,
        order: sortOrder,
        type: categoryFilter
      };
      
      // تحميل الفئات الرئيسية مع الفئات الفرعية
      const data = await adminCategoriesAPI.getCategories(filters);

      const rawCategories = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setCategories(normalizeCategories(rawCategories));

      const lastPageFromMeta = data?.meta?.last_page;
      const lastPageFallback = data?.last_page;
      setTotalPages(
        typeof lastPageFromMeta === "number"
          ? lastPageFromMeta
          : typeof lastPageFallback === "number"
          ? lastPageFallback
          : 1
      );
    } catch (err: any) {
      setError(err.response?.data?.message || "فشل في تحميل الفئات");
    } finally {
      setLoading(false);
    }
  };

  // دالة لتنظيم الفئات بطريقة هرمية
  const organizeCategoriesHierarchically = (categories: Category[]) => {
    const mainCategories = categories.filter(cat => cat.level === 0);
    const subCategories = categories.filter(cat => cat.level > 0);
    
    const organizedCategories: Category[] = [];
    
    mainCategories.forEach(mainCategory => {
      // إضافة الفئة الرئيسية
      organizedCategories.push(mainCategory);
      
      // إضافة الفئات الفرعية التابعة لها
      const children = subCategories.filter(sub => sub.parent_id === mainCategory.id);
      organizedCategories.push(...children);
    });
    
    return organizedCategories;
  };

  const handleDeleteCategory = async (id: number) => {
    if (window.confirm("هل أنت متأكد من حذف هذه الفئة؟")) {
      try {
        await adminCategoriesAPI.deleteCategory(id.toString());
        setCategories(categories.filter(c => c.id !== id));
      } catch (err: any) {
        setError(err.response?.data?.message || "فشل في حذف الفئة");
      }
    }
  };

  const toggleCategorySelection = (id: number) => {
    setSelectedCategories(prev => 
      prev.includes(id) 
        ? prev.filter(catId => catId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categories.map(cat => cat.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCategories.length === 0) return;
    
    if (window.confirm(`هل أنت متأكد من حذف ${selectedCategories.length} فئة؟`)) {
      try {
        await adminCategoriesAPI.bulkDelete(selectedCategories);
        setCategories(categories.filter(c => !selectedCategories.includes(c.id)));
        setSelectedCategories([]);
      } catch (err: any) {
        setError(err.response?.data?.message || "فشل في حذف الفئات");
      }
    }
  };


  const toggleAllSelection = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categories.map(c => c.id));
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">جاري تحميل الفئات...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">إدارة الفئات</h1>
            <p className="text-gray-600">عرض وإدارة جميع الفئات</p>
          </div>
          
          <button
            onClick={() => navigate("/admin/categories/create")}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            إضافة فئة جديدة
          </button>
        </div>
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <Boxes className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي الفئات</p>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Boxes className="w-6 h-6 text-green-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">الفئات الرئيسية</p>
                <p className="text-2xl font-bold text-gray-900">
                  {categories.filter(c => c.level === 0).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Filter className="w-6 h-6 text-purple-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">الفئات مع فلاتر</p>
                <p className="text-2xl font-bold text-gray-900">
                  {categories.filter(c => c.filters && c.filters.length > 0).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Boxes className="w-6 h-6 text-orange-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">الفئات الفرعية</p>
                <p className="text-2xl font-bold text-gray-900">
                  {categories.filter(c => c.level > 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="البحث في الفئات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4 space-x-reverse">
              {/* Category Type Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">جميع الفئات</option>
                <option value="main">الفئات الرئيسية فقط</option>
                <option value="sub">الفئات الفرعية فقط</option>
                <option value="with_filters">الفئات مع فلاتر</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="name">الاسم</option>
                <option value="created_at">تاريخ الإنشاء</option>
                <option value="sort_order">ترتيب العرض</option>
                <option value="products_count">عدد المنتجات</option>
                <option value="level">المستوى</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                {sortOrder === "asc" ? <SortAsc className="w-5 h-5" /> : <SortDesc className="w-5 h-5" />}
              </button>

              {/* View Mode */}
              <div className="flex border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-emerald-100 text-emerald-600" : "text-gray-600"}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-emerald-100 text-emerald-600" : "text-gray-600"}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedCategories.length > 0 && (
            <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-emerald-700">
                  تم تحديد {selectedCategories.length} فئة
                </span>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <button
                    onClick={handleBulkDelete}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    حذف المحدد
                  </button>
                  <button
                    onClick={() => setSelectedCategories([])}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    إلغاء التحديد
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Categories Table */}
        {categories.length === 0 ? (
          <div className="text-center py-16">
            <Boxes className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">لا توجد فئات</h3>
            <p className="text-gray-600 mb-4">لم يتم العثور على فئات تطابق معايير البحث</p>
            <button
              onClick={() => navigate("/admin/categories/create")}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700"
            >
              إضافة فئة جديدة
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedCategories.length === categories.length && categories.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الفئة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المستوى
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الفئة الرئيسية
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الفلاتر
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المنتجات
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
                  {organizeCategoriesHierarchically(categories).map((category) => (
                    <tr key={category.id} className={`${category.level === 0 ? 'bg-gray-100 border-l-4 border-l-green-400 hover:bg-gray-200' : 'hover:bg-emerald-50'} transition-colors duration-200`}>
                      {/* Checkbox */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category.id)}
                          onChange={() => toggleCategorySelection(category.id)}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                      </td>
                      
                      {/* Category Name & Info */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-10 w-10 ${category.level > 0 ? 'mr-8' : ''}`}>
                            <div 
                              className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                                category.level === 0 ? 'ring-2 ring-green-200' : ''
                              }`}
                              style={{ backgroundColor: category.color + '20' }}
                            >
                              <Boxes 
                                className="h-6 w-6" 
                                style={{ color: category.color }}
                              />
                            </div>
                          </div>
                          <div className="mr-4">
                            <div className="flex items-center">
                              {category.level > 0 && (
                                <div className="flex items-center mr-2">
                                  <div className="w-4 h-4 border-l-2 border-b-2 border-gray-300 mr-2"></div>
                                  <div className="w-2 h-2 bg-gray-400 rounded-full ml-4"></div>
                                </div>
                              )}
                              <div>
                                <div className={`text-sm font-medium ${category.level === 0 ? 'text-green-800 font-bold' : 'text-gray-700'}`}>
                                  {category.level > 0 ? `└─ ${category.name}` : category.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {category.slug}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      {/* Level */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {category.level > 0 && (
                            <div className="flex items-center mr-2">
                              {Array.from({ length: category.level }, (_, i) => (
                                <div key={i} className="w-3 h-3 border-l border-b border-gray-300 mr-1"></div>
                              ))}
                            </div>
                          )}
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            category.level === 0 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {category.level === 0 ? 'رئيسية' : `فرعية (${category.level})`}
                          </span>
                        </div>
                      </td>
                      
                      {/* Parent Category */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {category.parent ? (
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-gray-400 rounded-full ml-4"></div>
                            <span className="text-gray-600">
                              {category.parent.name}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full ml-4"></div>
                            <span className="text-green-600 font-medium">فئة رئيسية</span>
                          </div>
                        )}
                      </td>
                      
                      {/* Filters */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {category.filters && category.filters.length > 0 ? (
                          <div className="flex items-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {category.filters.length} فلتر
                            </span>
                            <button
                              onClick={() => navigate(`/admin/categories/${category.id}/filters`)}
                              className="mr-2 text-purple-600 hover:text-purple-800"
                              title="إدارة الفلاتر"
                            >
                              <Filter className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => navigate(`/admin/categories/${category.id}/filters`)}
                            className="text-gray-400 hover:text-purple-600 flex items-center gap-1 transition-colors"
                            title="إضافة فلاتر"
                          >
                            <Filter className="w-4 h-4" />
                            <span className="text-xs italic">إضافة فلاتر</span>
                          </button>
                        )}
                      </td>
                      
                      {/* Products Count */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-medium">{category.products_count || 0}</span>
                        <span className="text-gray-500"> منتج</span>
                      </td>
                      
                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          category.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {category.is_active ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      
                      {/* Sort Order */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {category.sort_order}
                      </td>
                      
                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button
                            onClick={() => navigate(`/admin/categories/${category.id}`)}
                            className="text-emerald-600 hover:text-emerald-900"
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/categories/${category.id}/edit`)}
                            className="text-green-600 hover:text-green-900"
                            title="تعديل الفئة"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {category.level === 0 && (
                            <button
                              onClick={() => navigate(`/admin/categories/create?parent=${category.id}`)}
                              className="text-purple-600 hover:text-purple-900"
                              title="إضافة فئة فرعية"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/admin/categories/${category.id}/filters`)}
                            className="text-orange-600 hover:text-orange-900"
                            title={category.filters && category.filters.length > 0 ? "إدارة الفلاتر" : "إضافة فلاتر"}
                          >
                            <Filter className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-red-600 hover:text-red-900"
                            title="حذف الفئة"
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
      </div>
    </AdminLayout>
  );
};

export default AdminCategories;
