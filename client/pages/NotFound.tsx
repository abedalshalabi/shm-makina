import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, Search } from "lucide-react";
import { useSiteSettings } from "../context/SiteSettingsContext";

const NotFound = () => {
  const location = useLocation();
  const { siteName } = useSiteSettings();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 arabic">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-9xl mb-6 animate-pulse">🔍</div>
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">الصفحة غير موجودة</h2>
        <p className="text-lg text-gray-600 mb-8">
          عذراً، لا يمكننا العثور على الصفحة التي تبحث عنها{siteName ? ` في ${siteName}` : ""}.

        </p>
        
        <div className="flex gap-4 justify-center mb-8">
          <Link
            to="/"
            className="bg-emerald-600 text-white px-6 py-3 rounded-full hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg"
          >
            <Home className="w-5 h-5" />
            الصفحة الرئيسية
          </Link>
          <Link
            to="/products"
            className="border-2 border-emerald-600 text-emerald-600 px-6 py-3 rounded-full hover:bg-emerald-600 hover:text-white transition-colors flex items-center gap-2"
          >
            <Search className="w-5 h-5" />
            تصفح المنتجات
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="font-semibold mb-3 text-gray-800">اقتراحات:</h3>
          <ul className="text-right space-y-2 text-gray-600">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              تأكد من كتابة الرابط بشكل صحيح
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              استخدم البحث للعثور على ما تريد
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              تصفح الأقسام المختلفة
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              تواصل معنا للمساعدة
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
