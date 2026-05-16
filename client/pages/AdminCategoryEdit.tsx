import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import adminApi, { adminCategoriesAPI } from '@/services/adminApi';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
  color: string;
  is_active: boolean;
  sort_order: number;
  meta_title: string;
  meta_description: string;
  parent_id?: number | null;
  parent?: {
    id: number;
    name: string;
    slug: string;
  } | null;
}

const AdminCategoryEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [category, setCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    color: '#3B82F6',
    is_active: true,
    show_in_slider: false,
    sort_order: 0,
    meta_title: '',
    meta_description: '',
    parent_id: null as number | null
  });

  useEffect(() => {
    loadCategory();
  }, [id]);

  const loadCategory = async () => {
    try {
      setLoading(true);
      const [categoryResponse, categoriesResponse] = await Promise.all([
        adminCategoriesAPI.getCategory(Number(id).toString()),
        adminCategoriesAPI.getCategories()
      ]);
      
      setCategory(categoryResponse.data);
      setCategories(categoriesResponse.data);
      
      // Convert Tailwind color class to hex if needed
      let colorValue = categoryResponse.data.color || '#3B82F6';
      if (colorValue && !colorValue.startsWith('#')) {
        // Map Tailwind color classes to hex values
        const colorMap: Record<string, string> = {
          'bg-emerald-400': '#60A5FA',
          'bg-emerald-500': '#3B82F6',
          'bg-purple-400': '#A78BFA',
          'bg-purple-500': '#8B5CF6',
          'bg-pink-400': '#F472B6',
          'bg-pink-500': '#EC4899',
          'bg-green-400': '#4ADE80',
          'bg-green-500': '#10B981',
          'bg-orange-400': '#FB923C',
          'bg-orange-500': '#F97316',
          'bg-red-400': '#F87171',
          'bg-red-500': '#EF4444',
          'bg-yellow-400': '#FBBF24',
          'bg-yellow-500': '#EAB308',
        };
        colorValue = colorMap[colorValue] || '#3B82F6';
      }
      
      setFormData({
        name: categoryResponse.data.name || '',
        slug: categoryResponse.data.slug || '',
        description: categoryResponse.data.description || '',
        image: categoryResponse.data.image || '',
        color: colorValue,
        is_active: categoryResponse.data.is_active || false,
        show_in_slider: categoryResponse.data.show_in_slider || false,
        sort_order: categoryResponse.data.sort_order || 0,
        meta_title: categoryResponse.data.meta_title || '',
        meta_description: categoryResponse.data.meta_description || '',
        parent_id: categoryResponse.data.parent_id || categoryResponse.data.parent?.id || null
      });
      
      // Set image preview if image exists
      if (categoryResponse.data.image) {
        setImagePreview(categoryResponse.data.image);
      }
    } catch (err) {
      setError('فشل في تحميل بيانات الفئة');
      console.error('Error loading category:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      image: ''
    }));
  };

  const handleSwitchChange = (checked: boolean, field: 'is_active' | 'show_in_slider') => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      // Prepare FormData for file upload
      const uploadFormData = new FormData();
      
      // Add all form fields
      uploadFormData.append('name', formData.name);
      uploadFormData.append('slug', formData.slug);
      uploadFormData.append('description', formData.description || '');
      
      // Ensure color is in hex format (not Tailwind class)
      let colorToSend = formData.color;
      if (colorToSend && !colorToSend.startsWith('#')) {
        // Map Tailwind color classes to hex values
        const colorMap: Record<string, string> = {
          'bg-emerald-400': '#60A5FA',
          'bg-emerald-500': '#3B82F6',
          'bg-purple-400': '#A78BFA',
          'bg-purple-500': '#8B5CF6',
          'bg-pink-400': '#F472B6',
          'bg-pink-500': '#EC4899',
          'bg-green-400': '#4ADE80',
          'bg-green-500': '#10B981',
          'bg-orange-400': '#FB923C',
          'bg-orange-500': '#F97316',
          'bg-red-400': '#F87171',
          'bg-red-500': '#EF4444',
          'bg-yellow-400': '#FBBF24',
          'bg-yellow-500': '#EAB308',
        };
        colorToSend = colorMap[colorToSend] || '#3B82F6';
      }
      uploadFormData.append('color', colorToSend);
      
      uploadFormData.append('sort_order', String(Number(formData.sort_order) || 0));
      uploadFormData.append('is_active', String(formData.is_active));
      uploadFormData.append('show_in_slider', String(formData.show_in_slider));
      uploadFormData.append('meta_title', formData.meta_title || '');
      uploadFormData.append('meta_description', formData.meta_description || '');
      
      // Add parent_id if set
      if (formData.parent_id !== null && formData.parent_id !== undefined) {
        uploadFormData.append('parent_id', String(formData.parent_id));
      } else {
        // Send empty string to remove parent
        uploadFormData.append('parent_id', '');
      }
      
      // Handle image: file upload or URL
      if (imageFile) {
        uploadFormData.append('image_file', imageFile);
      } else if (formData.image) {
        uploadFormData.append('image', formData.image);
      } else {
        // If no image and no preview, send empty string to delete image
        uploadFormData.append('image', '');
      }
      
      await adminCategoriesAPI.updateCategory(Number(id).toString(), uploadFormData);
      navigate('/admin/categories');
    } catch (err) {
      setError('فشل في تحديث الفئة');
      console.error('Error updating category:', err);
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
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => navigate('/admin/categories')}>
            العودة للفئات
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/categories')}
              className="flex items-center space-x-2 rtl:space-x-reverse"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>العودة</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">تعديل الفئة</h1>
              <p className="text-gray-600">تعديل بيانات الفئة: {category?.name}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>بيانات الفئة</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">اسم الفئة *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="أدخل اسم الفئة"
                  />
                </div>

                {/* Slug */}
                <div className="space-y-2">
                  <Label htmlFor="slug">الرابط المختصر *</Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    required
                    placeholder="category-slug"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="أدخل وصف الفئة"
                  />
                </div>

                {/* Image */}
                <div className="space-y-2">
                  <Label htmlFor="image">صورة الفئة</Label>
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="صورة الفئة"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  
                  {/* Image Upload */}
                  <div className="space-y-2">
                    <Input
                      id="image"
                      name="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('image')?.click()}
                        className="flex items-center space-x-2 rtl:space-x-reverse"
                      >
                        <Upload className="h-4 w-4" />
                        <span>{imagePreview ? 'تغيير الصورة' : 'اختيار صورة'}</span>
                      </Button>
                      {imagePreview && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleRemoveImage}
                          className="flex items-center space-x-2 rtl:space-x-reverse text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>حذف الصورة</span>
                        </Button>
                      )}
                    </div>
                    
                    {/* URL Input as fallback */}
                    <div className="mt-2">
                      <Label htmlFor="image_url" className="text-sm text-gray-500">
                        أو أدخل رابط الصورة مباشرة:
                      </Label>
                      <Input
                        id="image_url"
                        name="image"
                        value={formData.image}
                        onChange={handleInputChange}
                        placeholder="https://example.com/image.jpg"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Color */}
                <div className="space-y-2">
                  <Label htmlFor="color">لون الفئة</Label>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Input
                      id="color"
                      name="color"
                      type="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.color}
                      onChange={handleInputChange}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Parent Category */}
                <div className="space-y-2">
                  <Label htmlFor="parent_id">الفئة الأب</Label>
                  <Select
                    value={formData.parent_id?.toString() || 'none'}
                    onValueChange={(value) => {
                      setFormData(prev => ({
                        ...prev,
                        parent_id: value === 'none' ? null : Number(value)
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفئة الأب (اختياري)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">لا يوجد (فئة رئيسية)</SelectItem>
                      {categories
                        .filter(cat => cat.id !== Number(id)) // Exclude current category
                        .map(cat => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    اختر فئة رئيسية لتكون هذه الفئة فرعية منها. اتركه فارغاً لجعلها فئة رئيسية.
                  </p>
                </div>

                {/* Sort Order */}
                <div className="space-y-2">
                  <Label htmlFor="sort_order">ترتيب العرض</Label>
                  <Input
                    id="sort_order"
                    name="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </div>

                {/* Active Status */}
                <div className="space-y-2">
                  <Label htmlFor="is_active">حالة النشاط</Label>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => handleSwitchChange(checked, 'is_active')}
                    />
                    <span className="text-sm text-gray-600">
                      {formData.is_active ? 'نشط' : 'غير نشط'}
                    </span>
                  </div>
                </div>

                {/* Show in Slider */}
                <div className="space-y-2">
                  <Label htmlFor="show_in_slider">إظهار في السلايدر</Label>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Switch
                      id="show_in_slider"
                      checked={formData.show_in_slider}
                      onCheckedChange={(checked) => handleSwitchChange(checked, 'show_in_slider')}
                    />
                    <span className="text-sm text-gray-600">
                      {formData.show_in_slider ? 'نعم' : 'لا'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    سيتم إظهار هذه الفئة في السلايدر "التصنيفات الرئيسية" في الصفحة الرئيسية
                  </p>
                </div>
              </div>

              {/* SEO Fields */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">إعدادات SEO</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="meta_title">عنوان SEO</Label>
                    <Input
                      id="meta_title"
                      name="meta_title"
                      value={formData.meta_title}
                      onChange={handleInputChange}
                      placeholder="عنوان الصفحة في محركات البحث"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meta_description">وصف SEO</Label>
                    <Textarea
                      id="meta_description"
                      name="meta_description"
                      value={formData.meta_description}
                      onChange={handleInputChange}
                      rows={2}
                      placeholder="وصف الصفحة في محركات البحث"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-4 rtl:space-x-reverse pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/categories')}
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

export default AdminCategoryEdit;
