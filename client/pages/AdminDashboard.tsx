import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { adminDashboardAPI, adminContactMessagesAPI, adminOrdersAPI } from "../services/adminApi";
import AdminLayout from "../components/AdminLayout";
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Boxes,
  Tag,
  MessageSquare,
  AlertCircle
} from "lucide-react";

interface DashboardStats {
  total_products: number;
  active_products: number;
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  total_users: number;
  total_categories: number;
  total_brands: number;
  total_admins: number;
  total_visits: number;
}

interface RevenueStats {
  total_revenue: number;
  monthly_revenue: number;
  daily_revenue: number;
}

interface TopProduct {
  id: number;
  name: string;
  sales_count: number;
  price: number;
}

interface DashboardData {
  stats: DashboardStats;
  revenue: RevenueStats;
  recent_orders: any[];
  top_products: TopProduct[];
  message: string;
}

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    fetchDashboardData();
    fetchNewMessagesCount();
    fetchNewOrdersCount();

    // Poll for new orders and messages every 30 seconds
    const interval = setInterval(() => {
      fetchNewMessagesCount();
      fetchNewOrdersCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [navigate]);

  const fetchNewMessagesCount = async () => {
    try {
      const response = await adminContactMessagesAPI.getContactMessages({
        status: 'new',
        per_page: 1,
        page: 1
      });
      setNewMessagesCount(response.meta?.total || 0);
    } catch (error) {
      console.error('Error fetching new messages count:', error);
    }
  };

  const fetchNewOrdersCount = async () => {
    try {
      const response = await adminOrdersAPI.getNewOrdersCount();
      setNewOrdersCount(response.count || 0);
    } catch (error) {
      console.error('Error fetching new orders count:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const data = await adminDashboardAPI.getDashboard();
      setDashboardData(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "فشل في تحميل بيانات لوحة التحكم");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    navigate("/admin/login");
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }: {
    title: string;
    value: number;
    icon: any;
    color: string;
    trend?: { value: number; isPositive: boolean };
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend.isPositive ? "text-green-600" : "text-red-600"
              }`}>
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              {trend.value}%
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">حدث خطأ</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* New Orders Alert */}
        {newOrdersCount > 0 && (
          <div className="mb-6 bg-green-50 border-r-4 border-green-600 rounded-lg p-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-green-600 rounded-full p-2">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    لديك {newOrdersCount} {newOrdersCount === 1 ? 'طلب جديد' : 'طلبات جديدة'}
                  </h3>
                  <p className="text-sm text-gray-600">يوجد طلبات جديدة تحتاج إلى مراجعة</p>
                </div>
              </div>
              <Link
                to="/admin/orders?status=pending"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                عرض الطلبات
              </Link>
            </div>
          </div>
        )}

        {/* New Messages Alert */}
        {newMessagesCount > 0 && (
          <div className="mb-6 bg-emerald-50 border-r-4 border-emerald-600 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-600 rounded-full p-2">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    لديك {newMessagesCount} {newMessagesCount === 1 ? 'رسالة جديدة' : 'رسائل جديدة'}
                  </h3>
                  <p className="text-sm text-gray-600">يوجد رسائل اتصال جديدة تحتاج إلى مراجعة</p>
                </div>
              </div>
              <Link
                to="/admin/contact-messages?status=new"
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                عرض الرسائل
              </Link>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="إجمالي المنتجات"
            value={dashboardData?.stats.total_products || 0}
            icon={Package}
            color="bg-emerald-500"
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="الطلبات"
            value={dashboardData?.stats.total_orders || 0}
            icon={ShoppingCart}
            color="bg-green-500"
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="المستخدمين"
            value={dashboardData?.stats.total_users || 0}
            icon={Users}
            color="bg-purple-500"
            trend={{ value: 15, isPositive: true }}
          />
          <StatCard
            title="زيارات الموقع"
            value={dashboardData?.stats.total_visits || 0}
            icon={Eye}
            color="bg-pink-500"
            trend={{ value: 20, isPositive: true }}
          />
        </div>

        {/* Revenue Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">الإيرادات</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">الإجمالي</span>
                <span className="text-xl font-bold text-gray-900">
                  {dashboardData?.revenue.total_revenue?.toLocaleString() || 0} شيكل
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">هذا الشهر</span>
                <span className="text-lg font-semibold text-emerald-600">
                  {dashboardData?.revenue.monthly_revenue?.toLocaleString() || 0} شيكل
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">اليوم</span>
                <span className="text-lg font-semibold text-green-600">
                  {dashboardData?.revenue.daily_revenue?.toLocaleString() || 0} شيكل
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">الطلبات</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">إجمالي الطلبات</span>
                <span className="text-xl font-bold text-gray-900">
                  {dashboardData?.stats.total_orders || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">معلقة</span>
                <span className="text-lg font-semibold text-yellow-600">
                  {dashboardData?.stats.pending_orders || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">مكتملة</span>
                <span className="text-lg font-semibold text-green-600">
                  {dashboardData?.stats.completed_orders || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">المنتجات</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">إجمالي المنتجات</span>
                <span className="text-xl font-bold text-gray-900">
                  {dashboardData?.stats.total_products || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">نشطة</span>
                <span className="text-lg font-semibold text-green-600">
                  {dashboardData?.stats.active_products || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">الفئات</span>
                <span className="text-lg font-semibold text-emerald-600">
                  {dashboardData?.stats.total_categories || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">المنتجات الأكثر مبيعاً</h3>
          <div className="space-y-4">
            {dashboardData?.top_products?.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-600">{product.price.toLocaleString()} شيكل</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{product.sales_count} مبيع</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
