import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, User, Mail, Phone, Calendar, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { adminUsersAPI } from '@/services/adminApi';

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
    permissions: Array<{
      id: number;
      name: string;
      slug: string;
      module: string;
    }>;
  }>;
  created_at: string;
  updated_at: string;
}

const AdminUserView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const response = await adminUsersAPI.getUser(id!);
      setUser(response.data);
    } catch (err) {
      setError('فشل في تحميل بيانات المستخدم');
      console.error('Error loading user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      try {
        await adminUsersAPI.deleteUser(id!);
        navigate('/admin/users');
      } catch (err) {
        setError('فشل في حذف المستخدم');
        console.error('Error deleting user:', err);
      }
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">المستخدم غير موجود</p>
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
              <h1 className="text-2xl font-bold text-gray-900">عرض المستخدم</h1>
              <p className="text-gray-600">تفاصيل المستخدم: {user.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Button
              onClick={() => navigate(`/admin/users/${user.id}/edit`)}
              className="flex items-center space-x-2 rtl:space-x-reverse"
            >
              <Edit className="h-4 w-4" />
              <span>تعديل</span>
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex items-center space-x-2 rtl:space-x-reverse"
            >
              <Trash2 className="h-4 w-4" />
              <span>حذف</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Info */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                  <User className="h-5 w-5" />
                  <span>معلومات المستخدم</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">الاسم الكامل</label>
                    <p className="text-lg font-semibold text-gray-900">{user.name}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">البريد الإلكتروني</label>
                    <p className="text-lg text-gray-900 flex items-center space-x-2 rtl:space-x-reverse">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{user.email}</span>
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">رقم الهاتف</label>
                    <p className="text-lg text-gray-900 flex items-center space-x-2 rtl:space-x-reverse">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{user.phone || 'غير محدد'}</span>
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">حالة النشاط</label>
                    <div>
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">آخر تسجيل دخول</label>
                    <p className="text-lg text-gray-900 flex items-center space-x-2 rtl:space-x-reverse">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>
                        {user.last_login_at 
                          ? new Date(user.last_login_at).toLocaleString('ar-SA')
                          : 'لم يسجل دخول'
                        }
                      </span>
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">تاريخ الإنشاء</label>
                    <p className="text-lg text-gray-900 flex items-center space-x-2 rtl:space-x-reverse">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{new Date(user.created_at).toLocaleString('ar-SA')}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Roles & Permissions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Shield className="h-5 w-5" />
                  <span>الأدوار والصلاحيات</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user.roles && user.roles.length > 0 ? (
                  <div className="space-y-4">
                    {user.roles.map((role) => (
                      <div key={role.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{role.name}</h4>
                          <Badge variant="outline">{role.slug}</Badge>
                        </div>
                        {role.permissions && role.permissions.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-500">الصلاحيات:</p>
                            <div className="flex flex-wrap gap-1">
                              {role.permissions.map((permission) => (
                                <Badge key={permission.id} variant="secondary" className="text-xs">
                                  {permission.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center">لا توجد أدوار مخصصة</p>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>إجراءات سريعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                  className="w-full flex items-center justify-center space-x-2 rtl:space-x-reverse"
                >
                  <Edit className="h-4 w-4" />
                  <span>تعديل المستخدم</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin/users')}
                  className="w-full"
                >
                  العودة لقائمة المستخدمين
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserView;
