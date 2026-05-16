import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { adminSettingsAPI } from "../services/adminApi";
import { getStorageUrl } from "../config/env";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Save, RefreshCw, Plus, Trash2, Upload, X } from "lucide-react";
import Swal from "sweetalert2";

// Array Item Editor Component
interface ArrayItemEditorProps {
  settingKey: string;
  item: any;
  itemIndex: number;
  keys: string[];
  onItemChange: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
}

const ArrayItemEditor = ({ settingKey, item, itemIndex, keys, onItemChange, onRemove }: ArrayItemEditorProps) => {
  const isHeaderBottomNavLink = settingKey === 'header_bottom_nav_links';
  const isVisible = item.show === '1' || item.show === 1 || item.show === true || item.show === 'true';

  const getFieldLabel = (key: string) => {
    if (!isHeaderBottomNavLink) return key;

    switch (key) {
      case 'title':
        return 'النص الظاهر';
      case 'link':
        return 'الرابط';
      case 'show':
        return 'حالة الظهور';
      default:
        return key;
    }
  };

  const getFieldHint = (key: string) => {
    if (!isHeaderBottomNavLink) return '';

    switch (key) {
      case 'title':
        return 'مثال: المنتجات';
      case 'link':
        return 'مثال: /products';
      case 'show':
        return isVisible ? 'هذا الرابط ظاهر حالياً في الهيدر.' : 'هذا الرابط مخفي حالياً من الهيدر.';
      default:
        return '';
    }
  };

  return (
    <div
      className={`space-y-4 rounded-2xl border p-4 ${isHeaderBottomNavLink ? 'border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50/70 shadow-sm' : 'border-gray-200 bg-white'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="inline-flex items-center rounded-full border border-emerald-100 bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
            {isHeaderBottomNavLink ? `رابط الهيدر ${itemIndex + 1}` : `عنصر ${itemIndex + 1}`}
          </span>
          {isHeaderBottomNavLink && (
            <p className="text-sm text-gray-500">
              عدّل النص والرابط وحدد هل تريد إظهاره أو إخفاءه.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onRemove(itemIndex)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
          title="حذف العنصر"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className={isHeaderBottomNavLink ? 'grid gap-4 md:grid-cols-2' : 'space-y-3'}>
        {keys.map((key) => {
          const isImageField = key.toLowerCase().includes('image') ||
            key.toLowerCase().includes('photo') ||
            key.toLowerCase().includes('picture') ||
            key.toLowerCase().includes('avatar') ||
            (typeof item[key] === 'string' && (
              item[key].startsWith('http://') ||
              item[key].startsWith('https://') ||
              item[key].startsWith('/storage/') ||
              item[key].match(/\.(jpg|jpeg|png|gif|webp)$/i)
            ));

          return (
            <div
              key={key}
              className={isHeaderBottomNavLink && key === 'show' ? 'md:col-span-2' : undefined}
            >
              <Label className="text-sm font-semibold text-gray-700 capitalize">
                {getFieldLabel(key)}
              </Label>
              {getFieldHint(key) && (
                <p className="mt-1 mb-2 text-xs text-gray-500">{getFieldHint(key)}</p>
              )}
              {isImageField ? (
                <ImageUploadInput
                  setting={{ key: settingKey } as SiteSetting}
                  value={item[key] || ''}
                  onChange={(value) => onItemChange(itemIndex, key, value)}
                  onFileUpload={async (file) => {
                    try {
                      const response = await adminSettingsAPI.uploadImageGeneral(file);
                      if (response.data?.value) {
                        onItemChange(itemIndex, key, response.data.value);
                        Swal.fire({
                          icon: 'success',
                          title: 'تم!',
                          text: 'تم رفع الصورة بنجاح',
                          toast: true,
                          position: 'top-end',
                          showConfirmButton: false,
                          timer: 2000,
                        });
                      }
                    } catch (error: any) {
                      Swal.fire({
                        icon: 'error',
                        title: 'خطأ!',
                        text: error.response?.data?.message || 'فشل في رفع الصورة',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 3000,
                      });
                    }
                  }}
                />
              ) : typeof item[key] === 'object' && Array.isArray(item[key]) ? (
                <Textarea
                  value={JSON.stringify(item[key], null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      onItemChange(itemIndex, key, parsed);
                    } catch {
                      onItemChange(itemIndex, key, e.target.value);
                    }
                  }}
                  rows={3}
                  className="font-mono text-xs"
                />
              ) : settingKey === 'header_bottom_nav_links' && key === 'show' ? (
                <div className="rounded-2xl border border-emerald-100 bg-white p-3 sm:p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex w-full sm:w-auto rounded-xl border border-emerald-100 bg-emerald-50 p-1">
                      <button
                        type="button"
                        onClick={() => onItemChange(itemIndex, key, '1')}
                        className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all sm:flex-none ${
                          item[key] === '1' || item[key] === 1 || item[key] === true || item[key] === 'true'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-white'
                        }`}
                      >
                        إظهار
                      </button>
                      <button
                        type="button"
                        onClick={() => onItemChange(itemIndex, key, '0')}
                        className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all sm:flex-none ${
                          item[key] === '0' || item[key] === 0 || item[key] === false || item[key] === 'false'
                            ? 'bg-rose-500 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-white'
                        }`}
                      >
                        إخفاء
                      </button>
                    </div>
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-semibold ${
                        item[key] === '1' || item[key] === 1 || item[key] === true || item[key] === 'true'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {item[key] === '1' || item[key] === 1 || item[key] === true || item[key] === 'true'
                        ? 'ظاهر حالياً'
                        : 'مخفي حالياً'}
                    </span>
                  </div>
                </div>
              ) : (
                <Input
                  type="text"
                  value={item[key] || ''}
                  onChange={(e) => onItemChange(itemIndex, key, e.target.value)}
                  placeholder={getFieldHint(key)}
                  className={isHeaderBottomNavLink ? 'h-11 rounded-xl border-gray-200 bg-white' : undefined}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Image Upload Component
interface ImageUploadInputProps {
  setting: SiteSetting;
  value: string;
  onChange: (value: string) => void;
  onFileUpload: (file: File) => Promise<void>;
}

const ImageUploadInput = ({ setting, value, onChange, onFileUpload }: ImageUploadInputProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'خطأ!',
        text: 'يرجى اختيار ملف صورة',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'خطأ!',
        text: 'حجم الملف يجب ألا يتجاوز 10 ميجابايت',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    try {
      await onFileUpload(file);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* URL Input */}
      <div>
        <Label className="text-xs text-gray-600 mb-1 block">أو أدخل رابط URL:</Label>
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="أدخل رابطاً أو ارفع صورة"
          disabled={uploading}
        />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="text-xs text-gray-500">أو</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      {/* File Upload */}
      <div>
        <Label className="text-xs text-gray-600 mb-1 block">رفع صورة جديدة:</Label>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id={`file-upload-${setting.key}`}
          />
          <label
            htmlFor={`file-upload-${setting.key}`}
            className={`flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            <Upload className="w-4 h-4" />
            <span className="text-sm">{uploading ? 'جاري الرفع...' : 'اختر صورة'}</span>
          </label>
        </div>
      </div>

      {/* Preview */}
      {(preview || value) && (
        <div className="relative inline-block">
          <img
            src={getStorageUrl(preview || value)}
            alt="Preview"
            className="h-32 w-auto border rounded-lg shadow-sm max-w-full"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
            onLoad={() => {
              // Clear preview after image loads (it's already saved)
              if (preview && value) {
                setTimeout(() => setPreview(null), 1000);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

// Simple WYSIWYG editor for rich text settings
interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

const RichTextEditor = ({ value, onChange }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const exec = (cmd: string) => {
    document.execCommand(cmd, false);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 rounded-md border border-gray-200 bg-gray-50 p-2">
        <button type="button" className="px-2 py-1 text-sm font-semibold rounded hover:bg-white" onClick={() => exec("bold")}>B</button>
        <button type="button" className="px-2 py-1 text-sm font-semibold italic rounded hover:bg-white" onClick={() => exec("italic")}>I</button>
        <button type="button" className="px-2 py-1 text-sm font-semibold underline rounded hover:bg-white" onClick={() => exec("underline")}>U</button>
        <button type="button" className="px-2 py-1 text-sm font-semibold rounded hover:bg-white" onClick={() => exec("insertUnorderedList")}>• قائمة</button>
      </div>
      <div
        ref={editorRef}
        className="min-h-[160px] w-full rounded-md border border-gray-200 bg-white p-3 text-sm leading-relaxed"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
      />
    </div>
  );
};

interface SiteSetting {
  id: number;
  key: string;
  value: any;
  type: string;
  group: string;
  description: string;
}

interface Tab {
  id: string;
  label: string;
  group: string;
}

const HOMEPAGE_SECTION_LABELS: Record<string, string> = {
  hero_slider: 'السلايدر الرئيسي',
  main_categories: 'التصنيفات الرئيسية',
  brand_categories: 'قسم الماركات',
  featured_offers: 'العروض المميزة',
  latest_products: 'أحدث المنتجات',
  newsletter: 'النشرة البريدية',
  homepage_features: 'بطاقات المزايا',
};

const tabs: Tab[] = [
  { id: 'general', label: 'الإعدادات العامة', group: 'general' },
  { id: 'header', label: 'Header', group: 'header' },
  { id: 'footer', label: 'تذييل الصفحة', group: 'footer' },
  { id: 'seo', label: 'SEO وتهيئة محركات البحث', group: 'seo' },
  { id: 'about', label: 'من نحن', group: 'about' },
  { id: 'contact', label: 'اتصل بنا', group: 'contact' },
  { id: 'shipping', label: 'الشحن والتوصيل', group: 'shipping' },
  { id: 'returns', label: 'الإرجاع والاستبدال', group: 'returns' },
  { id: 'warranty', label: 'الضمان', group: 'warranty' },
  { id: 'notifications', label: 'إشعارات الطلبات', group: 'notifications' },
  { id: 'analytics', label: 'الإحصائيات والعدادات', group: 'analytics' },
];

const AdminSiteSettings = () => {
  const location = useLocation();
  
  // Synchronously compute initial tab to prevent race conditions during fetch
  const initialHash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
  const initialTab = (initialHash && tabs.find(t => t.id === initialHash)) ? initialHash : 'general';
  
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Update tab when hash changes in URL (from sidebar navigation)
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && tabs.find(t => t.id === hash)) {
      setActiveTab(hash);
    } else if (!hash && location.pathname === '/admin/site-settings') {
      // Default to general if no hash
      setActiveTab('general');
      window.history.replaceState(null, '', '#general');
    }
  }, [location.hash, location.pathname]);

  useEffect(() => {
    loadSettings();
  }, [activeTab]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");
      const currentTab = tabs.find(t => t.id === activeTab);
      if (currentTab) {
        const response = await adminSettingsAPI.getSettings(currentTab.group);
        setSettings(response.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "فشل في تحميل الإعدادات");
      console.error("Error loading settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => prev.map(setting =>
      setting.key === key ? { ...setting, value } : setting
    ));
  };

  const handleArrayItemChange = (key: string, index: number, field: string, value: any) => {
    setSettings(prev => {
      const setting = prev.find(s => s.key === key);
      if (setting && Array.isArray(setting.value) && index >= 0 && index < setting.value.length) {
        const newArray = [...setting.value];
        newArray[index] = { ...newArray[index], [field]: value };
        return prev.map(s => s.key === key ? { ...s, value: newArray } : s);
      }
      return prev;
    });
  };

  const handleAddArrayItem = (key: string, defaultItem: any) => {
    const setting = settings.find(s => s.key === key);
    if (setting && Array.isArray(setting.value)) {
      handleSettingChange(key, [...setting.value, defaultItem]);
    }
  };

  const handleRemoveArrayItem = (key: string, index: number) => {
    const setting = settings.find(s => s.key === key);
    if (setting && Array.isArray(setting.value)) {
      const newArray = setting.value.filter((_: any, i: number) => i !== index);
      handleSettingChange(key, newArray);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      const settingsToUpdate = settings.map(setting => ({
        key: setting.key,
        value: setting.value
      }));

      await adminSettingsAPI.bulkUpdate(settingsToUpdate);

      Swal.fire({
        icon: 'success',
        title: 'تم بنجاح!',
        text: 'تم حفظ الإعدادات بنجاح',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });

      await loadSettings();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "فشل في حفظ الإعدادات";
      setError(errorMessage);

      Swal.fire({
        icon: 'error',
        title: 'خطأ!',
        text: errorMessage,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const renderSettingInput = (setting: SiteSetting) => {
    // Allow rich/long text editing for the story content
    if (setting.key === 'about_story_content') {
      return (
        <RichTextEditor
          value={setting.value || ''}
          onChange={(html) => handleSettingChange(setting.key, html)}
        />
      );
    }

    switch (setting.type) {
      case 'json':
        if (
          setting.key === 'homepage_section_visibility' &&
          setting.value &&
          typeof setting.value === 'object' &&
          !Array.isArray(setting.value)
        ) {
          const sectionVisibility = setting.value as Record<string, boolean | string | number>;

          const updateSectionVisibility = (sectionKey: string, isVisible: boolean) => {
            handleSettingChange(setting.key, {
              ...sectionVisibility,
              [sectionKey]: isVisible,
            });
          };

          return (
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(sectionVisibility).map(([sectionKey, value]) => {
                const isVisible =
                  value === true ||
                  value === 1 ||
                  value === '1' ||
                  value === 'true';

                return (
                  <div
                    key={sectionKey}
                    className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/70 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800">
                          {HOMEPAGE_SECTION_LABELS[sectionKey] || sectionKey}
                        </h4>
                        <p className="mt-1 text-xs text-gray-500">
                          {isVisible ? 'القسم ظاهر الآن في الصفحة الرئيسية.' : 'القسم مخفي الآن من الصفحة الرئيسية.'}
                        </p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          isVisible ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'
                        }`}
                      >
                        {isVisible ? 'ظاهر' : 'مخفي'}
                      </span>
                    </div>

                    <div className="mt-4 flex rounded-xl border border-emerald-100 bg-white p-1">
                      <button
                        type="button"
                        onClick={() => updateSectionVisibility(sectionKey, true)}
                        className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                          isVisible ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:bg-emerald-50'
                        }`}
                      >
                        إظهار
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSectionVisibility(sectionKey, false)}
                        className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                          !isVisible ? 'bg-rose-500 text-white shadow-sm' : 'text-gray-600 hover:bg-rose-50'
                        }`}
                      >
                        إخفاء
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }

        // Special handling for header_menu_items (object with nested arrays)
        if (setting.key === 'header_menu_items' && setting.value && typeof setting.value === 'object' && !Array.isArray(setting.value)) {
          const menuItems = setting.value as { main_pages?: Array<{ title: string; link: string }>, customer_service?: Array<{ title: string; link: string }>, account?: Array<{ title: string; link: string }> };

          const updateMenuSection = (section: string, index: number, field: string, value: string) => {
            const currentValue = setting.value as any;
            const sectionArray = currentValue[section] || [];
            const newArray = [...sectionArray];
            newArray[index] = { ...newArray[index], [field]: value };
            handleSettingChange(setting.key, { ...currentValue, [section]: newArray });
          };

          const addMenuSectionItem = (section: string) => {
            const currentValue = setting.value as any;
            const sectionArray = currentValue[section] || [];
            handleSettingChange(setting.key, {
              ...currentValue,
              [section]: [...sectionArray, { title: '', link: '' }]
            });
          };

          const removeMenuSectionItem = (section: string, index: number) => {
            const currentValue = setting.value as any;
            const sectionArray = currentValue[section] || [];
            handleSettingChange(setting.key, {
              ...currentValue,
              [section]: sectionArray.filter((_: any, i: number) => i !== index)
            });
          };

          return (
            <div className="space-y-6">
              {/* Main Pages */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">الصفحات الرئيسية</h4>
                <div className="space-y-3">
                  {(menuItems.main_pages || []).map((item, index) => (
                    <div key={`main_pages-${index}`} className="flex gap-2">
                      <Input
                        type="text"
                        value={item.title || ''}
                        onChange={(e) => updateMenuSection('main_pages', index, 'title', e.target.value)}
                        placeholder="العنوان"
                        className="flex-1"
                      />
                      <Input
                        type="text"
                        value={item.link || ''}
                        onChange={(e) => updateMenuSection('main_pages', index, 'link', e.target.value)}
                        placeholder="الرابط (مثال: /products)"
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeMenuSectionItem('main_pages', index)}
                        className="text-red-600 hover:text-red-800 p-2"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addMenuSectionItem('main_pages')}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-2 text-gray-600 hover:border-emerald-500 hover:text-emerald-600 flex items-center justify-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة صفحة رئيسية
                  </button>
                </div>
              </div>

              {/* Customer Service */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">خدمة العملاء</h4>
                <div className="space-y-3">
                  {(menuItems.customer_service || []).map((item, index) => (
                    <div key={`customer_service-${index}`} className="flex gap-2">
                      <Input
                        type="text"
                        value={item.title || ''}
                        onChange={(e) => updateMenuSection('customer_service', index, 'title', e.target.value)}
                        placeholder="العنوان"
                        className="flex-1"
                      />
                      <Input
                        type="text"
                        value={item.link || ''}
                        onChange={(e) => updateMenuSection('customer_service', index, 'link', e.target.value)}
                        placeholder="الرابط (مثال: /about)"
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeMenuSectionItem('customer_service', index)}
                        className="text-red-600 hover:text-red-800 p-2"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addMenuSectionItem('customer_service')}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-2 text-gray-600 hover:border-emerald-500 hover:text-emerald-600 flex items-center justify-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة عنصر خدمة عملاء
                  </button>
                </div>
              </div>

              {/* Account */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">الحساب</h4>
                <div className="space-y-3">
                  {(menuItems.account || []).map((item, index) => (
                    <div key={`account-${index}`} className="flex gap-2">
                      <Input
                        type="text"
                        value={item.title || ''}
                        onChange={(e) => updateMenuSection('account', index, 'title', e.target.value)}
                        placeholder="العنوان"
                        className="flex-1"
                      />
                      <Input
                        type="text"
                        value={item.link || ''}
                        onChange={(e) => updateMenuSection('account', index, 'link', e.target.value)}
                        placeholder="الرابط (مثال: /login)"
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeMenuSectionItem('account', index)}
                        className="text-red-600 hover:text-red-800 p-2"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addMenuSectionItem('account')}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-2 text-gray-600 hover:border-emerald-500 hover:text-emerald-600 flex items-center justify-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة عنصر حساب
                  </button>
                </div>
              </div>
            </div>
          );
        }

        if (Array.isArray(setting.value)) {
          if (setting.key === 'order_notification_admin_emails') {
            return (
              <div className="space-y-3">
                {(setting.value as string[]).map((item: string, index: number) => (
                  <div key={`${setting.key}-${index}`} className="flex items-center gap-2">
                    <Input
                      type="email"
                      value={item || ''}
                      onChange={(e) => {
                        const newArray = [...setting.value];
                        newArray[index] = e.target.value;
                        handleSettingChange(setting.key, newArray);
                      }}
                      placeholder="admin@example.com"
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveArrayItem(setting.key, index)}
                      className="text-red-600 hover:text-red-800 p-2"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddArrayItem(setting.key, '')}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-emerald-500 hover:text-emerald-600 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  إضافة إيميل أدمن
                </button>
                <p className="text-xs text-gray-500">
                  سيصل بريد الطلب الجديد إلى الزبون وإلى جميع الإيميلات المضافة هنا.
                </p>
              </div>
            );
          }

          // Check if it's an array of strings (like contact_subjects)
          const isStringArray = setting.value.length > 0 && typeof setting.value[0] === 'string';

          if (isStringArray) {
            // Render array of strings with simple input fields
            return (
              <div className="space-y-3">
                {setting.value.map((item: string, index: number) => (
                  <div key={`${setting.key}-${index}`} className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={item || ''}
                      onChange={(e) => {
                        const newArray = [...setting.value];
                        newArray[index] = e.target.value;
                        handleSettingChange(setting.key, newArray);
                      }}
                      placeholder={`عنصر ${index + 1}`}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveArrayItem(setting.key, index)}
                      className="text-red-600 hover:text-red-800 p-2"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddArrayItem(setting.key, '')}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-emerald-500 hover:text-emerald-600 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  إضافة عنصر جديد
                </button>
              </div>
            );
          }

          // It's an array of objects - use ArrayItemEditor
          const firstItem = setting.value[0] || {};
          const keys = Object.keys(firstItem);

          return (
            <div className="space-y-4">
              {setting.value.map((item: any, index: number) => (
                <ArrayItemEditor
                  key={`${setting.key}-${index}`}
                  settingKey={setting.key}
                  item={item}
                  itemIndex={index}
                  keys={keys}
                  onItemChange={(idx, field, value) => handleArrayItemChange(setting.key, idx, field, value)}
                  onRemove={(idx) => handleRemoveArrayItem(setting.key, idx)}
                />
              ))}
              <button
                type="button"
                onClick={() => handleAddArrayItem(setting.key, firstItem)}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-emerald-500 hover:text-emerald-600 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                إضافة عنصر جديد
              </button>
            </div>
          );
        }

        return (
          <Textarea
            value={typeof setting.value === 'string' ? setting.value : JSON.stringify(setting.value, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleSettingChange(setting.key, parsed);
              } catch {
                handleSettingChange(setting.key, e.target.value);
              }
            }}
            rows={8}
            className="font-mono text-sm"
            placeholder="JSON format"
          />
        );
      case 'toggle':
        const isEnabled = setting.value === '1' || setting.value === 1 || setting.value === 'true' || setting.value === true;
        return (
          <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="flex bg-white rounded-md border border-gray-300 p-1">
              <button
                type="button"
                onClick={() => handleSettingChange(setting.key, '1')}
                className={`px-4 py-1.5 rounded text-sm font-medium transition-all ${isEnabled
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'}`}
              >
                إظهار
              </button>
              <button
                type="button"
                onClick={() => handleSettingChange(setting.key, '0')}
                className={`px-4 py-1.5 rounded text-sm font-medium transition-all ${!isEnabled
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'}`}
              >
                إخفاء
              </button>
            </div>
            <span className={`text-sm font-medium ${isEnabled ? 'text-green-600' : 'text-red-600'}`}>
              {isEnabled ? 'مفعل حالياً' : 'معطل حالياً'}
            </span>
          </div>
        );
      case 'image':
        return (
          <ImageUploadInput
            setting={setting}
            value={setting.value || ''}
            onChange={(value) => handleSettingChange(setting.key, value)}
            onFileUpload={async (file) => {
              try {
                const response = await adminSettingsAPI.uploadImage(setting.key, file);
                if (response.data && response.data.value) {
                  handleSettingChange(setting.key, response.data.value);
                  Swal.fire({
                    icon: 'success',
                    title: 'تم!',
                    text: 'تم رفع الصورة بنجاح',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000,
                  });
                }
              } catch (error: any) {
                Swal.fire({
                  icon: 'error',
                  title: 'خطأ!',
                  text: error.response?.data?.message || 'فشل في رفع الصورة',
                  toast: true,
                  position: 'top-end',
                  showConfirmButton: false,
                  timer: 3000,
                });
              }
            }}
          />
        );
      default:
        return (
          <Input
            type="text"
            value={setting.value || ''}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            placeholder={setting.description}
          />
        );
    }
  };

  const getOrderedSettings = (items: SiteSetting[]) => {
    if (activeTab !== 'general') {
      return items;
    }

    const priority: Record<string, number> = {
      site_name: 1,
      header_logo: 2,
      site_logo: 2,
      site_favicon: 3,
      homepage_section_visibility: 4,
    };

    return [...items].sort((a, b) => {
      const aPriority = priority[a.key] ?? 999;
      const bPriority = priority[b.key] ?? 999;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      return 0;
    });
  };
  const currentTab = tabs.find(t => t.id === activeTab);

  return (
    <AdminLayout>
      <div className="px-6 py-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">إعدادات الموقع</h1>
          <p className="text-gray-600">قم بتعديل محتويات صفحات الموقع</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-wrap border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  window.location.hash = tab.id;
                }}
                className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                  ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-gray-600">جاري تحميل الإعدادات...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="mb-4 pb-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">
                  {currentTab?.label || 'الإعدادات'}
                </h2>
              </div>

              <div className="space-y-6">
                {settings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد إعدادات متاحة لهذه الصفحة
                  </div>
                ) : (
                  (() => {
                    // Separate settings into groups for better organization
                    const contactSettings = settings.filter(s =>
                      s.key === 'header_phone' || s.key === 'header_email'
                    );
                    const socialSettings = settings.filter(s =>
                      s.key.startsWith('social_media_') || s.key === 'whatsapp_number'
                    );
                    const otherSettings = getOrderedSettings(settings.filter(s =>
                      !contactSettings.includes(s) && !socialSettings.includes(s)
                    ));

                    return (
                      <>
                        {/* Social Media Section */}
                        {(socialSettings.length > 0 || contactSettings.length > 0) && (
                          <div className="space-y-6 pb-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800">وسائل التواصل الاجتماعي</h3>
                            {socialSettings.map((setting) => (
                              <div key={setting.id} className="space-y-2">
                                <Label htmlFor={setting.key} className="text-sm font-medium text-gray-700">
                                  {setting.description || setting.key}
                                  {setting.type === 'json' && (
                                    <span className="text-xs text-gray-500 block mt-1">
                                      {Array.isArray(setting.value) ? '(مصفوفة)' : '(JSON Format)'}
                                    </span>
                                  )}
                                </Label>
                                {renderSettingInput(setting)}
                              </div>
                            ))}

                            {/* Contact Info at the bottom of social media section */}
                            {contactSettings.length > 0 && (
                              <>
                                <div className="pt-4 mt-4 border-t border-gray-200">
                                  <h4 className="text-sm font-medium text-gray-600 mb-4">معلومات الاتصال</h4>
                                  {contactSettings.map((setting) => (
                                    <div key={setting.id} className="space-y-2">
                                      <Label htmlFor={setting.key} className="text-sm font-medium text-gray-700">
                                        {setting.description || setting.key}
                                        {setting.type === 'json' && (
                                          <span className="text-xs text-gray-500 block mt-1">
                                            {Array.isArray(setting.value) ? '(مصفوفة)' : '(JSON Format)'}
                                          </span>
                                        )}
                                      </Label>
                                      {renderSettingInput(setting)}
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {/* Other Settings */}
                        {otherSettings.length > 0 && (
                          <div className="space-y-6">
                            {otherSettings.map((setting) => (
                              <div key={setting.id} className="space-y-2">
                                <Label htmlFor={setting.key} className="text-sm font-medium text-gray-700">
                                  {setting.description || setting.key}
                                  {setting.type === 'json' && (
                                    <span className="text-xs text-gray-500 block mt-1">
                                      {Array.isArray(setting.value) ? '(مصفوفة)' : '(JSON Format)'}
                                    </span>
                                  )}
                                </Label>
                                {renderSettingInput(setting)}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()
                )}
              </div>

              <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={loadSettings}
                  disabled={saving || loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  إعادة تحميل
                </button>

                <button
                  type="submit"
                  disabled={saving || loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSiteSettings;
