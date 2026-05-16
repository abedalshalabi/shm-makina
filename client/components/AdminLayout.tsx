import { useState, ReactNode, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FolderTree,
  Tag,
  Star,
  LogOut,
  Menu,
  X,
  Settings,
  ChevronDown,
  ChevronRight,
  Gift,
  MessageSquare,
  Mail,
  MapPin,
  ExternalLink,
  Image,
  Filter,
  Shield
} from 'lucide-react';
import { adminContactMessagesAPI, adminOrdersAPI } from '../services/adminApi';
import SEO from './SEO';

interface AdminLayoutProps {
  children: ReactNode;
}

function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);

  // Fetch new messages count
  useEffect(() => {
    const fetchNewMessagesCount = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        if (!token) return;

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
        const token = localStorage.getItem('admin_token');
        if (!token) return;

        const response = await adminOrdersAPI.getNewOrdersCount();
        setNewOrdersCount(response.count || 0);
      } catch (error) {
        console.error('Error fetching new orders count:', error);
      }
    };

    fetchNewMessagesCount();
    fetchNewOrdersCount();
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchNewMessagesCount();
      fetchNewOrdersCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const menuItems = [
    {
      title: 'لوحة التحكم',
      icon: LayoutDashboard,
      path: '/admin/dashboard',
    },
    {
      title: 'المنتجات',
      icon: Package,
      path: '/admin/products',
    },
    {
      title: 'الفئات',
      icon: FolderTree,
      path: '/admin/categories',
    },
    {
      title: 'الفلاتر (المرشحات)',
      icon: Filter,
      path: '/admin/filters',
    },
    {
      title: 'العلامات التجارية',
      icon: Tag,
      path: '/admin/brands',
    },
    {
      title: 'الطلبات',
      icon: ShoppingCart,
      path: '/admin/orders',
    },
    {
      title: 'المدن',
      icon: MapPin,
      path: '/admin/cities',
    },
    {
      title: 'السلايدر الرئيسي',
      icon: Image,
      path: '/admin/slider',
    },
    {
      title: 'المسؤولين',
      icon: Shield,
      path: '/admin/users',
    },
    {
      title: 'الزبائن',
      icon: Users,
      path: '/admin/customers',
    },
    {
      title: 'المراجعات',
      icon: Star,
      path: '/admin/reviews',
    },
    {
      title: 'العروض',
      icon: Gift,
      path: '/admin/offers',
    },
    {
      title: 'رسائل الاتصال',
      icon: MessageSquare,
      path: '/admin/contact-messages',
    },
    {
      title: 'مشتركو النشرة',
      icon: Mail,
      path: '/admin/newsletter-subscribers',
    },
  ];

  const settingsSubMenu = [
    { title: 'الإعدادات العامة', tab: 'general' },
    { title: 'Header', tab: 'header' },
    { title: 'تذييل الصفحة', tab: 'footer' },
    { title: 'SEO وتهيئة المحركات', tab: 'seo' },
    { title: 'من نحن', tab: 'about' },
    { title: 'اتصل بنا', tab: 'contact' },
    { title: 'الشحن والتوصيل', tab: 'shipping' },
    { title: 'الإرجاع والاستبدال', tab: 'returns' },
    { title: 'الضمان', tab: 'warranty' },
    { title: 'إشعارات الطلبات', tab: 'notifications' },
    { title: 'الإحصائيات والعدادات', tab: 'analytics' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Auto-open settings menu if on settings page and update active state
  useEffect(() => {
    if (location.pathname === '/admin/site-settings') {
      setSettingsMenuOpen(true);
    }
  }, [location.pathname, location.hash]);

  const pageTitle = menuItems.find(item => isActive(item.path))?.title || 'لوحة الإدارة';

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      <SEO title={`${pageTitle} - لوحة الإدارة`} noindex={true} />
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-l border-gray-200 shadow-sm">
        {/* Logo/Brand */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-gradient-to-r from-emerald-600 to-emerald-700">
          <Link to="/admin/dashboard" className="text-white text-xl font-bold">
            لوحة الإدارة
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.path)
                ? 'bg-emerald-50 text-emerald-600 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <span>{item.title}</span>
              </div>
              {item.path === '/admin/contact-messages' && newMessagesCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {newMessagesCount > 99 ? '99+' : newMessagesCount}
                </span>
              )}
              {item.path === '/admin/orders' && newOrdersCount > 0 && (
                <span className="bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {newOrdersCount > 99 ? '99+' : newOrdersCount}
                </span>
              )}
            </Link>
          ))}

          {/* Settings Dropdown */}
          <div>
            <button
              onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === '/admin/site-settings'
                ? 'bg-emerald-50 text-emerald-600 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5" />
                <span>إعدادات الموقع</span>
              </div>
              {settingsMenuOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {settingsMenuOpen && (
              <div className="mr-4 mt-1 space-y-1">
                {settingsSubMenu.map((subItem) => (
                  <Link
                    key={subItem.tab}
                    to={`/admin/site-settings#${subItem.tab}`}
                    className={`block px-4 py-2 rounded-lg text-sm transition-colors ${location.hash === `#${subItem.tab}`
                      ? 'bg-emerald-100 text-emerald-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    {subItem.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Sidebar */}
          <aside className="fixed inset-y-0 right-0 w-64 bg-white shadow-lg z-50 lg:hidden">
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 bg-gradient-to-r from-emerald-600 to-emerald-700">
              <Link to="/admin/dashboard" className="text-white text-xl font-bold">
                لوحة الإدارة
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-white hover:bg-emerald-800 p-2 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.path)
                    ? 'bg-emerald-50 text-emerald-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </div>
                  {item.path === '/admin/contact-messages' && newMessagesCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {newMessagesCount > 99 ? '99+' : newMessagesCount}
                    </span>
                  )}
                  {item.path === '/admin/orders' && newOrdersCount > 0 && (
                    <span className="bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {newOrdersCount > 99 ? '99+' : newOrdersCount}
                    </span>
                  )}
                </Link>
              ))}

              {/* Settings Dropdown */}
              <div>
                <button
                  onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === '/admin/site-settings'
                    ? 'bg-emerald-50 text-emerald-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5" />
                    <span>إعدادات الموقع</span>
                  </div>
                  {settingsMenuOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                {settingsMenuOpen && (
                  <div className="mr-4 mt-1 space-y-1">
                    {settingsSubMenu.map((subItem) => (
                      <Link
                        key={subItem.tab}
                        to={`/admin/site-settings#${subItem.tab}`}
                        onClick={() => setSidebarOpen(false)}
                        className={`block px-4 py-2 rounded-lg text-sm transition-colors ${location.hash === `#${subItem.tab}`
                          ? 'bg-emerald-100 text-emerald-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                          }`}
                      >
                        {subItem.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-600 hover:text-gray-900 p-2"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Page Title */}
          <div className="flex-1 lg:flex-none">
            <h1 className="text-lg font-semibold text-gray-800">
              {menuItems.find(item => isActive(item.path))?.title || 'لوحة التحكم'}
            </h1>
          </div>

          {/* User Info & Site Link */}
          <div className="flex items-center gap-3">
            {/* Site Link */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all duration-200 hover:shadow-sm"
              title="الذهاب إلى الموقع"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">الموقع</span>
            </a>

            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-800">المسؤول</p>
              <p className="text-xs text-gray-600">admin@site.com</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-semibold">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;

