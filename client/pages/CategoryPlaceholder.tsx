import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import Header from "../components/Header";

interface CategoryPlaceholderProps {
  categoryName: string;
  categoryIcon: string;
}

const CategoryPlaceholder = ({ categoryName, categoryIcon }: CategoryPlaceholderProps) => {
  return (
    <div className="min-h-screen bg-gray-50 arabic">
      <Header 
        showSearch={true}
        showActions={true}
      />

      {/* Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-8xl mb-6 animate-bounce">{categoryIcon}</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{categoryName}</h1>
          <p className="text-xl text-gray-600 mb-8">
            هذا القسم قيد التطوير. سيتم إضافة محتوى {categoryName} قريباً.
          </p>
          
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">ما يمكنك فعله الآن:</h2>
            <div className="space-y-4 text-right">
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span>تصفح الصفحة الرئيسية لرؤية المنتجات المميزة</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span>استخدم البحث للعثور على منتجات محددة</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span>تواصل معنا للاستفسار عن منتجات معينة</span>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex gap-4 justify-center">
            <Link
              to="/"
              className="bg-emerald-600 text-white px-8 py-4 rounded-full hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg"
            >
              <Home className="w-5 h-5" />
              الصفحة الرئيسية
            </Link>
            <Link
              to="/contact"
              className="border-2 border-emerald-600 text-emerald-600 px-8 py-4 rounded-full hover:bg-emerald-600 hover:text-white transition-colors"
            >
              تواصل معنا
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryPlaceholder;
