import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Package,
  Star,
  DollarSign,
  ShoppingCart,
  ArrowLeft,
  ArrowRight,
  MoreHorizontal,
  Grid,
  List,
  Table,
  SortAsc,
  SortDesc,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Tag,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from "lucide-react";
import { adminProductsAPI, adminCategoriesAPI, adminBrandsAPI } from "../services/adminApi";
import { getStorageUrl } from "../config/env";
import { Progress } from "@/components/ui/progress";
import Swal from "sweetalert2";

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  original_price?: number;
  compare_price?: number;
  cost_price?: number;
  discount_percentage?: number;
  stock_quantity: number;
  in_stock: boolean;
  is_featured: boolean;
  is_active: boolean;
  category?: {
    id: number;
    name: string;
    parent?: {
      id: number;
      name: string;
    };
  };
  categories?: Array<{
    id: number;
    name: string;
    parent?: {
      id: number;
      name: string;
    };
  }>;
  brand?: {
    id: number;
    name: string;
  };
  images?: Array<{
    id: number;
    image_path: string;
    image_url: string;
    alt_text?: string;
    is_primary: boolean;
    sort_order: number;
  }>;
  variants?: Array<{
    id: number;
    price?: number | string | null;
  }>;
  sales_count: number;
  rating: number;
  reviews_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
  parent?: {
    id: number;
    name: string;
  };
}

interface Brand {
  id: number;
  name: string;
}

interface FilterState {
  search: string;
  category: number | null;
  brand: number | null;
  priceMin: number | null;
  priceMax: number | null;
  stockStatus: 'all' | 'in_stock' | 'out_of_stock' | 'low_stock';
  status: 'all' | 'active' | 'inactive';
  featured: 'all' | 'featured' | 'not_featured';
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  hasDiscount: boolean;
  discountMin: number | null;
  discountMax: number | null;
}

type ImportStage = "idle" | "preparing" | "uploading" | "processing" | "completed" | "failed";
type ImportSource = "upload" | "server";

interface InboxImportAsset {
  path: string;
  name: string;
  size: number;
  modified_at: number;
}

