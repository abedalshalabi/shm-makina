import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import {
  Search,
  Eye,
  User,
  Mail,
  Phone,
  Calendar,
  ArrowLeft,
  ArrowRight,
  ShoppingCart,
  Package,
  Heart,
} from "lucide-react";
import { adminCustomersAPI } from "../services/adminApi";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  orders_count: number;
  cart_items_count: number;
  wishlist_items_count: number;
  created_at: string;
}

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomers();
  }, [searchQuery, currentPage]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await adminCustomersAPI.getCustomers({
        search: searchQuery,
        page: currentPage,
        per_page: 20,
      });
      setCustomers(data.data || []);
      setTotalPages(data.meta?.last_page || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || "فشل في تحميل بيانات الزبائن");
    } finally {
      setLoading(false);
    }
  };

  if (loading && customers.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600" />
            <p className="text-lg text-gray-600">جاري تحميل الزبائن...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-6 py-4" dir="rtl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة الزبائن</h1>
            <p className="text-gray-600">عرض الزبائن المسجلين مع الطلبات والسلة والمفضلة</p>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              <input
                type="text"
                placeholder="ابحث بالاسم أو البريد أو الهاتف..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-gray-300 py-2 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {customers.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white py-16 text-center">
            <User className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 text-xl font-semibold text-gray-800">لا يوجد زبائن</h3>
            <p className="text-gray-600">لم يتم العثور على زبائن مطابقين لنتائج البحث</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-medium tracking-wider text-gray-500">الزبون</th>
                    <th className="px-6 py-4 text-xs font-medium tracking-wider text-gray-500">التواصل</th>
                    <th className="px-6 py-4 text-center text-xs font-medium tracking-wider text-gray-500">الطلبات</th>
                    <th className="px-6 py-4 text-center text-xs font-medium tracking-wider text-gray-500">السلة</th>
                    <th className="px-6 py-4 text-center text-xs font-medium tracking-wider text-gray-500">المفضلة</th>
                    <th className="px-6 py-4 text-xs font-medium tracking-wider text-gray-500">تاريخ الانضمام</th>
                    <th className="px-6 py-4 text-xs font-medium tracking-wider text-gray-500">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="transition-colors hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                            {customer.name.charAt(0)}
                          </div>
                          <div className="mr-3">
                            <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                            <div className="text-xs text-gray-500">#{customer.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="ml-1 h-3 w-3" />
                            {customer.email}
                          </div>
                          {customer.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="ml-1 h-3 w-3" />
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${customer.orders_count > 0 ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}>
                          <Package className="ml-1 h-3 w-3" />
                          {customer.orders_count} طلبات
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${customer.cart_items_count > 0 ? "bg-orange-100 text-orange-800" : "bg-gray-100 text-gray-800"}`}>
                          <ShoppingCart className="ml-1 h-3 w-3" />
                          {customer.cart_items_count} قطع
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${customer.wishlist_items_count > 0 ? "bg-rose-100 text-rose-800" : "bg-gray-100 text-gray-800"}`}>
                          <Heart className="ml-1 h-3 w-3" />
                          {customer.wishlist_items_count} عناصر
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="ml-1 h-3 w-3" />
                          {new Date(customer.created_at).toLocaleDateString("ar-EG")}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                        <button
                          onClick={() => navigate(`/admin/customers/${customer.id}`)}
                          className="flex items-center gap-1 rounded-lg p-2 text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-900"
                        >
                          <Eye className="h-4 w-4" />
                          عرض التفاصيل
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center">
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-gray-300 p-2 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowRight className="h-4 w-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-lg px-3 py-2 transition-colors ${
                    currentPage === page ? "bg-emerald-600 text-white" : "border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-gray-300 p-2 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCustomers;
