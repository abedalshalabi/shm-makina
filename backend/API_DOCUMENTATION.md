# أبو زينة للتقنيات - API Documentation

## نظرة عامة

هذا دليل شامل لاستخدام API الخاص بمتجر أبو زينة للتقنيات. يوفر API جميع الوظائف اللازمة لإدارة المتجر الإلكتروني.

**Base URL:** `http://localhost:8000/api/v1`

## المصادقة

### تسجيل مستخدم جديد
```http
POST /api/v1/register
Content-Type: application/json

{
  "name": "أحمد محمد",
  "email": "ahmed@example.com",
  "password": "password123",
  "password_confirmation": "password123",
  "phone": "0599123456",
  "city": "رام الله",
  "district": "البيرة",
  "street": "شارع الملك فيصل",
  "building": "مبنى رقم 5"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "أحمد محمد",
    "email": "ahmed@example.com",
    "phone": "0599123456",
    "city": "رام الله",
    "district": "البيرة",
    "street": "شارع الملك فيصل",
    "building": "مبنى رقم 5"
  },
  "token": "1|abc123...",
  "token_type": "Bearer"
}
```

### تسجيل الدخول
```http
POST /api/v1/login
Content-Type: application/json

{
  "email": "ahmed@example.com",
  "password": "password123"
}
```

### تسجيل الخروج
```http
POST /api/v1/logout
Authorization: Bearer {token}
```

## المنتجات

### جلب قائمة المنتجات
```http
GET /api/v1/products?page=1&per_page=15&search=ثلاجة&category_id=1&brand_id=2&price_min=1000&price_max=5000&sort=price
```

**Query Parameters:**
- `page`: رقم الصفحة (افتراضي: 1)
- `per_page`: عدد المنتجات في الصفحة (افتراضي: 15)
- `search`: البحث في اسم المنتج أو الوصف
- `category_id`: تصفية حسب الفئة
- `brand_id`: تصفية حسب العلامة التجارية
- `price_min`: الحد الأدنى للسعر
- `price_max`: الحد الأقصى للسعر
- `sort`: ترتيب النتائج (price, name, created_at, rating)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "ثلاجة LG 18 قدم",
      "slug": "lg-refrigerator-18ft",
      "description": "ثلاجة حديثة بتقنية التبريد الذكي",
      "price": 2500.00,
      "original_price": 3000.00,
      "discount_percentage": 16.67,
      "sku": "LG-REF-18",
      "stock_quantity": 10,
      "in_stock": true,
      "rating": 4.5,
      "reviews_count": 25,
      "category": {
        "id": 1,
        "name": "الأجهزة المنزلية",
        "slug": "home-appliances"
      },
      "brand": {
        "id": 2,
        "name": "LG",
        "slug": "lg"
      },
      "images": [
        {
          "id": 1,
          "image_path": "/images/products/lg-refrigerator-1.jpg",
          "is_primary": true
        }
      ]
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 15,
    "total": 75
  }
}
```

### جلب منتج محدد
```http
GET /api/v1/products/{id}
```

### المنتجات المميزة
```http
GET /api/v1/products/featured
```

### أحدث المنتجات
```http
GET /api/v1/products/latest
```

### منتجات فئة معينة
```http
GET /api/v1/products/category/{category_slug}
```

### منتجات علامة تجارية
```http
GET /api/v1/products/brand/{brand_slug}
```

## السلة

### جلب محتويات السلة
```http
GET /api/v1/cart
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "quantity": 2,
      "price": 2500.00,
      "total": 5000.00,
      "product": {
        "id": 1,
        "name": "ثلاجة LG 18 قدم",
        "slug": "lg-refrigerator-18ft",
        "price": 2500.00,
        "in_stock": true,
        "images": [
          {
            "image_path": "/images/products/lg-refrigerator-1.jpg",
            "is_primary": true
          }
        ]
      }
    }
  ],
  "meta": {
    "total_items": 1,
    "total_amount": 5000.00,
    "shipping_cost": 0.00,
    "final_total": 5000.00
  }
}
```

### إضافة منتج للسلة
```http
POST /api/v1/cart
Content-Type: application/json

{
  "product_id": 1,
  "quantity": 2
}
```

### تحديث كمية منتج في السلة
```http
PUT /api/v1/cart/{cart_id}
Content-Type: application/json

{
  "quantity": 3
}
```

### حذف منتج من السلة
```http
DELETE /api/v1/cart/{cart_id}
```

### مسح السلة
```http
DELETE /api/v1/cart
```

### ملخص السلة
```http
GET /api/v1/cart/summary
```

## الطلبات

### إنشاء طلب جديد
```http
POST /api/v1/orders
Content-Type: application/json

