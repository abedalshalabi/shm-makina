import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import Header from "../components/Header";
import { authAPI } from "../services/api";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const email = useMemo(() => searchParams.get("email") || "", [searchParams]);

  const [formData, setFormData] = useState({
    password: "",
    password_confirmation: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token || !email) {
      setError("رابط إعادة التعيين غير صالح أو ناقص.");
      return;
    }

    if (formData.password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      setError("تأكيد كلمة المرور غير متطابق.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authAPI.resetPassword({
        token,
        email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      });

      if (response?.message && !response?.errors) {
        setMessage("تم تغيير كلمة المرور بنجاح. سيتم تحويلك إلى صفحة تسجيل الدخول.");
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        setError(response?.message || "تعذر إعادة تعيين كلمة المرور.");
      }
    } catch (submitError) {
      console.error("Reset password error:", submitError);
      setError("حدث خطأ أثناء إعادة تعيين كلمة المرور.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 arabic">
      <Header showSearch={true} showActions={true} />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">تعيين كلمة مرور جديدة</h1>
            <p className="text-gray-600">أدخل كلمة المرور الجديدة لهذا الحساب.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {message && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  readOnly
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                كلمة المرور الجديدة
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 pr-12 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  required
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-2">
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <input
                  id="password_confirmation"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.password_confirmation}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password_confirmation: e.target.value }))}
                  className="w-full px-4 py-3 pr-12 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  required
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "جاري الحفظ..." : "حفظ كلمة المرور الجديدة"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-emerald-600 hover:text-emerald-700 transition-colors">
              العودة إلى تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
