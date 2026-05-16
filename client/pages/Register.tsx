import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Home } from "lucide-react";
import Header from "../components/Header";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useAuth } from "../context/AuthContext";
import { settingsAPI } from "../services/api";
import { getStorageUrl } from "../config/env";

interface City {
  id: number;
  name: string;
}

const Register = () => {
  const navigate = useNavigate();
  const { siteName, headerLogo } = useSiteSettings();
  const logoUrl = getStorageUrl(headerLogo) || "/logo.webp";
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    district: "",
    street: "",
    building: "",
    password: "",
    password_confirmation: ""
  });
  const [cities, setCities] = useState<City[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const response = await settingsAPI.getCities();
      if (response && response.data) {
        setCities(response.data);
      }
    } catch (error) {
      console.error("Error loading cities:", error);
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      newErrors.name = "الاسم بالكامل مطلوب";
    }

    if (!formData.email.trim()) {
      newErrors.email = "البريد الإلكتروني مطلوب";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "البريد الإلكتروني غير صحيح";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "رقم الهاتف مطلوب";
    }

    if (!formData.city) {
      newErrors.city = "يرجى اختيار المدينة";
    }

    if (!formData.district.trim()) {
      newErrors.district = "اسم المنطقة/الحي مطلوب";
    }

    if (!formData.password) {
      newErrors.password = "كلمة المرور مطلوبة";
    } else if (formData.password.length < 8) {
      newErrors.password = "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
    }

    if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = "كلمة المرور غير متطابقة";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await register(formData);
      if (success) {
        navigate('/dashboard');
      } else {
        setErrors({ general: "فشل إنشاء الحساب، يرجى التأكد من البيانات والمحاولة مرة أخرى" });
      }
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.errors) {
        // Map backend errors to frontend fields
        const backendErrors: any = {};
        Object.keys(error.response.data.errors).forEach(key => {
          backendErrors[key] = error.response.data.errors[key][0];
        });
        setErrors(backendErrors);
      } else {
        setErrors({ general: "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى لاحقاً" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ""
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 arabic">
      <Header 
        showSearch={true}
        showActions={true}
      />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100">
            <div className="bg-emerald-600 p-8 text-center text-white">
              <div className="mb-6">
                <Link to="/" className="inline-block bg-white/10 rounded-2xl p-4 border border-white/20 backdrop-blur-sm shadow-xl">
                  <img src={logoUrl} alt={siteName} className="h-16 w-auto mx-auto brightness-0 invert" onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }} />
                </Link>
              </div>
              <h1 className="text-3xl font-bold mb-2">إنشاء حساب جديد</h1>
              <p className="text-emerald-100">{siteName ? `انضم إلى عائلة ${siteName}` : "مرحباً بك في متجرنا"}</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {errors.general && (
                <div className="p-4 bg-red-50 border-r-4 border-red-500 text-red-700 text-sm">
                  {errors.general}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info Section */}
                <div className="space-y-4 md:col-span-2">
                  <h2 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                    <User className="w-5 h-5 text-emerald-600" />
                    المعلومات الشخصية
                  </h2>
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-1.5">الاسم بالكامل</label>
                  <div className="relative">
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-gray-50'}`}
                      placeholder="أدخل اسمك الكامل"
                    />
                  </div>
                  {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-1.5">البريد الإلكتروني</label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-gray-50'}`}
                      placeholder="user@example.com"
                    />
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-bold text-gray-700 mb-1.5">رقم الهاتف</label>
                  <div className="relative">
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-gray-50'}`}
                      placeholder="05xxxxxxx"
                    />
                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                  {errors.phone && <p className="text-red-500 text-xs mt-1 font-medium">{errors.phone}</p>}
                </div>

                {/* Address Section */}
                <div className="space-y-4 md:col-span-2 pt-4">
                  <h2 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    معلومات العنوان (لحساب التوصيل)
                  </h2>
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-bold text-gray-700 mb-1.5">المدينة</label>
                  <div className="relative">
                    <select
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none ${errors.city ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-gray-50'}`}
                    >
                      <option value="">اختر مدينتك</option>
                      {cities.map(city => (
                        <option key={city.id} value={city.name}>{city.name}</option>
                      ))}
                    </select>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                  {errors.city && <p className="text-red-500 text-xs mt-1 font-medium">{errors.city}</p>}
                </div>

                <div>
                  <label htmlFor="district" className="block text-sm font-bold text-gray-700 mb-1.5">الحي / المنطقة</label>
                  <input
                    type="text"
                    id="district"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${errors.district ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-gray-50'}`}
                    placeholder="مثال: حي الروضة"
                  />
                  {errors.district && <p className="text-red-500 text-xs mt-1 font-medium">{errors.district}</p>}
                </div>

                <div>
                  <label htmlFor="street" className="block text-sm font-bold text-gray-700 mb-1.5">الشارع (اختياري)</label>
                  <input
                    type="text"
                    id="street"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 rounded-xl border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                    placeholder="اسم الشارع"
                  />
                </div>

                <div>
                  <label htmlFor="building" className="block text-sm font-bold text-gray-700 mb-1.5">رقم البناء / الشقة (اختياري)</label>
                  <div className="relative">
                    <input
                      type="text"
                      id="building"
                      name="building"
                      value={formData.building}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 rounded-xl border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                      placeholder="رقم البناء"
                    />
                    <Home className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 md:hidden" />
                  </div>
                </div>

                {/* Password Section */}
                <div className="space-y-4 md:col-span-2 pt-4">
                  <h2 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-emerald-600" />
                    الأمان
                  </h2>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-1.5">كلمة المرور</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pr-12 pl-12 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-gray-50'}`}
                      placeholder="8 أحرف كحد أدنى"
                    />
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password}</p>}
                </div>

                <div>
                  <label htmlFor="password_confirmation" className="block text-sm font-bold text-gray-700 mb-1.5">تأكيد كلمة المرور</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="password_confirmation"
                      name="password_confirmation"
                      value={formData.password_confirmation}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pr-12 pl-12 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${errors.password_confirmation ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-gray-50'}`}
                      placeholder="أعد إدخال كلمة المرور"
                    />
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password_confirmation && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password_confirmation}</p>}
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                <input 
                  type="checkbox" 
                  id="terms" 
                  className="mt-1.5 w-4 h-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500" 
                  required
                />
                <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed font-medium">
                  أوافق على{" "}
                  <Link to="/terms" className="text-emerald-700 hover:underline font-bold">الشروط والأحكام</Link>
                  {" "}و{" "}
                  <Link to="/privacy" className="text-emerald-700 hover:underline font-bold">سياسة الخصوصية</Link>
                  {" "}للموقع لخدمتكم بشكل أفضل.
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-lg shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري إنشاء الحساب...
                  </div>
                ) : (
                  "إنشاء الحساب والانضمام"
                )}
              </button>
            </form>

            <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
              <p className="text-gray-600 font-medium">
                لديك حساب بالفعل؟{" "}
                <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors">
                  تسجيل الدخول الآن
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;