{
  "customer_name": "أحمد محمد",
  "customer_email": "ahmed@example.com",
  "customer_phone": "0599123456",
  "customer_city": "رام الله",
  "customer_district": "البيرة",
  "customer_street": "شارع الملك فيصل",
  "customer_building": "مبنى رقم 5",
  "customer_additional_info": "بجانب المدرسة",
  "payment_method": "cod",
  "notes": "التوصيل في المساء"
}
```

**Response:**
```json
{
  "message": "Order created successfully",
  "data": {
    "id": 1,
    "order_number": "ORD-ABC123",
    "customer_name": "أحمد محمد",
    "customer_email": "ahmed@example.com",
    "subtotal": 5000.00,
    "shipping_cost": 0.00,
    "total": 5000.00,
    "payment_method": "cod",
    "order_status": "pending",
    "payment_status": "pending",
    "items": [
      {
        "id": 1,
        "product_name": "ثلاجة LG 18 قدم",
        "quantity": 2,
        "price": 2500.00,
        "total": 5000.00
      }
    ]
  }
}
```

### جلب تفاصيل طلب
```http
GET /api/v1/orders/{order_id}
```

### طلبات المستخدم
```http
GET /api/v1/user/orders
Authorization: Bearer {token}
```

## الفئات

### قائمة الفئات
```http
GET /api/v1/categories
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "الأجهزة المنزلية",
      "slug": "home-appliances",
      "description": "جميع الأجهزة المنزلية الحديثة",
      "color": "bg-blue-500",
      "is_active": true
    }
  ]
}
```

### تفاصيل فئة
```http
GET /api/v1/categories/{category_slug}
```

## العلامات التجارية

### قائمة العلامات التجارية
```http
GET /api/v1/brands
```

### تفاصيل علامة تجارية
```http
GET /api/v1/brands/{brand_slug}
```

## قائمة الأمنيات

### جلب قائمة الأمنيات
```http
GET /api/v1/wishlist
```

### إضافة منتج لقائمة الأمنيات
```http
POST /api/v1/wishlist/{product_id}
```

### حذف منتج من قائمة الأمنيات
```http
DELETE /api/v1/wishlist/{product_id}
```

## المراجعات

### مراجعات منتج
```http
GET /api/v1/products/{product_id}/reviews
```

### إضافة مراجعة
```http
POST /api/v1/products/{product_id}/reviews
Content-Type: application/json

{
  "rating": 5,
  "comment": "منتج ممتاز وجودة عالية"
}
```

## لوحة الإدارة

### إحصائيات لوحة التحكم
```http
GET /api/v1/admin/dashboard
Authorization: Bearer {admin_token}
```

### إدارة المنتجات
```http
# إنشاء منتج
POST /api/v1/admin/products
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "منتج جديد",
  "description": "وصف المنتج",
  "price": 1000.00,
  "sku": "PROD-001",
  "stock_quantity": 50,
  "category_id": 1,
  "brand_id": 1,
  "images": [
    "/images/products/product-1.jpg",
    "/images/products/product-2.jpg"
  ]
}

# تحديث منتج
PUT /api/v1/admin/products/{product_id}
Authorization: Bearer {admin_token}

# حذف منتج
DELETE /api/v1/admin/products/{product_id}
Authorization: Bearer {admin_token}
```

### إدارة الطلبات
```http
# قائمة الطلبات
GET /api/v1/admin/orders
Authorization: Bearer {admin_token}

# تحديث حالة طلب
PUT /api/v1/admin/orders/{order_id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "order_status": "shipped",
  "payment_status": "paid"
}
```

## رموز الحالة

- `200` - نجح الطلب
- `201` - تم إنشاء المورد بنجاح
- `400` - طلب غير صحيح
- `401` - غير مصرح
- `403` - ممنوع
- `404` - غير موجود
- `422` - خطأ في التحقق من البيانات
- `500` - خطأ في الخادم

## أمثلة على الاستخدام

### JavaScript/React
```javascript
// إعداد API
const API_BASE = 'http://localhost:8000/api/v1';

// تسجيل الدخول
const login = async (email, password) => {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
};

// جلب المنتجات
const getProducts = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`${API_BASE}/products?${params}`);
  return response.json();
};

// إضافة للسلة
const addToCart = async (productId, quantity, token) => {
  const response = await fetch(`${API_BASE}/cart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ product_id: productId, quantity }),
  });
  return response.json();
};
```

### PHP
```php
// استخدام cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:8000/api/v1/products');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $token
]);
$response = curl_exec($ch);
curl_close($ch);
```

## ملاحظات مهمة

1. **المصادقة**: معظم endpoints تتطلب مصادقة باستخدام Bearer token
2. **CORS**: تم إعداد CORS للسماح بالوصول من frontend
3. **Rate Limiting**: يوجد حد أقصى للطلبات في الدقيقة
4. **Validation**: جميع البيانات يتم التحقق منها قبل المعالجة
5. **Pagination**: النتائج الكبيرة مقسمة على صفحات

## الدعم

للحصول على الدعم أو الإبلاغ عن مشاكل:
- GitHub Issues
- البريد الإلكتروني: support@abozaina.ps
- الهاتف: +970-59-123-4567
