import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { settingsAPI } from "../services/api";

interface SiteSettings {
  site_name?: string;
  site_tagline?: string;
  site_favicon?: string;
  header_logo?: string;
}

interface SiteSettingsContextType {
  siteSettings: SiteSettings;
  siteName: string;
  siteTagline: string;
  siteFavicon: string;
  headerLogo: string;
  loading: boolean;
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  siteSettings: {},
  siteName: "",
  siteTagline: "",
  siteFavicon: "",
  headerLogo: "",
  loading: true,
});

export const useSiteSettings = () => useContext(SiteSettingsContext);

export const SiteSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await settingsAPI.getSettings("general");
        if (response?.data) {
          const data = response.data as SiteSettings;
          setSiteSettings(data);
        }
      } catch (e) {
        console.error("Failed to load general settings:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const siteName = siteSettings.site_name || "";
  const siteTagline = siteSettings.site_tagline || "";
  const siteFavicon = siteSettings.site_favicon || "";
  const headerLogo = siteSettings.header_logo || "";

  return (
    <SiteSettingsContext.Provider value={{ siteSettings, siteName, siteTagline, siteFavicon, headerLogo, loading }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};
