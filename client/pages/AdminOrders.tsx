import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import {
  Search,
  Filter,
  Eye,
  Plus,
  ArrowLeft,
  ArrowRight,
  Package,
  User,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  CreditCard,
  Mail,
  MoreHorizontal,
  Trash2,
  Download,
  FileSpreadsheet
} from "lucide-react";
import { adminOrdersAPI } from "../services/adminApi";
import Swal from "sweetalert2";

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  order_status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
  items_count: number;
  items?: Array<{
    id: number;
    product_name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sendingEmailOrderId, setSendingEmailOrderId] = useState<number | null>(null);
  const navigate = useNavigate();

  const statusOptions = [
    { value: "all", label: "جميع الحالات" },
    { value: "pending", label: "معلق" },
    { value: "processing", label: "قيد المعالجة" },
    { value: "shipped", label: "تم الشحن" },
    { value: "delivered", label: "تم التسليم" },
    { value: "cancelled", label: "ملغي" }
  ];

  const paymentOptions = [
    { value: "all", label: "جميع طرق الدفع" },
    { value: "paid", label: "مدفوع" },
    { value: "pending", label: "معلق" },
    { value: "failed", label: "فشل" },
    { value: "refunded", label: "مسترد" }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveSearch(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    fetchOrders();
  }, [navigate, activeSearch, statusFilter, paymentFilter, fromDate, toDate, currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const filters = {
        search: activeSearch,
        status: statusFilter !== "all" ? statusFilter : undefined,
        payment_status: paymentFilter !== "all" ? paymentFilter : undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        page: currentPage,
        per_page: 20
      };
      
      const data = await adminOrdersAPI.getOrders(filters);
      setOrders(data.data || []);
      setTotalPages(data.meta?.last_page || data.last_page || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || "فشل في تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      await adminOrdersAPI.updateOrder(orderId.toString(), { order_status: newStatus });
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, order_status: newStatus }
          : order
      ));
    } catch (err: any) {
      setError(err.response?.data?.message || "فشل في تحديث حالة الطلب");
    }
  };

  const handleDeleteOrder = async (orderId: number, orderNumber: string) => {
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: `سيتم حذف الطلب #${orderNumber} نهائياً. لا يمكن التراجع عن هذا الإجراء.`,
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
        await adminOrdersAPI.deleteOrder(orderId.toString());
        setOrders(orders.filter(order => order.id !== orderId));
        Swal.fire({
          icon: 'success',
          title: 'تم الحذف',
          text: 'تم حذف الطلب بنجاح',
          confirmButtonText: 'حسناً'
        });
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'خطأ',
          text: err.response?.data?.message || 'فشل في حذف الطلب',
          confirmButtonText: 'حسناً'
        });
      }
    }
  };

  const handleSendCustomerEmail = async (order: Order) => {
    if (!order.customer_email || !order.customer_email.trim()) {
      Swal.fire({
        icon: "warning",
        title: "تنبيه",
        text: "لا يوجد بريد إلكتروني للعميل في هذه الطلبية",
        confirmButtonText: "حسنًا",
      });
      return;
    }

    try {
      setSendingEmailOrderId(order.id);
      const response = await adminOrdersAPI.sendCustomerEmail(order.id.toString());
      Swal.fire({
        icon: "success",
        title: "تم الإرسال",
        text: response?.message || "تم إرسال إيميل التأكيد للعميل",
        confirmButtonText: "حسنًا",
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: err?.response?.data?.message || "فشل إرسال الإيميل",
        confirmButtonText: "حسنًا",
      });
    } finally {
      setSendingEmailOrderId(null);
    }
  };

  const handleExport = async () => {
    try {
      const filters = {
        search: activeSearch,
        status: statusFilter !== "all" ? statusFilter : undefined,
        payment_status: paymentFilter !== "all" ? paymentFilter : undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      };

      const blob = await adminOrdersAPI.exportOrders(filters);
      
      // Create a link element, use it to download the blob, and remove it
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `sales_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      if (link.parentNode) link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError("فشل في تصدير التقرير");
    }
  };

  const handleExportDetailed = async () => {
    try {
      const filters = {
        search: activeSearch,
        status: statusFilter !== "all" ? statusFilter : undefined,
        payment_status: paymentFilter !== "all" ? paymentFilter : undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      };

      const blob = await adminOrdersAPI.exportDetailedOrders(filters);
      
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `orders_report_detailed_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      if (link.parentNode) link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError("فشل في تصدير التقرير التفصيلي");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "processing": return "bg-emerald-100 text-emerald-800";
      case "shipped": return "bg-purple-100 text-purple-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4" />;
      case "processing": return <Package className="w-4 h-4" />;
      case "shipped": return <Truck className="w-4 h-4" />;
      case "delivered": return <CheckCircle className="w-4 h-4" />;
      case "cancelled": return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      case "refunded": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">جاري تحميل الطلبات...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">إدارة الطلبات</h1>
            <p className="text-gray-600">عرض وإدارة جميع الطلبات</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-emerald-700 border border-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
              title="تقرير المبيعات المختصر"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="text-sm">تقرير المبيعات</span>
            </button>
            <button
              onClick={handleExportDetailed}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-700 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              title="تقرير الطلبات التفصيلي (يشمل SKU وبيانات الزبون)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="text-sm">تقرير الطلبات</span>
            </button>
            <button
              onClick={() => navigate("/admin/orders/create")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">إنشاء طلب جديد</span>
            </button>
          </div>
        </div>
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="البحث في الطلبات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Filter */}
            <div>
              <select
                value={paymentFilter}
                onChange={(e) => { setPaymentFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {paymentOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* From Date */}
            <div>
              <div className="relative">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
            </div>

            {/* To Date */}
            <div>
              <div className="relative">
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Orders Table */}
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">لا توجد طلبات</h3>
            <p className="text-gray-600">لم يتم العثور على طلبات تطابق معايير البحث</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      رقم الطلب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      العميل
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المبلغ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الدفع
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
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              #{order.order_number}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.items_count} عنصر
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {order.customer_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.customer_email}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {order.total.toLocaleString()} شيكل
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.shipping_cost > 0 && `+ ${order.shipping_cost} شحن`}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                            {getStatusIcon(order.order_status)}
                            <span className="mr-1">
                              {statusOptions.find(s => s.value === order.order_status)?.label || order.order_status}
                            </span>
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CreditCard className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                              {order.payment_status}
                            </span>
                            <div className="text-sm text-gray-500 mt-1">
                              {order.payment_method}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm text-gray-900">
                              {new Date(order.created_at).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button
                            onClick={() => navigate(`/admin/orders/${order.id}`)}
                            className="text-emerald-600 hover:text-emerald-900 p-2 hover:bg-emerald-50 rounded-lg"
                            title="عرض/تعديل الطلب"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSendCustomerEmail(order)}
                            disabled={sendingEmailOrderId === order.id}
                            className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                            title="إرسال إيميل تأكيد للعميل"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order.id, order.order_number)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg"
                            title="حذف الطلب"
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

export default AdminOrders;
