# إعداد إرسال رسائل WhatsApp تلقائياً

هناك طريقتان مجانيتان لإرسال رسائل WhatsApp تلقائياً عند إنشاء طلب جديد:

## الطريقة 1: WhatsApp Business Cloud API (موصى بها - مجاني تماماً)

### الخطوات:

1. **إنشاء حساب Meta Business:**
   - اذهب إلى [Meta Business Suite](https://business.facebook.com/)
   - أنشئ حساب Business جديد أو استخدم حساب موجود

2. **إنشاء تطبيق WhatsApp:**
   - اذهب إلى [Meta for Developers](https://developers.facebook.com/)
   - أنشئ تطبيق جديد من نوع "Business"
   - أضف منتج "WhatsApp" إلى التطبيق

3. **الحصول على Phone Number ID و Access Token:**
   - في لوحة تحكم WhatsApp، اذهب إلى "API Setup"
   - انسخ "Phone number ID" و "Temporary access token" (أو أنشئ Permanent token)

4. **إضافة الإعدادات إلى ملف `.env`:**
   ```env
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
   WHATSAPP_ACCESS_TOKEN=your_access_token_here
   ```

5. **ملاحظة:** 
   - Access Token المؤقت صالح لمدة 24 ساعة فقط
   - للحصول على Permanent Token، تحتاج إلى إكمال عملية التحقق من Meta Business

## الطريقة 2: CallMeBot (بديل بسيط)

### الخطوات:

1. **إعداد CallMeBot على هاتفك:**
   - افتح WhatsApp على هاتفك
   - أرسل رسالة إلى: `+34 603 48 87 00`
   - اكتب: `/start`
   - ستحصل على API Key (مثل: `12345678`)

2. **إضافة API Key إلى ملف `.env`:**
   ```env
   WHATSAPP_API_KEY=12345678
   WHATSAPP_USE_CALLMEBOT=true
   ```

3. **ملاحظات مهمة:**
   - هذه الطريقة ترسل الرسالة إلى رقمك فقط (الذي سجلت فيه CallMeBot)
   - مجاني تماماً لكن محدود
   - **يجب أن يكون رقم WhatsApp في إعدادات الموقع (`whatsapp_number`) مطابقاً للرقم الذي سجلت فيه CallMeBot**
   - إذا لم تحصل على API Key، جرب إرسال `/start` مرة أخرى

## الإعدادات في ملف `.env`:

```env
# WhatsApp Business Cloud API
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=

# CallMeBot (بديل)
WHATSAPP_API_KEY=
WHATSAPP_USE_CALLMEBOT=false
```

## كيف يعمل النظام:

1. عند إنشاء طلب جديد، يتم استدعاء `sendWhatsAppNotification()`
2. النظام يحاول أولاً إرسال الرسالة عبر WhatsApp Business Cloud API (إذا كانت الإعدادات موجودة)
3. إذا فشل أو لم تكن الإعدادات موجودة، يستخدم CallMeBot كبديل
4. إذا فشل كلاهما، يتم تسجيل رابط WhatsApp في السجلات للاستخدام اليدوي

## محتوى الرسالة:

الرسالة المرسلة تحتوي على:
- 🛒 طلب جديد!
- رقم الطلب
- اسم العميل
- رقم الهاتف
- المدينة
- المجموع
- طريقة الدفع
- رابط عرض التفاصيل في لوحة التحكم

## استكشاف الأخطاء:

- تحقق من السجلات في `storage/logs/laravel.log`
- تأكد من صحة Phone Number ID و Access Token
- تأكد من أن رقم WhatsApp المستلم مسجل في Meta Business
- للـ CallMeBot، تأكد من أن API Key صحيح وأنك أرسلت `/start` إلى الرقم المطلوب

## روابط مفيدة:

- [WhatsApp Business Cloud API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [CallMeBot Documentation](https://www.callmebot.com/blog/free-api-whatsapp-messages/)
- [Meta for Developers](https://developers.facebook.com/)

