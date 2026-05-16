import { useState, useMemo, useEffect, useRef, Fragment } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Star,
  Heart,
  ShoppingCart,
  Minus,
  Plus,
  Share2,
  Truck,
  Shield,
  RotateCcw,
  Phone,
  MessageCircle,
  Ruler,
  ChevronLeft,
  ChevronRight,
  Zap,
  Award,
  Clock,
  X
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAnimation } from "../context/AnimationContext";
import { useWishlist } from "../context/WishlistContext";
import { trackEvent } from "../utils/pixel";
import Header from "../components/Header";
import SEO from "../components/SEO";
import { productsAPI, categoriesAPI, settingsAPI } from "../services/api";
import { getOptimizedImageUrl, getStorageUrl } from "../config/env";
import { useSiteSettings } from "../context/SiteSettingsContext";

interface ProductDetail {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  comparePrice?: number;
  explicitDiscountPercentage?: number;
  images: string[];
  rating: number;
  reviews: number;
  category: string;
  brand: string;
  discount?: number;
  discountPercentage?: number;
  inStock: boolean;
  stockStatus: string;
  stockCount: number;
  description: string;
  features: string[];
  specifications: { [key: string]: string };
  warranty: string;
  deliveryTime: string;
  sku: string;
  dimensions?: string;
  weight?: number;
  viewsCount: number;
  variants?: any[];
  filter_values: Record<string, string[]>;
  show_description?: boolean;
  show_specifications?: boolean;
  sizeGuideImages?: string[];
  cover_image?: string | null;
}

interface BreadcrumbCategory {
  id: number;
  name: string;
  parent_id: number | null;
  slug?: string;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const deriveBreadcrumbCategories = (
  apiProduct: any,
  categoriesMap: Map<number, BreadcrumbCategory>
): { main?: BreadcrumbCategory; sub?: BreadcrumbCategory } => {
  const result: { main?: BreadcrumbCategory; sub?: BreadcrumbCategory } = {};

  if (!apiProduct || categoriesMap.size === 0) {
    return result;
  }

  const productCategories: BreadcrumbCategory[] = Array.isArray(apiProduct.categories)
    ? apiProduct.categories
      .map((cat: any) => categoriesMap.get(Number(cat.id)))
      .filter((cat): cat is BreadcrumbCategory => Boolean(cat))
    : [];

  let mainCategory: BreadcrumbCategory | undefined;
  let subCategory: BreadcrumbCategory | undefined;

  subCategory = productCategories.find((cat) => cat.parent_id !== null);

  if (subCategory && subCategory.parent_id !== null) {
    const parent = categoriesMap.get(subCategory.parent_id);
    if (parent) {
      mainCategory = parent;
    }
  }

  if (!mainCategory) {
    const primaryCategoryId = apiProduct.category?.id ?? apiProduct.category_id;
    if (primaryCategoryId) {
      const candidate = categoriesMap.get(Number(primaryCategoryId));
      if (candidate) {
        if (candidate.parent_id) {
          subCategory = subCategory || candidate;
          const parent = categoriesMap.get(candidate.parent_id);
          mainCategory = parent || candidate;
        } else {
          mainCategory = candidate;
        }
      }
    }
  }

  if (!mainCategory) {
    mainCategory = productCategories.find((cat) => cat.parent_id === null);
  }

  if (!subCategory && mainCategory) {
    subCategory = productCategories.find((cat) => cat.parent_id === mainCategory.id);
  }

  if (mainCategory) {
    result.main = mainCategory;
  }
  if (subCategory && (!mainCategory || subCategory.id !== mainCategory.id)) {
    result.sub = subCategory;
  }

  return result;
};

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

const normalizeVariantValues = (raw: any): Record<string, string> => {
  if (!raw) return {};

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return {};

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return Object.fromEntries(
          Object.entries(parsed).map(([k, v]) => [k, String(v ?? "")])
        );
      }
      return {};
    } catch {
      return {};
    }
  }

  if (typeof raw === "object" && !Array.isArray(raw)) {
    return Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, String(v ?? "")])
    );
  }

  return {};
};

const normalizeImageList = (raw: any): string[] => {
  if (!raw) return [];

  let source: any = raw;

  if (typeof source === "string") {
    const trimmed = source.trim();
    if (!trimmed) return [];

    try {
      source = JSON.parse(trimmed);
    } catch {
      source = [trimmed];
    }
  }

  const asArray = Array.isArray(source) ? source : [source];
  const normalized = asArray
    .map((img: any) => {
      if (!img) return "";

      if (typeof img === "string") {
        const value = img.trim();
        if (!value) return "";
        return value.startsWith("http") ? value : getStorageUrl(value);
      }

      if (typeof img === "object") {
        const candidate =
          img.image_url ??
          img.image_path ??
          img.url ??
          img.path ??
          img.src ??
          img.image;

        if (typeof candidate === "string" && candidate.trim()) {
          const value = candidate.trim();
          return value.startsWith("http") ? value : getStorageUrl(value);
        }
      }

      return "";
    })
    .filter((value): value is string => Boolean(value) && value !== "/placeholder.svg");

  return Array.from(new Set(normalized));
};

