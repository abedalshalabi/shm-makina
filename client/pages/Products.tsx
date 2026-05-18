import { useState, useMemo, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Heart,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAnimation } from "../context/AnimationContext";
import Header from "../components/Header";
import SEO from "../components/SEO";
import { productsAPI, categoriesAPI, brandsAPI, settingsAPI } from "../services/api";
import { BASE_PATH, getOptimizedImageUrl, getStorageUrl } from "../config/env";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useWishlist } from "../context/WishlistContext";

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  comparePrice?: number;
  image?: string;
  images?: string[];
  rating: number;
  reviews: number;
  category: string;
  brand: string;
  discount?: number;
  discountPercentage?: number;
  inStock: boolean;
  stockStatus?: string;
  categoryId?: number;
  categoryIds?: number[];
  filterValues?: Record<string, any>;
  viewsCount?: number;
  slug?: string;
  hasVariants?: boolean;
  hasPriceRange?: boolean;
  maxPrice?: number;
}

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

const normalizeColorLabel = (value: string): string =>
  value.trim().replace(/\s+/g, " ");

const isHexColor = (value: string): boolean =>
  /^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(value.trim());

const resolveColorHex = (label: string): string | null => {
  const trimmed = label.trim();
  if (!trimmed) return null;
  if (isHexColor(trimmed)) return trimmed;
  return colorNameToHex[trimmed.toLowerCase()] || null;
};

const extractAvailableColors = (filterValues?: Record<string, any>): string[] => {
  if (!filterValues || typeof filterValues !== "object") {
    return [];
  }

  const colors = new Set<string>();
  Object.entries(filterValues).forEach(([key, rawValue]) => {
    const normalizedKey = key.toLowerCase();
    const compactKey = normalizedKey.replace(/\s+/g, "");
    const isColorKey =
      compactKey.includes("لون") ||
      compactKey.includes("الوان") ||
      compactKey.includes("ألوان") ||
      compactKey.includes("الالوان") ||
      compactKey.includes("color") ||
      compactKey.includes("colors");

    if (!isColorKey) {
      return;
    }

    const valuesArray = Array.isArray(rawValue)
      ? rawValue
      : typeof rawValue === "string"
        ? rawValue.split(",")
        : [];

    valuesArray.forEach((item) => {
      if (typeof item !== "string") return;
      const normalized = normalizeColorLabel(item);
      if (normalized) {
        colors.add(normalized);
      }
    });
  });

  return Array.from(colors);
};

type ProductsViewCache = {
  key: string;
  products: Product[];
  currentPage: number;
  hasMore: boolean;
  scrollY: number;
  anchorProductId: number | null;
  shouldRestore: boolean;
};

let productsViewCache: ProductsViewCache | null = null;
const PLACEHOLDER_IMAGE = `${BASE_PATH || ''}/placeholder.svg`;
const DYNAMIC_FILTERS_PARAM = "filter_values";
const PRODUCTS_RESTORE_LATEST_KEY = "products-restore:latest";

const parseDynamicFiltersFromSearch = (search: string): Record<string, string> => {
  const params = new URLSearchParams(search);
  const raw = params.get(DYNAMIC_FILTERS_PARAM);

  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.entries(parsed).reduce<Record<string, string>>((acc, [key, value]) => {
      if (typeof value === "string" && value.trim() !== "") {
        acc[key] = value;
      }
      return acc;
    }, {});
  } catch {
    return {};
  }
};

const stringifyDynamicFiltersForSearch = (filters: Record<string, string>): string | null => {
  const cleaned = Object.entries(filters).reduce<Record<string, string>>((acc, [key, value]) => {
    if (typeof value === "string" && value.trim() !== "") {
      acc[key] = value.trim();
    }
    return acc;
  }, {});

  return Object.keys(cleaned).length > 0 ? JSON.stringify(cleaned) : null;
};

