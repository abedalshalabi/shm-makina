import React, { useState, useEffect } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Essentials,
  Bold,
  Italic,
  Underline,
  Paragraph,
  Link,
  List,
  BlockQuote,
  Heading,
  Indent,
  Autoformat,
  Undo,
  Image,
  ImageCaption,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  Base64UploadAdapter,
  Table,
  TableToolbar,
  Alignment,
  LinkImage,
  ImageResize
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save, X, Upload, Image as ImageIcon, Trash2, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import adminApi, { adminProductsAPI, adminCategoriesAPI, adminBrandsAPI } from '@/services/adminApi';
import { getStorageUrl } from '@/config/env';
import Swal from 'sweetalert2';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  sku: string;
  price: number;
  original_price: number;
  compare_price: number;
  cost_price: number;
  discount_percentage: number;
  stock_quantity: number;
  manage_stock: boolean;
  stock_status: string;
  in_stock: boolean;
  weight: number;
  dimensions: string;
  warranty: string;
  delivery_time: string;
  images: Array<string | {
    id?: number;
    image_path?: string;
    image_url: string;
    alt_text?: string;
    is_primary?: boolean;
    sort_order?: number;
  }>;
  size_guide_images?: Array<string | {
    image_path?: string;
    image_url: string;
  }>;
  is_active: boolean;
  is_featured: boolean;
  show_in_offers: boolean;
  sort_order: number;
  rating: number;
  reviews_count: number;
  views_count: number;
  sales_count: number;
  meta_title: string;
  meta_description: string;
  category_id: number;
  brand_id: number;
  features: string[];
  specifications: Record<string, string>;
  filter_values: Record<string, string[]>;
  variants?: Variant[];
  show_description?: boolean;
  show_specifications?: boolean;
  created_at?: string;
}

export interface Variant {
  id?: number;
  product_id?: number;
  variant_values: Record<string, string>;
  price: string | number | null;
  stock_quantity: number | string;
  sku: string | null;
  images?: any[];
  image_files?: File[];
  image_previews?: string[];
  image_urls?: string[];
  existing_images?: any[];
}

interface Category {
  id: number;
  name: string;
  parent_id?: number | null;
  filters?: Filter[];
}

interface Filter {
  name: string;
  type: 'select' | 'checkbox' | 'range' | 'text';
  options?: string[];
  required?: boolean;
}

interface Brand {
  id: number;
  name: string;
}

const AdminProductEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [availableFilters, setAvailableFilters] = useState<Filter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageUrlsText, setImageUrlsText] = useState('');
  const [sizeGuideFiles, setSizeGuideFiles] = useState<File[]>([]);
  const [sizeGuidePreviews, setSizeGuidePreviews] = useState<string[]>([]);
  const [sizeGuideUrlsText, setSizeGuideUrlsText] = useState('');

  const formatDateTimeLocal = (value?: string | null): string => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    sku: '',
    price: 0,
    original_price: 0,
    compare_price: 0,
    cost_price: 0,
    discount_percentage: 0,
    stock_quantity: 0,
    manage_stock: true,
    stock_status: 'in_stock',
    in_stock: true,
    weight: 0,
    dimensions: '',
    warranty: '',
    delivery_time: '',
    images: [] as Array<string | { image_url: string; alt_text?: string; is_primary?: boolean; sort_order?: number }>,
    size_guide_images: [] as Array<string | { image_url: string; image_path?: string }>,
    is_active: true,
    is_featured: false,
    show_in_offers: false,
    sort_order: 0,
    rating: 0,
    reviews_count: 0,
    views_count: 0,
    sales_count: 0,
    meta_title: '',
    meta_description: '',
    category_id: null,
    categories: [] as number[],
    brand_id: null,
    features: [] as string[],
    specifications: {} as Record<string, string>,
    filter_values: {} as Record<string, string[]>,
    variants: [] as Variant[],
    cover_image: null as string | null,
    show_description: true,
    show_specifications: true,
    created_at: ''
  });

  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

  const normalizePreviewSrc = (path: string | null | undefined): string => {
    if (!path) return '';
    if (path.startsWith('data:') || path.startsWith('blob:')) {
      return path;
    }
    return getStorageUrl(path);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productResponse, categoriesResponse, brandsResponse] = await Promise.all([
        adminProductsAPI.getProduct(Number(id).toString()),
        adminCategoriesAPI.getCategories({ per_page: 1000 }),
        adminBrandsAPI.getBrands({ per_page: 1000 })
      ]);

      const normalizedCategories = Array.isArray(categoriesResponse.data) 
        ? categoriesResponse.data.map((c: any) => ({ ...c, id: Number(c.id), parent_id: c.parent_id ? Number(c.parent_id) : null }))
        : Array.isArray(categoriesResponse.data?.data)
          ? categoriesResponse.data.data.map((c: any) => ({ ...c, id: Number(c.id), parent_id: c.parent_id ? Number(c.parent_id) : null }))
          : [];

      setProduct(productResponse.data);
      setCategories(normalizedCategories);
      setBrands(brandsResponse.data);

      const formDataToSet = {
        name: productResponse.data.name || '',
        slug: productResponse.data.slug || '',
        description: productResponse.data.description || '',
        short_description: productResponse.data.short_description || '',
        sku: productResponse.data.sku || '',
        price: productResponse.data.price || 0,
        original_price: productResponse.data.original_price || 0,
        compare_price: productResponse.data.compare_price || 0,
        cost_price: productResponse.data.cost_price || 0,
        discount_percentage: productResponse.data.discount_percentage || 0,
        stock_quantity: productResponse.data.stock_quantity || 0,
        manage_stock: productResponse.data.manage_stock || false,
        stock_status: productResponse.data.stock_status || 'in_stock',
        in_stock: productResponse.data.in_stock || false,
        weight: productResponse.data.weight || 0,
        dimensions: productResponse.data.dimensions || '',
        warranty: productResponse.data.warranty || '',
        delivery_time: productResponse.data.delivery_time || '',
        images: productResponse.data.images || [],
        size_guide_images: productResponse.data.size_guide_images || [],
        is_active: productResponse.data.is_active || false,
        is_featured: productResponse.data.is_featured || false,
        show_in_offers: productResponse.data.show_in_offers || false,
        sort_order: productResponse.data.sort_order || 0,
        rating: productResponse.data.rating || 0,
        reviews_count: productResponse.data.reviews_count || 0,
        views_count: productResponse.data.views_count || 0,
        sales_count: productResponse.data.sales_count || 0,
        meta_title: productResponse.data.meta_title || '',
        meta_description: productResponse.data.meta_description || '',
        category_id: productResponse.data.category?.id || productResponse.data.category_id || null, // Keep for backward compatibility
        categories: productResponse.data.categories?.map((cat: any) => cat.id) || [], // New: multiple categories
        brand_id: productResponse.data.brand?.id || productResponse.data.brand_id || null,
        features: productResponse.data.features || [],
        specifications: productResponse.data.specifications || {},
        filter_values: (() => {
          const raw = productResponse.data.filter_values || {};
          // Convert old string format to array format for backward compatibility
          const normalized: Record<string, string[]> = {};
          Object.entries(raw).forEach(([key, val]) => {
            if (Array.isArray(val)) {
              normalized[key] = val;
            } else if (typeof val === 'string' && val.trim()) {
              normalized[key] = [val];
            } else {
              normalized[key] = [];
            }
          });
          return normalized;
        })(),
        variants: productResponse.data.variants?.map((v: any) => ({
          ...v,
          image_previews: v.images?.map((img: any) => normalizePreviewSrc(img.image_url)) || [],
          existing_images: v.images || []
        })) || [],
        cover_image: productResponse.data.cover_image || null,
        show_description: productResponse.data.show_description !== undefined ? productResponse.data.show_description : true,
        show_specifications: productResponse.data.show_specifications !== undefined ? productResponse.data.show_specifications : true,
        created_at: formatDateTimeLocal(productResponse.data.created_at),
      };

      setFormData(formDataToSet);

      // Set cover image preview if exists
      if (productResponse.data.cover_image) {
        setCoverImagePreview(normalizePreviewSrc(productResponse.data.cover_image));
      }

      // Initialize selectedParentId based on current category
      const initialCategoryId = productResponse.data.category?.id || productResponse.data.category_id;
      if (initialCategoryId) {
        const cat = categoriesResponse.data.find((c: any) => c.id === initialCategoryId);
        if (cat) {
          if (cat.parent_id) {
            setSelectedParentId(cat.parent_id);
          } else {
            setSelectedParentId(cat.id);
          }
        }
      }

      const existingImageUrls = (formDataToSet.images || [])
        .map((img: any) => {
          if (typeof img === 'string') {
            return img;
          }
          if (img && typeof img === 'object' && 'image_url' in img) {
            return img.image_url as string;
          }
          return null;
        })
        .filter((url): url is string => !!url && (url.startsWith('http://') || url.startsWith('https://')));
      setImageUrlsText(existingImageUrls.join('\n'));

      const existingSizeGuideUrls = (formDataToSet.size_guide_images || [])
        .map((img: any) => {
          if (typeof img === 'string') return img;
          if (img && typeof img === 'object' && 'image_url' in img) return img.image_url as string;
          return null;
        })
        .filter((url): url is string => !!url && (url.startsWith('http://') || url.startsWith('https://')));
      setSizeGuideUrlsText(existingSizeGuideUrls.join('\n'));

    } catch (err: any) {
      console.error('Error loading data:', err);

      // عرض السبب التفصيلي للخطأ
      let errorMessage = 'فشل في تحميل بيانات المنتج';

      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;

        if (status === 404) {
          errorMessage = 'المنتج غير موجود أو تم حذفه';
        } else if (status === 500) {
          errorMessage = `خطأ في الخادم (500): ${data.message || 'خطأ غير معروف'}`;
        } else {
          errorMessage = `خطأ في تحميل البيانات (${status}): ${data.message || 'خطأ غير معروف'}`;
        }
      } else if (err.request) {
        errorMessage = 'مشكلة في الاتصال بالخادم. تأكد من أن الخادم يعمل.';
      } else {
        errorMessage = `خطأ غير متوقع: ${err.message || 'خطأ غير معروف'}`;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const numValue = (type === 'number' || name.includes('_id')) ? Number(value) : value;

    setFormData(prev => {
      const updated = { ...prev, [name]: numValue };

      // Pricing logic: price is the base price, discount_percentage is applied on site
      if (name === 'price') {
        updated.price = Number(numValue);
      } else if (name === 'discount_percentage') {
        updated.discount_percentage = Number(numValue);
      }

      return updated;
    });
  };

  const handleCategoryChange = (categoryId: number) => {
    const numericId = Number(categoryId);
    setFormData(prev => {
      // Check if already in the list
      if (prev.categories.map(Number).includes(numericId)) {
        return prev;
      }
      
      const newCategories = [...prev.categories.map(Number), numericId];
      
      return { 
        ...prev, 
        category_id: numericId, // Keep last selected for compatibility
        categories: newCategories 
      };
    });
    
    console.log('Category added:', numericId);
  };

  const handleRemoveCategory = (categoryId: number) => {
    const numericIdToRemove = Number(categoryId);
    setFormData(prev => {
      const newCategories = prev.categories.filter(id => Number(id) !== numericIdToRemove);
      
      return {
        ...prev,
        categories: newCategories,
        category_id: newCategories.length > 0 ? Number(newCategories[newCategories.length - 1]) : null
      };
    });
  };

  // Effect to automatically update available filters based on categories selection
  useEffect(() => {
    if (categories.length > 0) {
      // Collect all selected categories and their parents for filter inheritance
      const allCategoryIds = [...formData.categories];
      
      // Include legacy category_id if not already in categories
      if (formData.category_id && !allCategoryIds.includes(formData.category_id)) {
        allCategoryIds.push(formData.category_id);
      }
      
      // Add parent IDs for inheritance
      const finalIds = [...allCategoryIds];
      allCategoryIds.forEach(id => {
        const cat = categories.find(c => c.id === id);
        if (cat?.parent_id && !finalIds.includes(cat.parent_id)) {
          finalIds.push(cat.parent_id);
        }
      });
      
      if (finalIds.length > 0) {
        updateFiltersFromCategories(finalIds);
      } else {
        setAvailableFilters([]);
      }
    }
  }, [categories, formData.categories, formData.category_id]);


  // Function to update filters from multiple categories
  const updateFiltersFromCategories = (categoryIds: number[]) => {
    const allFilters: Filter[] = [];
    categoryIds.forEach(catId => {
      const selectedCategory = categories.find(cat => cat.id === catId);
      if (selectedCategory && selectedCategory.filters) {
        // Merge filters, avoiding duplicates by name
        selectedCategory.filters.forEach(filter => {
          const existingFilter = allFilters.find(f => f.name === filter.name);
          if (!existingFilter) {
            // Add new filter
            allFilters.push({ ...filter });
          } else {
            // If filter exists, merge options (for select/range types)
            if (filter.type === 'select' && filter.options && existingFilter.options) {
              // Merge options, avoiding duplicates
              const mergedOptions = [...existingFilter.options];
              filter.options.forEach(option => {
                if (!mergedOptions.includes(option)) {
                  mergedOptions.push(option);
                }
              });
              existingFilter.options = mergedOptions;
            }
          }
        });
      }
    });
    console.log('Merged filters from categories:', categoryIds, 'Result:', allFilters);
    setAvailableFilters(allFilters);
  };

  const handleFilterValueChange = (filterName: string, values: string[]) => {
    setFormData(prev => ({
      ...prev,
      filter_values: {
        ...prev.filter_values,
        [filterName]: values
      }
    }));
  };

  const handleFilterToggleValue = (filterName: string, option: string, checked: boolean) => {
    setFormData(prev => {
      const currentValues = prev.filter_values[filterName] || [];
      let newValues: string[];
      if (checked) {
        newValues = [...currentValues, option];
      } else {
        newValues = currentValues.filter(v => v !== option);
      }
      return {
        ...prev,
        filter_values: {
          ...prev.filter_values,
          [filterName]: newValues
        }
      };
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImageFiles(prev => [...prev, ...files]);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          if (!result) {
            return;
          }

          setImagePreviews(prev => [...prev, result]);

          setFormData(prev => {
            const existingImages = prev.images.filter(
              (img): img is { image_url: string; alt_text?: string; is_primary?: boolean; sort_order?: number } =>
                typeof img === 'object' && img !== null && !Array.isArray(img) && 'image_url' in img
            );

            const regularUrls = prev.images.filter(
              (img): img is string => typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))
            );

            const dataUrls = prev.images.filter(
              (img): img is string => typeof img === 'string' && img.startsWith('data:')
            );

            if (dataUrls.includes(result)) {
              return prev;
            }

            return {
              ...prev,
              images: [...existingImages, ...regularUrls, ...dataUrls, result]
            };
          });
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));

    // Remove from formData.images as well (only remove data URLs, not regular URLs or existing objects)
    setFormData(prev => {
      const existingImages = prev.images.filter((img): img is { image_url: string; alt_text?: string; is_primary?: boolean; sort_order?: number } =>
        typeof img === 'object' && img !== null && !Array.isArray(img) && 'image_url' in img
      );
      const dataUrls = prev.images.filter(img => typeof img === 'string' && img.startsWith('data:'));
      const regularUrls = prev.images.filter(img => typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://')));

      const updatedDataUrls = dataUrls.filter((_, i) => i !== index);

      return {
        ...prev,
        images: [...existingImages, ...updatedDataUrls, ...regularUrls]
      };
    });
  };

  const handleRemoveCurrentImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setCoverImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCoverImage = () => {
    setCoverImageFile(null);
    setCoverImagePreview(null);
    setFormData(prev => ({ ...prev, cover_image: null }));
  };



  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('_id') ? Number(value) : value
    }));

    // إذا تم تغيير الفئة، قم بتحميل الفلاتر المتاحة
    if (name === 'category_id') {
      handleCategoryChange(Number(value));
    }
  };

  const parseImageUrls = (value: string): string[] =>
    value
      .split(/[\n,]/)
      .map(img => img.trim())
      .filter(img => img.length > 0 && (img.startsWith('http://') || img.startsWith('https://')));

  const handleImagesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setImageUrlsText(value);
    const imageUrls = parseImageUrls(value);

    setFormData(prev => ({
      ...prev,
      images: [
        ...prev.images.filter(img => typeof img === 'object' && img !== null && !Array.isArray(img) && 'image_url' in img),
        ...imagePreviews,
        ...imageUrls
      ]
    }));
  };

  const handleSizeGuideImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setSizeGuideFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (!result) return;

        setSizeGuidePreviews((prev) => [...prev, result]);
        setFormData((prev) => ({
          ...prev,
          size_guide_images: [...prev.size_guide_images, result],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveSizeGuideImage = (index: number) => {
    setSizeGuidePreviews((prev) => prev.filter((_, i) => i !== index));
    setSizeGuideFiles((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => {
      const existingImages = prev.size_guide_images.filter(
        (img): img is { image_url: string; image_path?: string } =>
          typeof img === 'object' && img !== null && !Array.isArray(img) && 'image_url' in img
      );
      const dataUrls = prev.size_guide_images.filter(
        (img): img is string => typeof img === 'string' && img.startsWith('data:')
      );
      const regularUrls = prev.size_guide_images.filter(
        (img): img is string => typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))
      );

      return {
        ...prev,
        size_guide_images: [...existingImages, ...dataUrls.filter((_, i) => i !== index), ...regularUrls],
      };
    });
  };

  const handleRemoveCurrentSizeGuideImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      size_guide_images: prev.size_guide_images.filter((_, i) => i !== index),
    }));
  };

  const handleSizeGuideUrlsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setSizeGuideUrlsText(value);
    const imageUrls = parseImageUrls(value);

    setFormData((prev) => ({
      ...prev,
      size_guide_images: [
        ...prev.size_guide_images.filter((img) => typeof img === 'object' && img !== null && !Array.isArray(img) && 'image_url' in img),
        ...sizeGuidePreviews,
        ...imageUrls,
      ],
    }));
  };

  const handleFeaturesChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    const features = value.split(',').map(feature => feature.trim()).filter(feature => feature);
    setFormData(prev => ({
      ...prev,
      features
    }));
  };

  const generateVariants = () => {
    const filtersWithValues = Object.entries(formData.filter_values).filter(([_, values]) => values && values.length > 0);
    if (filtersWithValues.length === 0) {
      setFormData(prev => ({ ...prev, variants: [] }));
      return;
    }

    const cartesian = (arrays: string[][]): string[][] => {
      return arrays.reduce<string[][]>((a, b) => 
        a.flatMap(d => b.map(e => [...d, e])), [[]]
      );
    };

    const keys = filtersWithValues.map(([key]) => key);
    const arrays = filtersWithValues.map(([_, values]) => values);
    const combinations = cartesian(arrays);

    const newVariants: Variant[] = combinations.map(combo => {
      const variant_values: Record<string, string> = {};
      combo.forEach((val, i) => {
        variant_values[keys[i]] = val;
      });

      const existing = formData.variants?.find(v => {
        return (
          Object.keys(v.variant_values).length === keys.length &&
          keys.every(k => v.variant_values[k] === variant_values[k])
        );
      });

      if (existing) {
        return existing;
      }
      return { variant_values, price: '', stock_quantity: '0', sku: '' };
    });

    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const handleVariantChange = (index: number, field: keyof Variant, value: string) => {
    setFormData(prev => {
      const newVariants = [...(prev.variants || [])];
      newVariants[index] = { ...newVariants[index], [field]: value };
      return { ...prev, variants: newVariants };
    });
  };

  const handleVariantImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newVariants = [...formData.variants];
    const variant = { ...newVariants[index] };
    
    if (!variant.image_files) variant.image_files = [];
    if (!variant.image_previews) variant.image_previews = [];
    
    variant.image_files = [...variant.image_files, ...files];
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          variant.image_previews = [...(variant.image_previews || []), result];
          newVariants[index] = variant;
          setFormData(prev => ({ ...prev, variants: [...newVariants] }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveVariantImage = (variantIndex: number, imageIndex: number) => {
    setFormData(prev => {
      const newVariants = [...prev.variants];
      const variant = { ...newVariants[variantIndex] };
      
      // If it's an existing image (from backend)
      const isExisting = variant.existing_images && imageIndex < variant.existing_images.length;
      
      if (isExisting) {
        variant.existing_images = variant.existing_images?.filter((_, i) => i !== imageIndex);
      } else {
        // It's a new file upload
        const fileIdx = variant.existing_images ? imageIndex - variant.existing_images.length : imageIndex;
        if (variant.image_files) {
          variant.image_files = variant.image_files.filter((_, i) => i !== fileIdx);
        }
      }

      if (variant.image_previews) {
        variant.image_previews = variant.image_previews.filter((_, i) => i !== imageIndex);
      }
      
      newVariants[variantIndex] = variant;
      return { ...prev, variants: newVariants };
    });
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    setFormData(prev => {
      const newImages = [...prev.images];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (targetIndex < 0 || targetIndex >= newImages.length) return prev;
      
      [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
      return { ...prev, images: newImages };
    });
  };

  const moveNewImage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= imageFiles.length) return;

    setImageFiles(prev => {
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });

    setImagePreviews(prev => {
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const moveVariantImage = (variantIndex: number, imageIndex: number, direction: 'up' | 'down') => {
    setFormData(prev => {
      const newVariants = [...prev.variants];
      const variant = { ...newVariants[variantIndex] };
      const targetIndex = direction === 'up' ? imageIndex - 1 : imageIndex + 1;
      
      if (!variant.image_previews || targetIndex < 0 || targetIndex >= variant.image_previews.length) return prev;

      // 1. Swap in image_previews for visual consistency
      const newPreviews = [...variant.image_previews];
      [newPreviews[imageIndex], newPreviews[targetIndex]] = [newPreviews[targetIndex], newPreviews[imageIndex]];
      variant.image_previews = newPreviews;

      // 2. Identify and swap in source arrays
      const existingCount = variant.existing_images?.length || 0;
      const urlsCount = variant.image_urls?.length || 0;
      const filesCount = variant.image_files?.length || 0;

      // Helper to identify source and local index
      const getSourceInfo = (idx: number) => {
        if (idx < existingCount) return { type: 'existing', localIdx: idx };
        if (idx < existingCount + urlsCount) return { type: 'url', localIdx: idx - existingCount };
        return { type: 'file', localIdx: idx - existingCount - urlsCount };
      };

      const sourceA = getSourceInfo(imageIndex);
      const sourceB = getSourceInfo(targetIndex);

      if (sourceA.type === sourceB.type) {
        // Simple swap within same array
        if (sourceA.type === 'existing' && variant.existing_images) {
          const arr = [...variant.existing_images];
          [arr[sourceA.localIdx], arr[sourceB.localIdx]] = [arr[sourceB.localIdx], arr[sourceA.localIdx]];
          variant.existing_images = arr;
        } else if (sourceA.type === 'url' && variant.image_urls) {
          const arr = [...variant.image_urls];
          [arr[sourceA.localIdx], arr[sourceB.localIdx]] = [arr[sourceB.localIdx], arr[sourceA.localIdx]];
          variant.image_urls = arr;
        } else if (sourceA.type === 'file' && variant.image_files) {
          const arr = [...variant.image_files];
          [arr[sourceA.localIdx], arr[sourceB.localIdx]] = [arr[sourceB.localIdx], arr[sourceA.localIdx]];
          variant.image_files = arr;
        }
      } else {
        // Cross-array swap: Move items between different source arrays
        const arrays: Record<string, any[] | undefined> = {
          'existing': variant.existing_images ? [...variant.existing_images] : [],
          'url': variant.image_urls ? [...variant.image_urls] : [],
          'file': variant.image_files ? [...variant.image_files] : []
        };

        const itemA = arrays[sourceA.type]![sourceA.localIdx];
        const itemB = arrays[sourceB.type]![sourceB.localIdx];

        // Swap them in their respective arrays
        arrays[sourceA.type]![sourceA.localIdx] = itemB;
        arrays[sourceB.type]![sourceB.localIdx] = itemA;

        // Update variant state
        variant.existing_images = arrays['existing'];
        variant.image_urls = arrays['url'];
        variant.image_files = arrays['file'];
      }
      
      newVariants[variantIndex] = variant;
      return { ...prev, variants: newVariants };
    });
  };

  const handleDeleteVariant = async (index: number) => {
    const variant = formData.variants[index];
    
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: "سيتم حذف هذا الخيار من المنتج!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'نعم، احذفه!',
      cancelButtonText: 'إلغاء'
    });

    if (result.isConfirmed) {
      if (variant.id) {
        try {
          // If variant has an ID, we can optionally call the delete API immediately
          // but since the update method in backend recreates all variants from the array,
          // simply removing it from the array is enough to "delete" it upon save.
          // However, to be extra safe and provide immediate feedback:
          await adminProductsAPI.deleteVariant(variant.id.toString());
        } catch (err) {
          console.error('Error deleting variant via API:', err);
          // We still proceed to remove it from UI state below
        }
      }

      setFormData(prev => ({
        ...prev,
        variants: prev.variants.filter((_, i) => i !== index)
      }));

      Swal.fire(
        'تم الحذف!',
        'تم إزالة الخيار من القائمة.',
        'success'
      );
    }
  };

  const validateFilters = () => {
    const errors: string[] = [];

    availableFilters.forEach(filter => {
      const values = formData.filter_values[filter.name] || [];

      if (filter.required && values.length === 0) {
        errors.push(`الفلتر "${filter.name}" مطلوب`);
        return;
      }

      if (values.length > 0 && filter.type === 'select' && filter.options) {
        const invalidValues = values.filter(v => !filter.options!.includes(v));
        if (invalidValues.length > 0) {
          errors.push(`القيم "${invalidValues.join(', ')}" غير صحيحة للفلتر "${filter.name}". القيم المتاحة: ${filter.options.join(', ')}`);
        }
      }

      // Checkbox with options (multiple values)
      if (values.length > 0 && filter.type === 'checkbox' && filter.options && filter.options.length > 0) {
        const invalidValues = values.filter(v => !filter.options!.includes(v));
        if (invalidValues.length > 0) {
          errors.push(`القيم "${invalidValues.join(', ')}" غير صحيحة للفلتر "${filter.name}". القيم المتاحة: ${filter.options.join(', ')}`);
        }
      }

      // Checkbox without options (true/false only)
      if (values.length > 0 && filter.type === 'checkbox' && (!filter.options || filter.options.length === 0)) {
        if (!values.every(v => v === 'true' || v === 'false')) {
          errors.push(`القيمة غير صحيحة للفلتر "${filter.name}". القيم المتاحة: true, false`);
        }
      }
    });

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== Form Submit Started ===');
    console.log('FormData state:', formData);
    console.log('Category ID in formData:', formData.category_id, 'Type:', typeof formData.category_id);

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // التحقق من صحة الفلاتر
      console.log('Validating filters...');
      const filterErrors = validateFilters();
      console.log('Filter errors:', filterErrors);

      if (filterErrors.length > 0) {
        console.log('Filter validation failed, stopping submit');
        setError(filterErrors.join('\n'));
        setSaving(false);
        return;
      }

      console.log('Filter validation passed, creating FormData...');

      // Create FormData for file uploads
      const uploadFormData = new FormData();

      // Add all product data
      uploadFormData.append('name', formData.name);
      uploadFormData.append('slug', formData.slug);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('short_description', formData.short_description);
      uploadFormData.append('sku', formData.sku);
      uploadFormData.append('price', String(Number(formData.price)));
      uploadFormData.append('original_price', String(Number(formData.original_price) || 0));
      uploadFormData.append('compare_price', String(Number(formData.compare_price) || 0));
      uploadFormData.append('cost_price', String(Number(formData.cost_price) || 0));
      uploadFormData.append('discount_percentage', String(Number(formData.discount_percentage) || 0));
      uploadFormData.append('stock_quantity', String(Number(formData.stock_quantity)));
      uploadFormData.append('stock_status', formData.stock_status);
      uploadFormData.append('weight', String(Number(formData.weight) || 0));
      uploadFormData.append('sort_order', String(Number(formData.sort_order) || 0));
      uploadFormData.append('rating', String(Number(formData.rating) || 0));
      uploadFormData.append('dimensions', formData.dimensions);
      uploadFormData.append('warranty', formData.warranty);
      uploadFormData.append('delivery_time', formData.delivery_time);
      if (formData.created_at) {
        uploadFormData.append('created_at', formData.created_at);
      }

      // Send categories (multiple) - prefer categories array over category_id
      console.log('Categories before sending:', formData.categories, 'Category ID:', formData.category_id);
      if (formData.categories && formData.categories.length > 0) {
        uploadFormData.append('categories', JSON.stringify(formData.categories));
        console.log('Categories added to FormData:', formData.categories);
        // Also send category_id for backward compatibility (use first selected category)
        uploadFormData.append('category_id', String(formData.categories[0]));
      } else if (formData.category_id !== undefined && formData.category_id !== null) {
        // Backward compatibility: if no categories array, use category_id
        uploadFormData.append('category_id', String(formData.category_id));
        console.log('Category ID added to FormData (backward compatibility):', formData.category_id);
      } else {
        console.log('No categories or category_id in formData');
      }

      // Add brand_id if it has a value
      if (formData.brand_id) {
        uploadFormData.append('brand_id', String(formData.brand_id));
      }

      // Convert boolean fields to strings ('true' or 'false')
      // Always send these values, even if false, to ensure they are updated
      const boolToString = (value: boolean): string => value ? 'true' : 'false';

      console.log('Boolean values before sending:', {
        manage_stock: formData.manage_stock,
        in_stock: formData.in_stock,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        show_in_offers: formData.show_in_offers
      });

      uploadFormData.append('manage_stock', boolToString(formData.manage_stock));
      uploadFormData.append('in_stock', boolToString(formData.in_stock));
      uploadFormData.append('is_active', boolToString(formData.is_active));
      uploadFormData.append('is_featured', boolToString(formData.is_featured));
      uploadFormData.append('show_in_offers', boolToString(formData.show_in_offers));
      uploadFormData.append('show_description', boolToString(formData.show_description));
      uploadFormData.append('show_specifications', boolToString(formData.show_specifications));

      console.log('Boolean values sent as strings:', {
        manage_stock: boolToString(formData.manage_stock),
        in_stock: boolToString(formData.in_stock),
        is_active: boolToString(formData.is_active),
        is_featured: boolToString(formData.is_featured)
      });

      // Convert array/object fields to JSON strings
      uploadFormData.append('features', JSON.stringify(formData.features));
      uploadFormData.append('specifications', JSON.stringify(formData.specifications));
      
      // Clean up filter_values: remove entries with empty arrays
      const cleanedFilterValues: Record<string, string[]> = {};
      Object.entries(formData.filter_values).forEach(([key, values]) => {
        if (Array.isArray(values) && values.length > 0) {
          cleanedFilterValues[key] = values;
        }
      });
      uploadFormData.append('filter_values', JSON.stringify(cleanedFilterValues));

      if (formData.variants && formData.variants.length > 0) {
        // Prepare variants for JSON sending (without File objects)
        const variantsData = formData.variants.map(v => {
          // Prepare variant images with their sort_orders
          const variantImagesMetadata: any[] = [];
          const variantImageUrls: any[] = [];
          const variantExistingImages: any[] = [];
          
          if (v.image_previews) {
            v.image_previews.forEach((preview, index) => {
              // Identify where this preview comes from
              const existingMatch = v.existing_images?.find(ei => normalizePreviewSrc(ei.image_url) === normalizePreviewSrc(preview));
              if (existingMatch) {
                variantExistingImages.push({ ...existingMatch, sort_order: index });
                return;
              }
              
              const urlMatch = v.image_urls?.find(u => normalizePreviewSrc(u) === normalizePreviewSrc(preview));
              if (urlMatch) {
                variantImageUrls.push({ url: urlMatch, sort_order: index });
                return;
              }
              
              // If not found in existing or URLs, it must be a file upload
              const fileIdx = v.image_previews!.slice(0, index).filter(p => 
                !v.existing_images?.some(ei => normalizePreviewSrc(ei.image_url) === normalizePreviewSrc(p)) &&
                !v.image_urls?.some(u => normalizePreviewSrc(u) === normalizePreviewSrc(p))
              ).length;
              variantImagesMetadata[fileIdx] = { sort_order: index };
            });
          }

          return {
            variant_values: v.variant_values,
            price: v.price,
            stock_quantity: v.stock_quantity,
            sku: v.sku,
            image_urls: variantImageUrls, // These are now objects with sort_order
            existing_images: variantExistingImages,
            images_metadata: variantImagesMetadata
          };
        });
        uploadFormData.append('variants', JSON.stringify(variantsData));
        
        // Add variant image files
        formData.variants.forEach((variant, vIdx) => {
          if (variant.image_files && variant.image_files.length > 0) {
            variant.image_files.forEach((file, fIdx) => {
              uploadFormData.append(`variant_images_${vIdx}[${fIdx}]`, file);
            });
          }
        });
      }

      // Unified and ordered images handling
      const finalExistingImages: any[] = [];
      const finalNewImageUrls: any[] = [];
      const imagesMetadata: any[] = [];
      
      formData.images.forEach((img, index) => {
        if (typeof img === 'object' && img !== null) {
          finalExistingImages.push({ ...img, sort_order: index });
        } else if (typeof img === 'string') {
          if (img.startsWith('data:')) {
            // Find which file this data URL refers to
            const dataUrlIdx = formData.images.slice(0, index).filter(i => typeof i === 'string' && (i as string).startsWith('data:')).length;
            imagesMetadata[dataUrlIdx] = { sort_order: index };
          } else {
            finalNewImageUrls.push({ url: img, sort_order: index });
          }
        }
      });

      uploadFormData.append('existing_images', JSON.stringify(finalExistingImages));
      
      if (finalNewImageUrls.length > 0) {
        uploadFormData.append('image_urls', JSON.stringify(finalNewImageUrls));
      }

      if (imagesMetadata.length > 0) {
        uploadFormData.append('images_metadata', JSON.stringify(imagesMetadata));
      }

      // Handle size guide images (existing + urls + files)
      const existingSizeGuideImages = formData.size_guide_images.filter((img): img is Exclude<typeof img, string> =>
        typeof img === 'object' && img !== null && !Array.isArray(img) && 'image_url' in img
      ) as Array<{ image_url: string; image_path?: string }>;

      const newSizeGuideImageUrls = formData.size_guide_images.filter((img) =>
        typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))
      );

      if (existingSizeGuideImages.length > 0) {
        uploadFormData.append('size_guide_existing_images', JSON.stringify(existingSizeGuideImages));
      } else if (formData.size_guide_images.length === 0) {
        uploadFormData.append('size_guide_existing_images', JSON.stringify([]));
      }

      if (newSizeGuideImageUrls.length > 0) {
        uploadFormData.append('size_guide_image_urls', JSON.stringify(newSizeGuideImageUrls));
      }

      if (sizeGuideFiles.length > 0) {
        sizeGuideFiles.forEach((file, index) => {
          uploadFormData.append(`size_guide_images[${index}]`, file);
        });
      }

      // Add cover image if selected
      // Add cover image if selected, or 'null' if removed
      if (coverImageFile) {
        uploadFormData.append('cover_image', coverImageFile);
      } else if (formData.cover_image === null) {
        uploadFormData.append('cover_image', 'null');
      }

      // Add new image files
      console.log('Image files state:', imageFiles);
      console.log('Image files length:', imageFiles.length);
      console.log('Existing images to keep:', finalExistingImages.length);
      console.log('New image URLs:', finalNewImageUrls.length);

      if (imageFiles.length > 0) {
        console.log('Adding', imageFiles.length, 'image files to FormData');
        imageFiles.forEach((file, index) => {
          console.log(`Adding image ${index + 1}:`, file.name, file.type, file.size, 'bytes');
          // Use indexed array format: images[0], images[1], etc.
          uploadFormData.append(`images[${index}]`, file);
        });
        console.log('FormData after adding images:', Array.from(uploadFormData.entries()).filter(([key]) => key.startsWith('images')));
      } else {
        console.log('No new image files to upload');
      }

      console.log('Sending update request with FormData...');
      console.log('FormData keys:', Array.from(uploadFormData.keys()));
      console.log('Product ID:', id);

      console.log('Calling updateProduct API...');
      const response = await adminProductsAPI.updateProduct(Number(id).toString(), uploadFormData);
      console.log('Update response received:', response);
      console.log('=== Update Successful ===');

      // Show success toast
      Swal.fire({
        icon: 'success',
        title: 'تم بنجاح!',
        text: 'تم تحديث المنتج بنجاح',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });

      setSuccess(null);
      setError(null);

      // Clear new image files and previews
      setImageFiles([]);
      setImagePreviews([]);
      setSizeGuideFiles([]);
      setSizeGuidePreviews([]);

      // Reload product data and categories to reflect changes (without showing loading)
      console.log('Reloading product data and categories...');

      try {
        // Reload both product and categories to ensure filters are available
        const [productResponse, categoriesResponse] = await Promise.all([
          adminProductsAPI.getProduct(Number(id).toString()),
          adminCategoriesAPI.getCategories({ per_page: 1000 })
        ]);

        console.log('Product response after save:', {
          category_id: productResponse.data.category_id,
          is_active: productResponse.data.is_active,
          is_featured: productResponse.data.is_featured,
        });

        const normalizedCategories = Array.isArray(categoriesResponse.data) 
          ? categoriesResponse.data.map((c: any) => ({ ...c, id: Number(c.id), parent_id: c.parent_id ? Number(c.parent_id) : null }))
          : Array.isArray(categoriesResponse.data?.data)
            ? categoriesResponse.data.data.map((c: any) => ({ ...c, id: Number(c.id), parent_id: c.parent_id ? Number(c.parent_id) : null }))
            : [];

        setProduct(productResponse.data);
        setCategories(normalizedCategories);

        // Update formData with new product data
        const formDataToSet = {
          name: productResponse.data.name || '',
          slug: productResponse.data.slug || '',
          description: productResponse.data.description || '',
          short_description: productResponse.data.short_description || '',
          sku: productResponse.data.sku || '',
          price: productResponse.data.price || 0,
          original_price: productResponse.data.original_price || 0,
          compare_price: productResponse.data.compare_price || 0,
          cost_price: productResponse.data.cost_price || 0,
          discount_percentage: productResponse.data.discount_percentage || 0,
          stock_quantity: productResponse.data.stock_quantity || 0,
          manage_stock: productResponse.data.manage_stock || false,
          stock_status: productResponse.data.stock_status || 'in_stock',
          in_stock: productResponse.data.in_stock || false,
          weight: productResponse.data.weight || 0,
          dimensions: productResponse.data.dimensions || '',
          warranty: productResponse.data.warranty || '',
          delivery_time: productResponse.data.delivery_time || '',
          images: productResponse.data.images || [],
          size_guide_images: productResponse.data.size_guide_images || [],
          is_active: productResponse.data.is_active || false,
          is_featured: productResponse.data.is_featured || false,
          sort_order: productResponse.data.sort_order || 0,
          rating: productResponse.data.rating || 0,
          reviews_count: productResponse.data.reviews_count || 0,
          views_count: productResponse.data.views_count || 0,
          sales_count: productResponse.data.sales_count || 0,
          meta_title: productResponse.data.meta_title || '',
          meta_description: productResponse.data.meta_description || '',
          category_id: productResponse.data.category_id ?? 0, // Keep for backward compatibility
          categories: productResponse.data.categories?.map((cat: any) => cat.id) || [], // New: multiple categories
          brand_id: productResponse.data.brand_id || 0,
          features: productResponse.data.features || [],
          specifications: productResponse.data.specifications || {},
          filter_values: (() => {
            const raw = productResponse.data.filter_values || {};
            const normalized: Record<string, string[]> = {};
            Object.entries(raw).forEach(([key, val]) => {
              if (Array.isArray(val)) {
                normalized[key] = val;
              } else if (typeof val === 'string' && val.trim()) {
                normalized[key] = [val];
              } else {
                normalized[key] = [];
              }
            });
            return normalized;
          })(),
          variants: productResponse.data.variants?.map((v: any) => ({
            ...v,
            image_previews: v.images?.map((img: any) => normalizePreviewSrc(img.image_url)) || [],
            existing_images: v.images || []
          })) || [],
          cover_image: productResponse.data.cover_image || null,
          show_in_offers: productResponse.data.show_in_offers || false,
          show_description: productResponse.data.show_description !== undefined ? productResponse.data.show_description : true,
          show_specifications: productResponse.data.show_specifications !== undefined ? productResponse.data.show_specifications : true,
        };
        setFormData(formDataToSet);

        const reloadedSizeGuideUrls = (formDataToSet.size_guide_images || [])
          .map((img: any) => {
            if (typeof img === 'string') return img;
            if (img && typeof img === 'object' && 'image_url' in img) return img.image_url as string;
            return null;
          })
          .filter((url): url is string => !!url && (url.startsWith('http://') || url.startsWith('https://')));
        setSizeGuideUrlsText(reloadedSizeGuideUrls.join('\n'));

        // تحميل الفلاتر المتاحة للفئة المختارة (نفس المنطق المستخدم في loadData)
        if (formDataToSet.category_id) {
          console.log('Available categories from response:', categoriesResponse.data);
          console.log('Looking for category_id:', formDataToSet.category_id);
          console.log('Category ID type:', typeof formDataToSet.category_id);

          const selectedCategory = categoriesResponse.data.find((cat: any) => {
            console.log('Comparing category:', cat.id, 'with', formDataToSet.category_id, 'match:', cat.id === formDataToSet.category_id);
            return cat.id === formDataToSet.category_id;
          }) || (productResponse.data.category?.id === formDataToSet.category_id ? productResponse.data.category : null);

          console.log('Selected category for filters:', selectedCategory);
          console.log('Category filters:', selectedCategory?.filters);
          if (selectedCategory && selectedCategory.filters) {
            console.log('Setting available filters after reload:', selectedCategory.filters);
            setAvailableFilters(selectedCategory.filters);
          } else {
            console.log('No filters found for category, using empty filters array');
            // لا توجد فلاتر محددة للفئة - استخدام مصفوفة فارغة
            setAvailableFilters([]);
          }
        } else {
          console.log('No category_id found, using empty filters array');
          setAvailableFilters([]);
        }
      } catch (reloadErr) {
        console.error('Error reloading product data:', reloadErr);
        // Don't show error, just log it
      }

    } catch (err: any) {
      console.error('=== Error in handleSubmit ===');
      console.error('Error updating product:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        request: err.request
      });

      // Show error toast
      let errorMessage = 'فشل في تحديث المنتج';

      if (err.response) {
        // خطأ من الخادم
        const status = err.response.status;
        const data = err.response.data;

        console.log('Server error response:', data);

        if (status === 422) {
          // خطأ في التحقق من صحة البيانات
          errorMessage = 'خطأ في البيانات المدخلة:\n';
          if (data.errors) {
            Object.keys(data.errors).forEach(field => {
              errorMessage += `• ${field}: ${data.errors[field].join(', ')}\n`;
            });
          } else if (data.message) {
            errorMessage += data.message;
          }
        } else if (status === 500) {
          // خطأ في الخادم
          errorMessage = `خطأ في الخادم (500): ${data.message || 'خطأ غير معروف'}`;
        } else if (status === 409) {
          // تضارب في البيانات (مثل SKU مكرر)
          errorMessage = `تضارب في البيانات: ${data.message || 'البيانات المدخلة موجودة مسبقاً'}`;
        } else {
          errorMessage = `خطأ في الخادم (${status}): ${data.message || 'خطأ غير معروف'}`;
        }
      } else if (err.request) {
        // مشكلة في الاتصال
        errorMessage = 'مشكلة في الاتصال بالخادم. تأكد من أن الخادم يعمل.';
      } else {
        // خطأ آخر
        errorMessage = `خطأ غير متوقع: ${err.message || 'خطأ غير معروف'}`;
      }

      // Show error toast
      Swal.fire({
        icon: 'error',
        title: 'خطأ!',
        text: errorMessage,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
      });

      setSuccess(null);
      setError(null);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-2xl">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-4">
            <div className="whitespace-pre-line">
              {error}
            </div>
          </div>
          <Button onClick={() => navigate('/admin/products')}>
            العودة للمنتجات
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/products')}
              className="flex items-center space-x-2 rtl:space-x-reverse"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>العودة</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">تعديل المنتج</h1>
              <p className="text-gray-600">تعديل بيانات المنتج: {product?.name}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>بيانات المنتج</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-2">
                  <Label htmlFor="name">اسم المنتج *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="أدخل اسم المنتج"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">الرابط المختصر *</Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    required
                    placeholder="product-slug"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">كود المنتج *</Label>
                  <Input
                    id="sku"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    required
                    placeholder="SKU-001"
                  />
                </div>

                {/* Multi-Category Selection */}
                <div className="md:col-span-2 space-y-4 border rounded-lg p-4 bg-gray-50/50">
                  <Label className="text-lg font-bold">التصنيفات (يمكنك اختيار أكثر من فئة) *</Label>
                  
                  {/* Selected Categories List */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {formData.categories.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">لم يتم اختيار أي تصنيف بعد.</p>
                    ) : (
                      formData.categories.map(catId => {
                        const numericId = Number(catId);
                        const cat = categories.find(c => Number(c.id) === numericId);
                        const parent = cat?.parent_id ? categories.find(c => Number(c.id) === Number(cat.parent_id)) : null;
                        
                        return (
                          <div 
                            key={numericId} 
                            className="bg-white text-emerald-700 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm border-2 border-emerald-100 shadow-sm hover:border-emerald-300 transition-colors"
                          >
                            <span className="font-bold">
                              {parent ? `${parent.name} > ` : ''}{cat?.name || `فئة #${numericId}`}
                            </span>
                            <button 
                              type="button" 
                              onClick={() => handleRemoveCategory(numericId)} 
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-lg border">
                    <div className="space-y-2">
                      <Label htmlFor="main_category">اختر فئة رئيسية لإضافتها</Label>
                      <Select
                        value={selectedParentId?.toString() || ''}
                        onValueChange={(value) => {
                          const id = Number(value);
                          setSelectedParentId(id);
                          // We don't necessarily add the main category unless the user wants to
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الفئة الرئيسية" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.filter(cat => !cat.parent_id).map(cat => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs text-emerald-600"
                        onClick={() => selectedParentId && handleCategoryChange(selectedParentId)}
                        disabled={!selectedParentId}
                      >
                        <Plus className="w-3 h-3 ml-1" /> إضافة الفئة الرئيسية
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category_id">اختر فئة فرعية لإضافتها</Label>
                      <Select
                        value="" 
                        onValueChange={(value) => handleCategoryChange(Number(value))}
                        disabled={!selectedParentId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={selectedParentId ? "اختر الفئة الفرعية" : "اختر الفئة الرئيسية أولاً"} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.filter(cat => cat.parent_id === selectedParentId).map(cat => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>


                <div className="space-y-2">
                  <Label htmlFor="brand_id">العلامة التجارية</Label>
                  <Select
                    value={formData.brand_id?.toString() || ''}
                    onValueChange={(value) => handleSelectChange('brand_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر العلامة التجارية" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map(brand => (
                        <SelectItem key={brand.id} value={brand.id.toString()}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Pricing */}
                <div className="space-y-2">
                  <Label htmlFor="price">السعر *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="original_price">السعر الأصلي</Label>
                  <Input
                    id="original_price"
                    name="original_price"
                    type="number"
                    step="0.01"
                    value={formData.original_price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compare_price">سعر المقارنة</Label>
                  <Input
                    id="compare_price"
                    name="compare_price"
                    type="number"
                    step="0.01"
                    value={formData.compare_price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost_price">سعر التكلفة</Label>
                  <Input
                    id="cost_price"
                    name="cost_price"
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_percentage">نسبة الخصم (%)</Label>
                  <Input
                    id="discount_percentage"
                    name="discount_percentage"
                    type="number"
                    step="0.01"
                    value={formData.discount_percentage}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>

                {/* Stock */}
                <div className="space-y-2">
                  <Label htmlFor="stock_quantity">الكمية المتاحة</Label>
                  <Input
                    id="stock_quantity"
                    name="stock_quantity"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock_status">حالة المخزون</Label>
                  <Select
                    value={formData.stock_status}
                    onValueChange={(value) => handleSelectChange('stock_status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_stock">متوفر</SelectItem>
                      <SelectItem value="out_of_stock">غير متوفر</SelectItem>
                      <SelectItem value="stock_based">حسب الكمية المتوفرة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Shipping & Product Details */}
                <div className="space-y-2">
                  <Label htmlFor="weight">الوزن (كجم)</Label>
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    step="0.01"
                    value={formData.weight}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dimensions">الأبعاد (سم)</Label>
                  <Input
                    id="dimensions"
                    name="dimensions"
                    value={formData.dimensions}
                    onChange={handleInputChange}
                    placeholder="مثال: 50 × 30 × 20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warranty">الضمان</Label>
                  <Input
                    id="warranty"
                    name="warranty"
                    value={formData.warranty}
                    onChange={handleInputChange}
                    placeholder="مثال: ضمان شامل لمدة سنتين"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_time">وقت التوصيل</Label>
                  <Input
                    id="delivery_time"
                    name="delivery_time"
                    value={formData.delivery_time}
                    onChange={handleInputChange}
                    placeholder="مثال: 2-3 أيام عمل"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="created_at">تاريخ إنشاء المنتج</Label>
                  <Input
                    id="created_at"
                    name="created_at"
                    type="datetime-local"
                    value={formData.created_at}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Stats (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="rating">التقييم</Label>
                  <Input
                    id="rating"
                    name="rating"
                    type="number"
                    step="0.01"
                    value={formData.rating}
                    readOnly
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reviews_count">عدد المراجعات</Label>
                  <Input
                    id="reviews_count"
                    name="reviews_count"
                    type="number"
                    value={formData.reviews_count}
                    readOnly
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="views_count">عدد المشاهدات</Label>
                  <Input
                    id="views_count"
                    name="views_count"
                    type="number"
                    value={formData.views_count}
                    readOnly
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sales_count">عدد المبيعات</Label>
                  <Input
                    id="sales_count"
                    name="sales_count"
                    type="number"
                    value={formData.sales_count}
                    readOnly
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                {/* Descriptions */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="short_description">الوصف المختصر</Label>
                  <Textarea
                    id="short_description"
                    name="short_description"
                    value={formData.short_description}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="وصف مختصر للمنتج"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">الوصف التفصيلي</Label>
                  <div className="prose max-w-none" dir="ltr">
                    <CKEditor
                      editor={ClassicEditor}
                      data={formData.description}
                      onChange={(event, editor) => {
                        const data = editor.getData();
                        setFormData(prev => ({ ...prev, description: data }));
                      }}
                      config={{
                        licenseKey: 'GPL',
                        language: 'ar',
                        plugins: [
                          Essentials, Bold, Italic, Underline, Paragraph,
                          Link, List, BlockQuote, Heading, Indent,
                          Autoformat, Undo,
                          Image, ImageCaption, ImageStyle, ImageToolbar, ImageUpload, Base64UploadAdapter, LinkImage,
                          Table, TableToolbar,
                          Alignment,
                          ImageResize
                        ],
                        toolbar: [
                          'undo', 'redo', '|',
                          'heading', '|',
                          'bold', 'italic', 'underline', 'link', '|',
                          'bulletedList', 'numberedList', 'outdent', 'indent', '|',
                          'alignment', '|',
                          'imageUpload', 'insertTable', 'blockQuote'
                        ],
                        image: {
                          toolbar: [
                            'imageTextAlternative',
                            'toggleImageCaption',
                            'imageStyle:inline',
                            'imageStyle:block',
                            'imageStyle:side',
                            'linkImage'
                          ]
                        },
                        table: {
                          contentToolbar: [
                            'tableColumn',
                            'tableRow',
                            'mergeTableCells'
                          ]
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Cover Image Upload */}
                <div className="space-y-4 md:col-span-2">
                  <Label>صورة الغلاف (منفصلة عن صور الألبوم)</Label>
                  <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {coverImagePreview ? (
                      <div className="relative inline-block">
                        <img
                          src={coverImagePreview}
                          alt="Cover Preview"
                          className="h-48 w-auto object-cover rounded-md border"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveCoverImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="mx-auto h-12 w-12 text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex text-sm text-gray-600 justify-center">
                          <label htmlFor="cover-image-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500">
                            <span>ارفع صورة غلاف</span>
                            <Input
                              id="cover-image-upload"
                              name="cover_image"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleCoverImageChange}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 5MB</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Images */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="images">صور المنتج</Label>

                  {/* Unified Image Previews (allowing reordering) */}
                  {formData.images && formData.images.length > 0 && (
                    <div className="mb-4">
                      <Label className="text-sm font-medium text-gray-700">معاينة وترتيب الصور:</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                        {formData.images.map((image, index) => {
                          const imageUrl = typeof image === 'string' ? image : (image as { image_url: string; alt_text?: string }).image_url;
                          const imageAlt = typeof image === 'string' ? `صورة ${index + 1}` : ((image as { alt_text?: string }).alt_text || `صورة ${index + 1}`);
                          const isDataUrl = typeof image === 'string' && image.startsWith('data:');
                          
                          return (
                            <div key={index} className="relative group w-24 h-24 border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                              <img
                                src={normalizePreviewSrc(imageUrl)}
                                alt={imageAlt}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.svg';
                                }}
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => moveImage(index, 'up')}
                                  disabled={index === 0}
                                  className="p-1 bg-white/20 hover:bg-white/40 text-white rounded disabled:opacity-30"
                                  title="تحريك لليمين"
                                >
                                  <ArrowRight className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveImage(index, 'down')}
                                  disabled={index === formData.images.length - 1}
                                  className="p-1 bg-white/20 hover:bg-white/40 text-white rounded disabled:opacity-30"
                                  title="تحريك لليسار"
                                >
                                  <ArrowLeft className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isDataUrl) {
                                      const dataUrlIdx = formData.images.slice(0, index).filter(img => typeof img === 'string' && img.startsWith('data:')).length;
                                      handleRemoveImage(dataUrlIdx);
                                    } else {
                                      handleRemoveCurrentImage(index);
                                    }
                                  }}
                                  className="p-1 bg-red-500 hover:bg-red-600 text-white rounded"
                                  title="حذف"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                              {index === 0 && (
                                <div className="absolute bottom-0 left-0 right-0 bg-emerald-600 text-white text-[8px] text-center py-0.5 font-bold">
                                  الغلاف الافتراضي
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}


                  {/* Image Upload */}
                  <div className="space-y-2">
                    <Input
                      id="images"
                      name="images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('images')?.click()}
                        className="flex items-center space-x-2 rtl:space-x-reverse"
                      >
                        <Upload className="h-4 w-4" />
                        <span>إضافة صور</span>
                      </Button>
                    </div>

                    {/* URL Input as fallback */}
                    <div className="mt-2">
                      <Label htmlFor="images_url" className="text-sm text-gray-500">
                        أو أدخل روابط الصور مفصولة بفواصل:
                      </Label>
                      <Textarea
                        id="images_url"
                        value={imageUrlsText}
                        onChange={handleImagesChange}
                        placeholder={"https://example.com/image1.jpg\nhttps://example.com/image2.jpg"}
                        rows={3}
                        className="mt-1 resize-y"
                      />
                    </div>
                  </div>
                </div>

                {/* Size Guide Images */}
                <div className="space-y-2 md:col-span-2 border rounded-lg p-4 bg-gray-50/50">
                  <Label className="text-base font-bold">دليل المقاسات</Label>
                  <p className="text-sm text-gray-600">
                    هذه الصور ستظهر في صفحة المنتج داخل نافذة منبثقة عند الضغط على أيقونة دليل المقاسات.
                  </p>

                  {formData.size_guide_images && formData.size_guide_images.length > 0 && (
                    <div className="mb-4">
                      <Label className="text-sm font-medium text-gray-700">صور الدليل الحالية:</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                        {formData.size_guide_images.map((image, index) => {
                          const imageUrl = typeof image === 'string' ? image : (image as { image_url: string }).image_url;
                          return (
                            <div key={`size-guide-current-${index}`} className="relative w-24 h-24 border rounded-lg overflow-hidden">
                              <img
                                src={normalizePreviewSrc(imageUrl)}
                                alt={`Size guide ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.svg';
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveCurrentSizeGuideImage(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {sizeGuidePreviews.length > 0 && (
                    <div className="mb-4">
                      <Label className="text-sm font-medium text-gray-700">صور الدليل الجديدة:</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                        {sizeGuidePreviews.map((preview, index) => (
                          <div key={`size-guide-new-${index}`} className="relative w-24 h-24 border rounded-lg overflow-hidden">
                            <img src={preview} alt={`Size guide new ${index + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveSizeGuideImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Input
                      id="size_guide_images_upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleSizeGuideImageChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('size_guide_images_upload')?.click()}
                      className="flex items-center space-x-2 rtl:space-x-reverse"
                    >
                      <Upload className="h-4 w-4" />
                      <span>إضافة صور دليل المقاسات</span>
                    </Button>

                    <div>
                      <Label htmlFor="size_guide_urls" className="text-sm text-gray-500">
                        أو أدخل روابط صور دليل المقاسات (كل رابط بسطر أو مفصول بفاصلة):
                      </Label>
                      <Textarea
                        id="size_guide_urls"
                        value={sizeGuideUrlsText}
                        onChange={handleSizeGuideUrlsChange}
                        rows={3}
                        className="mt-1 resize-y"
                        placeholder={"https://example.com/size-guide-1.jpg\nhttps://example.com/size-guide-2.jpg"}
                      />
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 md:col-span-2">
                  <div>
                    <Label>المميزات</Label>
                    <p className="text-sm text-gray-600 mb-4">
                      أضف المميزات الرئيسية للمنتج
                    </p>
                  </div>

                  {/* Current Features Display */}
                  {formData.features.length > 0 && (
                    <div className="mb-4">
                      <Label className="text-sm font-medium text-gray-700 mb-2">المميزات الحالية:</Label>
                      <div className="flex flex-wrap gap-2">
                        {formData.features.map((feature, index) => (
                          <div key={index} className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm flex items-center">
                            <span>{feature}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newFeatures = formData.features.filter((_, i) => i !== index);
                                setFormData(prev => ({ ...prev, features: newFeatures }));
                              }}
                              className="mr-2 text-emerald-600 hover:text-emerald-800"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add New Feature */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="أدخل ميزة جديدة..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const newFeature = e.currentTarget.value.trim();
                          if (newFeature && !formData.features.includes(newFeature)) {
                            setFormData(prev => ({
                              ...prev,
                              features: [...prev.features, newFeature]
                            }));
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        const newFeature = input.value.trim();
                        if (newFeature && !formData.features.includes(newFeature)) {
                          setFormData(prev => ({
                            ...prev,
                            features: [...prev.features, newFeature]
                          }));
                          input.value = '';
                        }
                      }}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      إضافة
                    </button>
                  </div>

                  {/* Bulk Add Features */}
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-gray-700 mb-2">أو أضف عدة مميزات مرة واحدة:</Label>
                    <Textarea
                      placeholder="أدخل المميزات مفصولة بفاصلة... مثال: توفير الطاقة, تقنية التبريد السريع, تصميم عصري"
                      rows={2}
                      onChange={(e) => {
                        const features = e.target.value.split(',').map(f => f.trim()).filter(f => f);
                        setFormData(prev => ({ ...prev, features }));
                      }}
                    />
                  </div>
                </div>

                {/* Specifications */}
                <div className="space-y-4 md:col-span-2">
                  <div>
                    <Label>المواصفات التقنية</Label>
                    <p className="text-sm text-gray-600 mb-4">
                      أضف المواصفات التقنية للمنتج
                    </p>
                  </div>

                  {/* Current Specifications Display */}
                  {Object.keys(formData.specifications).length > 0 && (
                    <div className="mb-4">
                      <Label className="text-sm font-medium text-gray-700 mb-2">المواصفات الحالية:</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(formData.specifications).map(([key, value], index) => (
                          <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-700">{key}</div>
                                <div className="text-sm text-gray-600">{String(value)}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const newSpecs = { ...formData.specifications };
                                  delete newSpecs[key];
                                  setFormData(prev => ({ ...prev, specifications: newSpecs }));
                                }}
                                className="text-red-600 hover:text-red-800 mr-2"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add New Specification */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="اسم المواصفة (مثل: السعة)"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      id="spec_key"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="القيمة (مثل: 10-15 قدم)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        id="spec_value"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const keyInput = document.getElementById('spec_key') as HTMLInputElement;
                          const valueInput = document.getElementById('spec_value') as HTMLInputElement;
                          const key = keyInput.value.trim();
                          const value = valueInput.value.trim();

                          if (key && value) {
                            setFormData(prev => ({
                              ...prev,
                              specifications: {
                                ...prev.specifications,
                                [key]: value
                              }
                            }));
                            keyInput.value = '';
                            valueInput.value = '';
                          }
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        إضافة
                      </button>
                    </div>
                  </div>

                  {/* JSON Editor for Advanced Users */}
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-gray-700 mb-2">محرر JSON متقدم:</Label>
                    <Textarea
                      value={JSON.stringify(formData.specifications, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          setFormData(prev => ({ ...prev, specifications: parsed }));
                        } catch (err) {
                          // Invalid JSON, don't update
                        }
                      }}
                      rows={4}
                      className="font-mono text-sm"
                      placeholder='{"السعة": "10-15 قدم", "نوع الفريزر": "علوي", "تقنية No Frost": "true"}'
                      dir="ltr"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      للمستخدمين المتقدمين: يمكنك تعديل المواصفات مباشرة بصيغة JSON
                    </p>
                  </div>
                </div>

                {/* Filter Values */}
                {availableFilters.length > 0 && (
                  <div className="space-y-4 md:col-span-2">
                    <div>
                      <Label>الفلاتر المتاحة</Label>
                      <p className="text-sm text-gray-600 mb-4">
                        اختر القيم المناسبة من الفلاتر المتاحة للفئة المختارة (يمكنك اختيار أكثر من قيمة)
                      </p>
                    </div>

                    <div className="space-y-4">
                      {availableFilters.map((filter, index) => {
                        const currentValues = formData.filter_values[filter.name] || [];
                        const hasValue = currentValues.length > 0;

                        return (
                          <div key={index} className={`border rounded-lg p-4 ${hasValue ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200'}`}>
                            <div className="flex items-center justify-between mb-3">
                              <Label className="text-sm font-medium text-gray-900">
                                {filter.name}
                                {hasValue && <span className="text-emerald-600 mr-2">✓ ({currentValues.length})</span>}
                              </Label>
                              <div className="flex items-center gap-2">
                                {filter.required && (
                                  <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                                    مطلوب
                                  </span>
                                )}
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {filter.type === 'select' ? 'اختيار متعدد' : filter.type}
                                </span>
                              </div>
                            </div>

                            {/* Selected values display */}
                            {hasValue && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {currentValues.map((val, i) => (
                                  <span key={i} className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full">
                                    {val}
                                    <button
                                      type="button"
                                      onClick={() => handleFilterToggleValue(filter.name, val, false)}
                                      className="text-emerald-600 hover:text-red-600 font-bold"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => handleFilterValueChange(filter.name, [])}
                                  className="text-xs text-red-600 hover:text-red-800 underline"
                                >
                                  مسح الكل
                                </button>
                              </div>
                            )}

                            {filter.type === 'select' && filter.options && (
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {filter.options.map((option, optionIndex) => {
                                    const isSelected = currentValues.includes(option);
                                    return (
                                      <label
                                        key={optionIndex}
                                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                                          isSelected ? 'bg-emerald-100 border-emerald-400' : 'bg-white border-gray-200 hover:bg-gray-50'
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) => handleFilterToggleValue(filter.name, option, e.target.checked)}
                                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                                        />
                                        <span className="text-sm text-gray-700">{option}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {filter.type === 'checkbox' && filter.options && filter.options.length > 0 && (
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {filter.options.map((option, optionIndex) => {
                                    const isSelected = currentValues.includes(option);
                                    return (
                                      <label
                                        key={optionIndex}
                                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                                          isSelected ? 'bg-emerald-100 border-emerald-400' : 'bg-white border-gray-200 hover:bg-gray-50'
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) => handleFilterToggleValue(filter.name, option, e.target.checked)}
                                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                                        />
                                        <span className="text-sm text-gray-700">{option}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {filter.type === 'checkbox' && (!filter.options || filter.options.length === 0) && (
                              <div className="space-y-2">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={currentValues.includes('true')}
                                    onChange={(e) => {
                                      handleFilterValueChange(filter.name, e.target.checked ? ['true'] : ['false']);
                                    }}
                                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                                  />
                                  <span className="mr-2 text-sm text-gray-700">نعم</span>
                                </label>
                              </div>
                            )}

                            {filter.type === 'range' && (
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={currentValues[0] || ''}
                                    onChange={(e) => handleFilterValueChange(filter.name, e.target.value ? [e.target.value] : [])}
                                    placeholder="مثال: 10-15 قدم"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                  />
                                  {currentValues.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => handleFilterValueChange(filter.name, [])}
                                      className="px-3 py-2 text-red-600 hover:text-red-800 border border-red-300 rounded-lg hover:bg-red-50"
                                      title="حذف قيمة الفلتر"
                                    >
                                      حذف
                                    </button>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">
                                  أدخل النطاق بصيغة: من - إلى (مثال: 10-15 قدم)
                                </p>
                              </div>
                            )}

                            {filter.type === 'text' && (
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={currentValues[0] || ''}
                                    onChange={(e) => handleFilterValueChange(filter.name, e.target.value ? [e.target.value] : [])}
                                    placeholder="أدخل النص..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                  />
                                  {currentValues.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => handleFilterValueChange(filter.name, [])}
                                      className="px-3 py-2 text-red-600 hover:text-red-800 border border-red-300 rounded-lg hover:bg-red-50"
                                      title="حذف النص"
                                    >
                                      حذف
                                    </button>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">
                                  أدخل النص المطلوب
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}


                {/* Hidden Filter Values Editor Removed at User Request */}

                {/* Variants UI */}
                <div className="space-y-4 md:col-span-2 border-t pt-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">خيارات المنتج (Variants) بناءً على الفلاتر</h3>
                    <Button type="button" onClick={generateVariants} variant="outline" size="sm">
                      توليد / تحديث الخيارات
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    إذا كان لديك خصائص متعددة للفلتر الواحد (مثل مقاس كبير وصغير)، يمكنك وضع سعر وكمية لكل إحتمال.
                  </p>
                  
                  {formData.variants && formData.variants.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 border">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase font-bold">الخصائص</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase font-bold">السعر</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase font-bold">الكمية</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase font-bold">الصور</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase font-bold">SKU</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-10 font-bold">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {formData.variants.map((variant, index) => (
                            <tr key={index} className="hover:bg-gray-50/50">
                              <td className="px-3 py-2 text-sm text-gray-900">
                                {Object.entries(variant.variant_values).map(([k, v]) => (
                                  <span key={k} className="inline-block bg-white border border-gray-100 rounded shadow-sm px-2 py-1 m-1 text-xs">
                                    <span className="text-gray-500">{k}:</span> <span className="font-bold">{v}</span>
                                  </span>
                                ))}
                              </td>
                              <td className="px-3 py-2">
                                <Input 
                                  type="number" 
                                  placeholder="0.00" 
                                  value={variant.price || ''} 
                                  onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                                  className="w-24 h-8 bg-white border-gray-100 focus:ring-emerald-500"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <Input 
                                  type="number" 
                                  value={variant.stock_quantity || ''} 
                                  onChange={(e) => handleVariantChange(index, 'stock_quantity', e.target.value)}
                                  className="w-24 h-8 bg-white border-gray-100 focus:ring-emerald-500"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex flex-col gap-2 min-w-[120px]">
                                  <div className="flex flex-wrap gap-1">
                                    {variant.image_previews?.map((preview, imgIdx) => (
                                      <div key={imgIdx} className="relative w-10 h-10 group border rounded-lg overflow-hidden bg-gray-50 shadow-sm">
                                        <img src={normalizePreviewSrc(preview)} className="w-full h-full object-cover" alt="" />
                                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <div className="flex gap-0.5">
                                            <button 
                                              type="button"
                                              onClick={() => moveVariantImage(index, imgIdx, 'up')}
                                              disabled={imgIdx === 0}
                                              className="p-0.5 bg-white/20 hover:bg-white/40 text-white rounded disabled:opacity-30"
                                            >
                                              <ArrowRight className="h-2 w-2" />
                                            </button>
                                            <button 
                                              type="button"
                                              onClick={() => moveVariantImage(index, imgIdx, 'down')}
                                              disabled={imgIdx === (variant.image_previews?.length || 0) - 1}
                                              className="p-0.5 bg-white/20 hover:bg-white/40 text-white rounded disabled:opacity-30"
                                            >
                                              <ArrowLeft className="h-2 w-2" />
                                            </button>
                                          </div>
                                          <button 
                                            type="button"
                                            onClick={() => handleRemoveVariantImage(index, imgIdx)}
                                            className="p-0.5 bg-red-500 hover:bg-red-600 text-white rounded"
                                          >
                                            <Trash2 className="h-2 w-2" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-[10px] bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                    onClick={() => document.getElementById(`variant-image-${index}`)?.click()}
                                  >
                                    <ImageIcon className="h-3 w-3 ml-1" />
                                    إضافة صور
                                  </Button>
                                  <input
                                    id={`variant-image-${index}`}
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleVariantImageChange(index, e)}
                                  />
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <Input 
                                  type="text" 
                                  value={variant.sku || ''} 
                                  onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                                  className="w-32 h-8 bg-white border-gray-100 focus:ring-emerald-500"
                                />
                              </td>
                              <td className="px-3 py-2 text-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteVariant(index)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-8 w-8"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 border p-4 rounded bg-gray-50 flex items-center justify-center">
                      قم بتحديد أكثر من خيار في الفلاتر ثم اضغط على "توليد / تحديث الخيارات"
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="is_active">حالة النشاط</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <div dir="ltr">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => handleSwitchChange('is_active', checked)}
                      />
                    </div>
                    <span className="text-sm text-gray-600 font-medium">
                      {formData.is_active ? 'نشط' : 'غير نشط'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="is_featured">منتج مميز</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <div dir="ltr">
                      <Switch
                        id="is_featured"
                        checked={formData.is_featured}
                        onCheckedChange={(checked) => handleSwitchChange('is_featured', checked)}
                      />
                    </div>
                    <span className="text-sm text-gray-600 font-medium">
                      {formData.is_featured ? 'مميز' : 'عادي'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="show_in_offers">إظهار في صفحة العروض</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <div dir="ltr">
                      <Switch
                        id="show_in_offers"
                        checked={formData.show_in_offers}
                        onCheckedChange={(checked) => handleSwitchChange('show_in_offers', checked)}
                      />
                    </div>
                    <span className="text-sm text-gray-600 font-medium">
                      {formData.show_in_offers ? 'مُضاف للعروض' : 'عادي'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="show_description">إظهار تاب الوصف</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <div dir="ltr">
                      <Switch
                        id="show_description"
                        checked={formData.show_description}
                        onCheckedChange={(checked) => handleSwitchChange('show_description', checked)}
                      />
                    </div>
                    <span className="text-sm text-gray-600 font-medium">
                      {formData.show_description ? 'ظاهر' : 'مخفي'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="show_specifications">إظهار تاب المواصفات</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <div dir="ltr">
                      <Switch
                        id="show_specifications"
                        checked={formData.show_specifications}
                        onCheckedChange={(checked) => handleSwitchChange('show_specifications', checked)}
                      />
                    </div>
                    <span className="text-sm text-gray-600 font-medium">
                      {formData.show_specifications ? 'ظاهر' : 'مخفي'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-4 rtl:space-x-reverse pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/products')}
                  className="flex items-center space-x-2 rtl:space-x-reverse"
                >
                  <X className="h-4 w-4" />
                  <span>إلغاء</span>
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-2 rtl:space-x-reverse"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminProductEdit;
