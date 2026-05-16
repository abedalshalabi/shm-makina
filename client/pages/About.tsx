import { Link } from "react-router-dom";
import { Heart, Mail, MapPin, Phone, Shield, Target, Zap } from "lucide-react";
import Header from "../components/Header";
import SEO from "../components/SEO";
import { useEffect, useState } from "react";
import { categoriesAPI, settingsAPI } from "../services/api";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { getStorageUrl } from "../config/env";

interface AboutSettings {
  about_hero_title?: string;
  about_hero_description?: string;
  about_story_content?: string | {
    title?: string;
    description?: string;
    image?: string;
  };
  about_story_image?: string;
  about_values?: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
}

const iconMap: Record<string, any> = {
  target: Target,
  heart: Heart,
  zap: Zap,
  shield: Shield,
};

const About = () => {
  const { siteName, headerLogo, siteSettings } = useSiteSettings();
  const [settings, setSettings] = useState<AboutSettings>({});
  const [footerSettings, setFooterSettings] = useState<any>({});
  const [contactSettings, setContactSettings] = useState<any>({});
  const [socialSettings, setSocialSettings] = useState<any>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [aboutResponse, footerResponse, contactResponse, socialResponse, categoriesResponse] = await Promise.all([
          settingsAPI.getSettings("about"),
          settingsAPI.getSettings("footer"),
          settingsAPI.getSettings("contact"),
          settingsAPI.getSettings("social"),
          categoriesAPI.getCategories(),
        ]);

        setSettings(aboutResponse?.data || {});
        setFooterSettings(footerResponse?.data || {});
        setContactSettings(contactResponse?.data || {});
        setSocialSettings(socialResponse?.data || {});
        setCategories(categoriesResponse?.data || []);
      } catch (error) {
        console.error("Error loading about settings:", error);
        setSettings({
          about_hero_title: "من نحن",
          about_hero_description: `نحن وجهة متخصصة في بيع ملابس الأطفال بجودة عالية وتصاميم عصرية${siteName ? ` في ${siteName}` : ""}`,
          about_story_content: {
            title: "قصتنا",
            description: `بدأنا بهدف بسيط: توفير ملابس أطفال جميلة، عملية، ومريحة للأهالي والأطفال مع تجربة شراء موثوقة وسهلة${siteName ? ` في ${siteName}` : ""}.`,
            image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&h=600&fit=crop",
          },
          about_values: [
            { title: "جودة موثوقة", description: "نختار منتجاتنا بعناية لتناسب الأطفال وتلبي توقعات الأهل.", icon: "target" },
            { title: "راحة الطفل", description: "نهتم بالخامات والتفاصيل التي تمنح الطفل راحة طوال اليوم.", icon: "heart" },
            { title: "تجديد مستمر", description: "نواكب الموديلات الجديدة ونضيف تشكيلات مناسبة لكل موسم.", icon: "zap" },
            { title: "ثقة وأمان", description: "نحرص على تجربة شراء واضحة وآمنة وخدمة تليق بعملائنا.", icon: "shield" },
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [siteName]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 arabic">
        <Header showSearch={true} showActions={true} />
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600" />
        </div>
      </div>
    );
  }

  const values = settings.about_values || [];

  const defaultStory = {
    title: "قصتنا",
    description: "نقدم ملابس أطفال مختارة بعناية مع اهتمام حقيقي بالجودة والراحة والتفاصيل.",
    image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&h=600&fit=crop",
  };

  let storyTitle = defaultStory.title;
  let storyDescription = defaultStory.description;
  let storyImage = settings.about_story_image || defaultStory.image;

  if (typeof settings.about_story_content === "string") {
    storyDescription = settings.about_story_content || defaultStory.description;
  } else if (typeof settings.about_story_content === "object" && settings.about_story_content) {
    storyTitle = settings.about_story_content.title || defaultStory.title;
    storyDescription = settings.about_story_content.description || defaultStory.description;
    storyImage = settings.about_story_content.image || storyImage;
  }

  const story = {
    title: storyTitle,
    description: storyDescription || "",
    image: storyImage || defaultStory.image,
  };
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const generalSettings = siteSettings || {};
  const activeCategories = categories.filter((cat: any) => !cat.parent_id && cat.is_active !== 0 && cat.is_active !== false);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: siteName ? `من نحن - ${siteName}` : "من نحن",
    description: settings.about_hero_description || `تعرف على قصتنا${siteName ? ` في ${siteName}` : ""} وقيمنا ومبادئنا`,
    url: `${siteUrl}/about`,
  };

  return (
    <div className="min-h-screen bg-gray-50 arabic">
      <SEO
        title={siteName ? `من نحن - ${siteName}` : "من نحن"}
        description={settings.about_hero_description || `تعرف على قصتنا${siteName ? ` في ${siteName}` : ""} ورؤيتنا وقيمنا`}
        keywords={`من نحن, قصة المتجر, قيم المتجر${siteName ? `, ${siteName}` : ""}`}
        structuredData={structuredData}
      />

      <Header showSearch={true} showActions={true} />

      <section className="bg-gradient-to-r from-emerald-900 to-teal-900 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-6 text-5xl font-bold">{settings.about_hero_title || "من نحن"}</h1>
          <p className="mx-auto max-w-3xl text-xl leading-relaxed text-emerald-200">
            {settings.about_hero_description || "نحن متجر متخصص في بيع ملابس الأطفال بعناية وجودة عالية"}
          </p>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 text-4xl font-bold text-gray-800">{story.title || "قصتنا"}</h2>
              <div
                className="mb-6 text-lg leading-relaxed text-gray-600 space-y-4"
                dangerouslySetInnerHTML={{ __html: story.description }}
              />
              {!settings.about_story_content && (
                <p className="text-lg leading-relaxed text-gray-600">
                  نؤمن أن اختيار ملابس الأطفال لا يتعلق بالشكل فقط، بل بالراحة، الجودة، وسهولة الحركة. لذلك نعمل على تقديم خيارات مناسبة لكل يوم ولكل مناسبة.
                </p>
              )}
            </div>
            <div>
              <img src={getStorageUrl(story.image)} alt="قصتنا" className="w-full rounded-lg shadow-lg" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-4xl font-bold text-gray-800">قيمنا ومبادئنا</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => {
              const IconComponent = iconMap[value.icon] || Target;
              return (
                <div key={index} className="rounded-lg bg-white p-6 text-center shadow-sm">
                  <div className="mb-4 flex justify-center">
                    <IconComponent className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-800">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-gray-50 pb-8 pt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4 md:gap-12">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <img src={getStorageUrl(headerLogo) || "/logo.webp"} alt={siteName || "Ropita"} className="h-8 w-auto" />
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{siteName || generalSettings.site_name || ""}</h3>
                  <p className="text-xs font-medium text-gray-500">{generalSettings.site_tagline || ""}</p>
                </div>
              </div>
              <p className="mb-6 text-sm font-medium leading-relaxed text-gray-600">{footerSettings.footer_about_text || ""}</p>
              <div className="flex flex-wrap gap-3">
                {socialSettings.social_media_facebook && (
                  <a href={socialSettings.social_media_facebook} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition-all hover:bg-emerald-600 hover:text-white" aria-label="facebook">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M13.5 9H16l.5-3h-3V4.5c0-.86.22-1.5 1.5-1.5H17V0h-2.5C11.57 0 10 1.57 10 4.5V6H8v3h2v9h3.5V9z" /></svg>
                  </a>
                )}
                {socialSettings.social_media_instagram && (
                  <a href={socialSettings.social_media_instagram} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition-all hover:bg-pink-600 hover:text-white" aria-label="instagram">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm10 2c1.654 0 3 1.346 3 3v10c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3V7c0-1.654 1.346-3 3-3h10zm-5 3a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zm6.5-.25a1 1 0 100 2 1 1 0 000-2z" /></svg>
                  </a>
                )}
                {socialSettings.social_media_youtube && (
                  <a href={socialSettings.social_media_youtube} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition-all hover:bg-red-600 hover:text-white" aria-label="youtube">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                  </a>
                )}
              </div>
            </div>

            <div>
              <h3 className="relative mb-6 inline-block text-lg font-bold text-gray-800 after:absolute after:-bottom-2 after:right-0 after:h-1 after:w-1/2 after:rounded-full after:bg-emerald-500">روابط سريعة</h3>
              <ul className="space-y-3 font-medium text-gray-600">
                <li><Link to="/about" className="inline-block transition-all hover:-translate-x-1 hover:text-emerald-600">من نحن</Link></li>
                <li><Link to="/contact" className="inline-block transition-all hover:-translate-x-1 hover:text-emerald-600">اتصل بنا</Link></li>
                <li><Link to="/shipping" className="inline-block transition-all hover:-translate-x-1 hover:text-emerald-600">الشحن والتوصيل</Link></li>
                <li><Link to="/returns" className="inline-block transition-all hover:-translate-x-1 hover:text-emerald-600">الإرجاع والاستبدال</Link></li>
                <li><Link to="/warranty" className="inline-block transition-all hover:-translate-x-1 hover:text-emerald-600">الضمان</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="relative mb-6 inline-block text-lg font-bold text-gray-800 after:absolute after:-bottom-2 after:right-0 after:h-1 after:w-1/2 after:rounded-full after:bg-emerald-500">الفئات</h3>
              <ul className="space-y-3 font-medium text-gray-600">
                {activeCategories.slice(0, 5).map((category: any) => (
                  <li key={category.id}>
                    <Link to={`/products?category_id=${category.id}`} className="inline-block transition-all hover:-translate-x-1 hover:text-emerald-600">
                      {category.name}
                    </Link>
                  </li>
                ))}
                {activeCategories.length === 0 && (
                  <>
                    <li><Link to="/products" className="inline-block transition-all hover:-translate-x-1 hover:text-emerald-600">جميع المنتجات</Link></li>
                    <li><Link to="/categories" className="inline-block transition-all hover:-translate-x-1 hover:text-emerald-600">جميع الفئات</Link></li>
                  </>
                )}
              </ul>
            </div>

            <div>
              <h3 className="relative mb-6 inline-block text-lg font-bold text-gray-800 after:absolute after:-bottom-2 after:right-0 after:h-1 after:w-1/2 after:rounded-full after:bg-emerald-500">تواصل معنا</h3>
              <div className="space-y-4 font-medium text-gray-600">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-emerald-600" />
                  <span>
                    {(contactSettings.contact_info?.find((item: any) => item.type === "address")?.details &&
                      (Array.isArray(contactSettings.contact_info?.find((item: any) => item.type === "address")?.details)
                        ? contactSettings.contact_info?.find((item: any) => item.type === "address")?.details.join(", ")
                        : contactSettings.contact_info?.find((item: any) => item.type === "address")?.details)) || "فلسطين"}
                  </span>
                </div>
                {socialSettings.header_phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-5 w-5 text-emerald-600" />
                    <a href={`tel:${socialSettings.header_phone.replace(/[^0-9+]/g, "")}`} className="transition-colors hover:text-emerald-600">
                      <span dir="ltr" className="inline-block">{socialSettings.header_phone}</span>
                    </a>
                  </div>
                )}
                {socialSettings.header_email && (
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-5 w-5 text-emerald-600" />
                    <a href={`mailto:${socialSettings.header_email}`} className="transition-colors hover:text-emerald-600">
                      <span dir="ltr" className="inline-block">{socialSettings.header_email}</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-gray-200 pt-6 text-center text-sm font-medium text-gray-500">
            <p>{footerSettings.footer_copyright || `© ${new Date().getFullYear()} ${siteName || generalSettings.site_name || ""}. جميع الحقوق محفوظة.`}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
