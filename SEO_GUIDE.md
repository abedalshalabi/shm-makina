# دليل تحسين محركات البحث (SEO)

تم تحسين الموقع ليكون SEO-friendly مع الميزات التالية:

## الميزات المضافة

### 1. SEO Component (`client/components/SEO.tsx`)
مكون React لإدارة meta tags ديناميكياً لكل صفحة.

**الاستخدام:**
```tsx
import SEO from "../components/SEO";

<SEO
  title="عنوان الصفحة"
  description="وصف الصفحة"
  keywords="كلمات مفتاحية"
  image="/path/to/image.jpg"
  type="website" // أو "product", "article", إلخ
  url="https://your-domain.com/page"
  structuredData={structuredDataObject}
  noindex={false} // true لإخفاء الصفحة من محركات البحث
  canonical="https://your-domain.com/canonical-url"
/>
```

### 2. Structured Data (JSON-LD)
تم إضافة structured data للصفحات الرئيسية:
- **الصفحة الرئيسية**: Store schema
- **صفحة المنتج**: Product schema مع ratings و offers
- **صفحة المنتجات**: CollectionPage schema
- **صفحة من نحن**: AboutPage schema
- **صفحة اتصل بنا**: ContactPage schema مع Organization

### 3. Meta Tags
- Open Graph tags للمشاركة على Facebook
- Twitter Card tags للمشاركة على Twitter
- Canonical URLs لمنع المحتوى المكرر
- Robots meta tags للتحكم في الفهرسة

### 4. Sitemap.xml
تم إنشاء `public/sitemap.xml` مع جميع الصفحات الرئيسية.

**ملاحظة:** يجب تحديث `https://your-domain.com` في الملفات التالية:
- `public/sitemap.xml`
- `public/robots.txt`

### 5. Robots.txt
تم تحسين `public/robots.txt` مع:
- السماح لجميع محركات البحث
- منع فهرسة صفحات الإدارة والخصوصية
- إضافة reference إلى sitemap

### 6. تحسينات HTML
- إضافة meta tags أساسية في `index.html`
- Language و direction attributes
- Theme color

## الصفحات التي تم تحسينها

✅ الصفحة الرئيسية (`Index.tsx`)
✅ صفحة المنتج (`Product.tsx`)
✅ صفحة المنتجات (`Products.tsx`)
✅ صفحة من نحن (`About.tsx`)
✅ صفحة اتصل بنا (`Contact.tsx`)

## الخطوات التالية

1. **تحديث URLs في sitemap.xml و robots.txt**:
   - استبدل `https://your-domain.com` بالـ domain الفعلي

2. **إضافة alt tags للصور**:
   - تأكد من أن جميع الصور تحتوي على `alt` attributes وصفية

3. **تحسين سرعة الموقع**:
   - استخدم lazy loading للصور
   - قم بضغط الصور
   - استخدم CDN إذا أمكن

4. **إضافة Google Analytics و Search Console**:
   - أضف Google Analytics tracking code
   - سجل الموقع في Google Search Console

5. **إنشاء sitemap ديناميكي**:
   - يمكن إنشاء sitemap ديناميكي من API بدلاً من الملف الثابت

6. **إضافة breadcrumbs structured data**:
   - يمكن إضافة BreadcrumbList schema للتنقل

## اختبار SEO

استخدم الأدوات التالية لاختبار SEO:
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Google Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Schema Markup Validator](https://validator.schema.org/)

## ملاحظات مهمة

- تأكد من أن جميع الصور لها `alt` attributes
- استخدم headings hierarchy صحيح (h1 → h2 → h3)
- أضف internal linking بين الصفحات ذات الصلة
- استخدم descriptive URLs
- أضف meta descriptions فريدة لكل صفحة

