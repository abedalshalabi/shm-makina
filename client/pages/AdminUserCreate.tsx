import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import adminApi, { adminUsersAPI } from '@/services/adminApi';

interface Role {
  id: number;
  name: string;
  slug: string;
  description: string;
}

const AdminUserCreate: React.FC = () => {
  const navigate = useNavigate();
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await adminUsersAPI.getRoles();
      setRoles(response.data);
    } catch (err) {
      setError('فشل في تحميل الأدوار');
      console.error('Error loading roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirm_password) {
      setError('كلمة المرور غير متطابقة');
      return;
    }

    if (!formData.password) {
      setError('كلمة المرور مطلوبة');
      return;
    }

    if (formData.role_ids.length === 0) {
      setError('يجب اختيار دور واحد على الأقل');
      return;
    }

    try {
      setSaving(true);
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        avatar: formData.avatar,
        password: formData.password,
        is_active: formData.is_active,
        role_ids: formData.role_ids
      };

      await adminUsersAPI.createUser(userData);
      navigate('/admin/users');
    } catch (err) {
      setError('فشل في إنشاء المستخدم');
      console.error('Error creating user:', err);
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
              <h1 className="text-2xl font-bold text-gray-900">إضافة مستخدم جديد</h1>
              <p className="text-gray-600">إنشاء مستخدم جديد في النظام</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>بيانات المستخدم الجديد</CardTitle>
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
                  <Input
                    id="avatar"
                    name="avatar"
                    value={formData.avatar}
                    onChange={handleInputChange}
                    placeholder="رابط الصورة"
                  />
                </div>

                {/* Password Fields */}
                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="كلمة المرور"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">تأكيد كلمة المرور *</Label>
                  <Input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    value={formData.confirm_password}
                    onChange={handleInputChange}
                    required
                    placeholder="تأكيد كلمة المرور"
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
                <h3 className="text-lg font-medium mb-4">الأدوار والصلاحيات *</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roles.map(role => (
                    <div key={role.id} className="flex items-start space-x-2 rtl:space-x-reverse">
                      <input
                        type="checkbox"
                        id={`role-${role.id}`}
                        checked={formData.role_ids.includes(role.id)}
                        onChange={(e) => handleRoleChange(role.id, e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 mt-1"
                      />
                      <div className="flex-1">
                        <label htmlFor={`role-${role.id}`} className="text-sm font-medium text-gray-700">
                          {role.name}
                        </label>
                        <p className="text-xs text-gray-500 mt-1">{role.description}</p>
                        <span className="text-xs text-gray-400">({role.slug})</span>
                      </div>
                    </div>
                  ))}
                </div>
                {formData.role_ids.length === 0 && (
                  <p className="text-sm text-red-600 mt-2">يجب اختيار دور واحد على الأقل</p>
                )}
              </div>

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
                  <span>{saving ? 'جاري الحفظ...' : 'إنشاء المستخدم'}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUserCreate;
