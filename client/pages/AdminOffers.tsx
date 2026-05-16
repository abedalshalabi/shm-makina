import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Tag,
  Image as ImageIcon,
  X,
  Save,
  Upload,
  Clock,
  Zap,
  Gift,
  Percent,
  Package,
} from "lucide-react";
import { adminOffersAPI, adminProductsAPI } from "../services/adminApi";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import Swal from "sweetalert2";

interface Offer {
  id: number;
  title: string;
  description?: string;
  type: 'flash_deal' | 'weekly_deal' | 'bundle';
  image?: string;
  discount_percentage?: number;
  fixed_discount?: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  sort_order: number;
  products?: Array<{
    id: number;
    name: string;
    slug: string;
    price: number;
    original_price?: number;
    image?: string;
    brand?: string;
  }>;
  bundle_items?: Array<{
    product_id: number;
    product_name: string;
    product_slug: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  bundle_price?: number;
  original_bundle_price?: number;
  stock_limit?: number;
  sold_count: number;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  sku?: string;
  price: number;
  original_price?: number;
  images?: Array<string | { image_url?: string; image_path?: string }>;
}

const AdminOffers = () => {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "flash_deal" as "flash_deal" | "weekly_deal" | "bundle",
    image: null as File | null,
    discount_percentage: "",
    fixed_discount: "",
    starts_at: "",
    ends_at: "",
    is_active: true,
    sort_order: 0,
    products: [] as number[],
    bundle_items: [] as Array<{ product_id: number; quantity: number }>,
    bundle_price: "",
    original_bundle_price: "",
    stock_limit: "",
  });

  useEffect(() => {
    loadOffers();
    loadProducts();
  }, [currentPage, perPage, typeFilter]);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const filters: any = {
        page: currentPage,
        per_page: perPage,
      };
      if (typeFilter !== "all") {
        filters.type = typeFilter;
      }
      if (searchTerm) {
        filters.search = searchTerm;
      }
      const response = await adminOffersAPI.getOffers(filters);
      setOffers(response.data || []);
    } catch (error) {
      console.error("Error loading offers:", error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ!',
        text: 'فشل في تحميل العروض',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await adminProductsAPI.getProducts({ per_page: 100 });
      if (response.data) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadOffers();
  };

  const handleCreate = () => {
    setEditingOffer(null);
    setFormData({
      title: "",
      description: "",
      type: "flash_deal",
      image: null,
      discount_percentage: "",
      fixed_discount: "",
      starts_at: "",
      ends_at: "",
      is_active: true,
      sort_order: 0,
      products: [],
      bundle_items: [],
      bundle_price: "",
      original_bundle_price: "",
      stock_limit: "",
    });
    setShowModal(true);
  };

  const handleEdit = (offer: Offer) => {
    setEditingOffer(offer);
    
    // Load bundle_items properly
    let bundleItems: Array<{ product_id: number; quantity: number }> = [];
    if (offer.bundle_items && Array.isArray(offer.bundle_items) && offer.bundle_items.length > 0) {
      bundleItems = offer.bundle_items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity || 1
      }));
    }
    
    console.log('Editing offer:', offer);
    console.log('Bundle items loaded:', bundleItems);
    
    setFormData({
      title: offer.title,
      description: offer.description || "",
      type: offer.type,
      image: null,
      discount_percentage: offer.discount_percentage?.toString() || "",
      fixed_discount: offer.fixed_discount?.toString() || "",
      starts_at: offer.starts_at.split('T')[0] + 'T' + offer.starts_at.split('T')[1].substring(0, 5),
      ends_at: offer.ends_at.split('T')[0] + 'T' + offer.ends_at.split('T')[1].substring(0, 5),
      is_active: offer.is_active,
      sort_order: offer.sort_order,
      products: offer.products?.map(p => p.id) || [],
      bundle_items: bundleItems,
      bundle_price: offer.bundle_price?.toString() || "",
      original_bundle_price: offer.original_bundle_price?.toString() || "",
      stock_limit: offer.stock_limit?.toString() || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'لن تتمكن من التراجع عن هذا!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذف!',
      cancelButtonText: 'إلغاء',
    });

    if (result.isConfirmed) {
      try {
        await adminOffersAPI.deleteOffer(id.toString());
        Swal.fire('تم الحذف!', 'تم حذف العرض بنجاح', 'success');
        loadOffers();
      } catch (error) {
        Swal.fire('خطأ!', 'فشل في حذف العرض', 'error');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      Swal.fire('خطأ!', 'يرجى إدخال عنوان العرض', 'error');
      return;
    }
    
    if (!formData.starts_at || !formData.ends_at) {
      Swal.fire('خطأ!', 'يرجى تحديد تاريخ البدء والانتهاء', 'error');
      return;
    }
    
    if (formData.type === 'bundle') {
      if (!formData.bundle_items || formData.bundle_items.length === 0) {
        Swal.fire('خطأ!', 'يرجى إضافة منتجات للباقة', 'error');
        return;
      }
      if (!formData.bundle_price) {
        Swal.fire('خطأ!', 'يرجى إدخال سعر الباقة', 'error');
        return;
      }
    } else {
      if (!formData.products || formData.products.length === 0) {
        Swal.fire('خطأ!', 'يرجى اختيار منتج واحد على الأقل', 'error');
        return;
      }
    }
    
    try {
      const submitData = new FormData();
      submitData.append('title', formData.title.trim());
      submitData.append('description', formData.description.trim());
      submitData.append('type', formData.type);
      submitData.append('starts_at', formData.starts_at);
      submitData.append('ends_at', formData.ends_at);
      submitData.append('is_active', formData.is_active.toString());
      submitData.append('sort_order', formData.sort_order.toString());
      
      if (formData.discount_percentage) {
        submitData.append('discount_percentage', formData.discount_percentage);
      }
      if (formData.fixed_discount) {
        submitData.append('fixed_discount', formData.fixed_discount);
      }
      if (formData.stock_limit) {
        submitData.append('stock_limit', formData.stock_limit);
      }
      
      if (formData.type === 'bundle') {
        // Always send bundle_items for bundle type
        console.log('Submitting bundle_items:', formData.bundle_items);
        console.log('Editing offer bundle_items:', editingOffer?.bundle_items);
        
        // Always use formData.bundle_items if it has items, otherwise check if we're updating
        if (formData.bundle_items && formData.bundle_items.length > 0) {
          // Use formData items
          submitData.append('bundle_items', JSON.stringify(formData.bundle_items));
        } else if (editingOffer && editingOffer.bundle_items && editingOffer.bundle_items.length > 0) {
          // If updating and formData is empty, use existing items from offer to preserve them
          const existingItems = editingOffer.bundle_items.map(item => ({ 
            product_id: item.product_id, 
            quantity: item.quantity || 1
          }));
          console.log('Using existing items:', existingItems);
          submitData.append('bundle_items', JSON.stringify(existingItems));
        } else {
          // Empty array for new bundle (will fail validation if required)
          submitData.append('bundle_items', JSON.stringify([]));
        }
        
        if (formData.bundle_price) {
          submitData.append('bundle_price', formData.bundle_price);
        }
        if (formData.original_bundle_price) {
          submitData.append('original_bundle_price', formData.original_bundle_price);
        }
        // Don't send products for bundle type
      } else {
        // Always send products for non-bundle types
        // If formData has products, use them; otherwise use from editingOffer (for update) or empty array (for create)
        if (editingOffer && formData.products.length === 0) {
          // If updating and formData is empty, use existing products from offer
          const existingProducts = editingOffer.products?.map(p => p.id) || [];
          submitData.append('products', JSON.stringify(existingProducts));
        } else {
          // Use formData products (even if empty, will be handled by backend)
          submitData.append('products', JSON.stringify(formData.products || []));
        }
        // Don't send bundle_items for non-bundle types
      }
      
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      if (editingOffer) {
        await adminOffersAPI.updateOffer(editingOffer.id.toString(), submitData);
        Swal.fire('تم التحديث!', 'تم تحديث العرض بنجاح', 'success');
      } else {
        await adminOffersAPI.createOffer(submitData);
        Swal.fire('تم الإنشاء!', 'تم إنشاء العرض بنجاح', 'success');
      }
      
      setShowModal(false);
      loadOffers();
    } catch (error: any) {
      console.error('Error saving offer:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'فشل في حفظ العرض';
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorList = Object.entries(errors)
          .map(([key, value]: [string, any]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('\n');
        errorMessage = `خطأ في البيانات المدخلة:\n${errorList}`;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Swal.fire({
        icon: 'error',
        title: 'خطأ!',
        text: errorMessage,
        width: '600px',
      });
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      flash_deal: 'عرض البرق',
      weekly_deal: 'عرض أسبوعي',
      bundle: 'باقة',
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'flash_deal':
        return <Zap className="w-4 h-4" />;
      case 'weekly_deal':
        return <Percent className="w-4 h-4" />;
      case 'bundle':
        return <Gift className="w-4 h-4" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة العروض</h1>
            <p className="text-gray-600 mt-2">إدارة العروض والباندلز والتوقيت</p>
          </div>
          <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 ml-2" />
            إضافة عرض جديد
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400" />
              <Input
                placeholder="البحث في العروض..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="نوع العرض" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="flash_deal">عرض البرق</SelectItem>
                <SelectItem value="weekly_deal">عرض أسبوعي</SelectItem>
                <SelectItem value="bundle">باقة</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} className="bg-emerald-600 hover:bg-emerald-700">
              <Search className="w-4 h-4 ml-2" />
              بحث
            </Button>
          </div>
        </div>

        {/* Offers Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">العنوان</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">النوع</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {offers.map((offer) => (
                    <tr key={offer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {offer.image && (
                            <img src={offer.image} alt={offer.title} className="w-10 h-10 rounded object-cover ml-3" />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{offer.title}</div>
                            {offer.description && (
                              <div className="text-sm text-gray-500 line-clamp-1">{offer.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(offer.type)}
                          <span className="text-sm text-gray-900">{getTypeLabel(offer.type)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{new Date(offer.starts_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        <div className="text-xs text-gray-400">إلى {new Date(offer.ends_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${offer.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {offer.is_active ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(offer)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(offer.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingOffer ? 'تعديل العرض' : 'إضافة عرض جديد'}
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="title">العنوان *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">نوع العرض *</Label>
                    <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flash_deal">عرض البرق</SelectItem>
                        <SelectItem value="weekly_deal">عرض أسبوعي</SelectItem>
                        <SelectItem value="bundle">باقة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="description">الوصف</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="starts_at">تاريخ البدء *</Label>
                    <Input
                      id="starts_at"
                      type="datetime-local"
                      value={formData.starts_at}
                      onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="ends_at">تاريخ الانتهاء *</Label>
                    <Input
                      id="ends_at"
                      type="datetime-local"
                      value={formData.ends_at}
                      onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                      required
                    />
                  </div>

                  {formData.type !== 'bundle' && (
                    <>
                      <div>
                        <Label htmlFor="discount_percentage">نسبة الخصم (%)</Label>
                        <Input
                          id="discount_percentage"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.discount_percentage}
                          onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="fixed_discount">خصم ثابت</Label>
                        <Input
                          id="fixed_discount"
                          type="number"
                          min="0"
                          value={formData.fixed_discount}
                          onChange={(e) => setFormData({ ...formData, fixed_discount: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  {formData.type === 'bundle' && (
                    <>
                      <div>
                        <Label htmlFor="bundle_price">سعر الباقة *</Label>
                        <Input
                          id="bundle_price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.bundle_price}
                          onChange={(e) => setFormData({ ...formData, bundle_price: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="original_bundle_price">السعر الأصلي للباقة</Label>
                        <Input
                          id="original_bundle_price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.original_bundle_price}
                          onChange={(e) => setFormData({ ...formData, original_bundle_price: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <Label htmlFor="stock_limit">حد الكمية المتاحة</Label>
                    <Input
                      id="stock_limit"
                      type="number"
                      min="0"
                      value={formData.stock_limit}
                      onChange={(e) => setFormData({ ...formData, stock_limit: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="sort_order">ترتيب العرض</Label>
                    <Input
                      id="sort_order"
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="image">صورة العرض</Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                    />
                    {editingOffer?.image && !formData.image && (
                      <img src={editingOffer.image} alt="Current" className="mt-2 w-32 h-32 object-cover rounded" />
                    )}
                  </div>

                  <div className="md:col-span-2 flex items-center gap-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label>نشط</Label>
                  </div>
                </div>

                {/* Products Selection */}
                {formData.type !== 'bundle' && (
                  <div className="space-y-4">
                    <div>
                      <Label>المنتجات *</Label>
                      <div className="flex gap-2 mb-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="بحث باسم المنتج أو SKU..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="pl-8"
                          />
                        </div>
                      </div>
                      <Select
                        onValueChange={(value) => {
                          const productId = parseInt(value);
                          if (!formData.products.includes(productId)) {
                            setFormData({ ...formData, products: [...formData.products, productId] });
                          }
                          setProductSearch(""); // Reset search after selection
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر من المنتجات المصفاة..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {products
                            .filter(p => !formData.products.includes(p.id))
                            .filter(p => 
                              p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                              (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
                            )
                            .map((product) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                <div className="flex flex-col">
                                  <span>{product.name}</span>
                                  {product.sku && <span className="text-[10px] text-gray-400">SKU: {product.sku}</span>}
                                </div>
                              </SelectItem>
                            ))}
                          {products.filter(p => !formData.products.includes(p.id)).filter(p => 
                            p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                            (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
                          ).length === 0 && (
                            <div className="p-2 text-center text-sm text-gray-500">لا توجد منتجات تطابق البحث</div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="mt-2 space-y-2">
                      {formData.products.map((productId) => {
                        const product = products.find(p => p.id === productId);
                        if (!product) return null;
                        return (
                          <div key={productId} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span>{product.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setFormData({ ...formData, products: formData.products.filter(id => id !== productId) })}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Bundle Items */}
                {formData.type === 'bundle' && (
                  <div className="space-y-4">
                    <div>
                      <Label>عناصر الباقة *</Label>
                      <div className="flex gap-2 mb-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="بحث باسم المنتج أو SKU..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="pl-8"
                          />
                        </div>
                      </div>
                      <Select
                        onValueChange={(value) => {
                          const productId = parseInt(value);
                          if (!formData.bundle_items.find(item => item.product_id === productId)) {
                            setFormData({
                              ...formData,
                              bundle_items: [...formData.bundle_items, { product_id: productId, quantity: 1 }],
                            });
                          }
                          setProductSearch(""); // Reset search after selection
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر من المنتجات المصفاة..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {products
                            .filter(p => !formData.bundle_items.find(item => item.product_id === p.id))
                            .filter(p => 
                              p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                              (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
                            )
                            .map((product) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                <div className="flex flex-col">
                                  <span>{product.name}</span>
                                  {product.sku && <span className="text-[10px] text-gray-400">SKU: {product.sku}</span>}
                                </div>
                              </SelectItem>
                            ))}
                          {products.filter(p => !formData.bundle_items.find(item => item.product_id === p.id)).filter(p => 
                            p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                            (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
                          ).length === 0 && (
                            <div className="p-2 text-center text-sm text-gray-500">لا توجد منتجات تطابق البحث</div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="mt-2 space-y-2">
                      {formData.bundle_items.map((item, index) => {
                        const product = products.find(p => p.id === item.product_id);
                        if (!product) return null;
                        return (
                          <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                            <span className="flex-1">{product.name}</span>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const newItems = [...formData.bundle_items];
                                newItems[index].quantity = parseInt(e.target.value) || 1;
                                setFormData({ ...formData, bundle_items: newItems });
                              }}
                              className="w-20"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setFormData({ ...formData, bundle_items: formData.bundle_items.filter((_, i) => i !== index) })}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                    <Save className="w-4 h-4 ml-2" />
                    {editingOffer ? 'تحديث' : 'إنشاء'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOffers;

