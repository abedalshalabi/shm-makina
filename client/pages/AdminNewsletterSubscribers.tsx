import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { adminNewsletterSubscribersAPI } from "../services/adminApi";
import { Mail, Search, RefreshCw, Trash2, Calendar, CheckCircle, XCircle, Download } from "lucide-react";
import Swal from "sweetalert2";

interface NewsletterSubscriber {
  id: number;
  email: string;
  status: "active" | "unsubscribed";
  source?: string | null;
  subscribed_at?: string | null;
  unsubscribed_at?: string | null;
  created_at: string;
  updated_at: string;
}

const AdminNewsletterSubscribers = () => {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    fetchSubscribers();
  }, [navigate, searchQuery, statusFilter, currentPage]);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await adminNewsletterSubscribersAPI.getSubscribers({
        search: searchQuery,
        status: statusFilter !== "all" ? statusFilter : undefined,
        page: currentPage,
        per_page: 15,
        sort_by: "created_at",
        sort_order: "desc",
      });

      setSubscribers(response.data || []);
      setTotalPages(response.meta?.last_page || 1);
      setTotal(response.meta?.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || "فشل في تحميل المشتركين");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, status: "active" | "unsubscribed") => {
    try {
      await adminNewsletterSubscribersAPI.updateStatus(id.toString(), status);
      Swal.fire({
        icon: "success",
        title: "تم!",
        text: "تم تحديث حالة المشترك بنجاح",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });
      fetchSubscribers();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "خطأ!",
        text: err.response?.data?.message || "فشل في تحديث الحالة",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "هل أنت متأكد؟",
      text: "سيتم حذف المشترك نهائياً.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "نعم، احذف",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    try {
      await adminNewsletterSubscribersAPI.deleteSubscriber(id.toString());
      Swal.fire({
        icon: "success",
        title: "تم الحذف!",
        text: "تم حذف المشترك بنجاح",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });
      fetchSubscribers();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "خطأ!",
        text: err.response?.data?.message || "فشل في حذف المشترك",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await adminNewsletterSubscribersAPI.exportSubscribers({
        search: searchQuery || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const disposition = response.headers["content-disposition"] as string | undefined;
      const matchedFileName = disposition?.match(/filename="?([^"]+)"?/i)?.[1];
      link.href = url;
      link.download = matchedFileName || "newsletter-subscribers.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "خطأ!",
        text: err.response?.data?.message || "فشل في تصدير الملف",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AdminLayout>
      <div className="px-6 py-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">مشتركو النشرة البريدية</h1>
          <p className="text-gray-600">إدارة قائمة المشتركين ومراجعة حالة الاشتراك</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي المشتركين</p>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
              </div>
              <Mail className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">نشطون</p>
                <p className="text-2xl font-bold text-emerald-600">{subscribers.filter((item) => item.status === "active").length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ملغاة</p>
                <p className="text-2xl font-bold text-rose-600">{subscribers.filter((item) => item.status === "unsubscribed").length}</p>
              </div>
              <XCircle className="w-8 h-8 text-rose-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="ابحث بالبريد الإلكتروني..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="all">كل الحالات</option>
                <option value="active">نشط</option>
                <option value="unsubscribed">ملغى</option>
              </select>
            </div>
            <button
              onClick={fetchSubscribers}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              تحديث
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              {exporting ? "جاري التصدير..." : "تصدير Excel"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-gray-600">جاري تحميل المشتركين...</p>
            </div>
          </div>
        ) : subscribers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">لا يوجد مشتركون حالياً</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">البريد الإلكتروني</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">المصدر</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الحالة</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">تاريخ الاشتراك</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {subscribers.map((subscriber) => (
                    <tr key={subscriber.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-gray-800 font-medium">{subscriber.email}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{subscriber.source || "—"}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            subscriber.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"
                          }`}
                        >
                          {subscriber.status === "active" ? "نشط" : "ملغى"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{formatDate(subscriber.subscribed_at || subscriber.created_at)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStatusChange(subscriber.id, subscriber.status === "active" ? "unsubscribed" : "active")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              subscriber.status === "active"
                                ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {subscriber.status === "active" ? "إلغاء الاشتراك" : "إعادة التفعيل"}
                          </button>
                          <button
                            onClick={() => handleDelete(subscriber.id)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
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

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  صفحة {currentPage} من {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
                  >
                    السابق
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminNewsletterSubscribers;
