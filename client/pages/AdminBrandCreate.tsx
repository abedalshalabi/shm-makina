import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminBrandsAPI } from '@/services/adminApi';

const AdminBrandCreate: React.FC = () => {
  const navigate = useNavigate();
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    logo: '',
    website: '',
    is_active: true,
    sort_order: 0,
    meta_title: '',
    meta_description: ''
  });

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
      logo: ''
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      is_active: checked
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
      uploadFormData.append('website', formData.website || '');
      uploadFormData.append('sort_order', String(formData.sort_order || 0));
      uploadFormData.append('is_active', formData.is_active ? '1' : '0');
      uploadFormData.append('meta_title', formData.meta_title || '');
      uploadFormData.append('meta_description', formData.meta_description || '');
      
      // Handle logo: file upload or URL
      if (imageFile) {
        uploadFormData.append('logo_file', imageFile);
      } else if (formData.logo) {
        uploadFormData.append('logo', formData.logo);
      }
      
      await adminBrandsAPI.createBrand(uploadFormData);
      navigate('/admin/brands');
    } catch (err) {
      setError('فشل في إنشاء العلامة التجارية');
      console.error('Error creating brand:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/brands')}
              className="flex items-center space-x-2 rtl:space-x-reverse"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>العودة</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">إضافة علامة تجارية جديدة</h1>
              <p className="text-gray-600">إنشاء علامة تجارية جديدة في المتجر</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>بيانات العلامة التجارية الجديدة</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">اسم العلامة التجارية *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="أدخل اسم العلامة التجارية"
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
                    placeholder="brand-slug"
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
                    placeholder="أدخل وصف العلامة التجارية"
                  />
                </div>

                {/* Logo */}
                <div className="space-y-2">
                  <Label htmlFor="logo">شعار العلامة التجارية</Label>
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="relative w-32 h-32 border rounded-lg overflow-hidden mb-2">
                      <img
                        src={imagePreview}
                        alt="شعار العلامة التجارية"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  
                  {/* Image Upload */}
                  <div className="space-y-2">
                    <Input
                      id="logo_file"
                      name="logo_file"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('logo_file')?.click()}
                        className="flex items-center space-x-2 rtl:space-x-reverse"
                      >
                        <span>{imagePreview ? 'تغيير الشعار' : 'اختيار شعار'}</span>
                      </Button>
                      {imagePreview && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleRemoveImage}
                          className="flex items-center space-x-2 rtl:space-x-reverse text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                          <span>حذف الشعار</span>
                        </Button>
                      )}
                    </div>
                    
                    {/* URL Input as fallback */}
                    <div className="mt-2">
                      <Label htmlFor="logo_url" className="text-sm text-gray-500">
                        أو أدخل رابط الشعار مباشرة:
                      </Label>
                      <Input
                        id="logo_url"
                        name="logo"
                        value={formData.logo}
                        onChange={handleInputChange}
                        placeholder="https://example.com/logo.png"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Website */}
                <div className="space-y-2">
                  <Label htmlFor="website">الموقع الإلكتروني</Label>
                  <Input
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                  />
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
                      onCheckedChange={handleSwitchChange}
                    />
                    <span className="text-sm text-gray-600">
                      {formData.is_active ? 'نشط' : 'غير نشط'}
                    </span>
                  </div>
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
                  onClick={() => navigate('/admin/brands')}
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
                  <span>{saving ? 'جاري الحفظ...' : 'إنشاء العلامة التجارية'}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminBrandCreate;
