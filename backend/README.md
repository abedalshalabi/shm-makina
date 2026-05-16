# أبو زينة للتقنيات - Laravel Backend API

## نظرة عامة

هذا هو الخادم الخلفي (Backend) لمتجر أبو زينة للتقنيات، مبني باستخدام Laravel 11 مع API RESTful شامل يدعم جميع وظائف المتجر الإلكتروني.

## الميزات الرئيسية

### 🛍️ إدارة المنتجات
- عرض المنتجات مع التصفية والترتيب
- البحث المتقدم في المنتجات
- إدارة المخزون والكميات
- دعم الصور المتعددة للمنتجات
- تقييمات ومراجعات المنتجات

### 🛒 نظام السلة والطلبات
- سلة تسوق متقدمة (دعم الضيوف والمستخدمين المسجلين)
- نظام طلبات شامل مع تتبع الحالة
- دعم طرق دفع متعددة
- إدارة الشحن والتوصيل

### 👤 نظام المستخدمين
- تسجيل الدخول والخروج
- إدارة الملف الشخصي
- قائمة الأمنيات
- تاريخ الطلبات

### 🔐 نظام المصادقة
- تسجيل المستخدمين
- تسجيل الدخول باستخدام Laravel Sanctum
- حماية API endpoints
- دعم الضيوف والمستخدمين المسجلين

### 📊 لوحة الإدارة
- إدارة المنتجات والفئات والعلامات التجارية
- إدارة الطلبات والعملاء
- إحصائيات المبيعات
- إدارة المراجعات

## البنية التقنية

### التقنيات المستخدمة
- **Laravel 11** - إطار العمل الأساسي
- **Laravel Sanctum** - نظام المصادقة
- **Spatie Laravel Permission** - إدارة الصلاحيات
- **Spatie Query Builder** - بناء استعلامات متقدمة
- **Laravel Scout** - البحث المتقدم
- **MySQL/SQLite** - قاعدة البيانات

### هيكل المشروع

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/     # متحكمات API
│   │   └── Resources/           # موارد JSON
│   └── Models/                  # نماذج البيانات
├── database/
│   ├── migrations/              # هجرات قاعدة البيانات
│   └── seeders/                 # بيانات تجريبية
├── routes/
│   └── api.php                  # مسارات API
└── config/                      # إعدادات التطبيق
```

## API Endpoints

### 🔐 المصادقة
```
POST /api/v1/register          # تسجيل مستخدم جديد
POST /api/v1/login             # تسجيل الدخول
POST /api/v1/logout            # تسجيل الخروج
GET  /api/v1/user              # بيانات المستخدم الحالي
```

### 🛍️ المنتجات
```
GET    /api/v1/products                    # قائمة المنتجات
GET    /api/v1/products/{id}               # تفاصيل منتج
GET    /api/v1/products/featured           # المنتجات المميزة
GET    /api/v1/products/latest             # أحدث المنتجات
GET    /api/v1/products/category/{slug}    # منتجات فئة معينة
GET    /api/v1/products/brand/{slug}       # منتجات علامة تجارية
POST   /api/v1/admin/products              # إنشاء منتج (إدارة)
PUT    /api/v1/admin/products/{id}         # تحديث منتج (إدارة)
DELETE /api/v1/admin/products/{id}         # حذف منتج (إدارة)
```

### 🛒 السلة والطلبات
```
GET    /api/v1/cart                        # محتويات السلة
POST   /api/v1/cart                        # إضافة منتج للسلة
PUT    /api/v1/cart/{id}                   # تحديث كمية منتج
DELETE /api/v1/cart/{id}                   # حذف منتج من السلة
DELETE /api/v1/cart                        # مسح السلة
GET    /api/v1/cart/summary                # ملخص السلة

