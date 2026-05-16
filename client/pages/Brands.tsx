import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { brandsAPI } from "../services/api";
import SEO from "../components/SEO";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { getStorageUrl } from "../config/env";

interface Brand {
  id: number;
  name: string;
  logo?: string;
  description?: string;
  productCount?: number;
  [key: string]: unknown;
}

const BrandsPage = () => {
  const { siteName } = useSiteSettings();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBrands = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await brandsAPI.getBrands();
        console.log("Brands API response:", response);
        
        // Filter brands to show only those with at least one product
        const allBrands = response?.data || [];
        const brandsWithProducts = allBrands
          .filter((brand: any) => (brand.products_count || 0) > 0)
          .map((brand: any) => ({
            id: brand.id,
            name: brand.name,
            logo: getStorageUrl(brand.logo),
            description: brand.description,
            productCount: brand.products_count || 0,
          }));
        
        setBrands(brandsWithProducts);
      } catch (err) {
        console.error("Error loading brands:", err);
        setError("حدث خطأ أثناء تحميل الماركات. حاول مرة أخرى.");
      } finally {
        setLoading(false);
      }
    };

    loadBrands();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 arabic">
      <Header showSearch showActions />
      <SEO
        title={siteName ? `جميع الماركات - ${siteName}` : "جميع الماركات"}
        description={siteName ? `تصفح جميع الماركات المتاحة في متجر ${siteName}` : "تصفح جميع الماركات واختر من بين مجموعة متنوعة من العلامات التجارية الموثوقة"}
        keywords={`ماركات, علامات تجارية, تسوق أونلاين${siteName ? `, ${siteName}` : ''}`}

        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": siteName ? `جميع الماركات - ${siteName}` : "جميع الماركات",
            "description": siteName ? `تصفح جميع الماركات المتاحة في متجر ${siteName}` : "جميع الماركات",
            "url": typeof window !== 'undefined' ? `${window.location.origin}/brands` : ''
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "الرئيسية",
                "item": typeof window !== 'undefined' ? window.location.origin : ''
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "الماركات",
                "item": typeof window !== 'undefined' ? `${window.location.origin}/brands` : ''
              }
            ]
          }
        ]}
      />

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">جميع الماركات</h1>
          <p className="text-gray-600">
            تصفح جميع الماركات المتاحة واختر من بين مجموعة متنوعة من العلامات التجارية الموثوقة.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center text-red-600">
            {error}
          </div>
        ) : brands.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-12 text-center text-gray-500">
            لا توجد ماركات متاحة حالياً.
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                to={`/products?brand_id=${brand.id}`}
                className="flex flex-col items-center gap-3 group"
              >
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-2 border-emerald-100 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden flex items-center justify-center group-hover:border-emerald-300">
                  {brand.logo ? (
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 text-lg md:text-xl font-bold">
                      {brand.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <span className="text-sm md:text-base font-semibold text-gray-700 group-hover:text-emerald-600 transition-colors block">
                    {brand.name}
                  </span>
                  {brand.productCount !== undefined && (
                    <span className="text-xs md:text-sm text-gray-500 block mt-1">
                      {brand.productCount} منتج
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default BrandsPage;

