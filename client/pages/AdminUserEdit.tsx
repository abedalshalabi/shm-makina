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
import adminApi, { adminUsersAPI } from '@/services/adminApi';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  is_active: boolean;
  last_login_at: string;
  roles: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
}

interface Role {
  id: number;
  name: string;
  slug: string;
  description: string;
}

const AdminUserEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: '',
    password: '',
    confirm_password: '',
    is_active: true,
    role_ids: [] as number[]
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [userResponse, rolesResponse] = await Promise.all([
        adminUsersAPI.getUser(id!),
        adminUsersAPI.getRoles()
      ]);

      setUser(userResponse.data);
      setRoles(rolesResponse.data);

      setFormData({
        name: userResponse.data.name || '',
        email: userResponse.data.email || '',
        phone: userResponse.data.phone || '',
        avatar: userResponse.data.avatar || '',
        password: '',
        confirm_password: '',
        is_active: userResponse.data.is_active || false,
        role_ids: userResponse.data.roles ? userResponse.data.roles.map(role => role.id) : []
      });
      
      // Set image preview if avatar exists
      if (userResponse.data.avatar) {
        setImagePreview(userResponse.data.avatar);
      }
    } catch (err) {
      setError('فشل في تحميل بيانات المستخدم');
      console.error('Error loading data:', err);
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

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      is_active: checked
    }));
  };

  const handleRoleChange = (roleId: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      role_ids: checked 
        ? [...prev.role_ids, roleId]
        : prev.role_ids.filter(id => id !== roleId)
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
      avatar: ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password && formData.password !== formData.confirm_password) {
      setError('كلمة المرور غير متطابقة');
      return;
    }

    try {
      setSaving(true);
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        avatar: formData.avatar,
        is_active: formData.is_active,
        role_ids: formData.role_ids
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      await adminUsersAPI.updateUser(id!, updateData);
      navigate('/admin/users');
    } catch (err) {
      setError('فشل في تحديث المستخدم');
      console.error('Error updating user:', err);
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
          <Button onClick={() => navigate('/admin/users')}>
            العودة للمستخدمين
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
              onClick={() => navigate('/admin/users')}
              className="flex items-center space-x-2 rtl:space-x-reverse"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>العودة</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">تعديل المستخدم</h1>
              <p className="text-gray-600">تعديل بيانات المستخدم: {user?.name}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>بيانات المستخدم</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم الكامل *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="أدخل الاسم الكامل"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="user@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+966501234567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar">صورة المستخدم</Label>
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="صورة المستخدم"
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
                      id="avatar"
                      name="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('avatar')?.click()}
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
                      <Label htmlFor="avatar_url" className="text-sm text-gray-500">
                        أو أدخل رابط الصورة مباشرة:
                      </Label>
                      <Input
                        id="avatar_url"
                        name="avatar"
                        value={formData.avatar}
                        onChange={handleInputChange}
                        placeholder="https://example.com/image.jpg"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Password Fields */}
                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور الجديدة</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="اترك فارغاً للحفاظ على كلمة المرور الحالية"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">تأكيد كلمة المرور</Label>
                  <Input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    value={formData.confirm_password}
                    onChange={handleInputChange}
                    placeholder="تأكيد كلمة المرور الجديدة"
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

              {/* Roles */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">الأدوار والصلاحيات</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roles.map(role => (
                    <div key={role.id} className="flex items-center space-x-2 rtl:space-x-reverse">
                      <input
                        type="checkbox"
                        id={`role-${role.id}`}
                        checked={formData.role_ids.includes(role.id)}
                        onChange={(e) => handleRoleChange(role.id, e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <label htmlFor={`role-${role.id}`} className="text-sm text-gray-700">
                        {role.name}
                      </label>
                      <span className="text-xs text-gray-500">({role.slug})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Info */}
              {user && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">معلومات إضافية</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">آخر تسجيل دخول:</span>
                      <span className="mr-2">
                        {user.last_login_at ? new Date(user.last_login_at).toLocaleString('ar-SA') : 'لم يسجل دخول'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">تاريخ الإنشاء:</span>
                      <span className="mr-2">
                        {new Date().toLocaleString('ar-SA')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end space-x-4 rtl:space-x-reverse pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/users')}
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

export default AdminUserEdit;
