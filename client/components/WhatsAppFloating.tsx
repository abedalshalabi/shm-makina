import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { settingsAPI } from "../services/api";

const isEnabled = (value: unknown): boolean =>
  value === "1" || value === 1 || value === true || value === "true";

const normalizePhone = (value: string): string => value.replace(/[^0-9]/g, "");

const WhatsAppFloating = () => {
  const [visible, setVisible] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      try {
        const [analyticsResponse, headerResponse] = await Promise.all([
          settingsAPI.getSettings("analytics"),
          settingsAPI.getSettings("header"),
        ]);

        if (!mounted) return;

        const analyticsSettings = analyticsResponse?.data || analyticsResponse || {};
        const headerSettings = headerResponse?.data || headerResponse || {};

        const canShow = isEnabled(analyticsSettings.show_whatsapp_float);
        const number = typeof headerSettings.whatsapp_number === "string"
          ? normalizePhone(headerSettings.whatsapp_number)
          : "";

        setWhatsappNumber(number);
        setVisible(canShow && !!number);
      } catch (error) {
        console.error("Failed to initialize floating WhatsApp:", error);
        if (mounted) {
          setVisible(false);
        }
      }
    };

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  if (!visible || !whatsappNumber) {
    return null;
  }

  const currentPage = typeof window !== "undefined" ? window.location.href : "";
  const message = `مرحباً، أحتاج مساعدة بخصوص الطلب. رابط الصفحة: ${currentPage}`;
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-lg transition-all hover:scale-105 hover:bg-[#1fb856]"
      aria-label="WhatsApp Chat"
      title="الدردشة عبر واتساب"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="text-sm font-semibold">واتساب</span>
    </a>
  );
};

export default WhatsAppFloating;