interface ImportJobStatus {
  id: number;
  uuid: string;
  status: string;
  stage: string;
  progress: number;
  message: string;
  total_rows?: number | null;
  processed_rows?: number | null;
  created_count?: number | null;
  updated_count?: number | null;
  row_number?: number | null;
  sku?: string | null;
  summary?: {
    rows_processed: number;
    created: number;
    updated: number;
  } | null;
  error_message?: string | null;
}

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "table">("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [perPage, setPerPage] = useState(12);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSource, setImportSource] = useState<ImportSource>("server");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importImagesZip, setImportImagesZip] = useState<File | null>(null);
  const [serverImportFiles, setServerImportFiles] = useState<InboxImportAsset[]>([]);
  const [serverImportZips, setServerImportZips] = useState<InboxImportAsset[]>([]);
  const [selectedServerImportFile, setSelectedServerImportFile] = useState("");
  const [selectedServerImportZip, setSelectedServerImportZip] = useState("");
  const [isLoadingImportInbox, setIsLoadingImportInbox] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);
  const [importStage, setImportStage] = useState<ImportStage>("idle");
  const [importProgress, setImportProgress] = useState(0);
  const [importStatusText, setImportStatusText] = useState("");
  const [activeImportId, setActiveImportId] = useState<number | null>(null);
  const importPollTimeoutRef = useRef<number | null>(null);

  // Inline Editing State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ price: '', original_price: '', compare_price: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isBulkDiscounting, setIsBulkDiscounting] = useState(false);
  const [bulkDiscountPercentage, setBulkDiscountPercentage] = useState<number>(0);
  const [showBulkDiscountInput, setShowBulkDiscountInput] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: null,
    brand: null,
    priceMin: null,
    priceMax: null,
    stockStatus: 'all',
    status: 'all',
    featured: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc',
    hasDiscount: false,
    discountMin: null,
    discountMax: null
  });

  const [searchInput, setSearchInput] = useState("");

  const navigate = useNavigate();

  const clearImportPolling = () => {
    if (importPollTimeoutRef.current !== null) {
      window.clearTimeout(importPollTimeoutRef.current);
      importPollTimeoutRef.current = null;
    }
  };

  const resetImportState = () => {
    clearImportPolling();
    setImportResults(null);
    setImportSource("server");
    setImportFile(null);
    setImportImagesZip(null);
    setServerImportFiles([]);
    setServerImportZips([]);
    setSelectedServerImportFile("");
    setSelectedServerImportZip("");
    setIsLoadingImportInbox(false);
    setIsImporting(false);
    setImportStage("idle");
    setImportProgress(0);
    setImportStatusText("");
    setActiveImportId(null);
  };

  const formatImportAssetSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${bytes} B`;
  };

  const loadImportInbox = useCallback(async () => {
    setIsLoadingImportInbox(true);
    try {
      const response = await adminProductsAPI.getImportInboxFiles();
      const inbox = response.inbox || {};
      setServerImportFiles(inbox.files || []);
      setServerImportZips(inbox.zips || []);
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "تعذر تحميل ملفات السيرفر",
        text: err.response?.data?.message || "تعذر قراءة مجلد الاستيراد من الخادم.",
      });
    } finally {
      setIsLoadingImportInbox(false);
    }
  }, []);

  const importSteps = [
    {
      key: "preparing",
      label: "تجهيز الملفات",
      description: "التحقق من ملف المنتجات وربط ملف الصور المضغوط إن وُجد.",
    },
    {
      key: "uploading",
      label: "رفع الملفات",
      description: "رفع ملف Excel أو CSV والملفات المرفقة إلى الخادم.",
    },
    {
      key: "processing",
      label: "المعالجة على الخادم",
      description: "فك ضغط الصور، قراءة الصفوف، ثم إنشاء المنتجات أو تحديثها.",
    },
    {
      key: "completed",
      label: "اكتمال الاستيراد",
      description: "تم إنهاء العملية وإرجاع الملخص النهائي.",
    },
  ] as const;

  const getImportStepState = (stepKey: typeof importSteps[number]["key"]) => {
    const stepOrder: Record<ImportStage, number> = {
      idle: -1,
      preparing: 0,
      uploading: 1,
      processing: 2,
      completed: 3,
      failed: 2,
    };

    const currentIndex = stepOrder[importStage];
    const targetIndex = stepOrder[stepKey as ImportStage];

    if (currentIndex > targetIndex) {
      return "done";
    }

    if (currentIndex === targetIndex) {
      return importStage === "failed" ? "done" : "active";
    }

    return "pending";
  };

  const showImportError = (errorData: any) => {
    const details = [
      errorData?.message || errorData?.error_message || 'حدث خطأ في معالجة الملف',
      errorData?.row_number ? `الصف: ${errorData.row_number}` : null,
      errorData?.sku ? `SKU: ${errorData.sku}` : null,
      errorData?.uuid ? `رقم التتبع: ${errorData.uuid}` : null,
      errorData?.import_id ? `رقم التتبع: ${errorData.import_id}` : null,
    ].filter(Boolean).join('<br>');

    Swal.fire({
      icon: 'error',
      title: 'خطأ في الاستيراد',
      html: details,
    });
  };

  const pollImportStatus = useCallback(async (importId: number) => {
    try {
      const response = await adminProductsAPI.getImportStatus(importId);
      const importData: ImportJobStatus = response.import;

      setActiveImportId(importData.id);
      setImportStage(importData.status === 'failed'
        ? 'failed'
        : importData.status === 'completed'
          ? 'completed'
          : 'processing');
      setImportProgress(importData.progress ?? 0);
      setImportStatusText(importData.message || 'جاري معالجة ملف الاستيراد...');

      if (importData.status === 'completed') {
        clearImportPolling();
        setIsImporting(false);
        setImportResults(importData.summary || {
          rows_processed: importData.processed_rows || 0,
          created: importData.created_count || 0,
          updated: importData.updated_count || 0,
        });
        fetchProducts();
        return;
      }

      if (importData.status === 'failed') {
        clearImportPolling();
        setIsImporting(false);
        showImportError(importData);
        return;
      }

      importPollTimeoutRef.current = window.setTimeout(() => {
        pollImportStatus(importId);
      }, 2000);
    } catch (error: any) {
      clearImportPolling();
      setIsImporting(false);
      setImportStage('failed');
      setImportStatusText('تعذر متابعة حالة الاستيراد من الخادم.');
      showImportError(error.response?.data);
    }
  }, []);

  useEffect(() => {
    if (showImportModal && importSource === "server") {
      loadImportInbox();
    }
  }, [showImportModal, importSource, loadImportInbox]);

  const getProductThumbnail = (product: Product): string => {
    const firstImage = product.images?.[0];
    if (!firstImage?.image_url) {
      return "/placeholder.svg";
    }

    return getStorageUrl(firstImage.image_url) || "/placeholder.svg";
  };

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    console.log('Admin token:', token ? 'Present' : 'Missing');
    if (!token) {
      console.log('No admin token found, redirecting to login');
      navigate("/admin/login");
      return;
    }

    // تحميل البيانات الأولية والفلاتر في نفس الوقت
    loadInitialData();
    fetchProducts();
  }, [navigate]);

  useEffect(() => {
    fetchProducts();
  }, [filters, currentPage, perPage]);

  useEffect(() => {
    return () => {
      clearImportPolling();
    };
  }, []);


  const loadInitialData = async () => {
    try {
      const [categoriesData, brandsData] = await Promise.all([
        adminCategoriesAPI.getCategories(),
        adminBrandsAPI.getBrands({ per_page: 1000 })
      ]);

      setCategories(categoriesData.data || []);
      setBrands(brandsData.data || []);
    } catch (err: any) {
      console.error('Error loading categories/brands:', err);
      // لا نعرض خطأ هنا لأن المنتجات يمكن تحميلها بدون الفئات والماركات
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const queryParams = {
        search: filters.search,
        category_id: filters.category,
        brand_id: filters.brand,
        price_min: filters.priceMin,
        price_max: filters.priceMax,
        stock_status: filters.stockStatus !== 'all' ? filters.stockStatus : undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        featured: filters.featured !== 'all' ? filters.featured : undefined,
        sort: filters.sortOrder === 'desc' ? `-${filters.sortBy}` : filters.sortBy,
        has_discount: filters.hasDiscount || undefined,
        discount_min: filters.discountMin,
        discount_max: filters.discountMax,
        page: currentPage,
        per_page: perPage
      };

      // إزالة القيم الفارغة
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key as keyof typeof queryParams] === undefined ||
          queryParams[key as keyof typeof queryParams] === null ||
          queryParams[key as keyof typeof queryParams] === '') {
          delete queryParams[key as keyof typeof queryParams];
        }
      });

      console.log('Filter Debug:', {
        filters,
        queryParams,
        currentPage
      });

      const data = await adminProductsAPI.getProducts(queryParams);

      setProducts(data.data || []);
      setTotalPages(data.meta?.last_page || 1);
      setTotalProducts(data.meta?.total || 0);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      console.error('Error response:', err.response);
      console.error('Error message:', err.message);
      setError(err.response?.data?.message || "فشل في تحميل المنتجات");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      try {
        await adminProductsAPI.deleteProduct(id.toString());
        setProducts(products.filter(p => p.id !== id));
      } catch (err: any) {
        setError(err.response?.data?.message || "فشل في حذف المنتج");
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;

    if (window.confirm(`هل أنت متأكد من حذف ${selectedProducts.length} منتج؟`)) {
      try {
        await adminProductsAPI.bulkDelete(selectedProducts);
        setProducts(products.filter(p => !selectedProducts.includes(p.id)));
        setSelectedProducts([]);
      } catch (err: any) {
        setError(err.response?.data?.message || "فشل في حذف المنتجات");
      }
    }
  };

  const handleBulkStatusUpdate = async (isActive: boolean) => {
    if (selectedProducts.length === 0) return;

    const actionText = isActive ? "تفعيل" : "تعطيل";

    if (window.confirm(`هل أنت متأكد من ${actionText} ${selectedProducts.length} منتج؟`)) {
      try {
        await adminProductsAPI.bulkUpdateStatus(selectedProducts, isActive);
        await fetchProducts();
        setSelectedProducts([]);

        Swal.fire({
          icon: 'success',
          title: 'تم بنجاح',
          text: `تم ${actionText} المنتجات المحددة`,
          confirmButtonText: 'حسناً'
        });
      } catch (err: any) {
        setError(err.response?.data?.message || `فشل في ${actionText} المنتجات`);
      }
    }
  };

  const handleBulkOffersUpdate = async (showInOffers: boolean) => {
    if (selectedProducts.length === 0) return;

    const actionText = showInOffers ? "إظهار في العروض" : "إخفاء من العروض";

    if (window.confirm(`هل أنت متأكد من ${actionText} لـ ${selectedProducts.length} منتج؟`)) {
      try {
        await adminProductsAPI.bulkUpdateOffers(selectedProducts, showInOffers);
        await fetchProducts();
        setSelectedProducts([]);

        Swal.fire({
          icon: 'success',
          title: 'تم بنجاح',
          text: `تم ${actionText} بنجاح`,
          confirmButtonText: 'حسناً'
        });
      } catch (err: any) {
        setError(err.response?.data?.message || `فشل في ${actionText}`);
      }
    }
  };

  const handleBulkApplyDiscount = async () => {
    if (selectedProducts.length === 0) return;
    if (bulkDiscountPercentage < 0 || bulkDiscountPercentage > 100) {
      alert("الرجاء إدخال نسبة خصم صحيحة بين 0 و 100");
      return;
    }

    if (window.confirm(`هل أنت متأكد من تطبيق خصم ${bulkDiscountPercentage}% على ${selectedProducts.length} منتج؟`)) {
      try {
        setIsBulkDiscounting(true);
        await adminProductsAPI.bulkApplyDiscount(selectedProducts, bulkDiscountPercentage);
        
        // Refresh products and clear selection
        await fetchProducts();
        setSelectedProducts([]);
        setShowBulkDiscountInput(false);
        setBulkDiscountPercentage(0);
        
        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'تم بنجاح',
          text: `تم تطبيق الخصم على ${selectedProducts.length} منتج`,
          confirmButtonText: 'حسناً'
        });
      } catch (err: any) {
        setError(err.response?.data?.message || "فشل في تطبيق الخصم");
      } finally {
        setIsBulkDiscounting(false);
      }
    }
  };

  const toggleProductSelection = (id: number) => {
    setSelectedProducts(prev =>
      prev.includes(id)
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1); // إعادة تعيين الصفحة عند تغيير الفلاتر
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category: null,
      brand: null,
      priceMin: null,
      priceMax: null,
      stockStatus: 'all',
      status: 'all',
      featured: 'all',
      sortBy: 'created_at',
      sortOrder: 'desc',
      hasDiscount: false,
      discountMin: null,
      discountMax: null
    });
    setSearchInput("");
    setCurrentPage(1);
    setProducts([]);
  };

  const getDiscountInfo = (product: Product) => {
    const basePrice = Number(product.price || 0);
    const comparePrice = Number(product.compare_price || 0);
    const originalPrice = Number(product.original_price || 0);
    const savedDiscountPercentage = Number(product.discount_percentage || 0);
    const referencePrice = comparePrice > basePrice ? comparePrice : originalPrice > basePrice ? originalPrice : 0;
    const variantPrices = Array.isArray(product.variants)
      ? product.variants
          .map((variant) => Number(variant.price || 0))
          .filter((price) => price > 0)
      : [];

    if (savedDiscountPercentage > 0) {
      if (variantPrices.length > 0) {
        const minVariantPrice = Math.min(...variantPrices);
        const maxVariantPrice = Math.max(...variantPrices);
        const minDiscountValue = (minVariantPrice * savedDiscountPercentage) / 100;
        const maxDiscountValue = (maxVariantPrice * savedDiscountPercentage) / 100;

        return {
          hasDiscount: true,
          discountPercentage: savedDiscountPercentage,
          discountValue: minDiscountValue,
          discountValueMax: maxDiscountValue,
          discountValueLabel:
            minDiscountValue === maxDiscountValue
              ? formatPrice(minDiscountValue)
              : `من ${formatPrice(minDiscountValue)} إلى ${formatPrice(maxDiscountValue)}`,
          referencePrice: referencePrice || basePrice,
        };
      }

      return {
        hasDiscount: true,
        discountPercentage: savedDiscountPercentage,
        discountValue: basePrice > 0 ? (basePrice * savedDiscountPercentage) / 100 : 0,
        discountValueMax: basePrice > 0 ? (basePrice * savedDiscountPercentage) / 100 : 0,
        discountValueLabel: formatPrice(basePrice > 0 ? (basePrice * savedDiscountPercentage) / 100 : 0),
        referencePrice: referencePrice || basePrice,
      };
    }

    if (referencePrice > basePrice && referencePrice > 0) {
      return {
        hasDiscount: true,
        discountPercentage: Math.round(((referencePrice - basePrice) / referencePrice) * 100),
        discountValue: referencePrice - basePrice,
        discountValueMax: referencePrice - basePrice,
        discountValueLabel: formatPrice(referencePrice - basePrice),
        referencePrice,
      };
    }

    return {
      hasDiscount: false,
      discountPercentage: 0,
      discountValue: 0,
      discountValueMax: 0,
      discountValueLabel: "0",
      referencePrice: 0,
    };
  };

  const getPriceInfo = (product: Product) => {
    const basePrice = Number(product.price || 0);
    const comparePrice = Number(product.compare_price || 0);
    const originalPrice = Number(product.original_price || 0);
    const savedDiscountPercentage = Number(product.discount_percentage || 0);
    const variantPrices = Array.isArray(product.variants)
      ? product.variants
          .map((variant) => Number(variant.price || 0))
          .filter((price) => price > 0)
      : [];

    if (variantPrices.length > 0) {
      const minBasePrice = Math.min(...variantPrices);
      const maxBasePrice = Math.max(...variantPrices);
      const minPrice = savedDiscountPercentage > 0
        ? minBasePrice * (1 - savedDiscountPercentage / 100)
        : minBasePrice;
      const maxPrice = savedDiscountPercentage > 0
        ? maxBasePrice * (1 - savedDiscountPercentage / 100)
        : maxBasePrice;

      return {
        hasVariantPricing: true,
        minPrice,
        maxPrice,
        priceLabel:
          minPrice === maxPrice
            ? formatPrice(minPrice)
            : `من ${formatPrice(minPrice)} إلى ${formatPrice(maxPrice)}`,
        referencePriceLabel:
          savedDiscountPercentage > 0
            ? (
              minBasePrice === maxBasePrice
                ? formatPrice(minBasePrice)
                : `من ${formatPrice(minBasePrice)} إلى ${formatPrice(maxBasePrice)}`
            )
            : null,
      };
    }

    const referencePrice = comparePrice > basePrice ? comparePrice : originalPrice > basePrice ? originalPrice : 0;
    const finalPrice = savedDiscountPercentage > 0
      ? basePrice * (1 - savedDiscountPercentage / 100)
      : basePrice;

    return {
      hasVariantPricing: false,
      minPrice: finalPrice,
      maxPrice: finalPrice,
      priceLabel: formatPrice(finalPrice),
      referencePriceLabel: savedDiscountPercentage > 0
        ? formatPrice(basePrice)
        : referencePrice > basePrice
          ? formatPrice(referencePrice)
          : null,
    };
  };

  const refreshProducts = async () => {
    setIsRefreshing(true);
    setCurrentPage(1);
    setProducts([]);
    await fetchProducts();
    setIsRefreshing(false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setCurrentPage(1); // Reset to first page when changing per page
  };

  // Debounce search
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (searchTerm: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setFilters(prev => ({ ...prev, search: searchTerm }));
        }, 500);
      };
    })(),
    []
  );

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    debouncedSearch(value);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.category) count++;
    if (filters.brand) count++;
    if (filters.priceMin || filters.priceMax) count++;
    if (filters.stockStatus !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.featured !== 'all') count++;
    if (filters.hasDiscount) count++;
    if (filters.discountMin || filters.discountMax) count++;
    return count;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price);
  };

  const getStockStatus = (product: Product) => {
    if (!product.in_stock) return { status: 'out', label: 'نفد المخزون', color: 'text-red-600' };
    if (product.stock_quantity <= 5) return { status: 'low', label: 'مخزون منخفض', color: 'text-orange-600' };
    return { status: 'in', label: 'متوفر', color: 'text-green-600' };
  };

  // Inline Editing Handlers
  const handleStartEdit = (product: Product) => {
    setEditingId(product.id);
    setEditForm({
      price: product.price.toString(),
      original_price: product.original_price ? product.original_price.toString() : '',
      compare_price: product.compare_price ? product.compare_price.toString() : ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ price: '', original_price: '', compare_price: '' });
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async (id: number) => {
    try {
      setIsSaving(true);

      const price = parseFloat(editForm.price);
      const originalPrice = editForm.original_price ? parseFloat(editForm.original_price) : null;
      const comparePrice = editForm.compare_price ? parseFloat(editForm.compare_price) : null;

      if (isNaN(price) || price < 0) {
        alert("الرجاء إدخال سعر صحيح (0 أو أكبر)"); // Simple alert or use your toast/error state
        return;
      }

      await adminProductsAPI.updateProduct(id.toString(), {
        price: price,
        original_price: originalPrice,
        compare_price: comparePrice
      });

      // Update local state immediately
      setProducts(prev => prev.map(p => {
        if (p.id === id) {
          return {
            ...p,
            price: price,
            original_price: originalPrice || undefined,
            compare_price: comparePrice || undefined
          };
        }
        return p;
      }));

      setEditingId(null);
      // Optional: Show success message/toast
    } catch (err: any) {
      console.error("Failed to update price", err);
      alert("فشل تحديث السعر: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <AdminLayout>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="p-2 rounded-lg hover:bg-gray-100 mr-4"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">إدارة المنتجات</h1>
              <p className="text-sm text-gray-600 mt-1">
                إجمالي المنتجات: {totalProducts.toLocaleString()} منتج
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 space-x-reverse">
            <button
              onClick={refreshProducts}
              disabled={isRefreshing}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 disabled:opacity-50"
              title="تحديث"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
               onClick={() => navigate("/admin/products/create")}
               className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center"
             >
               <Plus className="w-4 h-4 mr-2" />
               إضافة منتج
             </button>

             <button
               onClick={() => setShowImportModal(true)}
               className="bg-white text-emerald-600 border border-emerald-600 px-4 py-2 rounded-lg hover:bg-emerald-50 flex items-center"
             >
               <Upload className="w-4 h-4 mr-2" />
               استيراد جماعي
             </button>
           </div>
        </div>
      </div>

      <div className="mt-6">
        {/* Search and Quick Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="البحث في المنتجات..."
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Per Page Selector */}
            <div className="flex items-center space-x-2 space-x-reverse">
              <label className="text-sm text-gray-600 whitespace-nowrap">عدد الصفوف:</label>
              <select
                value={perPage}
                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white min-w-[80px]"
              >
                <option value={10}>10</option>
                <option value={12}>12</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={999999}>الكل</option>
              </select>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={() => handleFilterChange('status', filters.status === 'active' ? 'all' : 'active')}
                className={`px-2 py-1.5 rounded-md text-xs font-medium ${filters.status === 'active'
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
              >
                <CheckCircle className="w-3.5 h-3.5 inline ml-1" />
                نشط فقط
              </button>

              <button
                onClick={() => handleFilterChange('status', filters.status === 'inactive' ? 'all' : 'inactive')}
                className={`px-2 py-1.5 rounded-md text-xs font-medium ${filters.status === 'inactive'
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
              >
                <AlertCircle className="w-3.5 h-3.5 inline ml-1" />
                غير نشط
              </button>

              <button
                onClick={() => handleFilterChange('featured', filters.featured === 'featured' ? 'all' : 'featured')}
                className={`px-2 py-1.5 rounded-md text-xs font-medium ${filters.featured === 'featured'
                  ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
              >
                <Star className="w-3.5 h-3.5 inline ml-1" />
                مميز
              </button>

              <button
                onClick={() => handleFilterChange('stockStatus', filters.stockStatus === 'low_stock' ? 'all' : 'low_stock')}
                className={`px-2 py-1.5 rounded-md text-xs font-medium ${filters.stockStatus === 'low_stock'
                  ? 'bg-orange-100 text-orange-700 border border-orange-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
              >
                <AlertCircle className="w-3.5 h-3.5 inline ml-1" />
                مخزون منخفض
              </button>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-3 space-x-reverse">
              {/* Advanced Filters */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center ${showFilters || getActiveFiltersCount() > 0
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
              >
                <Filter className="w-4 h-4 ml-1" />
                فلاتر متقدمة
                {getActiveFiltersCount() > 0 && (
                  <span className="bg-emerald-600 text-white text-xs rounded-full px-2 py-0.5 mr-2">
                    {getActiveFiltersCount()}
                  </span>
                )}
                {showFilters ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
              </button>

              {/* Sort */}
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              >
                <option value="created_at">تاريخ الإنشاء</option>
                <option value="name">الاسم</option>
                <option value="price">السعر</option>
                <option value="sales_count">المبيعات</option>
                <option value="views_count">المشاهدات</option>
                <option value="rating">التقييم</option>
                <option value="stock_quantity">المخزون</option>
              </select>

              <button
                onClick={() => handleFilterChange('sortOrder', filters.sortOrder === "asc" ? "desc" : "asc")}
                className="p-2 rounded-lg hover:bg-gray-100"
                title={filters.sortOrder === "asc" ? "ترتيب تصاعدي" : "ترتيب تنازلي"}
              >
                {filters.sortOrder === "asc" ? <SortAsc className="w-5 h-5" /> : <SortDesc className="w-5 h-5" />}
              </button>

              {/* View Mode */}
              <div className="flex border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-emerald-100 text-emerald-600" : "text-gray-600"}`}
                  title="عرض شبكي"
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-emerald-100 text-emerald-600" : "text-gray-600"}`}
                  title="عرض قائمة"
                >
                  <List className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-2 ${viewMode === "table" ? "bg-emerald-100 text-emerald-600" : "text-gray-600"}`}
                  title="عرض جدول"
                >
                  <Table className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الفئة</label>
                  <select
                    value={filters.category || ''}
                    onChange={(e) => handleFilterChange('category', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">جميع الفئات</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.parent ? `${category.parent.name} > ${category.name}` : category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brand Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الماركة</label>
                  <select
                    value={filters.brand || ''}
                    onChange={(e) => handleFilterChange('brand', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">جميع الماركات</option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نطاق السعر</label>
                  <div className="flex space-x-2 space-x-reverse">
                    <input
                      type="number"
                      placeholder="من"
                      value={filters.priceMin || ''}
                      onChange={(e) => handleFilterChange('priceMin', e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="number"
                      placeholder="إلى"
                      value={filters.priceMax || ''}
                      onChange={(e) => handleFilterChange('priceMax', e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Stock Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">حالة المخزون</label>
                  <select
                    value={filters.stockStatus}
                    onChange={(e) => handleFilterChange('stockStatus', e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">الكل</option>
                    <option value="in_stock">متوفر</option>
                    <option value="out_of_stock">نفد</option>
                    <option value="low_stock">مخزون منخفض</option>
                  </select>
                </div>

                {/* Discount Filter */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">فلتر الخصومات</label>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.hasDiscount}
                        onChange={(e) => handleFilterChange('hasDiscount', e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">المنتجات التي لديها خصم فقط</span>
                    </label>
                    <div className="flex items-center space-x-2 space-x-reverse flex-1 max-w-xs">
                      <input
                        type="number"
                        placeholder="أقل خصم %"
                        value={filters.discountMin || ''}
                        onChange={(e) => handleFilterChange('discountMin', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="number"
                        placeholder="أقصى خصم %"
                        value={filters.discountMax || ''}
                        onChange={(e) => handleFilterChange('discountMax', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
                  >
                    <X className="w-4 h-4 ml-1" />
                    مسح جميع الفلاتر
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  {products.length} من {totalProducts} منتج
                </div>
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          {selectedProducts.length > 0 && (
            <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-emerald-700">
                  تم تحديد {selectedProducts.length} منتج
                </span>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <button
                    onClick={() => handleBulkStatusUpdate(true)}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    تفعيل المحدد
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate(false)}
                    className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    تعطيل المحدد
                  </button>
                  <button
                    onClick={() => handleBulkOffersUpdate(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    إظهار في العروض
                  </button>
                  <button
                    onClick={() => handleBulkOffersUpdate(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center"
                  >
                    <Zap className="w-4 h-4 mr-2 opacity-50" />
                    إخفاء من العروض
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    حذف المحدد
                  </button>
                  <button
                    onClick={() => setSelectedProducts([])}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    إلغاء التحديد
                  </button>
                </div>
              </div>

              {/* Bulk Discount Controls */}
              <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center space-x-3 space-x-reverse">
                <button
                  onClick={() => setShowBulkDiscountInput(!showBulkDiscountInput)}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center text-sm"
                >
                  <Tag className="w-4 h-4 ml-2" />
                  تطبيق خصم جماعي
                </button>

                {showBulkDiscountInput && (
                  <div className="flex items-center bg-white p-1 rounded-lg border border-orange-200 animate-in fade-in duration-300">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={bulkDiscountPercentage}
                      onChange={(e) => setBulkDiscountPercentage(Number(e.target.value))}
                      placeholder="نسبة الخصم %"
                      className="w-24 px-3 py-2 text-sm border-none focus:ring-0"
                    />
                    <button
                      onClick={handleBulkApplyDiscount}
                      disabled={isBulkDiscounting}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 text-sm disabled:opacity-50"
                    >
                      {isBulkDiscounting ? 'جاري التطبيق...' : 'تطبيق'}
                    </button>
                    <button
                      onClick={() => setShowBulkDiscountInput(false)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Products Grid/List */}
        {products.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">لا توجد منتجات</h3>
            <p className="text-gray-600 mb-4">
              {getActiveFiltersCount() > 0
                ? "لم يتم العثور على منتجات تطابق معايير البحث"
                : "لم يتم العثور على منتجات في النظام"
              }
            </p>
            {getActiveFiltersCount() > 0 && (
              <button
                onClick={clearFilters}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 mr-4"
              >
                مسح الفلاتر
              </button>
            )}
            <button
              onClick={() => navigate("/admin/products/create")}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700"
            >
              إضافة منتج جديد
            </button>
          </div>
        ) : (
          <>
            {/* Products */}
            {viewMode === "table" ? (
              /* Table View */
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">جاري تحميل المنتجات...</p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              checked={selectedProducts.length === products.length && products.length > 0}
                              onChange={toggleAllSelection}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            المنتج
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            الفئة
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                            السعر
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            المخزون
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            المبيعات
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            المشاهدات
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            الخصم
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            الحالة
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            الإجراءات
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {products.map((product) => {
                          const stockStatus = getStockStatus(product);
                          const { hasDiscount, discountPercentage, discountValueLabel } = getDiscountInfo(product);
                          const { hasVariantPricing, priceLabel, referencePriceLabel } = getPriceInfo(product);

                          return (
                            <tr key={product.id} className="hover:bg-gray-50">
                              {/* Checkbox */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={selectedProducts.includes(product.id)}
                                  onChange={() => toggleProductSelection(product.id)}
                                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                                />
                              </td>

                              {/* Product */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-12 w-12">
                                    {product.images?.[0] ? (
                                      <img
                                        className="h-12 w-12 rounded-lg object-cover"
                                        src={getProductThumbnail(product)}
                                        alt={product.images[0].alt_text || product.name}
                                        onError={(e) => {
                                          e.currentTarget.src = '/placeholder.svg';
                                        }}
                                      />
                                    ) : (
                                      <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                        <Package className="w-6 h-6 text-gray-400" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="mr-4">
                                    <div className="text-sm font-medium text-gray-900 line-clamp-1">
                                      {product.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {product.brand?.name}
                                    </div>
                                    <div className="flex items-center space-x-1 space-x-reverse mt-1">
                                      {product.is_featured && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                          <Star className="w-3 h-3 ml-1" />
                                          مميز
                                        </span>
                                      )}
                                      {hasDiscount && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                          -{discountPercentage}%
                                        </span>
                                      )}
                                      {!product.is_active && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                          غير نشط
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>



                              {/* Stock */}

                              {/* Category */}
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                  {(product.categories && product.categories.length > 0
                                    ? product.categories
                                    : product.category
                                      ? [product.category]
                                      : []
                                  ).map((category) => (
                                    <span
                                      key={category.id}
                                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                    >
                                      {category.parent ? `${category.parent.name} > ${category.name}` : category.name}
                                    </span>
                                  ))}
                                  {(!product.categories || product.categories.length === 0) && !product.category && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                      غير محدد
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Price */}
                              {/* Price (Editable) */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                {editingId === product.id ? (
                                  <div className="flex flex-col space-y-2">
                                    <div>
                                      <label className="text-xs text-gray-500 block mb-1">السعر</label>
                                      <input
                                        type="number"
                                        name="price"
                                        value={editForm.price}
                                        onChange={handleEditFormChange}
                                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        min="0"
                                        step="0.01"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-gray-500 block mb-1">الأصلي (اختياري)</label>
                                      <input
                                        type="number"
                                        name="original_price"
                                        value={editForm.original_price}
                                        onChange={handleEditFormChange}
                                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        min="0"
                                        step="0.01"
                                        placeholder="-"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-gray-500 block mb-1">المقارنة (اختياري)</label>
                                      <input
                                        type="number"
                                        name="compare_price"
                                        value={editForm.compare_price}
                                        onChange={handleEditFormChange}
                                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        min="0"
                                        step="0.01"
                                        placeholder="-"
                                      />
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse pt-1">
                                      <button
                                        onClick={() => handleSaveEdit(product.id)}
                                        disabled={isSaving}
                                        className="text-white bg-green-600 hover:bg-green-700 p-1 rounded disabled:opacity-50"
                                        title="حفظ"
                                      >
                                        {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                      </button>
                                      <button
                                        onClick={handleCancelEdit}
                                        disabled={isSaving}
                                        className="text-white bg-red-600 hover:bg-red-700 p-1 rounded disabled:opacity-50"
                                        title="إلغاء"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="group relative">
                                    <div className="text-sm font-medium text-gray-900">
                                      {priceLabel}
                                    </div>
                                    {referencePriceLabel && (
                                      <div className="text-sm text-gray-500 line-through">
                                        {referencePriceLabel}
                                      </div>
                                    )}
                                    <button
                                      onClick={() => handleStartEdit(product)}
                                      className="absolute left-0 top-1/2 -translate-y-1/2 p-1 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emerald-50 rounded"
                                      title="تعديل السعر سريعاً"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </td>

                              {/* Stock */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className={`text-sm font-medium ${stockStatus.color}`}>
                                    {product.stock_quantity}
                                  </span>
                                  <span className="text-sm text-gray-500 mr-1">قطعة</span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {stockStatus.label}
                                </div>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {product.sales_count}
                                </div>
                                <div className="text-xs text-gray-500">
                                  مبيع
                                </div>
                              </td>

                              {/* Views */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {product.views_count || 0}
                                </div>
                                <div className="text-xs text-gray-500">
                                  مشاهدة
                                </div>
                              </td>

                              {/* Discount */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                {hasDiscount ? (
                                  <div className="flex flex-col space-y-1">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 w-fit">
                                      {discountPercentage}%
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      خصم {discountValueLabel}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400">لا يوجد</span>
                                )}
                              </td>

                              {/* Status */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col space-y-1">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.is_active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                    }`}>
                                    {product.is_active ? 'نشط' : 'غير نشط'}
                                  </span>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.status === 'out' ? 'bg-red-100 text-red-800' :
                                    stockStatus.status === 'low' ? 'bg-orange-100 text-orange-800' :
                                      'bg-green-100 text-green-800'
                                    }`}>
                                    {stockStatus.label}
                                  </span>
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center space-x-2 space-x-reverse">
                                  <button
                                    onClick={() => navigate(`/admin/products/${product.id}`)}
                                    className="text-emerald-600 hover:text-emerald-900 p-1 rounded"
                                    title="عرض التفاصيل"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                                    className="text-green-600 hover:text-green-900 p-1 rounded"
                                    title="تعديل"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="text-red-600 hover:text-red-900 p-1 rounded"
                                    title="حذف"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              /* Grid/List View */
              loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">جاري تحميل المنتجات...</p>
                  </div>
                </div>
              ) : (
                <div className={`${viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
                  }`}>
                  {products.map((product) => {
                    const stockStatus = getStockStatus(product);
                    const { hasDiscount, discountPercentage, discountValueLabel } = getDiscountInfo(product);
                    const { priceLabel, referencePriceLabel } = getPriceInfo(product);

                    return (
                      <div
                        key={product.id}
                        className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow ${viewMode === "list" ? "flex" : ""
                          }`}
                      >
                        {/* Product Image */}
                        <div className={`${viewMode === "grid" ? "aspect-square" : "w-32 h-32"} bg-gray-100 relative group`}>
                          {product.images?.[0] ? (
                            <img
                              src={getProductThumbnail(product)}
                              alt={product.images[0].alt_text || product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                          )}

                          {/* Status Badges */}
                          <div className="absolute top-2 right-2 flex flex-col space-y-1">
                            {product.is_featured && (
                              <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                <Star className="w-3 h-3 inline ml-1" />
                                مميز
                              </span>
                            )}
                            {hasDiscount && (
                              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                -{discountPercentage}%
                              </span>
                            )}
                            {!product.is_active && (
                              <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                غير نشط
                              </span>
                            )}
                          </div>

                          {/* Selection Checkbox */}
                          <div className="absolute top-2 left-2">
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(product.id)}
                              onChange={() => toggleProductSelection(product.id)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </div>

                          {/* Stock Status Overlay */}
                          <div className="absolute bottom-2 left-2">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${stockStatus.status === 'out' ? 'bg-red-100 text-red-700' :
                              stockStatus.status === 'low' ? 'bg-orange-100 text-orange-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                              {stockStatus.label}
                            </span>
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">{product.name}</h3>
                              <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-500">
                                {(product.categories && product.categories.length > 0
                                  ? product.categories
                                  : product.category
                                    ? [product.category]
                                    : []
                                ).map((category) => (
                                  <span
                                    key={category.id}
                                    className="bg-gray-100 px-2 py-1 rounded-full text-xs font-medium text-gray-800"
                                  >
                                    {category.parent ? `${category.parent.name} > ${category.name}` : category.name}
                                  </span>
                                ))}
                                {product.brand && (
                                  <span className="bg-gray-100 px-2 py-1 rounded-full text-xs font-medium text-emerald-600">
                                    {product.brand.name}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <MoreHorizontal className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>

                          {/* Price Section */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-600">السعر:</span>
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <span className="font-bold text-lg text-gray-900">
                                  {priceLabel}
                                </span>
                                {referencePriceLabel && (
                                  <span className="text-sm text-gray-500 line-through">
                                    {referencePriceLabel}
                                  </span>
                                )}
                              </div>
                            </div>
                            {hasDiscount && (
                              <div className="text-xs text-red-600 font-medium">
                                وفرت {discountValueLabel}
                              </div>
                            )}
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-2 mb-4">
                            <div className="text-center p-2 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-center mb-1">
                                <ShoppingCart className="w-4 h-4 text-emerald-600 ml-1" />
                                <span className="text-sm font-medium text-gray-900">{product.sales_count}</span>
                              </div>
                              <div className="text-xs text-gray-500">مبيع</div>
                            </div>

                            <div className="text-center p-2 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-center mb-1">
                                <Eye className="w-4 h-4 text-purple-600 ml-1" />
                                <span className="text-sm font-medium text-gray-900">{product.views_count || 0}</span>
                              </div>
                              <div className="text-xs text-gray-500">مشاهدة</div>
                            </div>

                            <div className="text-center p-2 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-center mb-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-current ml-1" />
                                <span className="text-sm font-medium text-gray-900">
                                  {typeof product.rating === 'number' ? product.rating.toFixed(1) : '0.0'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">({product.reviews_count})</div>
                            </div>

                            <div className="text-center p-2 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-center mb-1">
                                <Package className="w-4 h-4 text-green-600 ml-1" />
                                <span className="text-sm font-medium text-gray-900">{product.stock_quantity}</span>
                              </div>
                              <div className="text-xs text-gray-500">مخزون</div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 border-t border-gray-100 flex items-center justify-between mt-auto">
                          <div className="flex items-center space-x-1 space-x-reverse">
                            <button
                              onClick={() => navigate(`/admin/products/${product.id}`)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="عرض التفاصيل"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="تعديل"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="text-xs text-gray-400">
                            {new Date(product.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* Pagination and Stats */}
            <div className="mt-8">
              {/* Stats Bar */}
              <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-6 space-x-reverse text-sm text-gray-600">
                  <div className="flex items-center">
                    <Package className="w-4 h-4 ml-2" />
                    <span>إجمالي المنتجات: <strong>{totalProducts.toLocaleString()}</strong></span>
                  </div>
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 ml-2" />
                    <span>المعروض: <strong>{products.length}</strong></span>
                  </div>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 ml-2" />
                    <span>المميز: <strong>{products.filter(p => p.is_featured).length}</strong></span>
                  </div>
                  <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 ml-2" />
                    <span>مخزون منخفض: <strong>{products.filter(p => p.stock_quantity <= 5).length}</strong></span>
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  تم تحميل {products.length.toLocaleString()} من {totalProducts.toLocaleString()} منتج
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      السابق
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${currentPage === page
                          ? 'bg-emerald-600 text-white'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      التالي
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2rem)] overflow-hidden animate-in fade-in zoom-in duration-200 text-right flex flex-col" dir="rtl">
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 sm:p-6 border-b bg-white">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" />
                استيراد المنتجات جماعياً
              </h2>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  resetImportState();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8">
              {!importResults ? (
                <div className="space-y-6">
                  {/* Step 1: Download Template */}
                  <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
                    <h3 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
                      <span className="bg-emerald-200 text-emerald-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                      تحميل نموذج الإكسل المحدث (XLSX)
                    </h3>
                    <p className="text-sm text-emerald-700 mb-4 leading-relaxed">
                      يحتوي هذا الملف على جميع الأعمدة المطلوبة بما في ذلك كافة "الفلاتر" المتاحة حالياً في متجرك، مع **قوائم منسدلة** لاختيار القيم بسهولة.
                    </p>
                    <button
                      onClick={async () => {
                        try {
                          const res = await adminProductsAPI.getImportTemplate();
                          const url = window.URL.createObjectURL(new Blob([res.data]));
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', 'products_template.xlsx');
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                        } catch (err) {
                          alert("فشل في تحميل النموذج");
                        }
                      }}
                      className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition-all font-semibold shadow-sm"
                    >
                      <Download className="w-4 h-4 ml-2" />
                      تحميل نموذج Excel
                    </button>
                  </div>

                  {/* Step 2: Import Source */}
                  <div className="space-y-5">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                      اختيار مصدر الملفات
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        disabled={isImporting}
                        onClick={() => setImportSource("server")}
                        className={`rounded-xl border px-4 py-3 text-right transition ${
                          importSource === "server"
                            ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                            : "border-gray-200 bg-white text-gray-700 hover:border-emerald-200"
                        }`}
                      >
                        <div className="font-bold">من السيرفر / FTP</div>
                        <div className="text-xs mt-1 text-gray-600">استورد من ملفات موجودة مسبقًا داخل مجلدات الاستيراد.</div>
                      </button>
                      <button
                        type="button"
                        disabled={isImporting}
                        onClick={() => setImportSource("upload")}
                        className={`rounded-xl border px-4 py-3 text-right transition ${
                          importSource === "upload"
                            ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                            : "border-gray-200 bg-white text-gray-700 hover:border-emerald-200"
                        }`}
                      >
                        <div className="font-bold">رفع من الجهاز</div>
                        <div className="text-xs mt-1 text-gray-600">استخدم هذا الخيار فقط إذا لم تكن الملفات موجودة على السيرفر.</div>
                      </button>
                    </div>

                    {importSource === "server" ? (
                      <div className="space-y-4 rounded-xl border border-emerald-100 bg-emerald-50/40 p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold text-emerald-900">ملفات السيرفر الجاهزة للاستيراد</div>
                            <div className="text-xs text-emerald-700 mt-1">ارفع الملفات عبر FTP إلى المجلدات التالية ثم حدّث القائمة.</div>
                            <div className="font-mono text-[11px] text-emerald-800 mt-2">storage/app/private/imports/products/inbox/files</div>
                            <div className="font-mono text-[11px] text-emerald-800 mt-1">storage/app/private/imports/products/inbox/zips</div>
                          </div>
                          <button
                            type="button"
                            disabled={isLoadingImportInbox || isImporting}
                            onClick={loadImportInbox}
                            className="px-3 py-2 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-white disabled:opacity-50"
                          >
                            {isLoadingImportInbox ? "جاري التحديث..." : "تحديث القائمة"}
                          </button>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2 text-right">ملف المنتجات على السيرفر *</label>
                          <select
                            value={selectedServerImportFile}
                            onChange={(e) => setSelectedServerImportFile(e.target.value)}
                            disabled={isImporting || isLoadingImportInbox}
                            className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700"
                          >
                            <option value="">اختر ملف Excel أو CSV</option>
                            {serverImportFiles.map((file) => (
                              <option key={file.path} value={file.path}>
                                {file.name} - {formatImportAssetSize(file.size)}
                              </option>
                            ))}
                          </select>
                          {serverImportFiles.length === 0 && !isLoadingImportInbox && (
                            <p className="mt-2 text-xs text-amber-700">لا توجد ملفات داخل مجلد `files` حتى الآن.</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2 text-right">ملف الصور ZIP على السيرفر (اختياري)</label>
                          <select
                            value={selectedServerImportZip}
                            onChange={(e) => setSelectedServerImportZip(e.target.value)}
                            disabled={isImporting || isLoadingImportInbox}
                            className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700"
                          >
                            <option value="">بدون ملف صور مضغوط</option>
                            {serverImportZips.map((zip) => (
                              <option key={zip.path} value={zip.path}>
                                {zip.name} - {formatImportAssetSize(zip.size)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2 text-right">ملف المنتجات (Excel أو CSV) *</label>
                          <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                            className="block w-full text-sm text-gray-500 file:ml-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 border border-gray-200 rounded-lg p-1"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2 text-right">صور المنتجات ZIP (اختياري)</label>
                          <input
                            type="file"
                            accept=".zip,application/zip"
                            onChange={(e) => setImportImagesZip(e.target.files?.[0] || null)}
                            className="block w-full text-sm text-gray-500 file:ml-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 border border-gray-200 rounded-lg p-1"
                          />
                          <p className="text-xs text-gray-500 mt-2 text-right">يجب أن تطابق أسماء الصور ما كتبته في عمود `image_filenames`.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {isImporting && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 space-y-4" dir="rtl">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-emerald-900">حالة الاستيراد</h4>
                          <p className="text-sm text-emerald-800">{importStatusText}</p>
                        </div>
                        <div className="text-2xl font-extrabold text-emerald-700 min-w-[64px] text-left">
                          {importProgress}%
                        </div>
                      </div>

                      <Progress value={importProgress} className="h-3 bg-emerald-100 [&>div]:bg-emerald-600" />

                      <div className="space-y-3">
                        {importSteps.map((step, index) => {
                          const state = getImportStepState(step.key);

                          return (
                            <div
                              key={step.key}
                              className={`flex items-start gap-3 rounded-lg border px-3 py-3 ${
                                state === "done"
                                  ? "border-emerald-200 bg-white"
                                  : state === "active"
                                    ? "border-emerald-400 bg-white shadow-sm"
                                    : "border-gray-200 bg-gray-50"
                              }`}
                            >
                              <div
                                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                  state === "done"
                                    ? "bg-emerald-600 text-white"
                                    : state === "active"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-gray-200 text-gray-500"
                                }`}
                              >
                                {state === "done" ? <CheckCircle className="w-4 h-4" /> : index + 1}
                              </div>
                              <div className="min-w-0">
                                <div className={`font-semibold ${state === "pending" ? "text-gray-500" : "text-gray-900"}`}>
                                  {step.label}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">{step.description}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <p className="text-xs text-gray-600">
                        {importSource === "upload"
                          ? "بعد وصول الرفع إلى 100% تبدأ مرحلة المعالجة داخل الخادم، وقد تستغرق وقتًا أطول إذا كان الملف المضغوط كبيرًا أو عدد المنتجات مرتفعًا."
                          : "عند اختيار الملفات من السيرفر يبدأ Laravel المعالجة مباشرة دون انتظار رفع الملفات من المتصفح."}
                      </p>
                    </div>
                  )}

                  <div className="sticky bottom-0 bg-white pt-4 sm:pt-6 border-t flex justify-end gap-3 flex-row-reverse">
                    <button
                      disabled={
                        isImporting ||
                        (importSource === "upload" ? !importFile : !selectedServerImportFile)
                      }
                      onClick={async () => {
                        let keepImportSessionOpen = false;
                        try {
                          setIsImporting(true);
                          setActiveImportId(null);
                          setImportResults(null);
                          setImportStage("preparing");
                          setImportProgress(5);
                          setImportStatusText("جاري تجهيز ملفات الاستيراد...");
                          let startRes;

                          if (importSource === "server") {
                            setImportStage("processing");
                            setImportProgress(15);
                            setImportStatusText("تم العثور على ملفات السيرفر. جاري بدء مهمة الاستيراد...");
                            startRes = await adminProductsAPI.startImportFromInbox({
                              file_path: selectedServerImportFile,
                              images_zip_path: selectedServerImportZip || null,
                            });
                          } else {
                            const formData = new FormData();
                            formData.append('file', importFile!);
                            if (importImagesZip) {
                              formData.append('images_zip', importImagesZip);
                            }

                            setImportStage("uploading");
                            setImportStatusText(
                              importImagesZip
                                ? "جاري رفع ملف المنتجات والملف المضغوط للصور..."
                                : "جاري رفع ملف المنتجات..."
                            );

                            const uploadRes = await adminProductsAPI.uploadImportAssets(formData, {
                              onUploadProgress: (progressEvent) => {
                                const total = progressEvent.total ?? 0;
                                if (!total) {
                                  setImportProgress(20);
                                  return;
                                }

                                const percent = Math.round((progressEvent.loaded * 100) / total);
                                setImportProgress(Math.max(10, Math.min(percent, 100)));

                                if (percent >= 100) {
                                  setImportStage("processing");
                                  setImportProgress(100);
                                  setImportStatusText(
                                    "تم رفع الملفات. الخادم يعالج الآن فك الضغط وقراءة الملف وحفظ المنتجات..."
                                  );
                                }
                              },
                            });

                            setImportStage("processing");
                            setImportProgress(100);
                            setImportStatusText("تم رفع الملفات. جاري بدء مهمة الاستيراد...");
                            startRes = await adminProductsAPI.startImport(uploadRes.assets);
                          }

                          const importData: ImportJobStatus = startRes.import;
                          keepImportSessionOpen = true;
                          setActiveImportId(importData.id);
                          setImportStage("processing");
                          setImportProgress(importData.progress ?? 0);
                          setImportStatusText(importData.message || "تمت إضافة الاستيراد إلى قائمة المعالجة.");
                          pollImportStatus(importData.id);
                          return;
                        } catch (err: any) {
                          setImportStage("failed");
                          setImportStatusText(err.response?.data?.message || "حدث خطأ أثناء معالجة ملف الاستيراد.");
                          showImportError(err.response?.data || {});
                          return;
                        } finally {
                          if (!keepImportSessionOpen) {
                            setIsImporting(false);
                          }
                        }
                      }}
                      className="px-8 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold shadow-md flex items-center gap-2"
                    >
                      {isImporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin ml-2" />
                          جاري الاستيراد...
                        </>
                      ) : (
                        "بدء الاستيراد الآن"
                      )}
                    </button>
                    <button
                      onClick={() => setShowImportModal(false)}
                      className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium border"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 space-y-6">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 scale-125">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">تم الاستيراد بنجاح!</h3>
                    <p className="text-gray-600">تمت معالجة بياناتك وتحديث المتجر.</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 max-w-md mx-auto py-6" dir="rtl">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <div className="text-2xl font-bold text-blue-700">{importResults.rows_processed}</div>
                      <div className="text-xs text-blue-600 font-medium">سطر معالج</div>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                      <div className="text-2xl font-bold text-emerald-700">{importResults.created}</div>
                      <div className="text-xs text-emerald-600 font-medium">منتج جديد</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                      <div className="text-2xl font-bold text-orange-700">{importResults.updated}</div>
                      <div className="text-xs text-orange-600 font-medium">منتج محدث</div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      resetImportState();
                    }}
                    className="mt-6 w-full bg-gray-900 text-white py-4 rounded-xl hover:bg-black transition-all font-bold"
                  >
                    إغلاق والعودة للقائمة
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminProducts;
