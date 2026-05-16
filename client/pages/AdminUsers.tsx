import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  User,
  Mail,
  Phone,
  Calendar,
  ArrowLeft,
  ArrowRight,
  MoreHorizontal,
  Shield,
  UserCheck,
  UserX,
  Star
} from "lucide-react";
import { adminUsersAPI } from "../services/adminApi";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  is_active: boolean;
  last_login_at?: string;
  roles: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  created_at: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const navigate = useNavigate();

  const statusOptions = [
    { value: "all", label: "جميع الحالات" },
    { value: "active", label: "نشط" },
    { value: "inactive", label: "غير نشط" }
  ];

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    fetchUsers();
    fetchRoles();
  }, [navigate, searchQuery, roleFilter, statusFilter, currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const filters = {
        search: searchQuery,
        role: roleFilter !== "all" ? roleFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        page: currentPage,
        per_page: 20
      };
      
      const data = await adminUsersAPI.getUsers();
      setUsers(data.data || []);
      setTotalPages(data.meta?.last_page || data.last_page || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || "فشل في تحميل المستخدمين");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await adminUsersAPI.getRoles();
      setRoles(data.data || []);
    } catch (err: any) {
      console.error("Failed to fetch roles:", err);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
      try {
        await adminUsersAPI.deleteUser(id.toString());
        setUsers(users.filter(u => u.id !== id));
      } catch (err: any) {
        setError(err.response?.data?.message || "فشل في حذف المستخدم");
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;
    
    if (window.confirm(`هل أنت متأكد من حذف ${selectedUsers.length} مستخدم؟`)) {
      try {
        await Promise.all(
          selectedUsers.map(id => adminUsersAPI.deleteUser(id.toString()))
        );
        setUsers(users.filter(u => !selectedUsers.includes(u.id)));
        setSelectedUsers([]);
      } catch (err: any) {
        setError(err.response?.data?.message || "فشل في حذف المستخدمين");
      }
    }
  };

  const toggleUserSelection = (id: number) => {
    setSelectedUsers(prev => 
      prev.includes(id) 
        ? prev.filter(u => u !== id)
        : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">جاري تحميل المستخدمين...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة المستخدمين الإداريين</h1>
            <p className="text-gray-600">عرض وإدارة جميع المستخدمين الإداريين</p>
          </div>
          
          <button
            onClick={() => navigate("/admin/users/create")}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            إضافة مستخدم
          </button>
        </div>
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="البحث في المستخدمين..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">جميع الأدوار</option>
                {roles.map(role => (
                  <option key={role.id} value={role.slug}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Button */}
            <div>
              <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center">
                <Filter className="w-4 h-4 mr-2" />
                فلترة
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-emerald-700">
                  تم تحديد {selectedUsers.length} مستخدم
                </span>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <button
                    onClick={handleBulkDelete}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    حذف المحدد
                  </button>
                  <button
                    onClick={() => setSelectedUsers([])}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    إلغاء التحديد
                  </button>
                </div>
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

        {/* Users Table */}
        {users.length === 0 ? (
          <div className="text-center py-16">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">لا توجد مستخدمين</h3>
            <p className="text-gray-600 mb-4">لم يتم العثور على مستخدمين تطابق معايير البحث</p>
            <button
              onClick={() => navigate("/admin/users/new")}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700"
            >
              إضافة مستخدم جديد
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length && users.length > 0}
                        onChange={toggleAllSelection}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المستخدم
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      البريد الإلكتروني
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الهاتف
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الأدوار
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      آخر دخول
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {user.avatar ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={user.avatar}
                                alt={user.name}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <User className="w-5 h-5 text-gray-600" />
                              </div>
                            )}
                          </div>
                          <div className="mr-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {user.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">
                            {user.email}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">
                            {user.phone || "غير محدد"}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <span
                              key={role.id}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"
                            >
                              <Shield className="w-3 h-3 mr-1" />
                              {role.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {user.is_active ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <UserCheck className="w-3 h-3 mr-1" />
                              نشط
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <UserX className="w-3 h-3 mr-1" />
                              غير نشط
                            </span>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">
                            {user.last_login_at 
                              ? new Date(user.last_login_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                              : "لم يسجل دخول"
                            }
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button
                            onClick={() => navigate(`/admin/users/${user.id}`)}
                            className="text-emerald-600 hover:text-emerald-900 p-2 hover:bg-emerald-50 rounded-lg"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                            className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="relative">
                            <button className="text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-50 rounded-lg">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center mt-8">
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg ${
                    currentPage === page
                      ? "bg-emerald-600 text-white"
                      : "border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
