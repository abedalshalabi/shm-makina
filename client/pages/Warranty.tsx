import { Link } from "react-router-dom";
import { Shield, Clock, CheckCircle, Settings, Phone, FileText, AlertTriangle, Award, Wrench, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import Header from "../components/Header";
import SEO from "../components/SEO";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { settingsAPI } from "../services/api";

interface WarrantySettings {
  warranty_hero_title?: string;
  warranty_hero_description?: string;
  warranty_types?: Array<{
    title: string;
    duration: string;
    coverage: string;
    description: string;
    features?: string[];
  }>;
  warranty_periods?: Array<{
    category: string;
    items: string[];
    period: string;
  }>;
  warranty_process?: Array<{
    step: number;
    title: string;
    description: string;
  }>;
  warranty_conditions?: Array<{
    title: string;
    description: string;
    important?: boolean;
  }>;
  warranty_excluded?: string[];
  warranty_services?: Array<{
    title: string;
    description: string;
    availability: string;
  }>;
  warranty_notes?: Array<{
    title: string;
    description: string;
    type?: string;
  }>;
  warranty_cta_title?: string;
  warranty_cta_description?: string;
  warranty_cta_phone?: string;
}

const Warranty = () => {
  const [settings, setSettings] = useState<WarrantySettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.getSettings('warranty');
      if (response && response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error("Error loading warranty settings:", error);
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
  const warrantyTypes = settings.warranty_types || [];
  const warrantyIcons = [Shield, Award, Wrench];

  const warrantyPeriods = settings.warranty_periods || [];
  const periodColors = [
    "bg-emerald-100 text-emerald-800",
    "bg-green-100 text-green-800",
    "bg-purple-100 text-purple-800",
    "bg-yellow-100 text-yellow-800"
  ];

  const warrantyProcess = settings.warranty_process || [];
  const processIcons = [Phone, Settings, Clock, CheckCircle];

  const warrantyConditions = settings.warranty_conditions || [];
  const conditionIcons = [FileText, Shield, Zap, Clock];
  const conditionIconColors = ["text-emerald-600", "text-green-600", "text-yellow-600", "text-purple-600"];

  const excludedItems = settings.warranty_excluded || [];

  const services = settings.warranty_services || [];
  const serviceIcons = [Wrench, Settings, Phone, CheckCircle];
  const serviceIconColors = ["text-emerald-600", "text-green-600", "text-purple-600", "text-red-600"];

  const { siteName } = useSiteSettings();

  return (
    <div className="min-h-screen bg-gray-50 arabic">
      <SEO 
        title={`سياسة الضمان${siteName ? ` | ${siteName}` : ''}`}
        description={`تعرف على خدمات الضمان في${siteName ? ` ${siteName}` : ' متجرنا'}. نحن نضمن جودة منتجاتنا.`}
      />
      <Header 
        showSearch={true}
        showActions={true}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">{settings.warranty_hero_title || "سياسة الضمان"}</h1>
          <p className="text-xl text-emerald-200 max-w-3xl mx-auto leading-relaxed">
            {settings.warranty_hero_description || "نقدم ضمان شامل على جميع منتجاتنا لضمان راحة بالكم وثقتكم في مشترياتكم"}
          </p>
        </div>
      </section>

      {/* Warranty Types */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">أنواع الضمان</h2>
            <p className="text-xl text-gray-600">نقدم عدة أنواع من الضمان لحماية استثماركم</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {warrantyTypes.map((warranty, index) => {
              const IconComponent = warrantyIcons[index % warrantyIcons.length];
              const iconColors = ["text-emerald-600", "text-yellow-600", "text-green-600"];
              
              return (
              <div key={index} className="bg-gray-50 p-8 rounded-2xl hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-emerald-200">
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-4">
                      <IconComponent className={`w-8 h-8 ${iconColors[index % iconColors.length]}`} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{warranty.title}</h3>
                  <div className="text-lg text-emerald-600 font-semibold mb-1">{warranty.duration}</div>
                  <div className="text-sm text-green-600">{warranty.coverage}</div>
                </div>
                
                <p className="text-gray-600 text-center mb-6">{warranty.description}</p>
                
                  {warranty.features && warranty.features.length > 0 && (
                <div className="space-y-3">
                  {warranty.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
                  )}
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Warranty Periods */}
      <section className="py-20 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">فترات الضمان</h2>
            <p className="text-xl text-gray-600">فترات الضمان حسب نوع المنتج</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {warrantyPeriods.map((period, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-4 ${periodColors[index % periodColors.length]}`}>
                  {period.period}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">{period.category}</h3>
                {period.items && period.items.length > 0 && (
                <div className="space-y-2">
                  {period.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Warranty Process */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">إجراءات الضمان</h2>
            <p className="text-xl text-gray-600">خطوات بسيطة للحصول على خدمة الضمان</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {warrantyProcess.map((step, index) => {
              const IconComponent = processIcons[index % processIcons.length];
              
              return (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 text-gray-800 rounded-full flex items-center justify-center text-sm font-bold">
                      {step.step || index + 1}
                  </div>
                  {index < warrantyProcess.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gray-300 transform translate-x-4"></div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Warranty Conditions */}
      <section className="py-20 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">شروط الضمان</h2>
            <p className="text-xl text-gray-600">يجب استيفاء الشروط التالية للاستفادة من الضمان</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {warrantyConditions.map((condition, index) => {
              const IconComponent = conditionIcons[index % conditionIcons.length];
              const iconColor = conditionIconColors[index % conditionIconColors.length];
              
              return (
                <div key={index} className={`p-8 rounded-2xl ${condition.important !== false ? 'bg-red-50 border-2 border-red-200' : 'bg-white'} hover:shadow-lg transition-all duration-300`}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                      <IconComponent className={`w-6 h-6 ${iconColor}`} />
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
              );
            })}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">خدمات الضمان</h2>
            <p className="text-xl text-gray-600">نقدم خدمات متنوعة لضمان راحتكم</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => {
              const IconComponent = serviceIcons[index % serviceIcons.length];
              const iconColor = serviceIconColors[index % serviceIconColors.length];
              
              return (
              <div key={index} className="bg-gray-50 p-6 rounded-xl hover:shadow-lg transition-all duration-300">
                <div className="text-center mb-4">
                  <div className="flex justify-center mb-3">
                      <IconComponent className={`w-8 h-8 ${iconColor}`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{service.title}</h3>
                </div>
                <p className="text-gray-600 text-sm mb-3 text-center">{service.description}</p>
                  {service.availability && (
                <div className="text-center">
                  <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-semibold">
                    {service.availability}
                  </span>
                </div>
                  )}
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Excluded Items */}
      <section className="py-20 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">ما لا يشمله الضمان</h2>
            <p className="text-xl text-gray-600">الحالات التي لا يغطيها الضمان</p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="space-y-4">
                {excludedItems.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Important Notes */}
      {settings.warranty_notes && settings.warranty_notes.length > 0 && (
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">ملاحظات مهمة</h2>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-6">
              {settings.warranty_notes.map((note, index) => {
                const typeColors: { [key: string]: { bg: string; border: string; icon: string; title: string; text: string } } = {
                  blue: { bg: 'bg-emerald-50', border: 'border-emerald-500', icon: 'text-emerald-600', title: 'text-emerald-800', text: 'text-emerald-700' },
                  green: { bg: 'bg-green-50', border: 'border-green-500', icon: 'text-green-600', title: 'text-green-800', text: 'text-green-700' },
                  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-500', icon: 'text-yellow-600', title: 'text-yellow-800', text: 'text-yellow-700' },
                  purple: { bg: 'bg-purple-50', border: 'border-purple-500', icon: 'text-purple-600', title: 'text-purple-800', text: 'text-purple-700' },
                };
                const colors = typeColors[note.type || 'blue'] || typeColors.blue;
                const icons = [Shield, CheckCircle, Clock];
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
          <h2 className="text-3xl font-bold mb-4">{settings.warranty_cta_title || "تحتاج خدمة ضمان؟"}</h2>
          <p className="text-xl text-emerald-200 mb-8">
            {settings.warranty_cta_description || "تواصل معنا الآن للحصول على خدمة الضمان"}
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/contact"
              className="bg-white text-emerald-600 px-8 py-4 rounded-full hover:bg-gray-100 transition-colors font-semibold"
            >
              تواصل معنا
            </Link>
            {settings.warranty_cta_phone && (
            <a
                href={`tel:${settings.warranty_cta_phone}`}
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

export default Warranty;