const Products = () => {
  const { addItem } = useCart();
  const { triggerAnimation } = useAnimation();
  const { wishlistProcessing, toggleWishlist, isWishlisted } = useWishlist();
  const location = useLocation();
  const navigate = useNavigate();
  const currentProductsRoute = `${location.pathname}${location.search}`;
  const routeCacheKey = `${location.pathname}${location.search}`;
  const productsSnapshotKey = `products-snapshot:${location.pathname}${location.search}`;
  const productsRestoreFlagKey = `products-restore:${location.pathname}${location.search}`;
  const initialProductsSnapshot = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    if (productsViewCache?.key === routeCacheKey && productsViewCache.shouldRestore) {
      return {
        products: productsViewCache.products,
        currentPage: productsViewCache.currentPage,
        hasMore: productsViewCache.hasMore,
      };
    }

    const shouldRestore = sessionStorage.getItem(productsRestoreFlagKey) === "1";
    if (!shouldRestore) {
      return null;
    }

    try {
      const raw = sessionStorage.getItem(productsSnapshotKey);
      if (!raw) {
        const latestRaw = sessionStorage.getItem(PRODUCTS_RESTORE_LATEST_KEY);
        if (!latestRaw) return null;
        const latest = JSON.parse(latestRaw);
        if (!latest || latest.routeKey !== routeCacheKey || !Array.isArray(latest.products)) return null;
        return {
          products: latest.products as Product[],
          currentPage: Number(latest.currentPage) || 1,
          hasMore: latest.hasMore !== false,
        };
      }

      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.products)) {
        return null;
      }

      return {
        products: parsed.products as Product[],
        currentPage: Number(parsed.currentPage) || 1,
        hasMore: parsed.hasMore !== false,
      };
    } catch {
      return null;
    }
  }, [routeCacheKey, productsRestoreFlagKey, productsSnapshotKey]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedBrand, setSelectedBrand] = useState("الكل");
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [sortBy, setSortBy] = useState("default");
  const [showFilters, setShowFilters] = useState(false);
  const [collapsedFilters, setCollapsedFilters] = useState<Record<string, boolean>>({});

  // API State
  const [products, setProducts] = useState<Product[]>(() => initialProductsSnapshot?.products || []);
  const [categories, setCategories] = useState<any[]>([]);
  const [allCategoriesList, setAllCategoriesList] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<any>(null);
  const [categoryFilters, setCategoryFilters] = useState<any[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<{ [key: string]: string }>({});
  const [allBrands, setAllBrands] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(() => !initialProductsSnapshot);
  const [error, setError] = useState("");
  const [showProductViews, setShowProductViews] = useState(true);
  const hasRestoredScrollRef = useRef(false);
  const pendingScrollRestoreRef = useRef<number | null>(null);
  const pendingProductRestoreRef = useRef<number | null>(null);
  const pendingPageRestoreRef = useRef<number | null>(null);
  const productsScrollKey = `products-scroll:${location.pathname}${location.search}`;
  const productsAnchorKey = `products-anchor:${location.pathname}${location.search}`;
  const productsPageKey = `products-page:${location.pathname}${location.search}`;

  useEffect(() => {
    sessionStorage.setItem("last-products-route", currentProductsRoute);
  }, [currentProductsRoute]);

  const selectedParentCategory = useMemo(() => {
    if (selectedCategoryId === null) {
      return null;
    }

    const numericId = Number(selectedCategoryId);
    if (Number.isNaN(numericId)) {
      return null;
    }

    const fromMain = categories.find((cat) => Number(cat.id) === numericId);
    if (fromMain) {
      return fromMain;
    }

    const fromAll = allCategoriesList.find((cat) => Number(cat.id) === numericId);
    return fromAll || null;
  }, [selectedCategoryId, categories, allCategoriesList]);

  // Pagination state for infinity scroll
  const [currentPage, setCurrentPage] = useState(() => initialProductsSnapshot?.currentPage || 1);
  const [hasMore, setHasMore] = useState(() => initialProductsSnapshot?.hasMore ?? true);
  const [loadingMore, setLoadingMore] = useState(false);
  const skipInitialReloadRef = useRef(Boolean(initialProductsSnapshot));
  const isRestoringSnapshotRef = useRef(Boolean(initialProductsSnapshot));
  const suppressAutoReloadUntilUserActionRef = useRef(Boolean(initialProductsSnapshot));
  const fullReloadVersionRef = useRef(0);

  const cancelSnapshotRestoreState = useCallback(() => {
    suppressAutoReloadUntilUserActionRef.current = false;
    isRestoringSnapshotRef.current = false;
    hasRestoredScrollRef.current = true;
    pendingScrollRestoreRef.current = null;
    pendingProductRestoreRef.current = null;
    pendingPageRestoreRef.current = null;
  }, []);

  const saveProductsScrollPosition = useCallback((productId?: number) => {
    productsViewCache = {
      key: routeCacheKey,
      products,
      currentPage,
      hasMore,
      scrollY: window.scrollY,
      anchorProductId: productId ?? null,
      shouldRestore: true,
    };
    sessionStorage.setItem(productsRestoreFlagKey, "1");
    sessionStorage.setItem(productsScrollKey, String(window.scrollY));
    sessionStorage.setItem(productsPageKey, String(currentPage));
    sessionStorage.setItem(productsSnapshotKey, JSON.stringify({
      products,
      currentPage,
      hasMore,
    }));
    sessionStorage.setItem(PRODUCTS_RESTORE_LATEST_KEY, JSON.stringify({
      routeKey: routeCacheKey,
      products,
      currentPage,
      hasMore,
      scrollY: window.scrollY,
      anchorProductId: productId ?? null,
      shouldRestore: true,
    }));
    if (productId) {
      sessionStorage.setItem(productsAnchorKey, String(productId));
    }
  }, [routeCacheKey, productsRestoreFlagKey, productsScrollKey, productsAnchorKey, productsPageKey, productsSnapshotKey, currentPage, products, hasMore]);

  // Map URL paths to category names for SEO-friendly URLs
  const pathToCategoryMap: { [key: string]: string } = {
    "/home-appliances": "الأجهزة المنزلية",
    "/electronics": "الإلكترونيات",
    "/personal-care": "العناية الشخصية",
    "/cooling": "أجهزة التدفئة والتبريد",
    "/small-appliances": "الأجهزة المنزلية الصغيرة",
    "/kitchen": "أجهزة المطبخ الصغيرة",
    "/washing": "غسالات",
    "/cleaning": "غسالات", // Map cleaning to washing (or whichever fits best in DB)
    "/lighting": "الإضاءة",
    "/tools": "العدد والأدوات",
  };

  const flattenCategories = useCallback((categoriesData: any[]): any[] => {
    const result: any[] = [];

    const traverse = (nodes: any[], parentId: number | null = null) => {
      if (!Array.isArray(nodes)) {
        return;
      }

      nodes.forEach((node) => {
        if (!node) return;

        const currentIdRaw = node.id;
        const currentId = currentIdRaw !== undefined && currentIdRaw !== null ? Number(currentIdRaw) : NaN;
        const normalizedCurrentId = Number.isNaN(currentId) ? null : currentId;

        const parentIdRaw =
          node.parent_id !== undefined && node.parent_id !== null ? node.parent_id : parentId;
        const normalizedParentId =
          parentIdRaw !== undefined && parentIdRaw !== null && !Number.isNaN(Number(parentIdRaw))
            ? Number(parentIdRaw)
            : null;

        const normalizedNode = {
          ...node,
          id: normalizedCurrentId ?? node.id,
          parent_id: normalizedParentId,
        };

        result.push(normalizedNode);

        if (Array.isArray(node.children) && node.children.length > 0 && normalizedCurrentId !== null) {
          traverse(node.children, normalizedCurrentId);
        }
      });
    };

    traverse(categoriesData);
    return result;
  }, []);

  // ============================================
  // FILTERS MANAGEMENT - Rebuilt from scratch
  // ============================================

  /**
   * Load subcategories for a given category
   */
  const loadSubcategories = useCallback(async (categoryId: number) => {
    try {
      const response = await categoriesAPI.getSubcategories(categoryId);
      const subcats = response.data || [];
      setSubcategories(subcats);
      return subcats;
    } catch (err) {
      console.error("Error loading subcategories:", err);
      setSubcategories([]);
      return [];
    }
  }, []);

  /**
   * Load category filters for a given category
   */
  const loadCategoryFilters = useCallback(async (categoryId: number, preserveSelectedFilters: boolean = false) => {
    try {
      console.log('Loading category filters for category ID:', categoryId);
      const response = await categoriesAPI.getCategoryFilters(categoryId);
      console.log('Category filters API response:', response);
      const rawFilters = response.data?.filters || [];
      const filters = rawFilters.filter((f: any) => f.show_in_frontend !== false && f.show_in_frontend !== 0);
      console.log('Parsed filters:', filters);
      setCategoryFilters(filters);
      // Clear selected filters when filters change
      if (!preserveSelectedFilters) {
        setSelectedFilters({});
      }
      return filters;
    } catch (err) {
      console.error("Error loading category filters:", err);
      setCategoryFilters([]);
      if (!preserveSelectedFilters) {
        setSelectedFilters({});
      }
      return [];
    }
  }, []);

  /**
   * Initialize category data (subcategories and filters) based on selected category
   * This is the central function that handles all category-related data loading
   */
  const initializeCategoryData = useCallback(async (category: any | null, preserveSelectedFilters: boolean = false) => {
    // Clear everything immediately and synchronously
    setSubcategories([]);
    setCategoryFilters([]);
    if (!preserveSelectedFilters) {
      setSelectedFilters({});
    }

    if (!category || category === null) {
      // Thorough reset
      setSelectedCategoryId(null);
      setSelectedSubcategory(null);
      // Ensure we clear the lists again just in case
      setSubcategories([]);
      setCategoryFilters([]);
      return;
    }

    const categoryId = Number(category.id);
    const isChildCategory = category.parent_id !== null && category.parent_id !== undefined;

    if (isChildCategory) {
      // This is a child category (subcategory)
      const parentId = Number(category.parent_id);

      // Find parent category
      const parentCategory =
        categories.find(cat => Number(cat.id) === parentId) ||
        allCategoriesList.find(cat => Number(cat.id) === parentId);

      if (parentCategory) {
        // Set parent as selected category
        setSelectedCategoryId(parentId);
        setSelectedSubcategory(category);

        // Load subcategories for parent (to show in dropdown)
        await loadSubcategories(parentId);

        // Load filters for the child category (this is what we filter by)
        await loadCategoryFilters(categoryId, preserveSelectedFilters);
      }
    } else {
      // This is a parent category
      setSelectedCategoryId(categoryId);
      setSelectedSubcategory(null);

      // Check if category has children
      if (category.has_children) {
        // Has subcategories - load them
        await loadSubcategories(categoryId);
      }

      // Always load filters directly for this category, so general filters show up
      await loadCategoryFilters(categoryId, preserveSelectedFilters);
    }
  }, [categories, allCategoriesList, loadSubcategories, loadCategoryFilters]);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!initialProductsSnapshot) {
          setLoading(true);
        }
        setError("");

        // Load main categories, all categories, and all brands
        const [categoriesResponse, allCategoriesResponse, brandsResponse, analyticsSettingsResponse] = await Promise.all([
          categoriesAPI.getMainCategories(),
          categoriesAPI.getCategories(),
          brandsAPI.getBrands(),
          settingsAPI.getSettings('analytics').catch(() => ({ data: {} })),
        ]);

        const mainCategories = categoriesResponse.data || [];
        const allCategoriesData = allCategoriesResponse.data || [];

        setCategories(
          Array.isArray(mainCategories)
            ? mainCategories.map((category) => ({
              ...category,
              id: Number(category.id),
              parent_id:
                category.parent_id !== undefined && category.parent_id !== null
                  ? Number(category.parent_id)
                  : null,
            }))
            : []
        );
        setAllCategoriesList(flattenCategories(allCategoriesData));
        const allBrandsData = brandsResponse.data || [];
        setAllBrands(allBrandsData);
        setBrands(allBrandsData);

        if (analyticsSettingsResponse?.data) {
          setShowProductViews(analyticsSettingsResponse.data.show_product_views === "1" || analyticsSettingsResponse.data.show_product_views === true);
        }

      } catch (err) {
        setError("حدث خطأ في تحميل البيانات");
        console.error("Error loading data:", err);
        setLoading(false);
      }
    };

    loadData();
  }, [flattenCategories, initialProductsSnapshot]);

  // Products will be loaded by the filters useEffect below

  /**
   * Sync filters state with URL parameters
   * This runs when URL changes (browser navigation, back/forward, etc.)
   */
  useEffect(() => {
    const syncFiltersWithUrl = async () => {
      const params = new URLSearchParams(location.search);
      const searchFromUrl = params.get('search') || '';
      if (searchFromUrl !== searchQuery) {
        setSearchQuery(searchFromUrl);
      }

      const parsedDynamicFilters = parseDynamicFiltersFromSearch(location.search);
      const currentDynamicFilters = Object.entries(selectedFilters).reduce<Record<string, string>>((acc, [key, value]) => {
        if (value && value.trim() !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});

      if (JSON.stringify(parsedDynamicFilters) !== JSON.stringify(currentDynamicFilters)) {
        setSelectedFilters(parsedDynamicFilters);
      }

      // Handle category_id from URL
      const categoryIdFromUrl = params.get('category_id');

      // Only process if we have categories loaded
      if (categories.length > 0 || allCategoriesList.length > 0) {
        if (categoryIdFromUrl) {
          const categoryId = Number(categoryIdFromUrl);
          const category =
            categories.find(cat => cat.id === categoryId) ||
            allCategoriesList.find(cat => cat.id === categoryId);

          if (category) {
            // Check if this is different from current selection
            const currentCategoryId = selectedSubcategory
              ? Number(selectedSubcategory.id)
              : selectedCategoryId;

            if (currentCategoryId !== categoryId) {
              // Initialize category data (loads subcategories and filters)
              await initializeCategoryData(category, Object.keys(parsedDynamicFilters).length > 0);
            }
          }
        } else if (pathToCategoryMap[location.pathname]) {
          // Handle SEO-friendly paths (e.g., /kitchen)
          const categoryName = pathToCategoryMap[location.pathname];
          const category =
            categories.find(cat => cat.name === categoryName) ||
            allCategoriesList.find(cat => cat.name === categoryName);

          if (category) {
            const currentCategoryId = selectedSubcategory
              ? Number(selectedSubcategory.id)
              : selectedCategoryId;

            if (currentCategoryId !== Number(category.id)) {
              await initializeCategoryData(category, Object.keys(parsedDynamicFilters).length > 0);
            }
          }
        } else {
          // No category_id or specialized path in URL - reset if we have a selection
          if (selectedCategoryId !== null || selectedSubcategory !== null) {
            await initializeCategoryData(null);
          }
        }
      }

      // Handle brand_id
      const brandIdFromUrl = params.get('brand_id');
      if (brandIdFromUrl && allBrands.length > 0) {
        const brand = allBrands.find(b => b.id === Number(brandIdFromUrl));
        if (brand && brand.name !== selectedBrand) {
          setSelectedBrand(brand.name);
        }
      } else if (!brandIdFromUrl && selectedBrand !== "الكل") {
        setSelectedBrand("الكل");
      }

      // Handle price range
      const priceMin = params.get('price_min');
      const priceMax = params.get('price_max');
      if (priceMin !== null || priceMax !== null) {
        const nextPriceRange: [number, number] = [
          priceMin ? parseInt(priceMin) : 0,
          priceMax ? parseInt(priceMax) : 50000
        ];
        if (nextPriceRange[0] !== priceRange[0] || nextPriceRange[1] !== priceRange[1]) {
          setPriceRange(nextPriceRange);
        }
      } else if (priceRange[0] !== 0 || priceRange[1] !== 50000) {
        setPriceRange([0, 50000]);
      }

      // Handle sort
      const sortFromUrl = params.get('sort');
      if (sortFromUrl !== null && sortFromUrl !== sortBy) {
        setSortBy(sortFromUrl);
      } else if (sortFromUrl === null && sortBy !== "default") {
        setSortBy("default");
      }
    };

    syncFiltersWithUrl();
  }, [location.search, location.pathname, categories, allCategoriesList, allBrands, initializeCategoryData, selectedCategoryId, selectedSubcategory, selectedBrand, priceRange, sortBy, searchQuery, selectedFilters]);

  const resetAllFilters = useCallback(() => {
    cancelSnapshotRestoreState();
    setSelectedFilters({});
    setSelectedCategoryId(null);
    setSelectedSubcategory(null);
    setSubcategories([]);
    setCategoryFilters([]);
    setSelectedBrand("الكل");
    setPriceRange([0, 50000]);
    setSearchQuery("");
    setSortBy("default");

    // Clear URL
    navigate(location.pathname, { replace: true });
  }, [location.pathname, navigate, cancelSnapshotRestoreState]);

  const updateDynamicFilters = useCallback((nextFiltersInput: Record<string, string>) => {
    cancelSnapshotRestoreState();
    const cleanedFilters = Object.entries(nextFiltersInput).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value && value.trim() !== '') {
        acc[key] = value.trim();
      }
      return acc;
    }, {});

    setSelectedFilters(cleanedFilters);

    const params = new URLSearchParams(location.search);
    const serialized = stringifyDynamicFiltersForSearch(cleanedFilters);

    if (serialized) {
      params.set(DYNAMIC_FILTERS_PARAM, serialized);
    } else {
      params.delete(DYNAMIC_FILTERS_PARAM);
    }

    params.delete('page');

    const newUrl = params.toString()
      ? `${location.pathname}?${params.toString()}`
      : location.pathname;
    navigate(newUrl, { replace: true });
  }, [location.pathname, location.search, navigate, cancelSnapshotRestoreState]);

  const handleSearchChange = useCallback((value: string) => {
    cancelSnapshotRestoreState();
    setSearchQuery(value);
    const params = new URLSearchParams(location.search);

    if (value.trim()) {
      params.set('search', value);
    } else {
      params.delete('search');
    }

    params.delete('page');

    const newUrl = params.toString()
      ? `${location.pathname}?${params.toString()}`
      : location.pathname;
    navigate(newUrl, { replace: true });
  }, [location.pathname, location.search, navigate, cancelSnapshotRestoreState]);

  // Handle category selection from UI
  // Updates URL and initializes category data
  const handleCategorySelection = useCallback(async (category: any | null) => {
    cancelSnapshotRestoreState();
    const params = new URLSearchParams(location.search);

    // Synchronously clear all dependent filters when category changes
    setSubcategories([]);
    setCategoryFilters([]);
    setSelectedFilters({});

    if (!category) {
      // Clear category selection
      params.delete('category_id');
      params.delete('brand_id');
      params.delete(DYNAMIC_FILTERS_PARAM);
      params.delete('page');

      setSelectedCategoryId(null);
      setSelectedSubcategory(null);

      // Navigate immediately
      const newUrl = params.toString() ? `${location.pathname}?${params.toString()}` : location.pathname;
      setSearchQuery("");
      navigate(newUrl, { replace: true });

      // Also call data reset
      await initializeCategoryData(null);
    } else {
      const categoryId = Number(category.id);

      // Update URL
      params.set('category_id', categoryId.toString());
      params.delete('brand_id');
      params.delete(DYNAMIC_FILTERS_PARAM);
      params.delete('search');
      params.delete('page');

      // Update URL first
      const newUrl = params.toString()
        ? `${location.pathname}?${params.toString()}`
        : location.pathname;

      setSearchQuery("");
      navigate(newUrl, { replace: true });

      // Initialize data for the new category
      await initializeCategoryData(category);
    }
  }, [location.pathname, location.search, navigate, initializeCategoryData, cancelSnapshotRestoreState]);

  // Safety net: ensure sub-filters are hidden when no category is selected
  useEffect(() => {
    if (selectedCategoryId === null) {
      if (subcategories.length > 0) setSubcategories([]);
      if (categoryFilters.length > 0) setCategoryFilters([]);
      if (Object.keys(selectedFilters).length > 0) setSelectedFilters({});
    }
  }, [selectedCategoryId]);

  const handleBrandSelection = (brandName: string) => {
    cancelSnapshotRestoreState();
    setSelectedBrand(brandName);
    const params = new URLSearchParams(location.search);

    if (brandName === "الكل") {
      params.delete('brand_id');
    } else {
      const brand = allBrands.find(b => b.name === brandName);
      if (brand) {
        params.set('brand_id', brand.id.toString());
      }
    }

    const newUrl = params.toString()
      ? `${location.pathname}?${params.toString()}`
      : location.pathname;
    navigate(newUrl, { replace: true });
  };

  const handlePriceChange = (min: number, max: number) => {
    cancelSnapshotRestoreState();
    setPriceRange([min, max]);
    const params = new URLSearchParams(location.search);

    if (min === 0 && max === 50000) {
      params.delete('price_min');
      params.delete('price_max');
    } else {
      params.set('price_min', min.toString());
      params.set('price_max', max.toString());
    }

    const newUrl = params.toString()
      ? `${location.pathname}?${params.toString()}`
      : location.pathname;
    navigate(newUrl, { replace: true });
  };

  const handleSortChange = (newSort: string) => {
    cancelSnapshotRestoreState();
    setSortBy(newSort);
    const params = new URLSearchParams(location.search);

    if (newSort === "default") {
      params.delete('sort');
    } else {
      params.set('sort', newSort);
    }

    const newUrl = params.toString()
      ? `${location.pathname}?${params.toString()}`
      : location.pathname;
    navigate(newUrl, { replace: true });
  };

  // Load products function with pagination support
  const loadProducts = async (page: number = 1, append: boolean = false) => {
    // Prevent duplicate pagination requests, but always allow a full reload
    // so filter changes can recover from any stale loading state.
    if (append && loadingRef.current) return;
    
    const requestVersion = fullReloadVersionRef.current;
    if (!append) {
      fullReloadVersionRef.current++;
    }

    try {
      if (!append) {
        setLoading(true);
        loadingRef.current = true;
      } else {
        setLoadingMore(true);
        loadingRef.current = true;
      }

      // Build filters object
      const filters: any = {
        search: searchQuery || undefined,
        // Send price_min only if it's greater than 0 (user has set a minimum)
        price_min: priceRange[0] > 0 ? priceRange[0] : undefined,
        // Send price_max only if it's less than 50000 (user has set a maximum)
        price_max: priceRange[1] < 50000 ? priceRange[1] : undefined,
        page: page,
        per_page: 15, // Load 15 products per page
      };

      // Map sortBy to API sort parameters
      if (sortBy !== "default") {
        switch (sortBy) {
          case "price-low":
            filters.sort = 'price';
            filters.order = 'asc';
            break;
          case "price-high":
            filters.sort = 'price';
            filters.order = 'desc';
            break;
          case "rating":
            filters.sort = 'rating';
            filters.order = 'desc';
            break;
          case "name":
            filters.sort = 'name';
            filters.order = 'asc';
            break;
          default:
            filters.sort = 'created_at';
            filters.order = 'desc';
        }
      } else {
        filters.sort = 'created_at';
        filters.order = 'desc';
      }

      // Handle category filter - prioritize state over URL
      if (selectedSubcategory) {
        filters.category_id = Number(selectedSubcategory.id);
      } else if (selectedCategoryId !== null) {
        filters.category_id = selectedCategoryId;
      } else {
        const params = new URLSearchParams(location.search);
        const categoryIdFromUrl = params.get('category_id');
        if (categoryIdFromUrl) {
          filters.category_id = Number(categoryIdFromUrl);
        }
      }

      // Add brand filter - prioritize state over URL
      if (selectedBrand !== "الكل") {
        const brand = brands.find(b => b.name === selectedBrand) ||
          allBrands.find(b => b.name === selectedBrand);
        if (brand) {
          filters.brand_id = brand.id;
        }
      } else {
        const params = new URLSearchParams(location.search);
        const brandIdFromUrl = params.get('brand_id');
        if (brandIdFromUrl) {
          filters.brand_id = Number(brandIdFromUrl);
        }
      }

      // Add dynamic filters as JSON string (filter_values parameter works on backend)
      if (Object.keys(selectedFilters).length > 0) {
        const filtersObject: Record<string, string> = {};
        Object.entries(selectedFilters).forEach(([key, value]) => {
          if (value && value.trim() !== "") {
            filtersObject[key] = value;
          }
        });

        if (Object.keys(filtersObject).length > 0) {
          (filters as any)['filter_values'] = JSON.stringify(filtersObject);
          console.log('Sending filter_values to API:', filtersObject);
        }
      } else {
        console.log('No selected filters to send');
      }


      const response = await productsAPI.getProducts(filters);


      // Handle paginated response structure
      const productsData = response.data || [];
      const meta = response.meta || {};
      const currentPageNum = meta.current_page || page;
      const lastPageNum = meta.last_page || 1;


      // Transform API data to match Product interface
      const transformedProducts = productsData.map((product: any) => {
        const collectedImages: string[] = Array.isArray(product.images)
          ? product.images
            .map((img: any) => {
              if (!img) return '';
              if (typeof img === 'string') {
                return img;
              }
              if (typeof img === 'object') {
                if (img.image_url) {
                  return img.image_url;
                }
                if (img.image_path) {
                  return getStorageUrl(img.image_path);
                }
              }
              return '';
            })
            .filter((url: string) => !!url)
          : [];

        let imageUrl = '';

        const firstImageSource =
          product.rawImages?.[0] ??
          (Array.isArray(product.images) ? product.images[0] : undefined);

        if (product.cover_image) {
          imageUrl = getStorageUrl(product.cover_image);
        } else if (firstImageSource) {
          if (typeof firstImageSource === 'string') {
            imageUrl = firstImageSource;
          } else if (typeof firstImageSource === 'object') {
            if (firstImageSource.image_url) {
              imageUrl = firstImageSource.image_url;
            } else if (firstImageSource.image_path) {
              imageUrl = getStorageUrl(firstImageSource.image_path);
            }
          }
        }

        if (!imageUrl && typeof product.image === 'string' && product.image.trim() !== '') {
          imageUrl = product.image;
        }

        if (!imageUrl && collectedImages.length > 0) {
          imageUrl = collectedImages[0];
        }

        if (!imageUrl) {
          imageUrl = PLACEHOLDER_IMAGE;
        }

        const primaryCategoryIdRaw =
          product.category_id !== undefined && product.category_id !== null
            ? product.category_id
            : product.category?.id;
        const normalizedPrimaryCategoryId =
          primaryCategoryIdRaw !== undefined && primaryCategoryIdRaw !== null
            ? Number(primaryCategoryIdRaw)
            : undefined;

        const mappedCategoryIds = Array.isArray(product.categories)
          ? product.categories
            .map((cat: any) => {
              const catId = cat?.id;
              const numericId = catId !== undefined && catId !== null ? Number(catId) : NaN;
              return Number.isNaN(numericId) ? null : numericId;
            })
            .filter((id: number | null): id is number => id !== null)
          : [];

        const basePrice = Number(product.price);
        const discountPercentage = product.discount_percentage ? Number(product.discount_percentage) : 0;
        const explicitOriginalPrice = Number(product.original_price || product.compare_price || 0);
        const salePrice = discountPercentage > 0 ? Number((basePrice * (1 - discountPercentage / 100)).toFixed(2)) : basePrice;
        const displayOriginalPrice = Math.max(
          salePrice,
          discountPercentage > 0 ? Math.max(basePrice, explicitOriginalPrice) : explicitOriginalPrice
        );
        const discountAmount = Math.max(0, displayOriginalPrice - salePrice);

        return {
          id: product.id,
          name: product.name,
          price: salePrice,
          originalPrice: basePrice,
          comparePrice: displayOriginalPrice,
          images: collectedImages,
          image: imageUrl,
          rating: product.rating || 0,
          reviews: product.reviews_count || 0,
          category: product.category?.name || '',
          brand: product.brand?.name || '',
          discount: discountAmount,
          discountPercentage: discountAmount > 0
            ? (discountPercentage > 0 ? discountPercentage : Math.round((discountAmount / displayOriginalPrice) * 100))
            : 0,
          inStock: product.stock_status === 'stock_based'
            ? (product.stock_quantity || 0) > 0
            : (product.stock_status === 'in_stock' || (product.in_stock !== false && product.stock_status !== 'out_of_stock')),
          stockStatus: product.stock_status || (product.in_stock ? 'in_stock' : 'out_of_stock'),
          categoryId:
            normalizedPrimaryCategoryId !== undefined && !Number.isNaN(normalizedPrimaryCategoryId)
              ? normalizedPrimaryCategoryId
              : undefined,
          categoryIds: mappedCategoryIds,
          filterValues: product.filter_values || {},
          viewsCount: product.views_count || 0,
          slug: product.slug,
          hasVariants: !!product.has_variants,
          hasPriceRange: !!product.has_price_range,
          maxPrice: product.max_price
        };
      });

      console.log('Transformed products count:', transformedProducts.length);

      // Extract unique brands from loaded products (use original product data)
      const uniqueBrands = new Map<string, { id: number; name: string }>();
      productsData.forEach((product: any) => {
        if (product.brand && product.brand.id && product.brand.name) {
          uniqueBrands.set(product.brand.name, {
            id: product.brand.id,
            name: product.brand.name
          });
        }
      });

      // Also check existing products if appending
      if (append) {
        products.forEach((product: any) => {
          if (product.brand && product.brand.trim() !== '') {
            const existingBrand = brands.find(b => b.name === product.brand);
            if (existingBrand) {
              uniqueBrands.set(existingBrand.name, {
                id: existingBrand.id || 0,
                name: existingBrand.name
              });
            }
          }
        });
      }

      const isMainCategorySelected = !selectedSubcategory && selectedCategoryId === null;
      const uniqueBrandsArray = Array.from(uniqueBrands.values());
      const brandListForMainCategory = allBrands.length > 0 ? allBrands : uniqueBrandsArray;

      // Update brands list ONLY when no specific brand is selected
      // This ensures that choosing a brand doesn't cause other brands in the same category to disappear from the dropdown
      if (selectedBrand === "الكل") {
        if (!append) {
          if (isMainCategorySelected) {
            setBrands(brandListForMainCategory);
          } else {
            setBrands(uniqueBrandsArray);
          }
        } else {
          // For pagination, merge with existing brands
          setBrands(prev => {
            const merged = new Map<string, { id: number; name: string }>();
            prev.forEach(b => merged.set(b.name, b));
            uniqueBrands.forEach((brand, name) => {
              if (!merged.has(name)) {
                merged.set(name, brand);
              }
            });
            return Array.from(merged.values());
          });
        }
      }

      if (append && requestVersion !== fullReloadVersionRef.current) {
        // A full reload was triggered while this append was loading.
        // Ignore this stale result to avoid mixing products from different filters.
        return;
      }

      if (append) {
        // Append new products to existing ones
        setProducts(prev => [...prev, ...transformedProducts]);
      } else {
        // Replace products (new search/filter)
        setProducts(transformedProducts);
        setCurrentPage(1);
      }

      // Check if there are more pages
      setHasMore(currentPageNum < lastPageNum);
      setCurrentPage(currentPageNum);

    } catch (err) {
      setError("حدث خطأ في تحميل المنتجات");
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      loadingRef.current = false;
    }
  };

  // Track loading state with ref to avoid closure staleness in Observer
  const loadingRef = useRef(false);

  // Load more products (for infinity scroll)
  const loadMoreProducts = useCallback(() => {
    if (!loadingRef.current && hasMore) {
      loadProducts(currentPage + 1, true);
    }
  }, [currentPage, hasMore, searchQuery, selectedCategoryId, selectedSubcategory, selectedBrand, priceRange, sortBy, selectedFilters]);

  // Reload products when filters change (reset to page 1)
  useEffect(() => {
    // If URL params changed while we were restoring scroll/snapshot state,
    // cancel restore mode immediately and proceed with normal reload behavior.
    if (isRestoringSnapshotRef.current) {
      const isOriginalRestoreRoute = productsViewCache?.key === routeCacheKey;
      const hasSessionRestoreForRoute =
        typeof window !== "undefined" &&
        sessionStorage.getItem(productsRestoreFlagKey) === "1";

      // Keep restore mode when route has a valid restore marker in either memory cache
      // or session storage. This is important on production where memory cache can reset.
      if (!isOriginalRestoreRoute && !hasSessionRestoreForRoute) {
        isRestoringSnapshotRef.current = false;
        hasRestoredScrollRef.current = true;
        pendingScrollRestoreRef.current = null;
        pendingProductRestoreRef.current = null;
        pendingPageRestoreRef.current = null;
      }
    }
  }, [routeCacheKey, productsRestoreFlagKey]);

  useEffect(() => {
    const wasSkippingInitial = skipInitialReloadRef.current;
    if (wasSkippingInitial) {
      skipInitialReloadRef.current = false;
    }

    if (isRestoringSnapshotRef.current || suppressAutoReloadUntilUserActionRef.current || wasSkippingInitial) {
      return;
    }

    // Debounce reduced to 300ms for better responsiveness
    const timeoutId = setTimeout(() => {
      // Don't clear products here, let loadProducts replace them to avoid layout jumps
      setCurrentPage(1);
      setHasMore(true);
      loadProducts(1, false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCategoryId, selectedSubcategory, selectedBrand, priceRange, sortBy, selectedFilters]);

  // Infinity scroll observer - تحميل تلقائي عند التمرير
  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    const loadMoreTrigger = document.getElementById('load-more-trigger');

    // Only attach observer if we have more to load and the trigger exists
    if (loadMoreTrigger && hasMore) {
      observer = new IntersectionObserver(
        (entries) => {
          const target = entries[0];
          if (isRestoringSnapshotRef.current) {
            return;
          }
          if (target.isIntersecting && !loadingRef.current) {
            console.log('Intersection detected, triggering loadMore');
            loadMoreProducts();
          }
        },
        {
          root: null,
          rootMargin: '200px', // Pre-load well before reaching bottom
          threshold: 0,
        }
      );

      observer.observe(loadMoreTrigger);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [hasMore, loadMoreProducts, products.length]); // Re-attach when products change (position changes)

  // Fallback auto-load when observer misses intersections on some browsers/layout states.
  useEffect(() => {
    const checkAndAutoLoad = () => {
      if (isRestoringSnapshotRef.current) {
        return;
      }
      if (!hasMore || loading || loadingMore || loadingRef.current) {
        return;
      }

      const trigger = document.getElementById('load-more-trigger');
      if (!trigger) {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      if (rect.top <= window.innerHeight + 240) {
        loadMoreProducts();
      }
    };

    checkAndAutoLoad();
    window.addEventListener('scroll', checkAndAutoLoad, { passive: true });
    window.addEventListener('resize', checkAndAutoLoad);
    const intervalId = window.setInterval(checkAndAutoLoad, 1200);

    return () => {
      window.removeEventListener('scroll', checkAndAutoLoad);
      window.removeEventListener('resize', checkAndAutoLoad);
      window.clearInterval(intervalId);
    };
  }, [hasMore, loading, loadingMore, products.length, loadMoreProducts]);

  useEffect(() => {
    hasRestoredScrollRef.current = false;
    pendingScrollRestoreRef.current = null;
    pendingProductRestoreRef.current = null;
    pendingPageRestoreRef.current = null;
  }, [productsScrollKey]);

  useEffect(() => {
    if (!products.length) {
      return;
    }

    if (productsViewCache?.key === routeCacheKey) {
      productsViewCache = {
        ...productsViewCache,
        products,
        currentPage,
        hasMore,
      };
    }
  }, [routeCacheKey, products, currentPage, hasMore]);

  useEffect(() => {
    if (loading || hasRestoredScrollRef.current) {
      return;
    }

    if (productsViewCache?.key === routeCacheKey && productsViewCache.shouldRestore) {
      pendingScrollRestoreRef.current = productsViewCache.scrollY;
      pendingProductRestoreRef.current = productsViewCache.anchorProductId;
      pendingPageRestoreRef.current = productsViewCache.currentPage;
      return;
    }

    const shouldRestore = sessionStorage.getItem(productsRestoreFlagKey) === "1";
    if (!shouldRestore) {
      isRestoringSnapshotRef.current = false;
      hasRestoredScrollRef.current = true;
      return;
    }

    const savedScroll = sessionStorage.getItem(productsScrollKey);
    const savedProductId = sessionStorage.getItem(productsAnchorKey);
    const savedPage = sessionStorage.getItem(productsPageKey);
    if (savedScroll) {
      pendingScrollRestoreRef.current = Number(savedScroll);
      pendingProductRestoreRef.current = savedProductId ? Number(savedProductId) : null;
      pendingPageRestoreRef.current = savedPage ? Number(savedPage) : 1;
      return;
    }

    try {
      const latestRaw = sessionStorage.getItem(PRODUCTS_RESTORE_LATEST_KEY);
      if (!latestRaw) {
        isRestoringSnapshotRef.current = false;
        hasRestoredScrollRef.current = true;
        return;
      }
      const latest = JSON.parse(latestRaw);
      if (!latest || latest.routeKey !== routeCacheKey) {
        isRestoringSnapshotRef.current = false;
        hasRestoredScrollRef.current = true;
        return;
      }
      pendingScrollRestoreRef.current = Number(latest.scrollY || 0);
      pendingProductRestoreRef.current = latest.anchorProductId ? Number(latest.anchorProductId) : null;
      pendingPageRestoreRef.current = Number(latest.currentPage || 1);
    } catch {
      isRestoringSnapshotRef.current = false;
      hasRestoredScrollRef.current = true;
    }
  }, [loading, routeCacheKey, productsRestoreFlagKey, productsScrollKey, productsAnchorKey, productsPageKey]);

  useLayoutEffect(() => {
    if (typeof window === "undefined" || !("scrollRestoration" in window.history)) {
      return;
    }
    // Keep browser native restoration enabled to avoid production-only
    // inconsistencies caused by forcing manual mode.
    window.history.scrollRestoration = "auto";
  }, []);

  useLayoutEffect(() => {
    const targetScroll = pendingScrollRestoreRef.current;
    const targetProductId = pendingProductRestoreRef.current;
    const targetPage = pendingPageRestoreRef.current;
    if (loading || targetScroll === null || hasRestoredScrollRef.current) {
      return;
    }

    if (targetPage && currentPage < targetPage && hasMore && !loadingMore) {
      loadMoreProducts();
      return;
    }

    if (targetProductId) {
      const productElement = document.querySelector<HTMLElement>(`[data-product-id="${targetProductId}"]`);
      if (productElement) {
        hasRestoredScrollRef.current = true;
        requestAnimationFrame(() => {
          const maxScrollableTop = Math.max(
            document.documentElement.scrollHeight - window.innerHeight,
            0
          );
          const fallbackTop = productElement.getBoundingClientRect().top + window.scrollY;
          const desiredTop = Math.min(
            targetScroll ?? fallbackTop,
            maxScrollableTop
          );
          window.scrollTo({ top: desiredTop, behavior: "auto" });
          isRestoringSnapshotRef.current = false;
          if (productsViewCache?.key === routeCacheKey) {
            productsViewCache = {
              ...productsViewCache,
              shouldRestore: false,
            };
          }
          sessionStorage.removeItem(productsRestoreFlagKey);
          sessionStorage.removeItem(productsScrollKey);
          sessionStorage.removeItem(productsAnchorKey);
          sessionStorage.removeItem(productsPageKey);
          pendingScrollRestoreRef.current = null;
          pendingProductRestoreRef.current = null;
          pendingPageRestoreRef.current = null;
        });
        return;
      }
    }

    const maxScrollableTop = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      0
    );

    if (targetScroll > maxScrollableTop + 120 && hasMore && !loadingMore) {
      loadMoreProducts();
      return;
    }

    hasRestoredScrollRef.current = true;
    requestAnimationFrame(() => {
      window.scrollTo({ top: Math.min(targetScroll, maxScrollableTop), behavior: "auto" });
      isRestoringSnapshotRef.current = false;
      if (productsViewCache?.key === routeCacheKey) {
        productsViewCache = {
          ...productsViewCache,
          shouldRestore: false,
        };
      }
      sessionStorage.removeItem(productsRestoreFlagKey);
      sessionStorage.removeItem(productsScrollKey);
      sessionStorage.removeItem(productsAnchorKey);
      sessionStorage.removeItem(productsPageKey);
      pendingScrollRestoreRef.current = null;
      pendingProductRestoreRef.current = null;
      pendingPageRestoreRef.current = null;
    });
  }, [loading, loadingMore, hasMore, currentPage, products.length, loadMoreProducts, routeCacheKey, productsRestoreFlagKey, productsScrollKey, productsAnchorKey, productsPageKey]);

  // Hard fallback for production timing differences:
  // repeated restore attempts until content height settles.
  useEffect(() => {
    if (loading || hasRestoredScrollRef.current) {
      return;
    }

    const shouldRestore = sessionStorage.getItem(productsRestoreFlagKey) === "1";
    if (!shouldRestore) {
      return;
    }

    const savedScroll = sessionStorage.getItem(productsScrollKey);
    if (!savedScroll) {
      return;
    }

    const targetScroll = Number(savedScroll);
    if (Number.isNaN(targetScroll)) {
      return;
    }

    let attempts = 0;
    const maxAttempts = 18;
    const intervalId = window.setInterval(() => {
      attempts += 1;

      const maxScrollableTop = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        0
      );
      const finalTarget = Math.min(targetScroll, maxScrollableTop);
      window.scrollTo({ top: finalTarget, behavior: "auto" });

      const reachedTarget = Math.abs(window.scrollY - finalTarget) <= 4;
      const isLastAttempt = attempts >= maxAttempts;
      if (reachedTarget || isLastAttempt) {
        hasRestoredScrollRef.current = true;
        isRestoringSnapshotRef.current = false;
        sessionStorage.removeItem(productsRestoreFlagKey);
        sessionStorage.removeItem(productsScrollKey);
        sessionStorage.removeItem(productsAnchorKey);
        sessionStorage.removeItem(productsPageKey);
        window.clearInterval(intervalId);
      }
    }, 120);

    return () => window.clearInterval(intervalId);
  }, [loading, products.length, productsRestoreFlagKey, productsScrollKey, productsAnchorKey, productsPageKey]);


  const brandsList = brands.length > 0 ? ["الكل", ...brands.map(brand => brand.name)] : ["الكل"];

  // Client-side filtering removed - now handled by backend

  const ProductCard = ({ product }: { product: Product }) => {
    const isInWishlist = isWishlisted(product.id);
    const isProcessingWishlist = !!wishlistProcessing[product.id];
    const availableColors = extractAvailableColors(product.filterValues);
    const comparePrice = Number(product.comparePrice || product.originalPrice || 0);
    const savingsAmount = Math.max(0, comparePrice - Number(product.price));
    const rawDiscountPercentage = product.discountPercentage !== undefined ? Number(product.discountPercentage) : 0;
    const discountPercentage = savingsAmount > 0 || rawDiscountPercentage > 0
      ? (rawDiscountPercentage > 0 ? rawDiscountPercentage : Math.round((savingsAmount / comparePrice) * 100))
      : 0;

    return (
      <div
        data-product-id={product.id}
        className="product-card p-2 md:p-4 group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col h-full"
        style={{ contentVisibility: "auto", containIntrinsicSize: "360px" }}
      >
        <div className="relative mb-2 md:mb-4 aspect-square overflow-hidden rounded-lg bg-gray-50 flex items-center justify-center">
          <Link
            to={`/product/${product.id}`}
            state={{ fromProductsUrl: currentProductsRoute }}
            className="block w-full h-full"
            onClick={() => saveProductsScrollPosition(product.id)}
          >
            <img
              src={getOptimizedImageUrl(product.image || product.images?.[0] || PLACEHOLDER_IMAGE, { width: 520, quality: 72 })}
              alt={product.name}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              width="320"
              height="320"
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                console.error("Image load error for product", product.id, ":", e.currentTarget.src);
                e.currentTarget.src = PLACEHOLDER_IMAGE;
              }}
            />
          </Link>
          {discountPercentage > 0 && (
            <span className="absolute top-1 right-1 md:top-2 md:right-2 bg-red-500 text-white px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-sm font-bold z-10">
              {product.discountPercentage}%
            </span>
          )}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-lg z-20">
              <span className="text-white font-semibold text-sm md:text-base px-3 py-1 bg-black bg-opacity-20 rounded-lg">نفدت الكمية</span>
            </div>
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
            aria-pressed={isInWishlist}
            aria-label={isInWishlist ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
            disabled={isProcessingWishlist}
          >
            <Heart
              className={`w-3 h-3 md:w-4 md:h-4 ${isInWishlist ? "text-red-500" : "text-gray-600"}`}
              fill={isInWishlist ? "currentColor" : "none"}
            />
          </button>
        </div>

        <Link
          to={`/product/${product.id}`}
          state={{ fromProductsUrl: currentProductsRoute }}
          className="block flex-grow"
          onClick={() => saveProductsScrollPosition(product.id)}
        >
          {(() => {
            const filteredCatId = selectedSubcategory?.id || selectedCategoryId;
            const categoryToDisplay = product.categories?.find(c => Number(c.id) === Number(filteredCatId)) ||
              product.category ||
              (product.categories && product.categories[0]);

            return categoryToDisplay ? (
              <span className="text-[10px] md:text-xs text-emerald-600 font-bold mb-1 block uppercase tracking-wider">
                {categoryToDisplay.name}
              </span>
            ) : null;
          })()}
          <h3 className="text-sm md:text-base font-semibold text-gray-800 line-clamp-2 hover:text-brand-blue transition-colors mb-1 md:mb-2 min-h-[2.5rem] md:min-h-[3rem]">
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

        {showProductViews && (
          <div className="flex items-center gap-1 mb-1 md:mb-3 mt-auto text-[10px] md:text-xs text-gray-500">
            <Eye className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span>{product.viewsCount || 0}</span>
          </div>
        )}

        <div className="flex items-center gap-2 mb-2 md:mb-4">
          <span className="text-lg md:text-xl font-bold text-brand-green">
            {product.hasPriceRange ? `ابتداءً من: ${formatPrice(product.price)}` : formatPrice(product.price)} ₪
          </span>
          {(product.comparePrice || product.originalPrice) && (product.comparePrice || product.originalPrice)! > product.price && (
            <span className="text-sm md:text-base text-gray-500 line-through">{formatPrice((product.comparePrice || product.originalPrice)!)} ₪</span>
          )}
        </div>
        {savingsAmount > 0 && (
          <div className="mb-2 md:mb-4">
            <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-[11px] md:text-xs font-bold text-red-600">
              وفر {formatPrice(savingsAmount)} ₪
            </span>
          </div>
        )}

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!product.inStock) return;

            // If product has variants, redirect to product page instead of adding to cart
            if (product.hasVariants) {
              saveProductsScrollPosition(product.id);
              navigate(`/product/${product.id}`, {
                state: { fromProductsUrl: currentProductsRoute }
              });
              return;
            }

            const imageForAnimation = product.image || product.images?.[0] || PLACEHOLDER_IMAGE;
            triggerAnimation(e.currentTarget, {
              image: imageForAnimation,
              name: product.name
            });

            addItem({
              id: product.id,
              name: product.name,
              price: product.price,
              original_price: product.originalPrice || product.comparePrice,
              discount_percentage: Number(product.discount) || 0,
              image: imageForAnimation,
              brand: product.brand,
              stock_quantity: (product as any).stockCount || 0,
              manage_stock: product.stockStatus === 'stock_based'
            });
          }}
          className={`w-full py-1.5 md:py-2 rounded-lg transition-colors text-sm md:text-base font-medium shadow-sm ${product.inStock ? "bg-brand-blue text-white hover:bg-emerald-700" : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          disabled={!product.inStock}
        >
          {product.inStock ? "أضف للسلة" : "نفدت الكمية"}
        </button>
      </div>
    );
  };

  const { siteName } = useSiteSettings();
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const currentUrl = `${siteUrl}${location.pathname}${location.search}`;

  // Get category name for SEO
  const categoryName = selectedParentCategory?.name || selectedSubcategory?.name || '';
  const pageTitle = categoryName
    ? `${categoryName} - منتجات${siteName ? ` | ${siteName}` : ''}`
    : `جميع المنتجات${siteName ? ` | ${siteName}` : ''}`;
  const pageDescription = categoryName
    ? `تصفح مجموعة واسعة من منتجات ${categoryName}${siteName ? ` في ${siteName}` : ''}. أفضل الأسعار والجودة المضمونة.`
    : `تصفح جميع منتجاتنا${siteName ? ` في ${siteName}` : ''}. توصيل سريع وضمان شامل.`;

  // Build breadcrumb items
  const breadcrumbItems = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "الرئيسية",
      "item": siteUrl
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "المنتجات",
      "item": currentUrl
    }
  ];

  if (selectedParentCategory) {
    breadcrumbItems.push({
      "@type": "ListItem",
      "position": breadcrumbItems.length + 1,
      "name": selectedParentCategory.name,
      "item": `${siteUrl}/products?category_id=${selectedParentCategory.id}`
    });
  }

  if (selectedSubcategory) {
    breadcrumbItems.push({
      "@type": "ListItem",
      "position": breadcrumbItems.length + 1,
      "name": selectedSubcategory.name,
      "item": `${siteUrl}/products?category_id=${selectedSubcategory.id}`
    });
  }

  // Structured Data for Product Collection - Multiple Schemas
  const structuredDataArray = [
    // CollectionPage Schema
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": pageTitle,
      "description": pageDescription,
      "url": currentUrl,
      "mainEntity": {
        "@type": "ItemList",
        "numberOfItems": products.length
      }
    },
    // BreadcrumbList Schema
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbItems
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 arabic">
      <SEO
        title={pageTitle}
        description={pageDescription}
        keywords={`${categoryName}, منتجات${siteName ? `, ${siteName}` : ''}`}

        url={currentUrl}
        structuredData={structuredDataArray}
      />
      <Header
        showSearch={true}
        showActions={true}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Filters Sidebar */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-80 space-y-6 ${showFilters ? 'mb-6' : ''} lg:sticky lg:top-28 lg:self-start lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto lg:scrollbar-hide`}>
            {/* Mobile Overlay */}
            {showFilters && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                onClick={() => setShowFilters(false)}
              />
            )}

            {/* Filters Panel */}
            <div className={`lg:relative fixed lg:top-auto top-32 right-4 lg:right-auto h-[70vh] lg:h-auto w-[75vw] lg:w-auto max-w-xs lg:max-w-none z-50 lg:z-auto transform transition-transform duration-300 ease-in-out ${showFilters ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
              }`}>
              <div className="bg-white h-full lg:h-auto p-4 sm:p-6 rounded-xl lg:rounded-lg shadow-2xl lg:shadow-sm overflow-y-auto">
                <h3 className="font-semibold text-lg mb-4">البحث والفلترة</h3>

                {/* Search */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">البحث</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="ابحث عن المنتجات..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">الفئة الرئيسية</label>
                  <select
                    value={selectedCategoryId !== null ? selectedCategoryId.toString() : ""}
                    onChange={async (e) => {
                      const categoryIdValue = e.target.value;
                      if (!categoryIdValue) {
                        await handleCategorySelection(null);
                      } else {
                        const category = categories.find(cat => cat.id.toString() === categoryIdValue);
                        if (category) {
                          await handleCategorySelection(category);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  >
                    <option value="">الكل</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id.toString()}>{category.name}</option>
                    ))}
                  </select>
                </div>

                {/* Subcategory Filter */}
                {subcategories.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">الفئة الفرعية</label>
                    <select
                      value={selectedSubcategory?.id || ''}
                      onChange={async (e) => {
                        const subcategoryId = e.target.value;
                        if (!subcategoryId) {
                          // If subcategory is cleared, return to parent category view
                          const parent = categories.find(cat => cat.id === selectedCategoryId) ||
                            allCategoriesList.find(cat => cat.id === selectedCategoryId);
                          if (parent) {
                            await handleCategorySelection(parent);
                          } else {
                            await handleCategorySelection(null);
                          }
                        } else {
                          const subcategory = subcategories.find(sub => sub.id.toString() === subcategoryId);
                          if (subcategory) {
                            await handleCategorySelection(subcategory);
                          }
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    >
                      <option value="">اختر الفئة الفرعية...</option>
                      {subcategories.map(subcategory => (
                        <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Dynamic Category Filters */}
                {(() => {
                  console.log('Rendering filters section. categoryFilters:', categoryFilters, 'length:', categoryFilters.length);
                  return categoryFilters.length > 0;
                })() && (
                    <div className="mb-6 space-y-4">
                      <div>
                        <h4 className="font-semibold text-md">فلاتر الفئة</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          اختر القيم المناسبة لتضييق نتائج البحث
                        </p>
                      </div>
                      {categoryFilters.map((filter, index) => {
                        console.log('Rendering filter:', filter);
                        // Use filter name as key if available, otherwise use index
                        const filterKey = filter.name || `filter-${index}`;
                        const isCollapsed = collapsedFilters[filterKey] || false;

                        return (
                          <div key={filterKey} className="space-y-2 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                            <button
                              type="button"
                              onClick={() => setCollapsedFilters(prev => ({ ...prev, [filterKey]: !isCollapsed }))}
                              className="flex items-center justify-between w-full text-right"
                            >
                              <span className="text-sm font-bold text-brand-blue flex items-center gap-1">
                                {filter.name}
                                {filter.required && (
                                  <span className="text-red-500">*</span>
                                )}
                              </span>
                              {isCollapsed ? (
                                <ChevronDown className="w-4 h-4 text-brand-blue" />
                              ) : (
                                <ChevronUp className="w-4 h-4 text-brand-blue" />
                              )}
                            </button>

                            {!isCollapsed && (
                              <div className="pt-2">
                                {filter.type === 'select' && (
                                  <select
                                    value={selectedFilters[filter.name] || ''}
                                    onChange={(e) => {
                                      updateDynamicFilters({
                                        ...selectedFilters,
                                        [filter.name]: e.target.value
                                      });
                                    }}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow text-sm ${filter.required
                                      ? 'border-red-300 focus:ring-red-500'
                                      : 'border-gray-300'
                                      }`}
                                  >
                                    <option value="">
                                      {filter.required ? 'اختر...' : 'الكل'}
                                    </option>
                                    {Array.isArray(filter.options) && filter.options.map((option: string) => (
                                      <option key={option} value={option}>{option}</option>
                                    ))}
                                  </select>
                                )}
                                {filter.type === 'checkbox' && filter.options && filter.options.length > 0 && (
                                  <div className={filter.options.length > 8 ? "grid grid-cols-2 gap-y-2" : "space-y-2"}>
                                    {filter.options.map((option: string, optionIndex: number) => (
                                      <label key={optionIndex} className={`flex items-center gap-2 cursor-pointer ${filter.options.length > 8 && optionIndex % 2 !== 0 ? "border-r border-gray-200 pr-3 mr-1" : ""}`}>
                                        <input
                                          type="checkbox"
                                          checked={selectedFilters[filter.name]?.split(',').includes(option) || false}
                                          onChange={(e) => {
                                            const currentValues = selectedFilters[filter.name]?.split(',').filter(v => v.trim()) || [];
                                            let newValues;
                                            if (e.target.checked) {
                                              newValues = [...currentValues, option].filter(v => v.trim());
                                            } else {
                                              newValues = currentValues.filter(v => v !== option);
                                            }
                                            updateDynamicFilters({
                                              ...selectedFilters,
                                              [filter.name]: newValues.join(',')
                                            });
                                          }}
                                          className={`rounded text-brand-blue focus:ring-brand-yellow ${filter.required
                                            ? 'border-red-300 focus:ring-red-500'
                                            : 'border-gray-300'
                                            }`}
                                        />
                                        <span className="text-sm text-gray-700">{option}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                                {filter.type === 'checkbox' && (!filter.options || filter.options.length === 0) && (
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={selectedFilters[filter.name] === 'true'}
                                      onChange={(e) => {
                                        updateDynamicFilters({
                                          ...selectedFilters,
                                          [filter.name]: e.target.checked ? 'true' : ''
                                        });
                                      }}
                                      className={`rounded text-brand-blue focus:ring-brand-yellow ${filter.required
                                        ? 'border-red-300 focus:ring-red-500'
                                        : 'border-gray-300'
                                        }`}
                                    />
                                    <span className="text-sm text-gray-700">نعم</span>
                                  </label>
                                )}
                                {filter.type === 'range' && (
                                  <div className="space-y-2">
                                    <input
                                      type="text"
                                      value={selectedFilters[filter.name] || ''}
                                      onChange={(e) => {
                                        updateDynamicFilters({
                                          ...selectedFilters,
                                          [filter.name]: e.target.value
                                        });
                                      }}
                                      placeholder="مثال: 10-15 قدم"
                                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm ${filter.required
                                        ? 'border-red-300 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-brand-yellow'
                                        }`}
                                    />
                                    {filter.required && (
                                      <p className="text-xs text-red-500">هذا الفلتر مطلوب</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                {/* Brand Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">العلامة التجارية</label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => handleBrandSelection(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  >
                    {brandsList.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">السعر</label>
                  <div className="space-y-3">
                    {/* Min and Max Price Inputs */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">من</label>
                        <input
                          type="number"
                          min="0"
                          max={priceRange[1]}
                          step="100"
                          value={priceRange[0]}
                          onChange={(e) => {
                            const minValue = Math.max(0, Math.min(parseInt(e.target.value) || 0, priceRange[1]));
                            handlePriceChange(minValue, priceRange[1]);
                          }}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">إلى</label>
                        <input
                          type="number"
                          min={priceRange[0]}
                          max="50000"
                          step="100"
                          value={priceRange[1]}
                          onChange={(e) => {
                            const maxValue = Math.max(priceRange[0], Math.min(parseInt(e.target.value) || 50000, 50000));
                            handlePriceChange(priceRange[0], maxValue);
                          }}
                          placeholder="50000"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow text-sm"
                        />
                      </div>
                    </div>

                    {/* Currency Display */}
                    <div className="text-center text-xs text-gray-500">
                      <span>النطاق: {priceRange[0]} ₪ - {priceRange[1]} ₪</span>
                    </div>
                  </div>
                </div>

                {/* Reset Filters Button - Show when any filter is active */}
                {(() => {
                  const hasActiveFilters =
                    selectedCategoryId !== null ||
                    selectedSubcategory !== null ||
                    selectedBrand !== "الكل" ||
                    Object.keys(selectedFilters).length > 0 ||
                    searchQuery !== "" ||
                    (priceRange[0] !== 0 || priceRange[1] !== 50000) ||
                    sortBy !== "default" ||
                    location.search.includes('category_id') ||
                    location.search.includes('brand_id');

                  return hasActiveFilters ? (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <button
                        onClick={resetAllFilters}
                        className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2.5 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        إعادة تعيين جميع الفلاتر
                      </button>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          </div>

          {/* Products Area */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">
                    {products.length} منتج
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow text-sm"
                  >
                    <option value="default">ترتيب افتراضي</option>
                    <option value="price-low">السعر: من الأقل للأعلى</option>
                    <option value="price-high">السعر: من الأعلى للأقل</option>
                    <option value="name">الاسم</option>
                  </select>

                </div>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                  <p className="text-lg text-gray-600">جاري تحميل المنتجات...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">حدث خطأ في التحميل</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
                  {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Infinity Scroll Trigger - يتم التحميل تلقائياً عند الوصول لهذا العنصر */}
                <div id="load-more-trigger" className="py-8 text-center min-h-[100px]">
                  {loadingMore ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                      <span className="mr-2 text-gray-600">جاري تحميل المزيد...</span>
                    </div>
                  ) : hasMore ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-pulse">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      </div>
                      <p className="text-sm text-gray-500">جاري التحميل تلقائيًا...</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">تم عرض جميع المنتجات</p>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">لا توجد منتجات</h3>
                <p className="text-gray-600 mb-4">لم يتم العثور على منتجات تطابق معايير البحث</p>
                <button
                  onClick={resetAllFilters}
                  className="bg-brand-blue text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  إعادة تعيين الفلاتر
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Filter Button - Mobile Only */}
      {(() => {
        // Check if any filters are applied
        const hasActiveFilters =
          searchQuery.trim() !== "" ||
          selectedCategoryId !== null ||
          selectedSubcategory !== null ||
          selectedBrand !== "الكل" ||
          priceRange[0] !== 0 ||
          priceRange[1] !== 50000 ||
          Object.keys(selectedFilters).length > 0;

        return (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`lg:hidden fixed bottom-6 left-6 z-50 ${hasActiveFilters
              ? 'bg-red-700 hover:bg-red-800'
              : 'bg-red-600 hover:bg-red-700'
              } text-white px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105 inline-flex items-center gap-2`}
            style={{ position: 'fixed', bottom: '24px', left: '24px' }}
            aria-label="فتح الفلاتر"
          >
            <SlidersHorizontal className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-semibold">فلتر</span>
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                !
              </span>
            )}
            {showFilters && !hasActiveFilters && (
              <span className="absolute -top-1 -right-1 bg-gray-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                ×
              </span>
            )}
          </button>
        );
      })()}
    </div>
  );
};

export default Products;
