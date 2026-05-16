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
import { useNavigate } from 'react-router-dom';
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

interface Variant {
  id?: number;
  product_id?: number;
  variant_values: Record<string, string>;
  price: string | number | null;
  stock_quantity: number | string;
  sku: string | null;
  image_files?: File[];
  image_previews?: string[];
  image_urls?: string[];
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

const AdminProductCreate: React.FC = () => {
  const navigate = useNavigate();

  const normalizePreviewSrc = (path: string | null | undefined): string => {
    if (!path) return '';
    if (path.startsWith('data:') || path.startsWith('blob:')) {
      return path;
    }
    return getStorageUrl(path);
  };

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [availableFilters, setAvailableFilters] = useState<Filter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [sizeGuideFiles, setSizeGuideFiles] = useState<File[]>([]);
  const [sizeGuidePreviews, setSizeGuidePreviews] = useState<string[]>([]);
  const [sizeGuideUrlsText, setSizeGuideUrlsText] = useState('');
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

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
    category_id: null, // Keep for backward compatibility
    categories: [] as number[], // New: multiple categories
    brand_id: null,
    features: [] as string[],
    specifications: {} as Record<string, string>,
    filter_values: {} as Record<string, string[]>,
    variants: [] as Variant[],
    cover_image: '',
    show_description: true,
    show_specifications: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesResponse, brandsResponse] = await Promise.all([
        adminCategoriesAPI.getCategories(),
        adminBrandsAPI.getBrands({ per_page: 1000 })
      ]);

      const normalizedCategories = Array.isArray(categoriesResponse.data) 
        ? categoriesResponse.data.map((c: any) => ({ ...c, id: Number(c.id), parent_id: c.parent_id ? Number(c.parent_id) : null }))
        : Array.isArray(categoriesResponse.data?.data)
          ? categoriesResponse.data.data.map((c: any) => ({ ...c, id: Number(c.id), parent_id: c.parent_id ? Number(c.parent_id) : null }))
          : [];

      setCategories(normalizedCategories);
      setBrands(brandsResponse.data);

