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
  Tag,
  ArrowLeft,
  ArrowRight,
  MoreHorizontal,
  Grid,
  List,
  SortAsc,
  SortDesc,
  Image,
  Globe,
  Star
} from "lucide-react";
import { adminBrandsAPI } from "../services/adminApi";

interface Brand {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  is_active: boolean;
  sort_order: number;
  products_count: number;
  created_at: string;
  updated_at: string;
}

const AdminBrands = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    fetchBrands();
  }, [navigate, searchQuery, sortBy, sortOrder, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, sortOrder]);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const filters: Record<string, any> = {
        search: searchQuery || undefined,
        sort: sortOrder === "desc" ? `-${sortBy}` : sortBy,
        page: currentPage,
        per_page: 20
      };
      
      const data = await adminBrandsAPI.getBrands(filters);
      setBrands(data.data || []);
      setTotalPages(data.meta?.last_page || 1);
      if (typeof data.meta?.current_page === 'number') {
        setCurrentPage(data.meta.current_page);
      }
      setSelectedBrands([]);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "فشل في تحميل العلامات التجارية");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBrand = async (id: number) => {
    if (window.confirm("هل أنت متأكد من حذف هذه العلامة التجارية؟")) {
      try {
        await adminBrandsAPI.deleteBrand(id.toString());
        setBrands(brands.filter(b => b.id !== id));
      } catch (err: any) {
        setError(err.response?.data?.message || "فشل في حذف العلامة التجارية");
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBrands.length === 0) return;
    
    if (window.confirm(`هل أنت متأكد من حذف ${selectedBrands.length} علامة تجارية؟`)) {
      try {
        await Promise.all(
          selectedBrands.map(id => adminBrandsAPI.deleteBrand(id.toString()))
        );
        setBrands(brands.filter(b => !selectedBrands.includes(b.id)));
        setSelectedBrands([]);
      } catch (err: any) {
        setError(err.response?.data?.message || "فشل في حذف العلامات التجارية");
      }
    }
  };

  const toggleBrandSelection = (id: number) => {
    setSelectedBrands(prev => 
      prev.includes(id) 
        ? prev.filter(b => b !== id)
        : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedBrands.length === brands.length) {
      setSelectedBrands([]);
    } else {
      setSelectedBrands(brands.map(b => b.id));
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">جاري تحميل العلامات التجارية...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">إدارة العلامات التجارية</h1>
            <p className="text-gray-600">عرض وإدارة جميع العلامات التجارية</p>
          </div>
          
          <button
            onClick={() => navigate("/admin/brands/create")}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            إضافة علامة تجارية
          </button>
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
                  placeholder="البحث في العلامات التجارية..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4 space-x-reverse">
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
          {selectedBrands.length > 0 && (
            <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-emerald-700">
                  تم تحديد {selectedBrands.length} علامة تجارية
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
                    onClick={() => setSelectedBrands([])}
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

        {/* Brands Grid/List */}
        {brands.length === 0 ? (
          <div className="text-center py-16">
            <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">لا توجد علامات تجارية</h3>
            <p className="text-gray-600 mb-4">لم يتم العثور على علامات تجارية تطابق معايير البحث</p>
            <button
              onClick={() => navigate("/admin/brands/create")}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700"
            >
              إضافة علامة تجارية جديدة
            </button>
          </div>
        ) : (
          <>
            {/* Brands */}
            <div className={`${
              viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
                : "space-y-4"
            }`}>
              {brands.map((brand) => (
                <div
                  key={brand.id}
                  className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${
                    viewMode === "list" ? "flex" : ""
                  }`}
                >
                  {/* Brand Logo */}
                  <div className={`${viewMode === "grid" ? "aspect-square" : "w-32 h-32"} bg-gray-100 relative flex items-center justify-center`}>
                    {brand.logo ? (
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="w-full h-full object-contain p-4"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Tag className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      {brand.is_active ? (
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">نشط</span>
                      ) : (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">غير نشط</span>
                      )}
                    </div>

                    {/* Selection Checkbox */}
                    <div className="absolute top-2 left-2">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand.id)}
                        onChange={() => toggleBrandSelection(brand.id)}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Brand Info */}
                  <div className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">{brand.name}</h3>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">المنتجات:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {brand.products_count} منتج
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">الترتيب:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {brand.sort_order}
                        </span>
                      </div>

                      {brand.website && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">الموقع:</span>
                          <a 
                            href={brand.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-emerald-600 hover:text-emerald-800 flex items-center"
                          >
                            <Globe className="w-3 h-3 mr-1" />
                            زيارة الموقع
                          </a>
                        </div>
                      )}

                      {brand.description && (
                        <div className="text-sm text-gray-600 line-clamp-2">
                          {brand.description}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => navigate(`/admin/brands/${brand.id}`)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/brands/${brand.id}/edit`)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBrand(brand.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

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
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBrands;
