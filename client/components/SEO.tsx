import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { getStorageUrl } from '../config/env';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: string;
  url?: string;
  structuredData?: object | object[];
  noindex?: boolean;
  canonical?: string;
}

const SEO = ({
  title,
  description = '',
  keywords,
  image = '/logo.webp',
  type = 'website',
  url,
  structuredData,
  noindex = false,
  canonical
}: SEOProps) => {
  const { siteName, siteFavicon } = useSiteSettings();
  const location = useLocation();

  // Handle defaults dynamically
  const displayTitle = title || (siteName ? `${siteName}` : '');
  const displayKeywords = keywords || (siteName ? `${siteName}` : '');

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const currentUrl = url || `${siteUrl}${location.pathname}${location.search}`;
  const canonicalUrl = canonical || currentUrl;
  // Ensure image URL is absolute
  let fullImageUrl = image;
  if (!image.startsWith('http')) {
    fullImageUrl = image.startsWith('/') ? `${siteUrl}${image}` : `${siteUrl}/${image}`;
  }

  useEffect(() => {
    // Update document title
    document.title = displayTitle;

    // Remove existing meta tags
    const removeMetaTag = (attribute: string, value: string) => {
      const existing = document.querySelector(`meta[${attribute}="${value}"]`);
      if (existing) {
        existing.remove();
      }
    };

    // Remove existing structured data
    const existingStructuredData = document.querySelector('script[type="application/ld+json"]');
    if (existingStructuredData) {
      existingStructuredData.remove();
    }

    // Helper to set or update meta tag
    const setMetaTag = (attribute: string, value: string, content: string) => {
      removeMetaTag(attribute, value);
      const meta = document.createElement('meta');
      meta.setAttribute(attribute, value);
      meta.setAttribute('content', content);
      document.head.appendChild(meta);
    };

    // Basic meta tags
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', displayKeywords);
    setMetaTag('name', 'viewport', 'width=device-width, initial-scale=1.0');
    setMetaTag('charset', 'charset', 'UTF-8');

    // Open Graph tags
    setMetaTag('property', 'og:title', displayTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:image', fullImageUrl);
    setMetaTag('property', 'og:image:url', fullImageUrl);
    setMetaTag('property', 'og:image:secure_url', fullImageUrl);
    setMetaTag('property', 'og:image:type', 'image/jpeg');
    setMetaTag('property', 'og:image:width', '1200');
    setMetaTag('property', 'og:image:height', '630');
    setMetaTag('property', 'og:url', currentUrl);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:locale', 'ar_SA');
    setMetaTag('property', 'og:site_name', siteName || '');

    // Logo for search engines (Google)
    setMetaTag('itemprop', 'logo', fullImageUrl);

    // Add logo link tag
    let logoLink = document.querySelector('link[rel="image_src"]') as HTMLLinkElement;
    if (!logoLink) {
      logoLink = document.createElement('link');
      logoLink.setAttribute('rel', 'image_src');
      document.head.appendChild(logoLink);
    }
    logoLink.setAttribute('href', fullImageUrl);

    // Twitter Card tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', displayTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', fullImageUrl);

    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // Robots meta
    if (noindex) {
      setMetaTag('name', 'robots', 'noindex, nofollow');
    } else {
      setMetaTag('name', 'robots', 'index, follow');
    }

    // Language and direction
    document.documentElement.setAttribute('lang', 'ar');
    document.documentElement.setAttribute('dir', 'rtl');

    // Base Structured Data (Organization and Website)
    const baseUrl = siteUrl;
    const baseStructuredData = [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        "name": siteName || "",
        "url": baseUrl,
        "logo": {
          "@type": "ImageObject",
          "url": siteFavicon ? (siteFavicon.startsWith('http') ? siteFavicon : `${baseUrl}${siteFavicon}`) : `${baseUrl}/logo.webp`,
          "width": "512",
          "height": "512"
        },
        "image": siteFavicon ? (siteFavicon.startsWith('http') ? siteFavicon : `${baseUrl}${siteFavicon}`) : `${baseUrl}/logo.webp`,
        "sameAs": []
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        "name": siteName || "",
        "url": baseUrl,
        "publisher": {
          "@id": `${baseUrl}/#organization`
        }
      }
    ];

    // Add structured data (support both single object and array)
    if (structuredData || baseStructuredData) {
      // Remove all existing structured data scripts
      const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
      existingScripts.forEach(script => script.remove());

      // Merge user structured data with base data
      const dataArray = Array.isArray(structuredData) ? structuredData : (structuredData ? [structuredData] : []);
      const finalDataArray = [...baseStructuredData, ...dataArray];

      finalDataArray.forEach((data) => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(data);
        document.head.appendChild(script);
      });
    }
    // Update Favicon
    if (siteFavicon) {
      const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
      const favicon = document.querySelector('link[rel="icon"]');
      
      const fullFaviconUrl = getStorageUrl(siteFavicon);
      
      if (appleTouchIcon) appleTouchIcon.setAttribute('href', fullFaviconUrl);
      if (favicon) favicon.setAttribute('href', fullFaviconUrl);
    }
  }, [displayTitle, description, displayKeywords, image, type, currentUrl, canonicalUrl, fullImageUrl, structuredData, noindex, siteName, siteFavicon]);

  return null;
};

export default SEO;

