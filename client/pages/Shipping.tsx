import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Truck,
  Clock,
  MapPin,
  Package,
  Shield,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import Header from "../components/Header";
import SEO from "../components/SEO";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { settingsAPI } from "../services/api";

interface ShippingOption {
  title: string;
  duration: string;
  cost: string;
  description: string;
  features?: string[];
}

interface ShippingStep {
  step?: number;
  title: string;
  description: string;
}

interface ShippingCity {
  name: string;
  duration: string;
  cost: string;
  sameDay?: boolean;
}

interface ShippingPolicy {
  title: string;
  description: string;
}

interface ShippingNote {
  title: string;
  description: string;
  type?: "info" | "warning" | "success" | "danger";
}

interface ShippingSettings {
  shipping_hero_title?: string;
  shipping_hero_description?: string;
  shipping_options_title?: string;
  shipping_options_description?: string;
  shipping_options?: ShippingOption[];
  shipping_steps_title?: string;
  shipping_steps_description?: string;
  shipping_steps?: ShippingStep[];
  shipping_coverage_title?: string;
  shipping_coverage_description?: string;
  shipping_cities?: ShippingCity[];
  shipping_policies_title?: string;
  shipping_policies_description?: string;
  shipping_policies?: ShippingPolicy[];
  shipping_notes_title?: string;
  shipping_notes?: ShippingNote[];
  shipping_cta_title?: string;
  shipping_cta_description?: string;
  shipping_cta_phone?: string;
}

const parseStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
    } catch {
      return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }

  return [];
};

const parseSettingsArray = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
};

const shippingOptionIcons = [
  <Truck className="h-8 w-8 text-emerald-600" />,
  <Clock className="h-8 w-8 text-green-600" />,
  <Package className="h-8 w-8 text-purple-600" />,
];

const shippingStepIcons = [
  <CheckCircle className="h-6 w-6" />,
  <Package className="h-6 w-6" />,
  <Truck className="h-6 w-6" />,
  <MapPin className="h-6 w-6" />,
];

const shippingPolicyIcons = [
  <Shield className="h-6 w-6 text-green-600" />,
  <Clock className="h-6 w-6 text-emerald-600" />,
  <Package className="h-6 w-6 text-purple-600" />,
  <MapPin className="h-6 w-6 text-red-600" />,
];

const noteStyles = {
  info: {
    wrapper: "bg-emerald-50 border-emerald-500",
    icon: "text-emerald-600",
    title: "text-emerald-800",
    text: "text-emerald-700",
    component: Info,
  },
  warning: {
    wrapper: "bg-yellow-50 border-yellow-500",
    icon: "text-yellow-600",
    title: "text-yellow-800",
    text: "text-yellow-700",
    component: AlertCircle,
  },
  success: {
    wrapper: "bg-green-50 border-green-500",
    icon: "text-green-600",
    title: "text-green-800",
    text: "text-green-700",
    component: CheckCircle,
  },
  danger: {
    wrapper: "bg-red-50 border-red-500",
    icon: "text-red-600",
    title: "text-red-800",
    text: "text-red-700",
    component: AlertCircle,
  },
} as const;