POST   /api/v1/orders                       # إنشاء طلب جديد
GET    /api/v1/orders/{id}               # تفاصيل طلب
GET    /api/v1/user/orders                 # طلبات المستخدم
```

### 🏷️ الفئات والعلامات التجارية
```
GET    /api/v1/categories                  # قائمة الفئات
GET    /api/v1/categories/{slug}           # تفاصيل فئة
GET    /api/v1/brands                      # قائمة العلامات التجارية
GET    /api/v1/brands/{slug}               # تفاصيل علامة تجارية
```

### ❤️ قائمة الأمنيات
```
GET    /api/v1/wishlist                    # قائمة الأمنيات
POST   /api/v1/wishlist/{product}          # إضافة للسلة
DELETE /api/v1/wishlist/{product}          # حذف من السلة
```

### ⭐ المراجعات
```
GET    /api/v1/products/{id}/reviews       # مراجعات منتج
POST   /api/v1/products/{id}/reviews       # إضافة مراجعة
```

## التثبيت والتشغيل

### المتطلبات
- PHP 8.2+
- Composer
- MySQL/SQLite
- Node.js (لأدوات التطوير)

### خطوات التثبيت

1. **استنساخ المشروع**
```bash
git clone <repository-url>
cd backend
```

2. **تثبيت التبعيات**
```bash
composer install
```

3. **إعداد البيئة**
```bash
cp .env.example .env
php artisan key:generate
```

4. **إعداد قاعدة البيانات**
```bash
# في ملف .env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=abo_zaina
DB_USERNAME=root
DB_PASSWORD=
```

5. **تشغيل الهجرات والبذور**
```bash
php artisan migrate
php artisan db:seed
```

6. **تشغيل الخادم**
```bash
php artisan serve
```

## إعدادات البيئة

### متغيرات البيئة المهمة

```env
# قاعدة البيانات
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=abo_zaina
DB_USERNAME=root
DB_PASSWORD=

# إعدادات API
API_URL=http://localhost:8000/api/v1
FRONTEND_URL=http://localhost:3000

# إعدادات المصادقة
SANCTUM_STATEFUL_DOMAINS=localhost:3000
SESSION_DRIVER=database
SESSION_DOMAIN=localhost

# إعدادات البريد الإلكتروني
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-password
MAIL_ENCRYPTION=tls
```

## الاستخدام مع Frontend React

### إعداد CORS
```php
// config/cors.php
'allowed_origins' => ['http://localhost:3000'],
'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
'allowed_headers' => ['*'],
```

### مثال على الاستخدام في React
```javascript
// API Service
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
const addToCart = async (productId, quantity) => {
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

## الأمان

### حماية API
- **Laravel Sanctum** للمصادقة
- **CORS** للتحكم في الوصول
- **Rate Limiting** لمنع الإساءة
- **Input Validation** للتحقق من البيانات

### أفضل الممارسات
- استخدام HTTPS في الإنتاج
- تشفير البيانات الحساسة
- تحديث Laravel والتبعيات بانتظام
- مراقبة السجلات والأخطاء

## الأداء والتحسين

### تحسينات قاعدة البيانات
- **Eager Loading** لتقليل الاستعلامات
- **Database Indexing** للبحث السريع
- **Query Caching** لتخزين النتائج

### تحسينات API
- **Pagination** للنتائج الكبيرة
- **API Resources** لتنسيق البيانات
- **Response Caching** لتخزين الاستجابات

## الاختبار

### تشغيل الاختبارات
```bash
php artisan test
```

### اختبار API
```bash
# استخدام Postman أو curl
curl -X GET http://localhost:8000/api/v1/products
```

## النشر

### إعدادات الإنتاج
```bash
# تحسين الأداء
php artisan config:cache
php artisan route:cache
php artisan view:cache

# تشغيل الخادم
php artisan serve --host=0.0.0.0 --port=8000
```

### Docker (اختياري)
```dockerfile
FROM php:8.2-fpm
# إعدادات Docker...
```

## الدعم والمساهمة

### الإبلاغ عن المشاكل
- استخدم GitHub Issues
- قدم تفاصيل كاملة عن المشكلة
- أرفق سجلات الأخطاء

### المساهمة
- Fork المشروع
- إنشاء branch جديد
- إرسال Pull Request

## الترخيص

هذا المشروع مرخص تحت رخصة MIT.

---

**تم تطويره بواسطة:** فريق أبو زينة للتقنيات  
**الإصدار:** 1.0.0  
**تاريخ التحديث:** 2024