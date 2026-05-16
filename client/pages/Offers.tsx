import { Link, useNavigate } from "react-router-dom";
import { Clock, Star, ShoppingCart, Heart, Eye, Zap, Gift, Percent, Timer } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAnimation } from "../context/AnimationContext";
import Header from "../components/Header";
import SEO from "../components/SEO";
import { offersAPI, newsletterAPI } from "../services/api";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useWishlist } from "../context/WishlistContext";

// Helper function to format price without trailing zeros
const formatPrice = (price: number | string): string => {
  // Convert to number if it's a string
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;

  // Check if it's a whole number
  if (numPrice % 1 === 0) {
    // Return as integer without decimals
    return numPrice.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  } else {
    // Return with decimals but remove trailing zeros
    return numPrice.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).replace(/\.?0+$/, '');
  }
};

const colorNameToHex: Record<string, string> = {
  "احمر": "#ef4444",
  "أحمر": "#ef4444",
  "ازرق": "#3b82f6",
  "أزرق": "#3b82f6",
  "اخضر": "#22c55e",
  "أخضر": "#22c55e",
  "اصفر": "#eab308",
  "أصفر": "#eab308",
  "برتقالي": "#f97316",
  "بنفسجي": "#a855f7",
  "وردي": "#ec4899",
  "زهري": "#ec4899",
  "اسود": "#111827",
  "أسود": "#111827",
  "ابيض": "#ffffff",
  "أبيض": "#ffffff",
  "رمادي": "#9ca3af",
  "بني": "#92400e",
  "كحلي": "#1e3a8a",
  "beige": "#d6c3a5",
  "black": "#111827",
  "white": "#ffffff",
  "red": "#ef4444",
  "blue": "#3b82f6",
  "green": "#22c55e",
  "yellow": "#eab308",
  "orange": "#f97316",
  "purple": "#a855f7",
  "pink": "#ec4899",
  "gray": "#9ca3af",
  "grey": "#9ca3af",
  "brown": "#92400e",
  "navy": "#1e3a8a",
};

const resolveColorHex = (label: string): string | null => {
  const trimmed = label.trim();
  if (!trimmed) return null;
  if (/^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(trimmed)) return trimmed;
  return colorNameToHex[trimmed.toLowerCase()] || null;
};

const extractAvailableColors = (filterValues?: Record<string, any>): string[] => {
  if (!filterValues || typeof filterValues !== "object") return [];
  const colors = new Set<string>();

  Object.entries(filterValues).forEach(([key, rawValue]) => {
    const compactKey = key.toLowerCase().replace(/\s+/g, "");
    const isColorKey =
      compactKey.includes("لون") ||
      compactKey.includes("الوان") ||
      compactKey.includes("ألوان") ||
      compactKey.includes("الالوان") ||
      compactKey.includes("color") ||
      compactKey.includes("colors");

    if (!isColorKey) return;

    const values = Array.isArray(rawValue)
      ? rawValue
      : typeof rawValue === "string"
        ? rawValue.split(",")
        : [];

    values.forEach((item) => {
      if (typeof item !== "string") return;
      const normalized = item.trim().replace(/\s+/g, " ");
      if (normalized) colors.add(normalized);
    });
  });

  return Array.from(colors);
};