      console.log('Categories loaded:', categoriesResponse.data);
      console.log('Brands loaded:', brandsResponse.data);
    } catch (err: any) {
      console.error('Error loading data:', err);

      let errorMessage = 'فشل في تحميل البيانات';

      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;

        if (status === 500) {
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
      // No more auto-calculation of 'price' field based on discount to keep DB price as 'base'
      if (name === 'price') {
        // Ensure price is a number
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
      
      // Update filters from all selected categories
      // and their parents
      const allRelatedIds = [...newCategories];
      newCategories.forEach(catId => {
        const cat = categories.find(c => Number(c.id) === Number(catId));
        if (cat?.parent_id && !allRelatedIds.includes(Number(cat.parent_id))) {
          allRelatedIds.push(Number(cat.parent_id));
        }
      });
      
      updateFiltersFromCategories(allRelatedIds);
      
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
      
      // Update filters from remaining categories
      const allRelatedIds = [...newCategories];
      newCategories.forEach(catId => {
        const cat = categories.find(c => Number(c.id) === Number(catId));
        if (cat?.parent_id && !allRelatedIds.includes(Number(cat.parent_id))) {
          allRelatedIds.push(Number(cat.parent_id));
        }
      });
      
      updateFiltersFromCategories(allRelatedIds);
      
      return {
        ...prev,
        categories: newCategories,
        category_id: newCategories.length > 0 ? Number(newCategories[newCategories.length - 1]) : null
      };
    });
  };

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
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setImagePreviews(prev => [...prev, result]);
          // Add to formData.images as well
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, result]
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCoverImage = () => {
    setCoverImageFile(null);
    setCoverImagePreview(null);
  };

  const handleRemoveImage = (index: number) => {
    console.log('handleRemoveImage called with index:', index);
    console.log('Current imagePreviews length:', imagePreviews.length);
    console.log('Current imageFiles length:', imageFiles.length);
    console.log('Current formData.images length:', formData.images.length);

    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));

    // Remove from formData.images as well (only remove data URLs, not regular URLs)
    setFormData(prev => {
      // Separate data URLs (from file uploads) from regular URLs (from text input)
      const dataUrls = prev.images.filter(img => typeof img === 'string' && img.startsWith('data:'));
      const regularUrls = prev.images.filter(img => typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://')));

      // Remove the data URL at the specified index
      const updatedDataUrls = dataUrls.filter((_, i) => i !== index);

      console.log('Removing image. Data URLs before:', dataUrls.length, 'after:', updatedDataUrls.length);

      return {
        ...prev,
        images: [...updatedDataUrls, ...regularUrls]
      };
    });
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

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const imageUrls = value.split(',').map(img => img.trim()).filter(img => img);

    // Separate data URLs (from file uploads) from regular URLs (from text input)
    setFormData(prev => {
      const dataUrls = prev.images.filter(img => typeof img === 'string' && img.startsWith('data:'));

      // Combine data URLs with new URLs
      return {
        ...prev,
        images: [...dataUrls, ...imageUrls]
      };
    });
  };

  const parseUrlLines = (value: string): string[] =>
    value
      .split(/[\n,]/)
      .map((img) => img.trim())
      .filter((img) => img.length > 0 && (img.startsWith('http://') || img.startsWith('https://')));

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
      const dataUrls = prev.size_guide_images.filter(
        (img): img is string => typeof img === 'string' && img.startsWith('data:')
      );
      const regularUrls = prev.size_guide_images.filter(
        (img): img is string => typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))
      );
      return {
        ...prev,
        size_guide_images: [...dataUrls.filter((_, i) => i !== index), ...regularUrls],
      };
    });
  };

  const handleSizeGuideUrlsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setSizeGuideUrlsText(value);
    const urlImages = parseUrlLines(value);
    setFormData((prev) => {
      const dataUrls = prev.size_guide_images.filter(
        (img): img is string => typeof img === 'string' && img.startsWith('data:')
      );
      return {
        ...prev,
        size_guide_images: [...dataUrls, ...urlImages],
      };
    });
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

  const handleDeleteVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
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
      
      if (variant.image_files) {
        variant.image_files = variant.image_files.filter((_, i) => i !== imageIndex);
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
      
      // Separate indices for imageFiles/imagePreviews if they are in sync with data URLs
      const isDataUrlA = typeof newImages[index] === 'string' && (newImages[index] as string).startsWith('data:');
      const isDataUrlB = typeof newImages[targetIndex] === 'string' && (newImages[targetIndex] as string).startsWith('data:');
      
      // If both are data URLs, we also need to swap in imageFiles/imagePreviews
      // Note: AdminProductCreate keeps imageFiles in sync with data URLs in formData.images
      if (isDataUrlA && isDataUrlB) {
        // Find their indices in the dataUrl subset
        const dataUrlIndices = newImages.map((img, i) => ({ img, i }))
          .filter(x => typeof x.img === 'string' && (x.img as string).startsWith('data:'));
        
        const localIdxA = dataUrlIndices.findIndex(x => x.i === index);
        const localIdxB = dataUrlIndices.findIndex(x => x.i === targetIndex);
        
        if (localIdxA !== -1 && localIdxB !== -1) {
          setImageFiles(prevFiles => {
            const next = [...prevFiles];
            [next[localIdxA], next[localIdxB]] = [next[localIdxB], next[localIdxA]];
            return next;
          });
          setImagePreviews(prevPreviews => {
            const next = [...prevPreviews];
            [next[localIdxA], next[localIdxB]] = [next[localIdxB], next[localIdxA]];
            return next;
          });
        }
      }

      [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
      return { ...prev, images: newImages };
    });
  };

  const moveVariantImage = (variantIndex: number, imageIndex: number, direction: 'up' | 'down') => {
    setFormData(prev => {
      const newVariants = [...prev.variants];
      const variant = { ...newVariants[variantIndex] };
      const targetIndex = direction === 'up' ? imageIndex - 1 : imageIndex + 1;
      
      if (!variant.image_previews || targetIndex < 0 || targetIndex >= variant.image_previews.length) return prev;

      // Swap in image_previews
      const nextPreviews = [...variant.image_previews];
      [nextPreviews[imageIndex], nextPreviews[targetIndex]] = [nextPreviews[targetIndex], nextPreviews[imageIndex]];
      variant.image_previews = nextPreviews;

      // Swap in image_files if they exist (they should be in sync with previews in Create page)
      if (variant.image_files) {
        const nextFiles = [...variant.image_files];
        [nextFiles[imageIndex], nextFiles[targetIndex]] = [nextFiles[targetIndex], nextFiles[imageIndex]];
        variant.image_files = nextFiles;
      }
      
      newVariants[variantIndex] = variant;
      return { ...prev, variants: newVariants };
    });
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

    try {
      setSaving(true);
      setError(null);

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
          
          if (v.image_previews) {
            v.image_previews.forEach((preview, index) => {
              // Identify where this preview comes from
              const urlMatch = v.image_urls?.find(u => normalizePreviewSrc(u) === normalizePreviewSrc(preview));
              if (urlMatch) {
                variantImageUrls.push({ url: urlMatch, sort_order: index });
                return;
              }
              
              // If not found in URLs, it must be a file upload
              const fileIdx = v.image_previews!.slice(0, index).filter(p => 
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

      // Handle cover image
      if (coverImageFile) {
        uploadFormData.append('cover_image', coverImageFile);
      } else if (formData.cover_image) {
        uploadFormData.append('cover_image_url', formData.cover_image);
      }

      // Unified and ordered images handling
      const finalNewImageUrls: any[] = [];
      const imagesMetadata: any[] = [];
      
      formData.images.forEach((img, index) => {
        if (typeof img === 'string') {
          if (img.startsWith('data:')) {
            // Find which file this data URL refers to
            const dataUrlIdx = formData.images.slice(0, index).filter(i => typeof i === 'string' && (i as string).startsWith('data:')).length;
            imagesMetadata[dataUrlIdx] = { sort_order: index };
          } else {
            finalNewImageUrls.push({ url: img, sort_order: index });
          }
        }
      });

      // Send new image URLs as objects with sort_order
      if (finalNewImageUrls.length > 0) {
        uploadFormData.append('image_urls', JSON.stringify(finalNewImageUrls));
        console.log('Added image_urls to FormData:', JSON.stringify(finalNewImageUrls));
      }

      // Send images metadata for uploaded files
      if (imagesMetadata.length > 0) {
        uploadFormData.append('images_metadata', JSON.stringify(imagesMetadata));
      }

      // Add new image files
      console.log('Image files state:', imageFiles);
      console.log('Image files length:', imageFiles.length);
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

      // Handle size guide images
      const sizeGuideImageUrls = formData.size_guide_images.filter(
        (img) => typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))
      );
      if (sizeGuideImageUrls.length > 0) {
        uploadFormData.append('size_guide_image_urls', JSON.stringify(sizeGuideImageUrls));
      }
      if (sizeGuideFiles.length > 0) {
        sizeGuideFiles.forEach((file, index) => {
          uploadFormData.append(`size_guide_images[${index}]`, file);
        });
      }

      console.log('Sending create request with FormData...');
      console.log('FormData keys:', Array.from(uploadFormData.keys()));

      console.log('Calling createProduct API...');
      const response = await adminProductsAPI.createProduct(uploadFormData);
      console.log('Create response received:', response);
      console.log('=== Create Successful ===');

      // Show success toast
      Swal.fire({
        icon: 'success',
        title: 'تم بنجاح!',
        text: 'تم إنشاء المنتج بنجاح',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });

      // Navigate to edit page of the newly created product
      if (response.data && response.data.id) {
        setTimeout(() => {
          navigate(`/admin/products/${response.data.id}/edit`);
        }, 1000);
      } else {
        // If no ID, navigate to products list
        setTimeout(() => {
          navigate('/admin/products');
        }, 1000);
      }

    } catch (err: any) {
      console.error('=== Error in handleSubmit ===');
      console.error('Error creating product:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        request: err.request
      });

      // Show error toast
      let errorMessage = 'فشل في إنشاء المنتج';

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

      setError(errorMessage);
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

  if (error && !saving) {
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
              <h1 className="text-2xl font-bold text-gray-900">إنشاء منتج جديد</h1>
              <p className="text-gray-600">إضافة منتج جديد إلى المتجر</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>بيانات المنتج الجديد</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  <div className="whitespace-pre-line">
                    {error}
                  </div>
                </div>
              )}

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

                {/* Stats (Optional for new products) */}
                <div className="space-y-2">
                  <Label htmlFor="rating">التقييم</Label>
                  <Input
                    id="rating"
                    name="rating"
                    type="number"
                    step="0.01"
                    value={formData.rating}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reviews_count">عدد المراجعات</Label>
                  <Input
                    id="reviews_count"
                    name="reviews_count"
                    type="number"
                    value={formData.reviews_count}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="views_count">عدد المشاهدات</Label>
                  <Input
                    id="views_count"
                    name="views_count"
                    type="number"
                    value={formData.views_count}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sales_count">عدد المبيعات</Label>
                  <Input
                    id="sales_count"
                    name="sales_count"
                    type="number"
                    value={formData.sales_count}
                    onChange={handleInputChange}
                    placeholder="0"
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
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="وصف تفصيلي للمنتج"
                  />
                </div>

                {/* Cover Image */}
                <div className="space-y-4 md:col-span-2 p-6 bg-emerald-50/30 rounded-2xl border border-emerald-100">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div>
                      <Label htmlFor="cover_image" className="text-lg font-bold text-gray-900 leading-none">صورة الغلاف</Label>
                      <p className="text-xs text-emerald-600 font-medium mt-1">هذه هي الصورة الرئيسية التي ستظهر في المتجر والمقترحات</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="bg-white rounded-xl border-2 border-dashed border-emerald-200 p-4 transition-all hover:border-emerald-400">
                      <div className="relative group aspect-square flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                        {coverImagePreview ? (
                          <>
                            <img
                              src={coverImagePreview}
                              alt="Cover Preview"
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => document.getElementById('cover_image')?.click()}
                                className="p-2 bg-white text-emerald-600 rounded-full hover:bg-emerald-50 transition-colors shadow-sm"
                                title="تغيير الصورة"
                              >
                                <Upload className="h-5 w-5" />
                              </button>
                              <button
                                type="button"
                                onClick={handleRemoveCoverImage}
                                className="p-2 bg-white text-red-600 rounded-full hover:bg-red-50 transition-colors shadow-sm"
                                title="حذف الصورة"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-6 cursor-pointer w-full h-full flex flex-col items-center justify-center" onClick={() => document.getElementById('cover_image')?.click()}>
                            <div className="p-4 bg-emerald-50 rounded-full text-emerald-400 mb-3 group-hover:bg-emerald-100 group-hover:scale-110 transition-all">
                              <Upload className="h-8 w-8" />
                            </div>
                            <span className="text-sm font-bold text-gray-500 group-hover:text-emerald-600 transition-colors">اضغط لرفع صورة الغلاف</span>
                            <span className="text-xs text-gray-400 mt-1">JPG, PNG أو WebP (بحد أقصى 2MB)</span>
                          </div>
                        )}
                        <input
                          id="cover_image"
                          type="file"
                          accept="image/*"
                          onChange={handleCoverImageChange}
                          className="hidden"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="cover_image_url" className="text-sm font-bold text-gray-700 mb-2 block">رابط صورة الغلاف (خيار بديل)</Label>
                        <Input
                          id="cover_image_url"
                          name="cover_image"
                          value={formData.cover_image}
                          onChange={handleInputChange}
                          placeholder="https://example.com/cover.jpg"
                          className="border-emerald-100 focus:ring-emerald-500 rounded-xl"
                        />
                        <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">يمكنك رفع صورة مباشرة أو وضع رابط لها. إذا تم استخدام الخيارين، الأولوية للصورة المرفوعة.</p>
                      </div>

                      {coverImagePreview ? (
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                          <div className="flex items-center gap-3 text-emerald-700">
                            <Check className="h-4 w-4" />
                            <span className="text-xs font-bold leading-none">تم اختيار صورة بنجاح</span>
                          </div>
                          <div className="mt-2 text-[10px] text-emerald-600/70">سيتم رفع هذه الصورة كصورة رئيسية للمنتج وتخزينها في الخادم.</div>
                        </div>
                      ) : formData.cover_image ? (
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                          <div className="flex items-center gap-3 text-blue-700">
                            <Check className="h-4 w-4" />
                            <span className="text-xs font-bold leading-none">تم اعتماد الرابط كصورة غلاف</span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Images */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="images">صور المنتج</Label>

                  {/* Unified Image Previews (allowing reordering) */}
                  {formData.images.length > 0 && (
                    <div className="mb-4">
                      <Label className="text-sm font-medium text-gray-700">معاينة وترتيب الصور:</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                        {formData.images.map((image, index) => {
                          const imageUrl = typeof image === 'string' ? image : (image as any).image_url;
                          const isDataUrl = typeof image === 'string' && image.startsWith('data:');
                          
                          return (
                            <div key={index} className="relative group w-24 h-24 border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                              <img
                                src={imageUrl}
                                alt={`صورة المنتج ${index + 1}`}
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
                                      const regularUrl = image as string;
                                      setFormData(prev => ({
                                        ...prev,
                                        images: prev.images.filter(img => img !== regularUrl)
                                      }));
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
                      <Input
                        id="images_url"
                        value={formData.images.filter(img => typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))).join(', ')}
                        onChange={handleImagesChange}
                        placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Size Guide Images */}
                <div className="space-y-2 md:col-span-2 border rounded-lg p-4 bg-gray-50/50">
                  <Label className="text-base font-bold">دليل المقاسات</Label>
                  <p className="text-sm text-gray-600">
                    ارفع صورة واحدة أو عدة صور لدليل المقاسات. ستظهر في صفحة المنتج داخل نافذة منبثقة مع تمرير عمودي.
                  </p>

                  {formData.size_guide_images.filter((img) => typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))).length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">صور الدليل عبر الروابط:</Label>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {formData.size_guide_images
                          .filter((img) => typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://')))
                          .map((imageUrl, index) => (
                            <div key={`size-guide-url-${index}`} className="relative w-24 h-24 border rounded-lg overflow-hidden">
                              <img
                                src={normalizePreviewSrc(imageUrl as string)}
                                alt={`دليل المقاسات ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.svg';
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const dataUrls = formData.size_guide_images.filter((img) => typeof img === 'string' && img.startsWith('data:'));
                                  const regularUrls = formData.size_guide_images.filter((img) => typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://')));
                                  const updatedUrls = regularUrls.filter((_, i) => i !== index);
                                  setFormData((prev) => ({
                                    ...prev,
                                    size_guide_images: [...dataUrls, ...updatedUrls],
                                  }));
                                }}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {sizeGuidePreviews.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">صور الدليل المرفوعة:</Label>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {sizeGuidePreviews.map((preview, index) => (
                          <div key={`size-guide-new-${index}`} className="relative w-24 h-24 border rounded-lg overflow-hidden">
                            <img src={preview} alt={`Size guide ${index + 1}`} className="w-full h-full object-cover" />
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
                      id="size_guide_images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleSizeGuideImageChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('size_guide_images')?.click()}
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
                        placeholder={"https://example.com/size-guide-1.jpg\nhttps://example.com/size-guide-2.jpg"}
                        className="mt-1"
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
                      <Label className="text-sm font-medium text-gray-700 mb-2">المميزات المضافة:</Label>
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
                      <Label className="text-sm font-medium text-gray-700 mb-2">المواصفات المضافة:</Label>
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

                {/* No filters message */}
                {formData.category_id && availableFilters.length === 0 && (
                  <div className="md:col-span-2 p-4 bg-gray-50 border rounded-lg text-center text-gray-500 italic">
                    لا توجد فلاتر (مرشحات) مخصصة لهذه الفئة حالياً.
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
                    إذا كان لديك خصائص متعددة للفلتر الواحد (مثل مقاس كبير وصغير)، يمكنك وضع سعر וكمية لكل إحتمال.
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
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-10 font-bold">حذف</th>
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

                {/* SEO */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="meta_title">عنوان SEO</Label>
                  <Input
                    id="meta_title"
                    name="meta_title"
                    value={formData.meta_title}
                    onChange={handleInputChange}
                    placeholder="عنوان SEO للمنتج"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="meta_description">وصف SEO</Label>
                  <Textarea
                    id="meta_description"
                    name="meta_description"
                    value={formData.meta_description}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="وصف SEO للمنتج"
                  />
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
                  <span>{saving ? 'جاري الحفظ...' : 'إنشاء المنتج'}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminProductCreate;
