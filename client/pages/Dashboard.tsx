import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  User, 
  Package, 
  MapPin, 
  Settings, 
  LogOut, 
  ChevronRight, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  Truck, 
  XCircle,
  Edit2,
  Save,
  X
} from "lucide-react";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { authAPI, ordersAPI, settingsAPI } from "../services/api";

interface Order {
  id: number;
  order_number: string;
  total: number;
  order_status: string;
  created_at: string;
}

interface City {
  id: number;
  name: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    city: user?.city || "",
    district: user?.district || "",
    street: user?.street || "",
    building: user?.building || ""
  });

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadData();
  }, [token, navigate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, citiesRes] = await Promise.all([
        ordersAPI.getUserOrders(token!),
        settingsAPI.getCities()
      ]);
      setOrders(ordersRes.data || []);
      setCities(citiesRes.data || []);
    } catch (error) {
      console.error("Dashboard data load failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await authAPI.updateProfile(token!, profileData);
      if (response && response.user) {
        // Update local storage user data
        localStorage.setItem('user', JSON.stringify(response.user));
        // Force refresh state (since AuthContext reads from localStorage but might not react immediately)
        window.location.reload();
      }
    } catch (error) {
      console.error("Profile update failed:", error);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-4 h-4" /> };
      case 'processing': return { label: 'جاري التجهيز', color: 'bg-blue-100 text-blue-700', icon: <Settings className="w-4 h-4" /> };
      case 'shipped': return { label: 'تم الشحن', color: 'bg-indigo-100 text-indigo-700', icon: <Truck className="w-4 h-4" /> };
      case 'delivered': return { label: 'تم التوصيل', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle className="w-4 h-4" /> };
      case 'cancelled': return { label: 'ملغي', color: 'bg-red-100 text-red-700', icon: <XCircle className="w-4 h-4" /> };
      default: return { label: status, color: 'bg-gray-100 text-gray-700', icon: <Clock className="w-4 h-4" /> };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 arabic flex flex-col">
        <Header showSearch={true} showActions={true} />
        <div className="flex-grow flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 arabic text-right" dir="rtl">
      <Header showSearch={true} showActions={true} />

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-emerald-50">
              <div className="bg-emerald-600 p-8 text-center text-white">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold">{user?.name}</h2>
                <p className="text-emerald-100 text-sm">{user?.email}</p>
              </div>

              <nav className="p-4 space-y-2">
                <button 
                  onClick={() => setActiveTab("overview")}
                  className={`w-full flex items-center gap-3 px-6 py-4 rounded-xl font-bold transition-all ${activeTab === 'overview' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Settings className="w-5 h-5 text-emerald-600" />
                  <span>نظرة عامة</span>
                </button>
                <button 
                  onClick={() => setActiveTab("orders")}
                  className={`w-full flex items-center gap-3 px-6 py-4 rounded-xl font-bold transition-all ${activeTab === 'orders' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Package className="w-5 h-5 text-emerald-600" />
                  <span>طلباتي</span>
                  <span className="mr-auto bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full">{orders.length}</span>
                </button>
                <button 
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center gap-3 px-6 py-4 rounded-xl font-bold transition-all ${activeTab === 'profile' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <span>العنوان والملف الشخصي</span>
                </button>
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-6 py-4 rounded-xl font-bold text-red-600 hover:bg-red-50 transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-8 rounded-3xl shadow-lg border-b-4 border-emerald-500 transform hover:-translate-y-1 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                        <Package className="w-6 h-6" />
                      </div>
                      <span className="text-3xl font-black text-gray-800">{orders.length}</span>
                    </div>
                    <h3 className="text-gray-500 font-bold">إجمالي الطلبات</h3>
                  </div>
                  <div className="bg-white p-8 rounded-3xl shadow-lg border-b-4 border-emerald-500 transform hover:-translate-y-1 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                        <Clock className="w-6 h-6" />
                      </div>
                      <span className="text-3xl font-black text-gray-800">
                        {orders.filter(o => o.order_status === 'pending' || o.order_status === 'processing').length}
                      </span>
                    </div>
                    <h3 className="text-gray-500 font-bold">طلبات قيد التنفيذ</h3>
                  </div>
                  <div className="bg-white p-8 rounded-3xl shadow-lg border-b-4 border-emerald-500 transform hover:-translate-y-1 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <span className="text-xl font-black text-gray-800">
                        {orders.reduce((sum, o) => sum + Number(o.total), 0).toFixed(2)} شيكل
                      </span>
                    </div>
                    <h3 className="text-gray-500 font-bold">إجمالي المشتريات</h3>
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-50">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black text-gray-800">آخر الطلبات</h3>
                    <button onClick={() => setActiveTab("orders")} className="text-emerald-600 font-bold hover:underline flex items-center gap-1">
                      عرض الكل <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {orders.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right">
                        <thead>
                          <tr className="border-b-2 border-gray-50 text-gray-400 text-sm">
                            <th className="pb-4 font-bold">رقم الطلب</th>
                            <th className="pb-4 font-bold">التاريخ</th>
                            <th className="pb-4 font-bold">الحالة</th>
                            <th className="pb-4 font-bold text-center">المجموع</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {orders.slice(0, 5).map(order => (
                            <tr key={order.id} className="group hover:bg-gray-50/50 transition-colors">
                              <td className="py-5 font-bold text-gray-800">#{order.order_number}</td>
                              <td className="py-5 text-gray-500 text-sm">
                                {new Date(order.created_at).toLocaleDateString('ar-EG')}
                              </td>
                              <td className="py-5">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${getStatusInfo(order.order_status).color}`}>
                                  {getStatusInfo(order.order_status).icon}
                                  {getStatusInfo(order.order_status).label}
                                </span>
                              </td>
                              <td className="py-5 font-black text-emerald-600 text-center">{order.total} شيكل</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-gray-500 font-medium">
                      لا يوجد لديك طلبات سابقة حتى الآن.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-50">
                <h3 className="text-2xl font-black text-gray-800 mb-8">سجل الطلبات</h3>
                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map(order => (
                      <div key={order.id} className="p-6 rounded-2xl border-2 border-gray-50 hover:border-emerald-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                            <Package className="w-7 h-7" />
                          </div>
                          <div>
                            <div className="font-black text-lg text-gray-800">طلب رقم #{order.order_number}</div>
                            <div className="text-gray-400 text-sm flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(order.created_at).toLocaleDateString('ar-EG')} - {new Date(order.created_at).toLocaleTimeString('ar-EG')}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-left">
                            <div className="text-xs text-gray-400 font-bold mb-1">المبلغ الإجمالي</div>
                            <div className="text-xl font-black text-emerald-600">{order.total} شيكل</div>
                          </div>
                          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${getStatusInfo(order.order_status).color}`}>
                            {getStatusInfo(order.order_status).icon}
                            {getStatusInfo(order.order_status).label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <Package className="w-20 h-20 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500 font-bold text-xl">لم تقم بإجراء أي طلب بعد</p>
                    <Link to="/products" className="inline-block mt-4 text-emerald-600 font-black hover:underline">تصفح المنتجات الآن</Link>
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-50">
                <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-2xl font-black text-gray-800">بيانات العنوان والشحن</h3>
                  {!isEditingProfile ? (
                    <button 
                      onClick={() => setIsEditingProfile(true)}
                      className="flex items-center gap-2 px-6 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-black hover:bg-emerald-100 transition-all"
                    >
                      <Edit2 className="w-4 h-4" /> تعديل البيانات
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setIsEditingProfile(false)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-all"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-8">
                  {isEditingProfile ? (
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-black text-gray-600 mr-2">الاسم بالكامل</label>
                          <input 
                            type="text" 
                            className="w-full px-5 py-3.5 border-2 border-gray-100 bg-gray-50 rounded-2xl focus:border-emerald-500 outline-none transition-all font-bold"
                            value={profileData.name}
                            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-black text-gray-600 mr-2">رقم الهاتف</label>
                          <input 
                            type="tel" 
                            className="w-full px-5 py-3.5 border-2 border-gray-100 bg-gray-50 rounded-2xl focus:border-emerald-500 outline-none transition-all font-bold"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-black text-gray-600 mr-2">المدينة</label>
                          <select 
                            className="w-full px-5 py-3.5 border-2 border-gray-100 bg-gray-50 rounded-2xl focus:border-emerald-500 outline-none transition-all font-bold appearance-none"
                            value={profileData.city}
                            onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                          >
                            <option value="">اختر المدينة</option>
                            {cities.map(city => <option key={city.id} value={city.name}>{city.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-black text-gray-600 mr-2">الحي / المنطقة</label>
                          <input 
                            type="text" 
                            className="w-full px-5 py-3.5 border-2 border-gray-100 bg-gray-50 rounded-2xl focus:border-emerald-500 outline-none transition-all font-bold"
                            value={profileData.district}
                            onChange={(e) => setProfileData({...profileData, district: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-black text-gray-600 mr-2">الشارع</label>
                          <input 
                            type="text" 
                            className="w-full px-5 py-3.5 border-2 border-gray-100 bg-gray-50 rounded-2xl focus:border-emerald-500 outline-none transition-all font-bold"
                            value={profileData.street}
                            placeholder="اختياري"
                            onChange={(e) => setProfileData({...profileData, street: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-black text-gray-600 mr-2">رقم البناء / الشقة</label>
                          <input 
                            type="text" 
                            className="w-full px-5 py-3.5 border-2 border-gray-100 bg-gray-50 rounded-2xl focus:border-emerald-500 outline-none transition-all font-bold"
                            value={profileData.building}
                            placeholder="اختياري"
                            onChange={(e) => setProfileData({...profileData, building: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="pt-6 border-t border-gray-100">
                        <button 
                          type="submit"
                          className="w-full md:w-auto px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"
                        >
                          <Save className="w-5 h-5" /> حفظ التغييرات 
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
                      <div className="space-y-1">
                        <div className="text-xs text-gray-400 font-bold tracking-widest mb-2 uppercase">الاسم الكامل</div>
                        <div className="text-xl font-black text-gray-800">{user?.name}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-400 font-bold tracking-widest mb-2 uppercase">رقم الجوال</div>
                        <div className="text-xl font-black text-gray-800">{user?.phone || 'غير مضبوط'}</div>
                      </div>
                      <div className="md:col-span-2 space-y-4">
                        <div className="text-xs text-gray-400 font-bold tracking-widest uppercase">عنوان الشحن الافتراضي</div>
                        <div className="bg-emerald-50/50 p-8 rounded-3xl border-2 border-emerald-100 relative overflow-hidden">
                           <MapPin className="absolute -left-4 -bottom-4 w-32 h-32 text-emerald-100/50" />
                           <div className="relative z-10 flex flex-col gap-3">
                              <div className="flex items-center gap-3 text-2xl font-black text-emerald-800">
                                <span className="bg-emerald-600 text-white px-3 py-1 rounded-xl text-sm">المدينة</span>
                                {user?.city || 'يرجى تحديد المدينة'}
                              </div>
                              <div className="text-lg font-bold text-gray-700 flex items-center gap-2">
                                <ChevronRight className="w-5 h-5 text-emerald-400" />
                                {user?.district || 'حي غير محدد'} {user?.street ? `- شارع ${user.street}` : ''}
                              </div>
                              {user?.building && (
                                <div className="text-gray-500 font-medium">بناء: {user.building}</div>
                              )}
                              {!user?.city && (
                                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
                                  ⚠️ يرجى تعبئة العنوان ليتم احتساب أجرة التوصيل بشكل دقيق عند الطلب.
                                </div>
                              )}
                           </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
