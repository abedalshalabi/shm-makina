import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import {
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Star,
  ArrowLeft,
  ArrowRight,
  MoreHorizontal,
  User,
  Package,
  Calendar,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { adminReviewsAPI } from "../services/adminApi";

interface Review {
  id: number;
  rating: number;
  comment: string;
  customer_name: string;
  customer_email?: string;
  is_approved: boolean;
  is_featured: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  product?: {
    id: number;
    name: string;
    slug: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReviews, setSelectedReviews] = useState<number[]>([]);
  const navigate = useNavigate();

  const ratingOptions = [
    { value: "all", label: "جميع التقييمات" },
    { value: "5", label: "5 نجوم" },
    { value: "4", label: "4 نجوم" },
    { value: "3", label: "3 نجوم" },
    { value: "2", label: "2 نجوم" },
    { value: "1", label: "نجمة واحدة" }
  ];

  const statusOptions = [
    { value: "all", label: "جميع الحالات" },
    { value: "approved", label: "موافق عليه" },
    { value: "pending", label: "معلق" },
    { value: "rejected", label: "مرفوض" }
  ];

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    fetchReviews();
  }, [navigate, searchQuery, ratingFilter, statusFilter, currentPage]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const filters = {
        search: searchQuery,
        rating: ratingFilter !== "all" ? ratingFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        page: currentPage,
        per_page: 20
      };
      
      const data = await adminReviewsAPI.getReviews(filters);
      setReviews(data.data || []);
      setTotalPages(data.meta?.last_page || data.last_page || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || "فشل في تحميل التقييمات");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (id: number) => {
    if (window.confirm("هل أنت متأكد من حذف هذا التقييم؟")) {
      try {
        await adminReviewsAPI.deleteReview(id.toString());
        setReviews(reviews.filter(r => r.id !== id));
      } catch (err: any) {
        setError(err.response?.data?.message || "فشل في حذف التقييم");
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedReviews.length === 0) return;
    
    if (window.confirm(`هل أنت متأكد من حذف ${selectedReviews.length} تقييم؟`)) {
      try {
        await Promise.all(
          selectedReviews.map(id => adminReviewsAPI.deleteReview(id.toString()))
        );
        setReviews(reviews.filter(r => !selectedReviews.includes(r.id)));
        setSelectedReviews([]);
      } catch (err: any) {
        setError(err.response?.data?.message || "فشل في حذف التقييمات");
      }
    }
  };

  const handleApproveReview = async (id: number) => {
    try {
      await adminReviewsAPI.updateReview(id.toString(), { is_approved: true });
      setReviews(reviews.map(r => 
        r.id === id ? { ...r, is_approved: true } : r
      ));
    } catch (err: any) {
      setError(err.response?.data?.message || "فشل في الموافقة على التقييم");
    }
  };

  const handleRejectReview = async (id: number) => {
    try {
      await adminReviewsAPI.updateReview(id.toString(), { is_approved: false });
      setReviews(reviews.map(r => 
        r.id === id ? { ...r, is_approved: false } : r
      ));
    } catch (err: any) {
      setError(err.response?.data?.message || "فشل في رفض التقييم");
    }
  };

  const toggleReviewSelection = (id: number) => {
    setSelectedReviews(prev => 
      prev.includes(id) 
        ? prev.filter(r => r !== id)
        : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedReviews.length === reviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(reviews.map(r => r.id));
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  const getStatusColor = (isApproved: boolean) => {
    if (isApproved === null) return "bg-yellow-100 text-yellow-800";
    return isApproved ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  const getStatusIcon = (isApproved: boolean) => {
    if (isApproved === null) return <AlertCircle className="w-4 h-4" />;
    return isApproved ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />;
  };

  const getStatusText = (isApproved: boolean) => {
    if (isApproved === null) return "معلق";
    return isApproved ? "موافق عليه" : "مرفوض";
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">جاري تحميل التقييمات...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">إدارة التقييمات</h1>
            <p className="text-gray-600">عرض وإدارة جميع التقييمات والمراجعات</p>
          </div>
        </div>
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="البحث في التقييمات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {ratingOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Button */}
            <div>
              <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center">
                <Filter className="w-4 h-4 mr-2" />
                فلترة
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedReviews.length > 0 && (
            <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-emerald-700">
                  تم تحديد {selectedReviews.length} تقييم
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
                    onClick={() => setSelectedReviews([])}
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

        {/* Reviews Table */}
        {reviews.length === 0 ? (
          <div className="text-center py-16">
            <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">لا توجد تقييمات</h3>
            <p className="text-gray-600">لم يتم العثور على تقييمات تطابق معايير البحث</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right">
                      <input
                        type="checkbox"
                        checked={selectedReviews.length === reviews.length && reviews.length > 0}
                        onChange={toggleAllSelection}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      العميل
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المنتج
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      التقييم
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      التعليق
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      التاريخ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reviews.map((review) => (
                    <tr key={review.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedReviews.includes(review.id)}
                          onChange={() => toggleReviewSelection(review.id)}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {review.customer_name}
                            </div>
                            {review.customer_email && (
                              <div className="text-sm text-gray-500">
                                {review.customer_email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {review.product?.name || "غير محدد"}
                            </div>
                            <div className="text-sm text-gray-500">
                              #{review.product?.id || "غير محدد"}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex">
                            {getRatingStars(review.rating)}
                          </div>
                          <span className="text-sm font-medium text-gray-900 mr-2">
                            {review.rating}/5
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {review.comment || "لا يوجد تعليق"}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(review.is_approved)}`}>
                            {getStatusIcon(review.is_approved)}
                            <span className="mr-1">
                              {getStatusText(review.is_approved)}
                            </span>
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">
                            {new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button
                            onClick={() => navigate(`/admin/reviews/${review.id}`)}
                            className="text-emerald-600 hover:text-emerald-900 p-2 hover:bg-emerald-50 rounded-lg"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/reviews/${review.id}/edit`)}
                            className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {!review.is_approved && (
                            <button
                              onClick={() => handleApproveReview(review.id)}
                              className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-lg"
                              title="موافقة"
                            >
                              <ThumbsUp className="w-4 h-4" />
                            </button>
                          )}
                          {review.is_approved && (
                            <button
                              onClick={() => handleRejectReview(review.id)}
                              className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg"
                              title="رفض"
                            >
                              <ThumbsDown className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg"
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
      </div>
    </AdminLayout>
  );
};

export default AdminReviews;
