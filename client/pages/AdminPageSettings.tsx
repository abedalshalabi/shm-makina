import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { adminSettingsAPI } from "../services/adminApi";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Save, RefreshCw, Plus, Trash2 } from "lucide-react";
import Swal from "sweetalert2";

interface SiteSetting {
  id: number;
  key: string;
  value: any;
  type: string;
  group: string;
  description: string;
}

interface AdminPageSettingsProps {
  pageGroup: string;
  pageTitle: string;
}

const AdminPageSettings = ({ pageGroup, pageTitle }: AdminPageSettingsProps) => {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSettings();
  }, [pageGroup]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await adminSettingsAPI.getSettings(pageGroup);
      setSettings(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "فشل في تحميل الإعدادات");
      console.error("Error loading settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => prev.map(setting => 
      setting.key === key 
        ? { ...setting, value }
        : setting
    ));
  };

  const handleArrayItemChange = (key: string, index: number, field: string, value: any) => {
    const setting = settings.find(s => s.key === key);
    if (setting && Array.isArray(setting.value)) {
      const newArray = [...setting.value];
      newArray[index] = { ...newArray[index], [field]: value };
      handleSettingChange(key, newArray);
    }
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
        text: `تم حفظ إعدادات ${pageTitle} بنجاح`,
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
    switch (setting.type) {
      case 'json':
        if (Array.isArray(setting.value)) {
          // Render array of objects
          const firstItem = setting.value[0] || {};
          const keys = Object.keys(firstItem);
          
          return (
            <div className="space-y-4">
              {setting.value.map((item: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-700">عنصر #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveArrayItem(setting.key, index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {keys.map((key) => (
                    <div key={key}>
                      <Label className="text-xs text-gray-600 capitalize">{key}</Label>
                      {typeof firstItem[key] === 'object' && Array.isArray(firstItem[key]) ? (
                        <Textarea
                          value={JSON.stringify(item[key], null, 2)}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              handleArrayItemChange(setting.key, index, key, parsed);
                            } catch {
                              handleArrayItemChange(setting.key, index, key, e.target.value);
                            }
                          }}
                          rows={3}
                          className="font-mono text-xs"
                        />
                      ) : (
                        <Input
                          type="text"
                          value={item[key] || ''}
                          onChange={(e) => handleArrayItemChange(setting.key, index, key, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
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
      case 'image':
        return (
          <div className="space-y-2">
            <Input
              type="url"
              value={setting.value || ''}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            {setting.value && (
              <img 
                src={setting.value} 
                alt="Preview" 
                className="h-20 w-auto border rounded"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
          </div>
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل الإعدادات...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-6 py-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{pageTitle}</h1>
          <p className="text-gray-600">قم بتعديل محتويات {pageTitle} التي تظهر في الموقع</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="space-y-6">
              {settings.map((setting) => (
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

            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={loadSettings}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة تحميل
              </button>

              <button
                type="submit"
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPageSettings;

