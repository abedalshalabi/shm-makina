import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { getStorageUrl } from "../config/env";

const Login = () => {
  const navigate = useNavigate();
  const { siteName, headerLogo } = useSiteSettings();
  const logoUrl = getStorageUrl(headerLogo) || "/logo.webp";
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const success = await login(formData.email, formData.password);
      
      if (success) {
        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        setError('بيانات الدخول غير صحيحة، يرجى المحاولة مرة أخرى');
      }
    } catch (error) {
      setError('حدث خطأ في الاتصال بالخادم');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 arabic">
      <Header 
        showSearch={true}
        showActions={true}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="mb-6">
                <Link to="/" className="inline-block">
                  <img src={logoUrl} alt={siteName} className="h-16 w-auto mx-auto" onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }} />
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">تسجيل الدخول</h1>
              <p className="text-gray-600">{siteName ? `مرحباً بك مرة أخرى في ${siteName}` : "مرحباً بك مرة أخرى"}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="أدخل بريدك الإلكتروني"
                    required
                  />
                  <Mail className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pr-12 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="أدخل كلمة المرور"
                    required
                  />
                  <Lock className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                  <span className="mr-2 text-sm text-gray-600">تذكرني</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-700 transition-colors">
                  نسيت كلمة المرور؟
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري تسجيل الدخول...
                  </div>
                ) : (
                  "تسجيل الدخول"
                )}
              </button>
            </form>


            {/* Sign Up Link */}
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                ليس لديك حساب؟{" "}
                <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors">
                  إنشاء حساب جديد
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