interface Offer {
  id: number;
  title: string;
  description?: string;
  type: 'flash_deal' | 'weekly_deal' | 'bundle';
  image?: string;
  discount_percentage?: number;
  fixed_discount?: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  products?: Array<{
    id: number;
    name: string;
    slug: string;
    price: number;
    original_price?: number;
    image?: string;
    brand?: string;
    rating?: number;
    reviews_count?: number;
    has_different_prices?: boolean;
    has_variants?: boolean;
    filter_values?: Record<string, any>;
  }>;
  bundle_items?: Array<{
    product_id: number;
    product_name: string;
    product_slug: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  bundle_price?: number;
  original_bundle_price?: number;
  stock_limit?: number;
  sold_count: number;
  remaining_time: number;
  progress_percentage: number;
}

const Offers = () => {
  const { siteName } = useSiteSettings();

  const navigate = useNavigate();
  const { addItem } = useCart();
  const { triggerAnimation } = useAnimation();
  const { wishlistProcessing, toggleWishlist, isWishlisted } = useWishlist();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [newsletterMessageType, setNewsletterMessageType] = useState<"success" | "error" | "">("");
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    loadOffers();
  }, []);

  useEffect(() => {
    // Calculate time left for the first flash deal
    const flashDeal = offers.find(o => o.type === 'flash_deal');
    if (flashDeal && flashDeal.remaining_time > 0) {
      const timer = setInterval(() => {
        const remaining = flashDeal.remaining_time - Math.floor((Date.now() - new Date(flashDeal.starts_at).getTime()) / 1000);
        if (remaining > 0) {
          const days = Math.floor(remaining / 86400);
          const hours = Math.floor((remaining % 86400) / 3600);
          const minutes = Math.floor((remaining % 3600) / 60);
          const seconds = remaining % 60;
          setTimeLeft({ days, hours, minutes, seconds });
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [offers]);

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newsletterEmail.trim()) {
      setNewsletterMessageType("error");
      setNewsletterMessage("يرجى إدخال البريد الإلكتروني.");
      return;
    }

    try {
      setNewsletterLoading(true);
      setNewsletterMessage("");
      setNewsletterMessageType("");

      const response = await newsletterAPI.subscribe({
        email: newsletterEmail.trim(),
        source: "offers",
      });

      setNewsletterMessageType("success");
      setNewsletterMessage(response.message || "تم الاشتراك بنجاح.");
      setNewsletterEmail("");
    } catch (err: any) {
      setNewsletterMessageType("error");
      setNewsletterMessage(err.message || "حدث خطأ أثناء الاشتراك.");
    } finally {
      setNewsletterLoading(false);
    }
  };

  const loadOffers = async () => {
    try {
      setLoading(true);
      const response = await offersAPI.getOffers();
      if (response.success && response.data) {
        setOffers(response.data);

        // Set initial time left for hero section
        const flashDeal = response.data.find((o: Offer) => o.type === 'flash_deal');
        if (flashDeal && flashDeal.remaining_time > 0) {
          const days = Math.floor(flashDeal.remaining_time / 86400);
          const hours = Math.floor((flashDeal.remaining_time % 86400) / 3600);
          const minutes = Math.floor((flashDeal.remaining_time % 3600) / 60);
          const seconds = flashDeal.remaining_time % 60;
          setTimeLeft({ days, hours, minutes, seconds });
        }
      }
    } catch (error) {
      console.error("Error loading offers:", error);
    } finally {
      setLoading(false);
    }
  };

  const flashDeals = offers.filter(o => o.type === 'flash_deal');
  const weeklyDeals = offers.filter(o => o.type === 'weekly_deal');
  const bundleOffers = offers.filter(o => o.type === 'bundle');

  const FlashDealCard = ({ offer }: { offer: Offer }) => {
    const product = offer.products?.[0];
    if (!product) return null;

    const isInWishlist = isWishlisted(product.id);
    const isProcessingWishlist = !!wishlistProcessing[product.id];
    const availableColors = extractAvailableColors(product.filter_values);

    const progressPercentage = offer.stock_limit ? offer.progress_percentage : 0;

    const calculatePrice = () => {
      if (offer.discount_percentage) {
        const originalPrice = product.original_price || product.price;
        return originalPrice * (1 - offer.discount_percentage / 100);
      } else if (offer.fixed_discount) {
        const originalPrice = product.original_price || product.price;
        return Math.max(0, originalPrice - offer.fixed_discount);
      }
      return product.price;
    };

    const originalPrice = product.original_price || product.price;
    const discountedPrice = calculatePrice();
    const discountPercent = offer.discount_percentage || Math.round((1 - discountedPrice / originalPrice) * 100);
    const savingsAmount = Math.max(0, originalPrice - discountedPrice);

    const formatTimeLeft = () => {
      const remaining = offer.remaining_time;
      if (remaining <= 0) return "0:00:00:00";
      const days = Math.floor(remaining / 86400);
      const hours = Math.floor((remaining % 86400) / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;
      return `${days}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
      <div className="product-card p-2 md:p-4 group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col h-full border border-emerald-50">
        <div className="relative mb-2 md:mb-4 aspect-square overflow-hidden rounded-lg bg-gray-50 flex items-center justify-center">
          <Link to={`/product/${product.id}`} className="block w-full h-full">
            <img
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
          </Link>

          <div className="absolute top-1 right-1 md:top-2 md:right-2 z-10 flex flex-col gap-1 items-end">
            <div className="bg-emerald-600 text-white px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[8px] md:text-xs font-bold shadow-lg flex items-center gap-1">
              <Zap className="w-2 h-2 md:w-3 md:h-3 animate-pulse" />
              <span>FLASH</span>
            </div>
            {discountPercent > 0 && (
              <span className="bg-red-500 text-white px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-sm font-bold shadow-md">
                {discountPercent}%
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isProcessingWishlist) {
                toggleWishlist(product.id);
              }
            }}
            className={`absolute top-1 left-1 md:top-2 md:left-2 p-1.5 md:p-2 rounded-full shadow-md transition-colors z-10 ${isInWishlist ? "bg-red-50 hover:bg-red-100" : "bg-white hover:bg-gray-50"
              }`}
            disabled={isProcessingWishlist}
          >
            <Heart
              className={`w-3 h-3 md:w-4 md:h-4 ${isInWishlist ? "text-red-500" : "text-gray-600"}`}
              fill={isInWishlist ? "currentColor" : "none"}
            />
          </button>

          {offer.stock_limit && (
            <div className="absolute bottom-1 left-1 right-1 md:bottom-2 md:left-2 md:right-2 bg-black/70 backdrop-blur-sm text-white p-1.5 md:p-2 rounded-lg z-10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[8px] md:text-[10px]">باقي: {formatTimeLeft()}</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-1 md:h-1.5">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <Link to={`/product/${product.id}`} className="block flex-grow">
          <h3 className="text-sm md:text-base font-semibold text-gray-800 line-clamp-2 hover:text-emerald-600 transition-colors mb-1 md:mb-2 min-h-[2.5rem] md:min-h-[3rem]">
            {product.name}
          </h3>
        </Link>

        {availableColors.length > 0 && (
          <div className="mb-2">
            <div className="mb-1 text-[11px] font-medium text-gray-500">الألوان:</div>
            <div className="flex flex-wrap items-center gap-1.5">
              {availableColors.slice(0, 4).map((color) => {
                const colorHex = resolveColorHex(color);
                return (
                  <span
                    key={`${product.id}-${color}`}
                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-700"
                    title={color}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-gray-300"
                      style={{ backgroundColor: colorHex || "#e5e7eb" }}
                    />
                    <span>{color}</span>
                  </span>
                );
              })}
              {availableColors.length > 4 && (
                <span className="text-[11px] text-gray-500">+{availableColors.length - 4}</span>
              )}
            </div>
          </div>
        )}

        {product.brand && (
          <div className="text-[10px] md:text-xs text-emerald-600 font-semibold mb-1">{product.brand}</div>
        )}

        <div className="flex flex-col mb-2 md:mb-4">
          {product.has_different_prices && (
            <span className="text-[10px] md:text-xs text-gray-400 mb-0.5">ابتداء من</span>
          )}
          <div className="flex items-center gap-2">
            <span className="text-lg md:text-xl font-bold text-emerald-600">
              {formatPrice(discountedPrice)} ₪
            </span>
            {originalPrice > discountedPrice && (
              <span className="text-sm md:text-base text-gray-500 line-through">{formatPrice(originalPrice)} ₪</span>
            )}
          </div>
        </div>
        {savingsAmount > 0 && (
          <div className="mt-2 mb-2 md:mb-4">
            <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-[11px] md:text-xs font-bold text-red-600">
              وفر {formatPrice(savingsAmount)} ₪
            </span>
          </div>
        )}

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            if (product.has_variants) {
              navigate(`/product/${product.id}`);
              return;
            }

            const imageForAnimation = product.image || "/placeholder.svg";
            triggerAnimation(e.currentTarget, {
              image: imageForAnimation,
              name: product.name
            });

            addItem({
              id: product.id,
              name: product.name,
              price: discountedPrice,
              original_price: originalPrice,
              image: imageForAnimation,
              brand: product.brand || '',
              manage_stock: false
            });
          }}
          className="w-full bg-emerald-500 text-white py-1.5 md:py-2 rounded-lg transition-colors text-sm md:text-base font-medium shadow-sm hover:bg-emerald-600"
        >
          {product.has_variants ? 'عرض الخيارات' : 'أضف للسلة'}
        </button>
      </div>
    );
  };

  const ProductCard = ({ offer }: { offer: Offer }) => {
    const product = offer.products?.[0];
    if (!product) return null;

    const isInWishlist = isWishlisted(product.id);
    const isProcessingWishlist = !!wishlistProcessing[product.id];
    const availableColors = extractAvailableColors(product.filter_values);

    const calculatePrice = () => {
      if (offer.discount_percentage) {
        const originalPrice = product.original_price || product.price;
        return originalPrice * (1 - offer.discount_percentage / 100);
      } else if (offer.fixed_discount) {
        const originalPrice = product.original_price || product.price;
        return Math.max(0, originalPrice - offer.fixed_discount);
      }
      return product.price;
    };

    const originalPrice = product.original_price || product.price;
    const discountedPrice = calculatePrice();
    const discountPercent = offer.discount_percentage || Math.round((1 - discountedPrice / originalPrice) * 100);
    const savingsAmount = Math.max(0, originalPrice - discountedPrice);

    return (
      <div className="product-card p-2 md:p-4 group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col h-full">
        <div className="relative mb-2 md:mb-4 aspect-square overflow-hidden rounded-lg bg-gray-50 flex items-center justify-center">
          <Link to={`/product/${product.id}`} className="block w-full h-full">
            <img
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
          </Link>
          {discountPercent > 0 && (
            <span className="absolute top-1 right-1 md:top-2 md:right-2 bg-red-500 text-white px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-sm font-bold z-10">
              {discountPercent}%
            </span>
          )}

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isProcessingWishlist) {
                toggleWishlist(product.id);
              }
            }}
            className={`absolute top-1 left-1 md:top-2 md:left-2 p-1.5 md:p-2 rounded-full shadow-md transition-colors z-10 ${isInWishlist ? "bg-red-50 hover:bg-red-100" : "bg-white hover:bg-gray-50"
              }`}
            disabled={isProcessingWishlist}
          >
            <Heart
              className={`w-3 h-3 md:w-4 md:h-4 ${isInWishlist ? "text-red-500" : "text-gray-600"}`}
              fill={isInWishlist ? "currentColor" : "none"}
            />
          </button>

          <span className="absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-emerald-500/90 backdrop-blur-sm text-white px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[8px] md:text-xs font-bold z-10 shadow-lg border border-white/20">
            عرض الأسبوع
          </span>
        </div>

        <Link to={`/product/${product.id}`} className="block flex-grow">
          <h3 className="text-sm md:text-base font-semibold text-gray-800 line-clamp-2 hover:text-emerald-600 transition-colors mb-1 md:mb-2 min-h-[2.5rem] md:min-h-[3rem]">
            {product.name}
          </h3>
        </Link>

        {availableColors.length > 0 && (
          <div className="mb-2">
            <div className="mb-1 text-[11px] font-medium text-gray-500">الألوان:</div>
            <div className="flex flex-wrap items-center gap-1.5">
              {availableColors.slice(0, 4).map((color) => {
                const colorHex = resolveColorHex(color);
                return (
                  <span
                    key={`${product.id}-${color}`}
                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-700"
                    title={color}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-gray-300"
                      style={{ backgroundColor: colorHex || "#e5e7eb" }}
                    />
                    <span>{color}</span>
                  </span>
                );
              })}
              {availableColors.length > 4 && (
                <span className="text-[11px] text-gray-500">+{availableColors.length - 4}</span>
              )}
            </div>
          </div>
        )}

        {product.brand && (
          <div className="text-[10px] md:text-xs text-emerald-600 font-semibold mb-1">{product.brand}</div>
        )}

        <div className="flex flex-col mb-2 md:mb-4">
          {product.has_different_prices && (
            <span className="text-[10px] md:text-xs text-gray-400 mb-0.5">ابتداء من</span>
          )}
          <div className="flex items-center gap-2">
            <span className="text-lg md:text-xl font-bold text-emerald-600">
              {formatPrice(discountedPrice)} ₪
            </span>
            {originalPrice > discountedPrice && (
              <span className="text-sm md:text-base text-gray-500 line-through">{formatPrice(originalPrice)} ₪</span>
            )}
          </div>
        </div>
        {savingsAmount > 0 && (
          <div className="mt-2 mb-2 md:mb-4">
            <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-[11px] md:text-xs font-bold text-red-600">
              وفر {formatPrice(savingsAmount)} ₪
            </span>
          </div>
        )}

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            if (product.has_variants) {
              navigate(`/product/${product.id}`);
              return;
            }

            const imageForAnimation = product.image || "/placeholder.svg";
            triggerAnimation(e.currentTarget, {
              image: imageForAnimation,
              name: product.name
            });

            addItem({
              id: product.id,
              name: product.name,
              price: discountedPrice,
              original_price: originalPrice,
              image: imageForAnimation,
              brand: product.brand || '',
              manage_stock: false
            });
          }}
          className="w-full bg-emerald-500 text-white py-1.5 md:py-2 rounded-lg transition-colors text-sm md:text-base font-medium shadow-sm hover:bg-emerald-600"
        >
          {product.has_variants ? 'عرض الخيارات' : 'أضف للسلة'}
        </button>
      </div>
    );
  };

  const BundleCard = ({ offer }: { offer: Offer }) => {
    if (!offer.bundle_items || offer.bundle_items.length === 0) return null;

    const bundlePrice = offer.bundle_price || 0;
    const originalPrice = offer.original_bundle_price || bundlePrice;
    const discount = originalPrice - bundlePrice;
    const discountPercent = Math.round((discount / originalPrice) * 100);

    return (
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-emerald-100">
        <div className="relative">
          {offer.image ? (
            <img
              src={offer.image}
              alt={offer.title}
              className="w-full h-64 object-cover"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-product.jpg';
              }}
            />
          ) : (
            <div className="w-full h-64 bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
              <Gift className="w-16 h-16 text-emerald-400" />
            </div>
          )}
          <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-2 rounded-full">
            <div className="flex items-center gap-1">
              <Gift className="w-4 h-4" />
              <span className="text-sm font-bold">باقة حصرية</span>
            </div>
          </div>
          <div className="absolute top-4 left-4 bg-amber-400 text-white px-3 py-1 rounded-full text-sm font-bold">
            -{discountPercent}%
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-3">{offer.title}</h3>
          {offer.description && (
            <p className="text-sm text-gray-600 mb-4">{offer.description}</p>
          )}

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">يشمل:</p>
            <ul className="space-y-1">
              {offer.bundle_items.map((item, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <Link
                    to={`/product/${item.product_id}`}
                    className="hover:text-emerald-600 transition-colors"
                  >
                    {item.product_name} (x{item.quantity})
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-emerald-700">{bundlePrice.toFixed(2)} شيكل</span>
            </div>
            <span className="text-lg text-gray-400 line-through">{originalPrice.toFixed(2)} شيكل</span>
            <div className="text-lg text-green-600 font-bold">
              وفر {discount.toFixed(2)} شيكل
            </div>
          </div>

          <button
            onClick={(e) => {
              triggerAnimation(e.currentTarget, {
                image: offer.image,
                name: offer.title
              });
              addItem({
                id: offer.id,
                name: offer.title,
                price: bundlePrice,
                image: offer.image || '',
                brand: "باقة",
                type: 'offer'
              });
            }}
            className="w-full bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            اشتري الباقة
          </button>
        </div>
      </div>
    );
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

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const currentUrl = `${siteUrl}/offers`;

  // Structured Data for Offers Page
  const structuredDataArray = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": siteName ? `العروض الخاصة - ${siteName}` : "العروض الخاصة",
      "description": `تصفح العروض الخاصة والخصومات الحصريةعلى أفضل المنتجات${siteName ? ` في متجر ${siteName} الإلكتروني` : ''}. عروض فلاش، تخفيضات أسبوعية وباقات حصرية بأسعار مميزة.`,
      "url": currentUrl
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "الرئيسية",
          "item": siteUrl
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "العروض",
          "item": currentUrl
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 arabic">
      <SEO
        title={siteName ? `العروض الخاصة - ${siteName}` : "العروض الخاصة"}
        description={`تصفح العروض الخاصة والخصومات الحصرية على أفضل المنتجات${siteName ? ` في متجر ${siteName} الإلكتروني` : ''}. عروض فلاش، تخفيضات أسبوعية وباقات حصرية بأسعار مميزة.`}
        keywords={`عروض, خصومات, تسوق أونلاين, عروض فلاش, تخفيضات, باقات حصرية${siteName ? `, ${siteName}` : ''}`}
        structuredData={structuredDataArray}
      />
      <Header
        showSearch={true}
        showActions={true}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-emerald-700 to-teal-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">العروض الحصرية</h1>
          <p className="text-xl text-red-200 mb-8">اكتشف أفضل العروض والخصومات على جميع المنتجات</p>

          {/* Countdown Timer */}
          {timeLeft.days > 0 || timeLeft.hours > 0 || timeLeft.minutes > 0 || timeLeft.seconds > 0 ? (
            <div className="max-w-md mx-auto bg-white/10 border border-white/15 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4">العرض ينتهي خلال:</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="bg-white text-emerald-700 text-2xl font-bold py-3 px-2 rounded-lg">
                    {timeLeft.days.toString().padStart(2, '0')}
                  </div>
                  <div className="text-sm mt-2">يوم</div>
                </div>
                <div className="text-center">
                  <div className="bg-white text-emerald-700 text-2xl font-bold py-3 px-2 rounded-lg">
                    {timeLeft.hours.toString().padStart(2, '0')}
                  </div>
                  <div className="text-sm mt-2">ساعة</div>
                </div>
                <div className="text-center">
                  <div className="bg-white text-emerald-700 text-2xl font-bold py-3 px-2 rounded-lg">
                    {timeLeft.minutes.toString().padStart(2, '0')}
                  </div>
                  <div className="text-sm mt-2">دقيقة</div>
                </div>
                <div className="text-center">
                  <div className="bg-white text-emerald-700 text-2xl font-bold py-3 px-2 rounded-lg">
                    {timeLeft.seconds.toString().padStart(2, '0')}
                  </div>
                  <div className="text-sm mt-2">ثانية</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Flash Deals */}
        {flashDeals.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-emerald-500 p-3 rounded-full">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-800">عروض البرق</h2>
                <p className="text-gray-600">خصومات محدودة الوقت - اسرع قبل انتهاء الكمية!</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {flashDeals.map(offer => (
                <FlashDealCard key={offer.id} offer={offer} />
              ))}
            </div>
          </section>
        )}

        {/* Weekly Deals */}
        {weeklyDeals.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-emerald-400 p-3 rounded-full">
                <Percent className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-800">عروض الأسبوع</h2>
                <p className="text-gray-600">خصومات مميزة تستمر طوال الأسبوع</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {weeklyDeals.map(offer => (
                <ProductCard key={offer.id} offer={offer} />
              ))}
            </div>
          </section>
        )}

        {/* Bundle Offers */}
        {bundleOffers.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-emerald-500 p-3 rounded-full">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-800">الباقات الحصرية</h2>
                <p className="text-gray-600">وفر أكثر مع باقاتنا المتكاملة</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {bundleOffers.map(offer => (
                <BundleCard key={offer.id} offer={offer} />
              ))}
            </div>
          </section>
        )}

        {offers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">لا توجد عروض متاحة حالياً</p>
          </div>
        )}

        {/* Newsletter Signup */}
        <section className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">لا تفوت العروض القادمة!</h2>
          <p className="text-emerald-100 mb-6">اشترك في نشرتنا البريدية لتصلك أحدث العروض والخصومات</p>
          <form onSubmit={handleNewsletterSubscribe} className="max-w-md mx-auto">
            <div className="flex gap-4">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="أدخل بريدك الإلكتروني"
                className="flex-1 px-4 py-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button
                type="submit"
                disabled={newsletterLoading}
                className="bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-60"
              >
                {newsletterLoading ? "جاري..." : "اشتراك"}
              </button>
            </div>
            {newsletterMessage && (
              <p className={`mt-3 text-sm ${newsletterMessageType === "success" ? "text-white" : "text-rose-100"}`}>
                {newsletterMessage}
              </p>
            )}
          </form>
        </section>
      </div>
    </div>
  );
};

export default Offers;