const Product = () => {
  const { siteName } = useSiteSettings();

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem, updateQuantity } = useCart();
  const { triggerAnimation } = useAnimation();
  const { isWishlisted, toggleWishlist, wishlistProcessing } = useWishlist();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications'>('description');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [breadcrumbCategories, setBreadcrumbCategories] = useState<{ main?: BreadcrumbCategory; sub?: BreadcrumbCategory }>({});
  const [whatsappNumber, setWhatsappNumber] = useState<string>("");
  const [headerSettings, setHeaderSettings] = useState<any>({});
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showProductViews, setShowProductViews] = useState(true);
  const [showWhatsAppOrderButton, setShowWhatsAppOrderButton] = useState(true);
  const [isSizeGuideModalOpen, setIsSizeGuideModalOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const preloadedImageUrlsRef = useRef<Set<string>>(new Set());

  const toMainImageSrc = (url: string): string =>
    getOptimizedImageUrl(url, { width: 1200, quality: 82 }) || url;

  const toThumbImageSrc = (url: string): string =>
    getOptimizedImageUrl(url, { width: 260, quality: 70 }) || url;

  const toModalImageSrc = (url: string): string =>
    getOptimizedImageUrl(url, { width: 1800, quality: 86 }) || url;

  const preloadImages = (urls: string[], mapToSrc: (url: string) => string = toMainImageSrc) => {
    urls
      .map((url) => mapToSrc(url))
      .filter((url): url is string => Boolean(url) && !preloadedImageUrlsRef.current.has(url))
      .forEach((url) => {
        preloadedImageUrlsRef.current.add(url);
        const img = new Image();
        img.decoding = "async";
        img.src = url;
      });
  };

  const preloadVariantImagesByOption = (optionKey: string, optionValue: string) => {
    if (!product?.variants?.length) return;
    const urls = product.variants
      .filter((variant: any) => variant?.variant_values?.[optionKey] === optionValue)
      .map((variant: any) => (Array.isArray(variant?.images) ? variant.images[0] : null))
      .filter((url): url is string => Boolean(url));
    preloadImages(urls, toMainImageSrc);
  };
  const lastFetchedId = useRef<string | null>(null);

  const isEnabledSetting = (value: unknown, defaultValue = true) => {
    if (value === undefined || value === null) return defaultValue;
    return value === "1" || value === 1 || value === "true" || value === true;
  };

  const matchingVariant = useMemo(() => {
    if (!product || !product.variants || product.variants.length === 0) return null;
    const variantKeys = Object.keys(product.variants[0].variant_values);
    // Check if every filter key required by variants is selected
    if (!variantKeys.every(k => selectedOptions[k])) return null;

    return product.variants.find(v => {
      return Object.entries(v.variant_values).every(([k, val]) => selectedOptions[k] === val);
    }) || null;
  }, [product, selectedOptions]);

  // Check if there's at least one available variant path for current selection
  const hasAvailableVariant = useMemo(() => {
    if (!product) return false;
    if (!product.variants || product.variants.length === 0) {
      if (product.stockStatus === 'in_stock') return true;
      if (product.stockStatus === 'stock_based') return product.stockCount > 0;
      return product.inStock && product.stockStatus !== 'out_of_stock';
    }

    return product.variants.some(v => {
      // Must match all currently selected options
      const matchesSelection = Object.entries(selectedOptions).every(([k, val]) => v.variant_values[k] === val);
      if (!matchesSelection) return false;

      // Check stock for this variant
      return product.stockStatus === 'in_stock' || Number(v.stock_quantity) > 0;
    });
  }, [product, selectedOptions]);

  const explicitDiscountPercentage = Number(product?.explicitDiscountPercentage || 0);

  // Pricing rules:
  // - If API provides an explicit discount_percentage, compute sale from base price.
  // - Otherwise treat `price` (and variant price) as the final price, even if compare/original is higher.
  const baseVariantPrice = product
    ? (matchingVariant && matchingVariant.price ? Number(matchingVariant.price) : Number(product.originalPrice ?? product.price ?? 0))
    : 0;

  const displayPrice = product
    ? (explicitDiscountPercentage > 0
      ? Number((baseVariantPrice * (1 - explicitDiscountPercentage / 100)).toFixed(2))
      : (matchingVariant && matchingVariant.price ? Number(matchingVariant.price) : Number(product.price || 0)))
    : 0;

  const displayOriginalPrice = Math.max(
    Number(product?.comparePrice || 0),
    explicitDiscountPercentage > 0 ? baseVariantPrice : displayPrice
  );
  const displaySavingsAmount = Math.max(0, displayOriginalPrice - displayPrice);
  const displayDiscountPercentage = displaySavingsAmount > 0
    ? (explicitDiscountPercentage > 0
      ? explicitDiscountPercentage
      : Math.round((displaySavingsAmount / displayOriginalPrice) * 100))
    : 0;
  const displayStockCount = product ? (matchingVariant ? Number(matchingVariant.stock_quantity) : product.stockCount) : 0;
  const effectiveStockLimit = useMemo(() => {
    if (!product) return 0;
    if (product.stockStatus !== 'stock_based') return Number.POSITIVE_INFINITY;

    const limits: number[] = [];
    const productLimit = Number(product.stockCount);
    const hasVariants = !!(product.variants && product.variants.length > 0);

    // For variant-based products, a zero product-level stock is often a placeholder.
    // Use product-level limit only when it is explicitly positive.
    if (
      Number.isFinite(productLimit) &&
      ((hasVariants && productLimit > 0) || (!hasVariants && productLimit >= 0))
    ) {
      limits.push(productLimit);
    }

    if (matchingVariant) {
      const variantLimit = Number(matchingVariant.stock_quantity);
      if (Number.isFinite(variantLimit) && variantLimit >= 0) {
        limits.push(variantLimit);
      }
    }

    if (limits.length === 0) return 0;
    return Math.min(...limits);
  }, [product, matchingVariant]);

  const displayInStock = product ? (
    product.stockStatus === 'in_stock' ||
    (product.stockStatus === 'stock_based' && (
      product.variants && product.variants.length > 0
        ? hasAvailableVariant
        : product.stockCount > 0
    )) ||
    (product.stockStatus !== 'stock_based' && product.stockStatus !== 'out_of_stock' && product.inStock)
  ) : false;

  const displayStockStatus = product ? (
    product.stockStatus === 'out_of_stock'
      ? 'out_of_stock'
      : (product.stockStatus === 'in_stock'
        ? 'in_stock'
        : (product.stockStatus === 'stock_based'
          ? (hasAvailableVariant ? 'in_stock' : 'out_of_stock')
          : (matchingVariant ? (displayStockCount > 0 ? 'in_stock' : 'out_of_stock') : product.stockStatus)))
  ) : 'out_of_stock';
  const displaySku = product ? (matchingVariant?.sku || product.sku) : '';
  const productIsWishlisted = product ? isWishlisted(product.id) : false;
  const isProcessingWishlist = product ? !!wishlistProcessing[product.id] : false;
  const returnToProductsUrl =
    (location.state as { fromProductsUrl?: string } | null)?.fromProductsUrl ||
    sessionStorage.getItem("last-products-route") ||
    "/products";

  useEffect(() => {
    // Inject CKEditor content styles
    const styleId = 'ck-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        .ck-content img {
          max-width: 100% !important;
          height: auto !important;
          display: block;
          margin: 1.5rem auto;
          border-radius: 0.5rem;
        }
        .ck-content ul, .ck-content ol {
          padding-right: 2rem;
          margin-bottom: 1rem;
        }
        .ck-content ul { list-style-type: disc !important; }
        .ck-content ol { list-style-type: decimal !important; }
        .ck-content h2, .ck-content h3 { font-weight: bold; margin: 1.5rem 0 1rem; }
      `;
      document.head.appendChild(style);
    }

    // If we're already loading this product or have no ID, skip
    if (!id || id === lastFetchedId.current) return;

    // Mark as being fetched
    lastFetchedId.current = id;

    // Reset UI for the new product
    setLoading(true);
    setProduct(null);
    setBreadcrumbCategories({});

    const loadProduct = async () => {
      try {
        const [productResponse, categoriesResponse, headerSettingsResponse, analyticsSettingsResponse] = await Promise.all([
          productsAPI.getProduct(Number(id), sessionStorage.getItem(`viewed_product_${id}`) === "true"),
          categoriesAPI.getCategories().catch(() => ({ data: [] })),
          settingsAPI.getSettings('header').catch(() => ({ data: {} })),
          settingsAPI.getSettings('analytics').catch(() => ({ data: {} })),
        ]);

        // Guard: if user navigated away while we were fetching, ignore result
        if (id !== lastFetchedId.current) return;

        // Set Analytics settings
        if (analyticsSettingsResponse?.data) {
          setShowProductViews(isEnabledSetting(analyticsSettingsResponse.data.show_product_views, true));
          setShowWhatsAppOrderButton(
            isEnabledSetting(analyticsSettingsResponse.data.show_product_whatsapp_order_button, true)
          );
        }

        if (headerSettingsResponse?.data) {
          if (headerSettingsResponse.data.whatsapp_number) {
            setWhatsappNumber(headerSettingsResponse.data.whatsapp_number);
          }
          setHeaderSettings(headerSettingsResponse.data);
        }

        const apiProduct = productResponse.data;
        if (!apiProduct) {
          throw new Error("Product data is missing");
        }

        const categoriesData = categoriesResponse?.data || [];
        const categoriesMap = new Map<number, BreadcrumbCategory>();
        if (Array.isArray(categoriesData)) {
          const addCategoryToMap = (cat: any) => {
            if (!cat) return;
            const categoryId = Number(cat.id);
            if (!Number.isNaN(categoryId)) {
              categoriesMap.set(categoryId, {
                id: categoryId,
                name: cat.name,
                parent_id: cat.parent_id !== undefined && cat.parent_id !== null ? Number(cat.parent_id) : null,
                slug: cat.slug,
              });
            }
            if (Array.isArray(cat.children)) {
              cat.children.forEach(addCategoryToMap);
            }
          };
          categoriesData.forEach(addCategoryToMap);
        }

        // Transform images
        const transformedImages: string[] = [];
        const coverImageUrl = apiProduct.cover_image 
          ? (apiProduct.cover_image.startsWith('http') ? apiProduct.cover_image : getStorageUrl(apiProduct.cover_image)) 
          : null;
        normalizeImageList(apiProduct.images).forEach((fullUrl) => {
          if (!(coverImageUrl && fullUrl === coverImageUrl)) {
            transformedImages.push(fullUrl);
          }
        });

        const transformedSizeGuideImages: string[] = normalizeImageList(apiProduct.size_guide_images);

        const normalizedVariants = Array.isArray(apiProduct.variants)
          ? apiProduct.variants.map((variant: any) => ({
              ...variant,
              variant_values: normalizeVariantValues(variant?.variant_values),
              images: normalizeImageList(
                variant?.images ??
                variant?.variant_images ??
                variant?.image_urls ??
                variant?.image
              ),
            }))
          : [];

        const basePrice = Number(apiProduct.price);
        const explicitDiscountPercentage = apiProduct.discount_percentage ? Number(apiProduct.discount_percentage) : 0;
        const explicitOriginalPrice = Number(apiProduct.original_price || apiProduct.compare_price || 0);
        const salePrice = explicitDiscountPercentage > 0
          ? Number((basePrice * (1 - explicitDiscountPercentage / 100)).toFixed(2))
          : basePrice;
        const displayOriginalPrice = Math.max(
          salePrice,
          explicitDiscountPercentage > 0 ? Math.max(basePrice, explicitOriginalPrice) : explicitOriginalPrice
        );
        const discountAmount = Math.max(0, displayOriginalPrice - salePrice);

        const transformedProduct: ProductDetail = {
          id: apiProduct.id,
          name: apiProduct.name,
          price: salePrice,
          originalPrice: basePrice,
          comparePrice: displayOriginalPrice,
          explicitDiscountPercentage,
          images: transformedImages.length > 0 ? transformedImages : ['/placeholder.svg'],
          rating: apiProduct.rating || 0,
          reviews: apiProduct.reviews_count || 0,
          category: apiProduct.category?.name || '',
          brand: apiProduct.brand?.name || '',
          discount: discountAmount,
          discountPercentage: discountAmount > 0
            ? (explicitDiscountPercentage > 0 ? explicitDiscountPercentage : Math.round((discountAmount / displayOriginalPrice) * 100))
            : 0,
          inStock: apiProduct.stock_status === 'stock_based'
            ? ((apiProduct.stock_quantity || 0) > 0 || (apiProduct.variants && apiProduct.variants.length > 0))
            : (apiProduct.stock_status === 'in_stock' || (apiProduct.in_stock && apiProduct.stock_status !== 'out_of_stock')),
          stockStatus: apiProduct.stock_status || (apiProduct.in_stock ? 'in_stock' : 'out_of_stock'),
          stockCount: apiProduct.stock_quantity || 0,
          description: apiProduct.description || '',
          features: apiProduct.features || [],
          specifications: apiProduct.specifications || {},
          warranty: apiProduct.warranty || 'ضمان شامل',
          deliveryTime: apiProduct.delivery_time || '2-3 أيام عمل',
          sku: apiProduct.sku || '',
          dimensions: apiProduct.dimensions,
          weight: apiProduct.weight,
          viewsCount: apiProduct.views_count || 0,
          variants: normalizedVariants,
          filter_values: (() => {
            const raw = apiProduct.filter_values || {};
            const normalized: Record<string, string[]> = {};
            Object.entries(raw).forEach(([key, val]) => {
              if (Array.isArray(val)) {
                normalized[key] = val;
              } else if (typeof val === 'string' && val.trim()) {
                normalized[key] = [val];
              }
            });
            return normalized;
          })(),
          show_description: apiProduct.show_description !== undefined ? Boolean(apiProduct.show_description) : true,
          show_specifications: apiProduct.show_specifications !== undefined ? Boolean(apiProduct.show_specifications) : true,
          sizeGuideImages: transformedSizeGuideImages,
          cover_image: coverImageUrl,
        };

        if (categoriesMap.size > 0) {
          setBreadcrumbCategories(deriveBreadcrumbCategories(apiProduct, categoriesMap));
        }

        if (transformedProduct.show_description) {
          setActiveTab('description');
        } else if (transformedProduct.show_specifications) {
          setActiveTab('specifications');
        }

        if (normalizedVariants.length > 0) {
          // Find first variant with stock to set as default
          const firstAvailableVariant = normalizedVariants.find((v: any) => Number(v.stock_quantity) > 0) || normalizedVariants[0];
          setSelectedOptions({ ...firstAvailableVariant.variant_values });
        } else {
          setSelectedOptions({});
        }

        setProduct(transformedProduct);
        setQuantity(1);

        trackEvent('ViewContent', {
          content_name: transformedProduct.name,
          content_ids: [transformedProduct.id],
          content_type: 'product',
          value: transformedProduct.price,
          currency: 'ILS'
        });

        sessionStorage.setItem(`viewed_product_${id}`, "true");
        setLoading(false); // Success - stop loading
      } catch (err) {
        if (id !== lastFetchedId.current) return;
        console.error('Error loading product:', err);
        setLoading(false); // Error - stop loading to show "Not found" or error UI
      }
    };

    loadProduct();
  }, [id]);

  useEffect(() => {
    if (!product || product.stockStatus !== 'stock_based') return;
    if (quantity <= effectiveStockLimit) return;

    setQuantity(Math.max(1, effectiveStockLimit));
  }, [product, quantity, effectiveStockLimit]);

  const handleAddToCart = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!displayInStock) return;
    if (product) {
      if (product.stockStatus === 'stock_based' && quantity > effectiveStockLimit) {
        setQuantity(Math.max(1, effectiveStockLimit));
        return;
      }

      const buttonElement = event.currentTarget;
      const cartImage = galleryImages[0] || product.cover_image || (product.images && product.images[0] ? product.images[0] : '/placeholder.svg');

      // Trigger animation
      triggerAnimation(buttonElement, {
        image: cartImage,
        name: product.name
      });

      // Add to cart
      addItem({
        id: product.id,
        variant_id: matchingVariant?.id,
        name: product.name,
        price: displayPrice,
        original_price: displayOriginalPrice,
        discount_percentage: displayDiscountPercentage,
        image: cartImage,
        brand: product.brand || '',
        type: 'product',
        selected_options: matchingVariant?.variant_values,
        stock_quantity: displayStockCount,
        manage_stock: product.stockStatus === 'stock_based'
      });
      // Update quantity after adding
      if (quantity > 1) {
        updateQuantity(product.id, quantity, matchingVariant?.id);
      }

      // Track AddToCart event
      trackEvent('AddToCart', {
        content_name: product.name,
        content_ids: [product.id],
        content_type: 'product',
        value: displayPrice * quantity,
        currency: 'ILS',
        quantity: quantity
      });
    }
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity < 1) return;
    if (product?.stockStatus === 'stock_based' && newQuantity > effectiveStockLimit) return;
    setQuantity(newQuantity);
  };

  const handleWhatsAppOrder = () => {
    if (!displayInStock || !product) return;

    if (!whatsappNumber) {
      alert('رقم الواتساب غير متوفر حالياً');
      return;
    }

    // Clean phone number (remove any non-numeric characters)
    const phoneNumber = whatsappNumber.replace(/[^0-9]/g, '');
    const productName = product.name;
    const productPrice = formatPrice(product.price);
    const productUrl = window.location.href;
    const quantityText = quantity > 1 ? `الكمية: ${quantity}` : '';

    const message = `مرحباً، أريد طلب المنتج التالي:\n\n${productName}\nالسعر: ${productPrice} ₪\n${quantityText}\n\nرابط المنتج: ${productUrl}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
  };

  const handleShare = async () => {
    if (!product) return;

    const productUrl = window.location.href;
    const productName = product.name;
    const productPrice = formatPrice(product.price);
    const shareText = `${productName} - ${productPrice} ₪`;

    // Check if Web Share API is available (mobile devices)
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: shareText,
          url: productUrl,
        });
        return;
      } catch (err) {
        // User cancelled or error occurred, fall back to share menu
        if ((err as Error).name !== 'AbortError') {
          console.log('Share failed:', err);
        }
      }
    }

    // Show share menu
    setShowShareMenu(true);
  };

  const shareToPlatform = (platform: string) => {
    if (!product) return;

    const productUrl = window.location.href;
    const productName = product.name;
    const productPrice = formatPrice(product.price);
    const shareText = `${productName} - ${productPrice} ₪`;

    setShowShareMenu(false);

    switch (platform) {
      case 'copy':
        navigator.clipboard.writeText(productUrl).then(() => {
          alert('تم نسخ رابط المنتج!');
        }).catch(() => {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = productUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          alert('تم نسخ رابط المنتج!');
        });
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`, '_blank', 'width=600,height=400');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(productUrl)}`, '_blank', 'width=600,height=400');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + productUrl)}`, '_blank');
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
        break;
    }
  };

  const galleryImages = useMemo(() => {
    if (!product) return [];
    
    // 1. If variant is selected and HAS images, show ONLY those variant images.
    const variantImages = Array.isArray(matchingVariant?.images)
      ? (matchingVariant?.images as string[]).filter(Boolean)
      : [];
    if (variantImages.length > 0) {
      return variantImages;
    }
    
    // 2. If no variant selected or selected variant HAS NO images, return cover image + base images
    const baseImages = product.images.filter(img => img !== "/placeholder.svg");
    if (product.cover_image) {
      const fullCoverUrl = product.cover_image.startsWith('http') 
        ? product.cover_image 
        : getStorageUrl(product.cover_image);
      
      // Only add if not already in baseImages (sanity check)
      if (!baseImages.includes(fullCoverUrl)) {
        return [fullCoverUrl, ...baseImages];
      }
    }
    
    // If still empty after filtering placeholder, return placeholder.
    return baseImages.length > 0 ? baseImages : ["/placeholder.svg"];
  }, [product, matchingVariant]);

  // Reset selected image when variant changes
  useEffect(() => {
    setSelectedImage(0);
  }, [matchingVariant?.id]);

  // Keep preloading focused to avoid saturating bandwidth on huge galleries.
  useEffect(() => {
    if (!product) return;

    const immediateUrls = galleryImages.slice(0, 2).filter(Boolean);
    const deferredUrls = galleryImages.slice(2, 4).filter(Boolean);

    preloadImages(immediateUrls, toMainImageSrc);

    const deferLoad = () => preloadImages(deferredUrls, toMainImageSrc);

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = (window as any).requestIdleCallback(deferLoad, { timeout: 1500 });
      return () => (window as any).cancelIdleCallback?.(id);
    }

    const timer = window.setTimeout(deferLoad, 300);
    return () => window.clearTimeout(timer);
  }, [product, galleryImages]);

  const nextImage = () => {
    if (product) {
      setSelectedImage((prev) => (prev + 1) % galleryImages.length);
    }
  };

  const prevImage = () => {
    if (product) {
      setSelectedImage((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 arabic">
        <Header
          showSearch={true}
          showActions={true}
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">جاري تحميل تفاصيل المنتج...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 arabic">
        <Header
          showSearch={true}
          showActions={true}
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">المنتج غير موجود</h2>
            <p className="text-gray-600 mb-4">عذراً، لم يتم العثور على المنتج المطلوب</p>
            <Link
              to={returnToProductsUrl}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              العودة للمنتجات
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "الرئيسية", href: "/" },
    { label: "المنتجات", href: returnToProductsUrl },
  ];

  if (breadcrumbCategories.main) {
    breadcrumbItems.push({
      label: breadcrumbCategories.main.name,
      href: `/products?category_id=${breadcrumbCategories.main.id}`,
    });
  }

  if (
    breadcrumbCategories.sub &&
    breadcrumbCategories.sub.id !== breadcrumbCategories.main?.id
  ) {
    breadcrumbItems.push({
      label: breadcrumbCategories.sub.name,
      href: `/products?category_id=${breadcrumbCategories.sub.id}`,
    });
  }

  breadcrumbItems.push({ label: product.name });

  const matchingVariantPlaceHolder = null; // replaced by top-level matchingVariant

  // display Variables are now at the top

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const productUrl = `${siteUrl}/product/${product.id}`;
  // Ensure product image URL is absolute and properly formatted
  let productImage = `${siteUrl}/placeholder.svg`;
  if (product.images && product.images[0]) {
    productImage = getStorageUrl(product.images[0]);
  }

  // Build breadcrumb items for structured data
  const breadcrumbStructuredData = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "الرئيسية",
      "item": typeof window !== 'undefined' ? window.location.origin : ''
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "المنتجات",
      "item": `${typeof window !== 'undefined' ? window.location.origin : ''}/products`
    }
  ];

  if (breadcrumbCategories.main) {
    breadcrumbStructuredData.push({
      "@type": "ListItem",
      "position": breadcrumbStructuredData.length + 1,
      "name": breadcrumbCategories.main.name,
      "item": `${typeof window !== 'undefined' ? window.location.origin : ''}/products?category_id=${breadcrumbCategories.main.id}`
    });
  }

  if (breadcrumbCategories.sub) {
    breadcrumbStructuredData.push({
      "@type": "ListItem",
      "position": breadcrumbStructuredData.length + 1,
      "name": breadcrumbCategories.sub.name,
      "item": `${typeof window !== 'undefined' ? window.location.origin : ''}/products?category_id=${breadcrumbCategories.sub.id}`
    });
  }

  breadcrumbStructuredData.push({
    "@type": "ListItem",
    "position": breadcrumbStructuredData.length + 1,
    "name": product.name,
    "item": productUrl
  });

  // Structured Data for Product - Multiple Schemas
  const structuredDataArray = [
    // Product Schema with enhanced details
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "description": product.description || `${product.name} من ${product.brand}${siteName ? ` - متوفر في ${siteName}` : ''}.`,
      "image": product.images?.map((img: string) => getStorageUrl(img)) || [productImage],
      "brand": {
        "@type": "Brand",
        "name": product.brand
      },
      "category": product.category,
      "sku": product.id.toString(),
      "mpn": product.id.toString(),
      "offers": {
        "@type": "Offer",
        "url": productUrl,
        "priceCurrency": "ILS",
        "price": product.price.toString(),
        "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "itemCondition": "https://schema.org/NewCondition",
        "seller": {
          "@type": "Organization",
          "name": siteName || ""
        }
      },
      ...(product.rating > 0 && product.reviews > 0 ? {
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": product.rating.toString(),
          "reviewCount": product.reviews.toString(),
          "bestRating": "5",
          "worstRating": "1"
        }
      } : {})
    },
    // BreadcrumbList Schema
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbStructuredData
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 arabic">
      <SEO
        title={`${product.name} - ${product.brand}${siteName ? ` | ${siteName}` : ''}`}
        description={product.description || `${product.name} من ${product.brand} - ${product.category}${siteName ? ` متوفر في ${siteName}` : ''}. السعر: ${product.price} ₪. توصيل سريع وضمان شامل.`}
        keywords={`${product.name}, ${product.brand}, ${product.category}${siteName ? `, ${siteName}` : ''}`}
        image={productImage}
        type="product"
        url={productUrl}
        structuredData={structuredDataArray}
      />
      <Header
        showSearch={true}
        showActions={true}
      />

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
            {breadcrumbItems.map((item, index) => (
              <Fragment key={`${item.label}-${index}`}>
                {index > 0 && <ChevronLeft className="w-4 h-4" />}
                {item.href ? (
                  <Link to={item.href} className="hover:text-emerald-600">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-gray-800">{item.label}</span>
                )}
              </Fragment>
            ))}
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 mb-12">
          {/* Product Images */}
          <div className="space-y-4 mt-6">
            {/* Main Image */}
            <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden">
              <img
                src={toMainImageSrc(galleryImages[selectedImage] || '/placeholder.svg')}
                alt={product.name}
                width="600"
                height="600"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="w-full h-96 object-contain bg-white cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setIsImageModalOpen(true)}
                onError={(e) => {
                  console.error('Image load error:', e.currentTarget.src);
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
              {displayDiscountPercentage > 0 && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  خصم {displayDiscountPercentage}%
                </div>
              )}

              {/* Image Navigation */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Images */}
            {galleryImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {galleryImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index ? 'border-emerald-500' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    type="button"
                  >
                    <img
                      src={toThumbImageSrc(image || '/placeholder.svg')}
                      alt={`${product.name} ${index + 1}`}
                      width="80"
                      height="80"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain bg-white cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => {
                        setSelectedImage(index);
                        // setIsImageModalOpen(true);
                      }}
                      onError={(e) => {
                        console.error('Thumbnail image load error:', e.currentTarget.src);
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Brand and SKU */}
            <div className="flex items-center justify-between">
              <span className="text-emerald-600 font-semibold text-lg">{product.brand}</span>
              {displaySku && (
                <span className="text-gray-500 text-sm bg-gray-100 px-3 py-1 rounded-full">
                  كود المنتج: <span className="font-mono">{displaySku}</span>
                </span>
              )}
            </div>

            {/* Product Name */}
            <h1 className="text-3xl font-bold text-gray-800 leading-tight">{product.name}</h1>

            {/* Price */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-3xl font-bold text-emerald-600">{formatPrice(displayPrice)} ₪</span>
              {displayOriginalPrice > displayPrice && (
                <>
                  <span className="text-xl text-gray-500 line-through">{formatPrice(displayOriginalPrice)} ₪</span>
                  <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm font-bold animate-pulse">
                    وفر {displayDiscountPercentage}%
                  </span>
                </>
              )}
            </div>
            {displaySavingsAmount > 0 && (
              <div className="mt-2">
                <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-600">
                  وفر {formatPrice(displaySavingsAmount)} ₪
                </span>
              </div>
            )}

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${displayStockStatus === 'stock_based'
                ? (displayStockCount > 0 ? 'bg-green-500' : 'bg-red-500')
                : (displayStockStatus === 'in_stock' ? 'bg-green-500' :
                  displayStockStatus === 'out_of_stock' ? 'bg-red-500' :
                    'bg-orange-500')
                }`}></div>
              <span className={`font-medium ${displayStockStatus === 'stock_based'
                ? (displayStockCount > 0 ? 'text-green-600' : 'text-red-600')
                : (displayStockStatus === 'in_stock' ? 'text-green-600' :
                  displayStockStatus === 'out_of_stock' ? 'text-red-600' :
                    'text-orange-600')
                }`}>
                {displayStockStatus === 'stock_based'
                  ? (displayStockCount > 0 ? 'متوفر' : 'نفذت الكمية')
                  : (displayStockStatus === 'in_stock' ? 'متوفر' :
                    displayStockStatus === 'out_of_stock' ? 'غير متوفر' :
                      'طلب مسبق')}
              </span>
              {showProductViews && (
                <>
                  <div className="h-4 w-px bg-gray-300 mx-2"></div>
                  <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>شوهد {product.viewsCount} مرة</span>
                  </div>
                </>
              )}
            </div>

            {(product.sizeGuideImages?.length || 0) > 0 && (
              <div className="pt-1 mb-4">
                <button
                  type="button"
                  onClick={() => setIsSizeGuideModalOpen(true)}
                  className="w-full sm:w-auto px-3 py-1.5 rounded-lg border-2 border-gray-300 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 transition-colors inline-flex items-center gap-1.5 text-sm font-semibold"
                  aria-label="دليل المقاسات"
                  title="دليل المقاسات"
                >
                  <Ruler className="w-4 h-4" />
                  دليل المقاسات
                </button>
              </div>
            )}

            {/* Variant Selectors */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-4 rounded-xl border p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-800">خيارات المنتج:</h3>
                {Object.keys(product.variants[0].variant_values).map((key, index) => {
                  const values = product.filter_values[key] || [];
                  if (values.length === 0) return null; // fallback
                  return (
                    <div key={key} className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">{key}:</label>
                      <div className="flex flex-wrap gap-2">
                        {values.map((val: string) => {
                          const isSelected = selectedOptions[key] === val;

                          // Hierarchical availability: depends on selection of previous attributes only
                          const isAvailable = product.variants?.some(v => {
                            if (v.variant_values[key] !== val) return false;
                            if (product.stockStatus !== 'in_stock' && Number(v.stock_quantity) <= 0) return false;

                            const variantKeys = Object.keys(product.variants[0].variant_values);
                            // Must match all PREVIOUSly selected attributes (hierarchy)
                            for (let i = 0; i < index; i++) {
                              const prevKey = variantKeys[i];
                              if (v.variant_values[prevKey] !== selectedOptions[prevKey]) return false;
                            }
                            return true;
                          });

                          return (
                            <button
                              key={val}
                              onMouseEnter={() => preloadVariantImagesByOption(key, val)}
                              onTouchStart={() => preloadVariantImagesByOption(key, val)}
                              onClick={() => {
                                if (!product || !product.variants) return;
                                const variantKeys = Object.keys(product.variants[0].variant_values);
                                let newOptions = { ...selectedOptions, [key]: val };

                                // Snap subsequent attributes to first available in stock
                                for (let i = index + 1; i < variantKeys.length; i++) {
                                  const nextKey = variantKeys[i];
                                  const currentNextVal = newOptions[nextKey];

                                  const isNextAvailable = product.variants.some(v =>
                                    v.variant_values[nextKey] === currentNextVal &&
                                    variantKeys.slice(0, i).every(k => v.variant_values[k] === newOptions[k]) &&
                                    (product.stockStatus === 'in_stock' || Number(v.stock_quantity) > 0)
                                  );

                                  if (!isNextAvailable) {
                                    const firstAvailable = product.variants.find(v =>
                                      variantKeys.slice(0, i).every(k => v.variant_values[k] === newOptions[k]) &&
                                      (product.stockStatus === 'in_stock' || Number(v.stock_quantity) > 0)
                                    );
                                    if (firstAvailable) {
                                      newOptions[nextKey] = firstAvailable.variant_values[nextKey];
                                    }
                                  }
                                }
                                setSelectedOptions(newOptions);
                              }}
                              disabled={index > 0 && !isAvailable && !isSelected}
                              className={`px-4 py-2 text-sm rounded-lg border transition-all relative overflow-hidden ${isSelected
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md transform scale-105 active:scale-100 ring-2 ring-emerald-300 ring-offset-2'
                                : isAvailable
                                  ? 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-sm'
                                  : 'bg-gray-100 text-gray-400 border-gray-200 opacity-50 cursor-not-allowed'
                                }`}
                              title={!isAvailable ? (index === 0 ? 'هذا الخيار غير متوفر نهائياً' : 'هذا الخيار غير متوفر حالياً لهذا التحديد') : ''}
                            >
                              <span className={isSelected ? 'font-bold' : ''}>{val}</span>
                              {!isAvailable && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="w-[140%] h-[2px] bg-red-400/40 -rotate-45 transform origin-center"></div>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {false && (product.sizeGuideImages?.length || 0) > 0 && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsSizeGuideModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg border-2 border-gray-300 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 transition-colors inline-flex items-center gap-2 font-semibold"
                  aria-label="دليل المقاسات"
                  title="دليل المقاسات"
                >
                  <Ruler className="w-5 h-5" />
                  دليل المقاسات
                </button>
              </div>
            )}

            {/* Main Features */}
            {Array.isArray(product.features) && product.features.filter((f) => typeof f === 'string' && f.trim().length > 0).length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">المميزات الرئيسية:</h3>
                <ul className="space-y-2">
                  {product.features
                    .filter((feature) => typeof feature === 'string' && feature.trim().length > 0)
                    .map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-emerald-500" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {/* Quantity and Add to Cart */}
            {displayInStock && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="font-medium text-gray-700">الكمية:</span>
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 font-medium">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="p-2 hover:bg-gray-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex gap-4">
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      إضافة للسلة
                    </button>
                    <button
                      onClick={() => {
                        if (product && !isProcessingWishlist) {
                          toggleWishlist(product.id);
                        }
                      }}
                      disabled={isProcessingWishlist}
                      className={`p-3 rounded-lg border-2 transition-colors ${productIsWishlisted
                        ? 'border-red-500 bg-red-50 text-red-500'
                        : 'border-gray-300 hover:border-red-300 hover:bg-red-50 hover:text-red-500'
                        }`}
                    >
                      <Heart className={`w-5 h-5 ${productIsWishlisted ? 'fill-current' : ''}`} />
                    </button>
                    <div className="relative">
                      <button
                        onClick={handleShare}
                        className="p-3 rounded-lg border-2 border-gray-300 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-500 transition-colors"
                        aria-label="مشاركة المنتج"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>

                      {/* Share Menu */}
                      {showShareMenu && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowShareMenu(false)}
                          />
                          <div className="absolute left-0 bottom-full mb-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 min-w-[200px]">
                            <button
                              onClick={() => shareToPlatform('copy')}
                              className="w-full text-right px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                              <span>📋</span>
                              <span>نسخ الرابط</span>
                            </button>
                            <button
                              onClick={() => shareToPlatform('facebook')}
                              className="w-full text-right px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                              <span>📘</span>
                              <span>Facebook</span>
                            </button>
                            <button
                              onClick={() => shareToPlatform('twitter')}
                              className="w-full text-right px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                              <span>🐦</span>
                              <span>Twitter</span>
                            </button>
                            <button
                              onClick={() => shareToPlatform('whatsapp')}
                              className="w-full text-right px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                              <span>💬</span>
                              <span>WhatsApp</span>
                            </button>
                            <button
                              onClick={() => shareToPlatform('telegram')}
                              className="w-full text-right px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                              <span>✈️</span>
                              <span>Telegram</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {showWhatsAppOrderButton && (
                    <button
                      onClick={handleWhatsAppOrder}
                      className="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
                    >
                      <MessageCircle className="w-5 h-5" />
                      طلب عبر واتساب
                    </button>
                  )}
                </div>
              </div>
            )}

            {false && (product.sizeGuideImages?.length || 0) > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsSizeGuideModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg border-2 border-gray-300 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 transition-colors inline-flex items-center gap-2 font-semibold"
                  aria-label="دليل المقاسات"
                  title="دليل المقاسات"
                >
                  <Ruler className="w-5 h-5" />
                  دليل المقاسات
                </button>
              </div>
            )}

            {/* Service Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
              <div className="flex items-center gap-3">
                <Truck className="w-6 h-6 text-emerald-500" />
                <div>
                  <p className="font-medium text-gray-800">توصيل سريع</p>
                  <p className="text-sm text-gray-600">{product.deliveryTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-green-500" />
                <div>
                  <p className="font-medium text-gray-800">جودة عالية</p>
                  <p className="text-sm text-gray-600">منتجاتنا أصلية وذات جودة عالية</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6 text-orange-500" />
                <div>
                  <p className="font-medium text-gray-800">خدمة عملاء</p>
                  <p className="text-sm text-gray-600">على مدار الساعة</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        {(product.show_description || product.show_specifications) && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Tab Headers */}
          <div className="border-b">
            <div className="flex">
              {
                [
                  { key: 'description', label: 'الوصف', show: product.show_description },
                  { key: 'specifications', label: 'المواصفات', show: product.show_specifications }
                ].filter(tab => tab.show).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-6 py-4 font-medium transition-colors ${activeTab === tab.key
                    ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                    : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'description' && product.show_description && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 mb-4">وصف المنتج</h3>
                <div
                  className="text-gray-700 leading-relaxed text-sm prose ck-content max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.description || '' }}
                />
              </div>
            )}

            {activeTab === 'specifications' && product.show_specifications && (
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">المواصفات التقنية</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {product.dimensions && (
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white">
                      <div className="w-1/2 p-3 bg-gray-50 font-medium text-gray-900 border-l border-gray-200 flex items-center justify-center text-center">
                        الأبعاد
                      </div>
                      <div className="w-1/2 p-3 text-gray-700 flex items-center justify-center text-center" dir="ltr">
                        {product.dimensions}
                      </div>
                    </div>
                  )}
                  {product.weight && Number(product.weight) > 0 && (
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white">
                      <div className="w-1/2 p-3 bg-gray-50 font-medium text-gray-900 border-l border-gray-200 flex items-center justify-center text-center">
                        الوزن
                      </div>
                      <div className="w-1/2 p-3 text-gray-700 flex items-center justify-center text-center">
                        {product.weight} كجم
                      </div>
                    </div>
                  )}
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white">
                      <div className="w-1/2 p-3 bg-gray-50 font-medium text-gray-900 border-l border-gray-200 flex items-center justify-center text-center">
                        {key}
                      </div>
                      <div className="w-1/2 p-3 text-gray-700 flex items-center justify-center text-center">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
        )}        {/* Contact Support */}
        <div className="mt-12 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-2xl p-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">هل تحتاج مساعدة؟</h3>
            <p className="text-emerald-100 mb-6">فريق خدمة العملاء جاهز لمساعدتك في أي وقت</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {headerSettings.header_phone && (
                <a
                  href={`tel:${headerSettings.header_phone.replace(/[^0-9+]/g, '')}`}
                  className="flex items-center gap-2 bg-white text-emerald-600 px-6 py-3 rounded-lg hover:bg-emerald-50 transition-colors font-semibold"
                >
                  <Phone className="w-5 h-5" />
                  <span>اتصل بنا: <span dir="ltr" className="inline-block">{headerSettings.header_phone}</span></span>
                </a>
              )}
              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-semibold"
                >
                  <MessageCircle className="w-5 h-5" />
                  واتساب
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Size Guide Modal */}
      {isSizeGuideModalOpen && product && (product.sizeGuideImages?.length || 0) > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4"
          onClick={() => setIsSizeGuideModalOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-4 md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsSizeGuideModalOpen(false)}
              className="sticky top-0 mr-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              aria-label="إغلاق دليل المقاسات"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="mb-4 text-xl font-bold text-gray-900">دليل المقاسات</h3>
            <div className="space-y-4">
              {product.sizeGuideImages?.map((img, index) => (
                <img
                  key={`${img}-${index}`}
                  src={toMainImageSrc(img)}
                  alt={`دليل المقاسات ${index + 1}`}
                  className="w-full rounded-lg border border-gray-100 bg-white object-contain"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Image Modal/Lightbox */}
      {isImageModalOpen && product && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div className="relative max-w-7xl w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-4 right-4 z-10 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full p-2 transition-all"
              aria-label="إغلاق"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Main Image */}
            <img
              src={toModalImageSrc(galleryImages[selectedImage] || '/placeholder.svg')}
              alt={product.name}
              loading="eager"
              decoding="async"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />

            {/* Navigation Buttons */}
            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full p-3 transition-all z-10"
                  aria-label="الصورة السابقة"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full p-3 transition-all z-10"
                  aria-label="الصورة التالية"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Image Counter */}
            {galleryImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/95 text-gray-800 border border-gray-300 px-4 py-2 rounded-full text-sm">
                {selectedImage + 1} / {galleryImages.length}
              </div>
            )}

            {/* Thumbnail Strip (optional - at bottom) */}
            {galleryImages.length > 1 && galleryImages.length <= 10 && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2 overflow-x-auto max-w-4xl px-4">
                {galleryImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(index);
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index
                      ? 'border-emerald-500 scale-110'
                      : 'border-gray-300 hover:border-gray-500'
                      }`}
                  >
                    <img
                      src={toThumbImageSrc(image || '/placeholder.svg')}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-contain bg-white"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Product;

