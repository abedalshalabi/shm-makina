import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Mail, MessageCircle, Phone } from "lucide-react";
import Header from "../components/Header";
import { authAPI, settingsAPI } from "../services/api";
import { useEffect } from "react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [contactResponse, headerResponse] = await Promise.all([
          settingsAPI.getSettings("contact").catch(() => ({ data: {} })),
          settingsAPI.getSettings("header").catch(() => ({ data: {} })),
        ]);

        setPhone(contactResponse?.data?.contact_cta_phone || contactResponse?.data?.contact_phone || headerResponse?.data?.header_phone || "");
        setWhatsapp(contactResponse?.data?.contact_cta_whatsapp || "");
      } catch (error) {
        console.error("Error loading forgot password settings:", error);
      }
    };

    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await authAPI.forgotPassword(email);

      if (response?.message && !response?.errors) {
        setMessage("إذا كان البريد موجودًا، فسيتم إرسال رابط استعادة كلمة المرور إليه.");
      } else {
        setError(response?.message || "تعذر إرسال رابط الاستعادة.");
      }
    } catch (submitError) {
      console.error("Forgot password error:", submitError);
      setError("حدث خطأ أثناء إرسال رابط الاستعادة.");
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">استعادة كلمة المرور</h1>
            <p className="text-gray-600">
              أدخل بريدك الإلكتروني وسنوضح لك طريقة المتابعة.
            </p>
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
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="أدخل بريدك الإلكتروني"
                  required
                />
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}
            </button>
          </form>

          <div className="mt-8 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <h2 className="font-semibold text-gray-800">بدائل سريعة</h2>
            {phone && (
              <a
                href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-emerald-600"
              >
                <Phone className="w-4 h-4" />
                <span>{phone}</span>
              </a>
            )}
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-emerald-600"
              >
                <MessageCircle className="w-4 h-4" />
                <span>التواصل عبر واتساب</span>
              </a>
            )}
            <Link to="/contact" className="flex items-center gap-2 text-sm text-gray-700 hover:text-emerald-600">
              <ArrowRight className="w-4 h-4" />
              <span>الانتقال إلى صفحة اتصل بنا</span>
            </Link>
          </div>

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

export default ForgotPassword;
