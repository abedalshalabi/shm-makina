import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import {
  Search,
  Filter,
  Eye,
  Mail,
  Phone,
  User,
  Calendar,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  X
} from "lucide-react";
import { adminContactMessagesAPI } from "../services/adminApi";
import Swal from "sweetalert2";

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  created_at: string;
  updated_at: string;
}

const AdminContactMessages = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const navigate = useNavigate();

  const statusOptions = [
    { value: "all", label: "جميع الرسائل" },
    { value: "new", label: "جديدة" },
    { value: "read", label: "مقروءة" },
    { value: "replied", label: "تم الرد" }
  ];

  const statusColors: { [key: string]: string } = {
    new: "bg-emerald-100 text-emerald-800",
    read: "bg-yellow-100 text-yellow-800",
    replied: "bg-green-100 text-green-800"
  };

  const statusLabels: { [key: string]: string } = {
    new: "جديدة",
    read: "مقروءة",
    replied: "تم الرد"
  };

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    fetchMessages();
  }, [navigate, searchQuery, statusFilter, currentPage]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError("");
      const filters = {
        search: searchQuery,
        status: statusFilter !== "all" ? statusFilter : undefined,
        page: currentPage,
        per_page: 15,
        sort_by: 'created_at',
        sort_order: 'desc'
      };
      
      const response = await adminContactMessagesAPI.getContactMessages(filters);
      setMessages(response.data || []);
      setTotalPages(response.meta?.last_page || 1);
      setTotal(response.meta?.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || "فشل في تحميل الرسائل");
      console.error("Error loading messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: 'new' | 'read' | 'replied') => {
    try {
      await adminContactMessagesAPI.updateStatus(id.toString(), newStatus);
      Swal.fire({
        icon: 'success',
        title: 'تم!',
        text: 'تم تحديث حالة الرسالة بنجاح',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
      });
      fetchMessages();
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage({ ...selectedMessage, status: newStatus });
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'خطأ!',
        text: err.response?.data?.message || 'فشل في تحديث حالة الرسالة',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'لن تتمكن من التراجع عن هذا الإجراء!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء'
    });

    if (result.isConfirmed) {
      try {
        await adminContactMessagesAPI.deleteContactMessage(id.toString());
        Swal.fire({
          icon: 'success',
          title: 'تم الحذف!',
          text: 'تم حذف الرسالة بنجاح',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
        });
        fetchMessages();
        if (selectedMessage && selectedMessage.id === id) {
          setSelectedMessage(null);
        }
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'خطأ!',
          text: err.response?.data?.message || 'فشل في حذف الرسالة',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
        });
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminLayout>
      <div className="px-6 py-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">رسائل الاتصال</h1>
          <p className="text-gray-600">إدارة ومراجعة رسائل الاتصال الواردة</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الرسائل</p>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">رسائل جديدة</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {messages.filter(m => m.status === 'new').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">مقروءة</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {messages.filter(m => m.status === 'read').length}
                </p>
              </div>
              <Eye className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">تم الرد</p>
                <p className="text-2xl font-bold text-green-600">
                  {messages.filter(m => m.status === 'replied').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="ابحث في الرسائل..."
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
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={fetchMessages}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              تحديث
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-gray-600">جاري تحميل الرسائل...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">لا توجد رسائل</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Messages List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      onClick={() => setSelectedMessage(message)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedMessage?.id === message.id ? 'bg-emerald-50 border-r-4 border-emerald-600' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-gray-400" />
                          <h3 className="font-semibold text-gray-900">{message.name}</h3>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[message.status]}`}>
                          {statusLabels[message.status]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 font-medium">{message.subject}</p>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-2">{message.message}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span>{message.email}</span>
                          </div>
                          {message.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span>{message.phone}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(message.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    السابق
                  </button>
                  <span className="text-sm text-gray-600">
                    صفحة {currentPage} من {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    التالي
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Message Details */}
            <div className="lg:col-span-1">
              {selectedMessage ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">تفاصيل الرسالة</h2>
                    <button
                      onClick={() => setSelectedMessage(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">الاسم</label>
                      <p className="text-gray-900 font-semibold">{selectedMessage.name}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">البريد الإلكتروني</label>
                      <p className="text-gray-900">
                        <a href={`mailto:${selectedMessage.email}`} className="text-emerald-600 hover:underline">
                          {selectedMessage.email}
                        </a>
                      </p>
                    </div>

                    {selectedMessage.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">رقم الهاتف</label>
                        <p className="text-gray-900">
                          <a href={`tel:${selectedMessage.phone}`} className="text-emerald-600 hover:underline">
                            {selectedMessage.phone}
                          </a>
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-gray-500">الموضوع</label>
                      <p className="text-gray-900 font-semibold">{selectedMessage.subject}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">الرسالة</label>
                      <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                        {selectedMessage.message}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">التاريخ</label>
                      <p className="text-gray-900">{formatDate(selectedMessage.created_at)}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-2 block">تغيير الحالة</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusChange(selectedMessage.id, 'new')}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedMessage.status === 'new'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          }`}
                        >
                          جديدة
                        </button>
                        <button
                          onClick={() => handleStatusChange(selectedMessage.id, 'read')}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedMessage.status === 'read'
                              ? 'bg-yellow-600 text-white'
                              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          }`}
                        >
                          مقروءة
                        </button>
                        <button
                          onClick={() => handleStatusChange(selectedMessage.id, 'replied')}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedMessage.status === 'replied'
                              ? 'bg-green-600 text-white'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          تم الرد
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(selectedMessage.id)}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      حذف الرسالة
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">اختر رسالة لعرض التفاصيل</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminContactMessages;