const Shipping = () => {
  const { siteName } = useSiteSettings();
  const [settings, setSettings] = useState<ShippingSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await settingsAPI.getSettings("shipping");
        setSettings(response?.data || {});
      } catch (error) {
        console.error("Error loading shipping settings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

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

  const shippingOptions = parseSettingsArray<ShippingOption>(settings.shipping_options).map((option) => ({
    ...option,
    features: parseStringArray(option.features),
  }));
  const shippingSteps = parseSettingsArray<ShippingStep>(settings.shipping_steps);
  const shippingCities = parseSettingsArray<ShippingCity>(settings.shipping_cities);
  const shippingPolicies = parseSettingsArray<ShippingPolicy>(settings.shipping_policies);
  const shippingNotes = parseSettingsArray<ShippingNote>(settings.shipping_notes);

  const hasHero = Boolean(settings.shipping_hero_title || settings.shipping_hero_description);
  const hasOptions = shippingOptions.length > 0;
  const hasSteps = shippingSteps.length > 0;
  const hasCoverage = shippingCities.length > 0;
  const hasPolicies = shippingPolicies.length > 0;
  const hasNotes = shippingNotes.length > 0;
  const hasCta = Boolean(settings.shipping_cta_title || settings.shipping_cta_description || settings.shipping_cta_phone);

  return (
    <div className="min-h-screen bg-gray-50 arabic">
      <SEO
        title={`سياسة الشحن والتوصيل${siteName ? ` | ${siteName}` : ""}`}
        description={`تعرف على سياسة الشحن والتوصيل في${siteName ? ` ${siteName}` : " متجرنا"}.`}
      />
      <Header showSearch={true} showActions={true} />

      {hasHero && (
        <section className="bg-gradient-to-r from-emerald-900 to-teal-900 py-20 text-white">
          <div className="container mx-auto px-4 text-center">
            {settings.shipping_hero_title && <h1 className="mb-6 text-5xl font-bold">{settings.shipping_hero_title}</h1>}
            {settings.shipping_hero_description && (
              <p className="mx-auto max-w-3xl text-xl leading-relaxed text-emerald-200">{settings.shipping_hero_description}</p>
            )}
          </div>
        </section>
      )}

      {hasOptions && (
        <section className="bg-white py-20">
          <div className="container mx-auto px-4">
            {(settings.shipping_options_title || settings.shipping_options_description) && (
              <div className="mb-16 text-center">
                {settings.shipping_options_title && <h2 className="mb-4 text-4xl font-bold text-gray-800">{settings.shipping_options_title}</h2>}
                {settings.shipping_options_description && <p className="text-xl text-gray-600">{settings.shipping_options_description}</p>}
              </div>
            )}

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {shippingOptions.map((option, index) => (
                <div
                  key={`${option.title}-${index}`}
                  className="rounded-2xl border-2 border-transparent bg-gray-50 p-8 transition-all duration-300 hover:border-emerald-200 hover:shadow-lg"
                >
                  <div className="mb-6 text-center">
                    <div className="mb-4 flex justify-center">{shippingOptionIcons[index % shippingOptionIcons.length]}</div>
                    <h3 className="mb-2 text-2xl font-bold text-gray-800">{option.title}</h3>
                    <div className="mb-2 text-3xl font-bold text-emerald-600">{option.duration}</div>
                    <div className="text-lg font-semibold text-green-600">{option.cost}</div>
                  </div>
                  <p className="mb-6 text-center text-gray-600">{option.description}</p>
                  {option.features && option.features.length > 0 && (
                    <div className="space-y-3">
                      {option.features.map((feature, featureIndex) => (
                        <div key={`${feature}-${featureIndex}`} className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {hasSteps && (
        <section className="bg-gray-100 py-20">
          <div className="container mx-auto px-4">
            {(settings.shipping_steps_title || settings.shipping_steps_description) && (
              <div className="mb-16 text-center">
                {settings.shipping_steps_title && <h2 className="mb-4 text-4xl font-bold text-gray-800">{settings.shipping_steps_title}</h2>}
                {settings.shipping_steps_description && <p className="text-xl text-gray-600">{settings.shipping_steps_description}</p>}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {shippingSteps.map((step, index) => (
                <div
                  key={`${step.title}-${index}`}
                  className="relative rounded-2xl border border-emerald-100 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative mb-5">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md">
                      {shippingStepIcons[index % shippingStepIcons.length]}
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
      )}

      {hasCoverage && (
        <section className="bg-white py-20">
          <div className="container mx-auto px-4">
            {(settings.shipping_coverage_title || settings.shipping_coverage_description) && (
              <div className="mb-16 text-center">
                {settings.shipping_coverage_title && <h2 className="mb-4 text-4xl font-bold text-gray-800">{settings.shipping_coverage_title}</h2>}
                {settings.shipping_coverage_description && <p className="text-xl text-gray-600">{settings.shipping_coverage_description}</p>}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {shippingCities.map((city, index) => (
                <div key={`${city.name}-${index}`} className="rounded-xl bg-gray-50 p-6 transition-all duration-300 hover:shadow-lg">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-lg font-bold text-gray-800">{city.name}</h3>
                    {city.sameDay && (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">نفس اليوم</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm text-gray-600">{city.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-600">{city.cost}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {hasPolicies && (
        <section className="bg-gray-100 py-20">
          <div className="container mx-auto px-4">
            {(settings.shipping_policies_title || settings.shipping_policies_description) && (
              <div className="mb-16 text-center">
                {settings.shipping_policies_title && <h2 className="mb-4 text-4xl font-bold text-gray-800">{settings.shipping_policies_title}</h2>}
                {settings.shipping_policies_description && <p className="text-xl text-gray-600">{settings.shipping_policies_description}</p>}
              </div>
            )}

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {shippingPolicies.map((policy, index) => (
                <div
                  key={`${policy.title}-${index}`}
                  className="rounded-2xl bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-xl"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">{shippingPolicyIcons[index % shippingPolicyIcons.length]}</div>
                    <div>
                      <h3 className="mb-3 text-xl font-bold text-gray-800">{policy.title}</h3>
                      <p className="leading-relaxed text-gray-600">{policy.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {hasNotes && (
        <section className="bg-white py-20">
          <div className="container mx-auto px-4">
            {settings.shipping_notes_title && (
              <div className="mb-16 text-center">
                <h2 className="mb-4 text-4xl font-bold text-gray-800">{settings.shipping_notes_title}</h2>
              </div>
            )}

            <div className="mx-auto max-w-4xl space-y-6">
              {shippingNotes.map((note, index) => {
                const noteType = (note.type || "info") as keyof typeof noteStyles;
                const style = noteStyles[noteType] || noteStyles.info;
                const IconComponent = style.component;
                return (
                  <div key={`${note.title}-${index}`} className={`rounded-lg border-l-4 p-6 ${style.wrapper}`}>
                    <div className="flex items-start gap-3">
                      <IconComponent className={`mt-1 h-6 w-6 flex-shrink-0 ${style.icon}`} />
                      <div>
                        <h3 className={`mb-2 font-bold ${style.title}`}>{note.title}</h3>
                        <p className={style.text}>{note.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {hasCta && (
        <section className="bg-gradient-to-r from-emerald-600 to-teal-600 py-16 text-white">
          <div className="container mx-auto px-4 text-center">
            {settings.shipping_cta_title && <h2 className="mb-4 text-3xl font-bold">{settings.shipping_cta_title}</h2>}
            {settings.shipping_cta_description && <p className="mb-8 text-xl text-emerald-200">{settings.shipping_cta_description}</p>}
            <div className="flex justify-center gap-4">
              <Link
                to="/contact"
                className="rounded-full bg-white px-8 py-4 font-semibold text-emerald-600 transition-colors hover:bg-gray-100"
              >
                تواصل معنا
              </Link>
              {settings.shipping_cta_phone && (
                <a
                  href={`tel:${settings.shipping_cta_phone}`}
                  className="rounded-full border-2 border-white px-8 py-4 font-semibold text-white transition-colors hover:bg-white hover:text-emerald-600"
                >
                  اتصل الآن
                </a>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Shipping;
