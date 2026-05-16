import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Clock, Send, MessageCircle, Headphones, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import Header from "../components/Header";
import SEO from "../components/SEO";
import { settingsAPI, contactAPI } from "../services/api";
import { useSiteSettings } from "../context/SiteSettingsContext";

interface ContactSettings {
  contact_hero_title?: string;
  contact_hero_description?: string;
  contact_phone?: string;
  contact_email?: string;
  contact_address?: string;
  contact_working_hours?: string;
  contact_services?: Array<{
    title: string;
    description: string;
    icon?: string;
  }>;
  contact_subjects?: string[];
  contact_map_address?: string;
  contact_cta_title?: string;
  contact_cta_description?: string;
  contact_cta_phone?: string;
  contact_cta_whatsapp?: string;
  contact_faq?: Array<{
    question: string;
    answer: string;
  }>;
  contact_info?: ContactInfoItem[];
}

interface ContactInfoItem {
  type: 'phone' | 'email' | 'address' | 'hours';
  title: string;
  details: string | string[];
}

const Contact = () => {
  const { siteName } = useSiteSettings();
  const [settings, setSettings] = useState<ContactSettings>({});
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.getSettings('contact');
      if (response && response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error("Error loading contact settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);
    
    try {
      const response = await contactAPI.submitContact({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        subject: formData.subject,
        message: formData.message,
      });

      if (response.message) {
        setSubmitSuccess(true);
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        });
        
        // Hide success message after 5 seconds
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 5000);
      }
    } catch (error: any) {
      console.error("Error submitting contact form:", error);
      setSubmitError(error.message || 'حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
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

  // Parse contact_info from JSON or use individual fields
  let contactInfo: Array<{
    icon: JSX.Element;
    title: string;
    details: string[];
    color: string;
  }> = [];

  if (settings.contact_info && Array.isArray(settings.contact_info)) {
    // Use contact_info from API
    contactInfo = settings.contact_info.map((item: ContactInfoItem) => {
      let icon: JSX.Element;
      let color: string;
      
      switch (item.type) {
        case 'phone':
          icon = <Phone className="w-6 h-6" />;
          color = "text-green-600";
          break;
        case 'email':
          icon = <Mail className="w-6 h-6" />;
          color = "text-emerald-600";
          break;
        case 'address':
          icon = <MapPin className="w-6 h-6" />;
          color = "text-red-600";
          break;
        case 'hours':
          icon = <Clock className="w-6 h-6" />;
          color = "text-purple-600";
          break;
        default:
          icon = <Phone className="w-6 h-6" />;
          color = "text-gray-600";
      }
      
      return {
        icon,
        title: item.title,
        details: Array.isArray(item.details) ? item.details : (item.details ? [item.details] : []),
        color
      };
    });
  } else {
    // Fallback to individual fields or defaults
    const phoneNumbers = settings.contact_phone 
      ? (Array.isArray(settings.contact_phone) ? settings.contact_phone : [settings.contact_phone])
      : [];

    const emailAddresses = settings.contact_email 
      ? (Array.isArray(settings.contact_email) ? settings.contact_email : [settings.contact_email])
      : [];

    const addressLines = settings.contact_address 
      ? (Array.isArray(settings.contact_address) ? settings.contact_address : [settings.contact_address])
      : [];

    const workingHours = settings.contact_working_hours 
      ? (Array.isArray(settings.contact_working_hours) ? settings.contact_working_hours : [settings.contact_working_hours])
      : [];

    contactInfo = [
      {
        icon: <Phone className="w-6 h-6" />,
        title: "الهاتف",
        details: phoneNumbers.length > 0 ? phoneNumbers : ["+970 599 000 000"],
        color: "text-green-600"
      },
      {
        icon: <Mail className="w-6 h-6" />,
        title: "البريد الإلكتروني",
        details: emailAddresses.length > 0 ? emailAddresses : ["info@ropita.com"],
        color: "text-emerald-600"
      },
      {
        icon: <MapPin className="w-6 h-6" />,
        title: "العنوان",
        details: addressLines.length > 0 ? addressLines : ["شارع الحرية، جنين"],
        color: "text-red-600"
      },
      {
        icon: <Clock className="w-6 h-6" />,
        title: "ساعات العمل",
        details: workingHours.length > 0 ? workingHours : ["السبت - الخميس: 9:00 ص - 10:00 م"],
        color: "text-purple-600"
      }
    ];
  }

  const services = settings.contact_services || [
    {
      icon: <Headphones className="w-8 h-8 text-emerald-600" />,
      title: "دعم فني 24/7",
      description: "فريق الدعم الفني متاح على مدار الساعة لمساعدتك"
    },
    {
      icon: <Shield className="w-8 h-8 text-green-600" />,
      title: "ضمان شامل",
      description: "نقدم ضمان شامل على جميع منتجاتنا وخدماتنا"
    },
    {
      icon: <MessageCircle className="w-8 h-8 text-purple-600" />,
      title: "استشارة مجانية",
      description: "احصل على استشارة مجانية من خبرائنا المتخصصين"
    }
  ];

  // Map icon strings to components
  const iconComponentMap: { [key: string]: any } = {
    headphones: Headphones,
    shield: Shield,
    message: MessageCircle,
  };

  const subjects = settings.contact_subjects || [
    "استفسار عام",
    "شكوى أو اقتراح",
    "دعم فني",
    "طلب عرض سعر",
    "خدمة ما بعد البيع",
    "شراكة تجارية",
    "أخرى"
  ];

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": siteName ? `اتصل بنا - ${siteName}` : "اتصل بنا",
    "description": settings.contact_hero_description || `تواصل معنا${siteName ? ` في ${siteName}` : ''}`,
    "url": `${siteUrl}/contact`,
    "mainEntity": {
      "@type": "Organization",
      "name": siteName || "",
      "telephone": settings.contact_phone || "",
      "email": settings.contact_email || "",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": settings.contact_address || "",
        "addressCountry": "PS"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 arabic">
      <SEO
        title={siteName ? `اتصل بنا - ${siteName}` : "اتصل بنا"}
        description={settings.contact_hero_description || `تواصل معنا${siteName ? ` في ${siteName}` : ''}. نحن هنا لمساعدتك في جميع استفساراتك`}
        keywords={`اتصل بنا, تواصل, دعم العملاء, خدمة العملاء${siteName ? `, ${siteName}` : ''}`}
        structuredData={structuredData}
      />
      <Header 
        showSearch={true}
        showActions={true}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">{settings.contact_hero_title || "تواصل معنا"}</h1>
          <p className="text-xl text-emerald-200 max-w-3xl mx-auto leading-relaxed">
            {settings.contact_hero_description || "نحن هنا لمساعدتك! تواصل معنا في أي وقت وسنكون سعداء للإجابة على استفساراتك وتقديم أفضل الخدمات"}
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-2xl hover:shadow-lg transition-all duration-300">
                <div className={`${info.color} mb-4`}>
                  {info.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">{info.title}</h3>
                <div className="space-y-1">
                  {Array.isArray(info.details) && info.details.length > 0 ? (
                    info.details.map((detail, idx) => (
                      <p key={idx} className="text-gray-600 text-sm">{detail}</p>
                    ))
                  ) : (
                    <p className="text-gray-600 text-sm">لا توجد معلومات متاحة</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="py-20 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">أرسل لنا رسالة</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                      الاسم الكامل *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      placeholder="أدخل اسمك الكامل"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      البريد الإلكتروني *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      placeholder="example@email.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                      رقم الهاتف
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      placeholder="+966 50 123 4567"
                    />
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                      موضوع الرسالة *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    >
                      <option value="">اختر موضوع الرسالة</option>
                      {subjects.map((subject, index) => (
                        <option key={index} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                    الرسالة *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                    placeholder="اكتب رسالتك هنا..."
                  ></textarea>
                </div>

                {/* Success Message */}
                {submitSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                    <p className="font-semibold">تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.</p>
                  </div>
                )}

                {/* Error Message */}
                {submitError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                    <p className="font-semibold">{submitError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 text-white py-4 px-6 rounded-lg hover:bg-emerald-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      إرسال الرسالة
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Map and Additional Info */}
            <div className="space-y-8">
              {/* Map Placeholder */}
              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">موقعنا</h3>
                  <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-2" />
                    <p>خريطة الموقع</p>
                    <p className="text-sm">
                      {(settings.contact_map_address) || 
                       (settings.contact_info?.find((item: ContactInfoItem) => item.type === 'address')?.details) && 
                       (Array.isArray(settings.contact_info?.find((item: ContactInfoItem) => item.type === 'address')?.details) 
                        ? (settings.contact_info?.find((item: ContactInfoItem) => item.type === 'address')?.details as string[]).join(", ") 
                        : settings.contact_info?.find((item: ContactInfoItem) => item.type === 'address')?.details) ||
                       "العنوان"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Services */}
              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">خدماتنا</h3>
                <div className="space-y-4">
                  {services.map((service, index) => {
                    const IconComponent = service.icon 
                      ? (typeof service.icon === 'string' && iconComponentMap[service.icon.toLowerCase()] 
                          ? iconComponentMap[service.icon.toLowerCase()] 
                          : Headphones)
                      : Headphones;
                    const iconElement = <IconComponent className="w-8 h-8 text-emerald-600" />;
                    
                    return (
                      <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          {iconElement}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-1">{service.title}</h4>
                          <p className="text-gray-600 text-sm">{service.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      {settings.contact_faq && settings.contact_faq.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">الأسئلة الشائعة</h2>
              <p className="text-xl text-gray-600">إجابات على أكثر الأسئلة شيوعاً</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {settings.contact_faq.map((faq, index) => (
                <div key={index} className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-bold text-gray-800 mb-2">{faq.question}</h3>
                  <p className="text-gray-600 text-sm">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{settings.contact_cta_title || "هل تحتاج مساعدة فورية؟"}</h2>
          <p className="text-xl text-emerald-200 mb-8">
            {settings.contact_cta_description || "تواصل معنا الآن عبر الهاتف أو الواتساب للحصول على مساعدة فورية"}
          </p>
          <div className="flex gap-4 justify-center">
            {settings.contact_cta_phone && (
              <a
                href={`tel:${settings.contact_cta_phone}`}
                className="bg-white text-emerald-600 px-8 py-4 rounded-full hover:bg-gray-100 transition-colors font-semibold flex items-center gap-2"
              >
                <Phone className="w-5 h-5" />
                اتصل الآن
              </a>
            )}
            {settings.contact_cta_whatsapp && (
              <a
                href={`https://wa.me/${settings.contact_cta_whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-white text-white px-8 py-4 rounded-full hover:bg-white hover:text-emerald-600 transition-colors font-semibold flex items-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                واتساب
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;