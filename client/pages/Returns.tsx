import { Link } from "react-router-dom";
import { RotateCcw, Clock, CheckCircle, XCircle, AlertTriangle, Package, Shield, FileText, Phone } from "lucide-react";
import { useState, useEffect } from "react";
import Header from "../components/Header";
import SEO from "../components/SEO";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { settingsAPI } from "../services/api";

interface ReturnsSettings {
  returns_hero_title?: string;
  returns_hero_description?: string;
  returns_policy?: Array<{
    title: string;
    description: string;
    eligible?: boolean;
  }>;
  returns_reasons?: Array<{
    title: string;
    description: string;
    eligible?: boolean;
  }>;
  returns_steps?: Array<{
    step: number;
    title: string;
    description: string;
  }>;
  returns_conditions?: Array<{
    title: string;
    description: string;
    important?: boolean;
  }>;
  returns_non_returnable?: string[];
  returns_refund_methods?: Array<{
    method: string;
    duration: string;
    description: string;
  }>;
  returns_notes?: Array<{
    title: string;
    description: string;
    type?: string;
  }>;
  returns_cta_title?: string;
  returns_cta_description?: string;
  returns_cta_phone?: string;
}

const Returns = () => {
  const [settings, setSettings] = useState<ReturnsSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.getSettings('returns');
      console.log('Returns settings response:', response);
      if (response && response.data) {
        console.log('Returns settings data:', response.data);
        setSettings(response.data);
      }
    } catch (error) {
      console.error("Error loading returns settings:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 arabic">
        <Header showSearch={true} showActions={true} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }
  // Use returns_policy if available, otherwise use returns_reasons
  const returnReasons = (settings.returns_policy || settings.returns_reasons) || [
    {
      title: "المنتج معيب أو تالف",
      description: "إذا وصل المنتج تالفاً أو به عيب تصنيع",
      eligible: true
    },
    {
      title: "عدم الرضا عن المنتج",
      description: "إذا لم يلبي المنتج توقعاتك",
      eligible: true
    },
    {
      title: "المنتج مختلف عن الوصف",
      description: "إذا كان المنتج مختلفاً عن الوصف في الموقع",
      eligible: true
    },
    {
      title: "خطأ في الطلب",
      description: "إذا تم إرسال منتج خاطئ",
      eligible: true
    }
  ];

  const iconMap = [
    <Package className="w-6 h-6 text-emerald-600" />,
    <RotateCcw className="w-6 h-6 text-green-600" />,
    <XCircle className="w-6 h-6 text-red-600" />,
    <AlertTriangle className="w-6 h-6 text-yellow-600" />
  ];

  const returnSteps = settings.returns_steps || [
    {
      step: 1,
      title: "تقديم طلب الإرجاع",
      description: "تواصل معنا خلال 14 يوم من تاريخ الاستلام"
    },
    {
      step: 2,
      title: "مراجعة الطلب",
      description: "نراجع طلبك ونرسل تعليمات الإرجاع"
    },
    {
      step: 3,
      title: "إرسال المنتج",
      description: "أرسل المنتج في العبوة الأصلية"
    },
    {
      step: 4,
      title: "الفحص والاسترداد",
      description: "نفحص المنتج ونسترد المبلغ خلال 7 أيام"
    }
  ];

  const stepIcons = [
    <Phone className="w-6 h-6" />,
    <FileText className="w-6 h-6" />,
    <Package className="w-6 h-6" />,
    <CheckCircle className="w-6 h-6" />
  ];

  const conditions = settings.returns_conditions || [
    {
      title: "المدة الزمنية",
      description: "يجب تقديم طلب الإرجاع خلال 14 يوم من تاريخ الاستلام",
      important: true
    },
    {
      title: "حالة المنتج",
      description: "يجب أن يكون المنتج في حالته الأصلية وغير مستخدم",
      important: true
    },
    {
      title: "الفاتورة الأصلية",
      description: "يجب الاحتفاظ بالفاتورة الأصلية أو إيصال الشراء",
      important: true
    },
    {
      title: "العبوة الأصلية",
      description: "يجب إرجاع المنتج في عبوته الأصلية مع جميع الملحقات",
      important: true
    }
  ];

  const conditionIcons = [
    <Clock className="w-6 h-6 text-emerald-600" />,
    <Package className="w-6 h-6 text-green-600" />,
    <FileText className="w-6 h-6 text-purple-600" />,
    <Shield className="w-6 h-6 text-red-600" />
  ];

  const nonReturnableItems = settings.returns_non_returnable || [
    "المنتجات المخصصة أو المصنوعة حسب الطلب",
    "المنتجات الصحية والشخصية",
    "البرمجيات والألعاب الرقمية المفتوحة",
    "المنتجات القابلة للتلف أو سريعة الانتهاء",
    "المنتجات المستخدمة أو التالفة بسبب سوء الاستخدام"
  ];

  const refundMethods = settings.returns_refund_methods || [
    {
      method: "البطاقة الائتمانية",
      duration: "3-5 أيام عمل",
      description: "يتم الاسترداد إلى نفس البطاقة المستخدمة في الدفع"
    },
    {
      method: "التحويل البنكي",
      duration: "5-7 أيام عمل",
      description: "يتم التحويل إلى الحساب البنكي المحدد"
    },
    {
      method: "المحفظة الإلكترونية",
      duration: "1-3 أيام عمل",
      description: "يتم الاسترداد إلى المحفظة الإلكترونية المستخدمة"
    },
    {
      method: "رصيد المتجر",
      duration: "فوري",
      description: "يمكن استخدامه في أي عملية شراء مستقبلية"
    }
  ];

  const { siteName } = useSiteSettings();

  return (
    <div className="min-h-screen bg-gray-50 arabic">
      <SEO 
        title={`سياسة الإرجاع والاستبدال${siteName ? ` | ${siteName}` : ''}`}
        description={`تعرف على سياسة الإرجاع والاستبدال في${siteName ? ` ${siteName}` : ' متجرنا'}. نحن نضمن رضاكم التام.`}
      />
      <Header 
        showSearch={true}
        showActions={true}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">{settings.returns_hero_title || "سياسة الإرجاع والاستبدال"}</h1>
          <p className="text-xl text-emerald-200 max-w-3xl mx-auto leading-relaxed">
            {settings.returns_hero_description || "نحن ملتزمون برضاكم التام. إذا لم تكونوا راضين عن مشترياتكم، يمكنكم إرجاعها أو استبدالها بسهولة"}
          </p>
        </div>
      </section>

      {/* Return Reasons */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">أسباب الإرجاع المقبولة</h2>
            <p className="text-xl text-gray-600">نقبل الإرجاع في الحالات التالية</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {returnReasons.map((reason, index) => (
              <div key={index} className="bg-gray-50 p-8 rounded-2xl hover:shadow-lg transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {iconMap[index % iconMap.length]}
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold text-gray-800 mb-3">{reason.title}</h3>
                    <p className="text-gray-600 mb-4">{reason.description}</p>
                    {(reason.eligible !== false) && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-green-600 font-semibold">مؤهل للإرجاع</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Return Process */}
      <section className="py-20 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">خطوات الإرجاع</h2>
            <p className="text-xl text-gray-600">عملية بسيطة وسريعة</p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {returnSteps.map((step, index) => (
              <div
                key={index}
                className="relative rounded-2xl border border-emerald-100 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative mb-5">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md">
                    {stepIcons[index % stepIcons.length]}
                  </div>
                  <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-sm font-bold text-gray-800">
                    {step.step || index + 1}
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-800">{step.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Return Conditions */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">شروط الإرجاع</h2>
            <p className="text-xl text-gray-600">يجب استيفاء الشروط التالية</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {conditions.map((condition, index) => (
              <div key={index} className={`p-8 rounded-2xl ${condition.important !== false ? 'bg-red-50 border-2 border-red-200' : 'bg-gray-50'} hover:shadow-lg transition-all duration-300`}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {conditionIcons[index % conditionIcons.length]}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-3">{condition.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{condition.description}</p>
                    {(condition.important !== false) && (
                      <div className="mt-3 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <span className="text-red-600 font-semibold text-sm">شرط إجباري</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Non-Returnable Items */}
      <section className="py-20 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">المنتجات غير القابلة للإرجاع</h2>
            <p className="text-xl text-gray-600">لأسباب صحية وأمنية، لا يمكن إرجاع المنتجات التالية</p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="space-y-4">
                {nonReturnableItems.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                    <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Refund Methods */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">طرق الاسترداد</h2>
            <p className="text-xl text-gray-600">نقدم عدة خيارات لاسترداد أموالكم</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {refundMethods.map((method, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-xl hover:shadow-lg transition-all duration-300">
                <h3 className="text-lg font-bold text-gray-800 mb-3">{method.method}</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-semibold text-emerald-600">{method.duration}</span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{method.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Important Notes */}
      {settings.returns_notes && settings.returns_notes.length > 0 && (
        <section className="py-20 bg-gray-100">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">ملاحظات مهمة</h2>
            </div>
            
            <div className="max-w-4xl mx-auto space-y-6">
              {settings.returns_notes.map((note, index) => {
                const typeColors: { [key: string]: { bg: string; border: string; icon: string; title: string; text: string } } = {
                  blue: { bg: 'bg-emerald-50', border: 'border-emerald-500', icon: 'text-emerald-600', title: 'text-emerald-800', text: 'text-emerald-700' },
                  green: { bg: 'bg-green-50', border: 'border-green-500', icon: 'text-green-600', title: 'text-green-800', text: 'text-green-700' },
                  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-500', icon: 'text-yellow-600', title: 'text-yellow-800', text: 'text-yellow-700' },
                  purple: { bg: 'bg-purple-50', border: 'border-purple-500', icon: 'text-purple-600', title: 'text-purple-800', text: 'text-purple-700' },
                };
                const colors = typeColors[note.type || 'blue'] || typeColors.blue;
                const icons = [CheckCircle, Shield, AlertTriangle, Package];
                const IconComponent = icons[index % icons.length];
                
                return (
                  <div key={index} className={`${colors.bg} border-l-4 ${colors.border} p-6 rounded-lg`}>
                    <div className="flex items-start gap-3">
                      <IconComponent className={`w-6 h-6 ${colors.icon} flex-shrink-0 mt-1`} />
                      <div>
                        <h3 className={`font-bold ${colors.title} mb-2`}>{note.title}</h3>
                        <p className={colors.text}>{note.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section className="py-16 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{settings.returns_cta_title || "تحتاج مساعدة في الإرجاع؟"}</h2>
          <p className="text-xl text-emerald-200 mb-8">
            {settings.returns_cta_description || "فريق خدمة العملاء جاهز لمساعدتك في عملية الإرجاع"}
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/contact"
              className="bg-white text-emerald-600 px-8 py-4 rounded-full hover:bg-gray-100 transition-colors font-semibold"
            >
              تواصل معنا
            </Link>
            {settings.returns_cta_phone && (
              <a
                href={`tel:${settings.returns_cta_phone}`}
                className="border-2 border-white text-white px-8 py-4 rounded-full hover:bg-white hover:text-emerald-600 transition-colors font-semibold"
              >
                اتصل الآن
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Returns;
