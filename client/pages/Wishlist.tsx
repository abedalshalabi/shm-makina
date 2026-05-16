import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Trash2 } from "lucide-react";
import Header from "../components/Header";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { productsAPI, wishlistAPI } from "../services/api";

interface WishlistProduct {
  id: number;
  name: string;
  price: number;
  original_price?: number;
  compare_price?: number;
  discount_percentage?: number;
  has_variants?: boolean;
  has_price_range?: boolean;
  brand?: {
    name: string;
  };
  cover_image?: string;
  images?: Array<{
    image_url?: string;
    image_path?: string;
  }>;
  variants?: Array<{
    id?: number;
    price?: number | string | null;
  }>;
}

const formatPrice = (price: number | string) => {
  const numericPrice = typeof price === "number" ? price : Number(price);
  if (Number.isNaN(numericPrice)) return String(price);

  return Number.isInteger(numericPrice) ? numericPrice.toString() : numericPrice.toFixed(2);
};

const getWishlistPriceInfo = (item: WishlistProduct) => {
  const basePrice = Number(item.price || 0);
  const comparePrice = Number(item.compare_price || item.original_price || 0);
  const discountPercentage = Number(item.discount_percentage || 0);
  const variantPrices = Array.isArray(item.variants)
    ? item.variants
        .map((variant) => Number(variant.price || 0))
        .filter((price) => price > 0)
    : [];

  if (variantPrices.length > 0) {
    const minBasePrice = Math.min(...variantPrices);
    const maxBasePrice = Math.max(...variantPrices);
    const minFinalPrice = discountPercentage > 0
      ? Number((minBasePrice * (1 - discountPercentage / 100)).toFixed(2))
      : minBasePrice;
    const maxFinalPrice = discountPercentage > 0
      ? Number((maxBasePrice * (1 - discountPercentage / 100)).toFixed(2))
      : maxBasePrice;

    return {
      finalPrice: minFinalPrice,
      originalPrice: minBasePrice,
      priceLabel:
        minFinalPrice === maxFinalPrice
          ? `${formatPrice(minFinalPrice)} ₪`
          : `ابتداءً من ${formatPrice(minFinalPrice)} ₪`,
      originalPriceLabel:
        discountPercentage > 0
          ? (
            minBasePrice === maxBasePrice
              ? `${formatPrice(minBasePrice)} ₪`
              : `ابتداءً من ${formatPrice(minBasePrice)} ₪`
          )
          : null,
      hasDiscount: discountPercentage > 0,
    };
  }

  const finalPrice = discountPercentage > 0
    ? Number((basePrice * (1 - discountPercentage / 100)).toFixed(2))
    : basePrice;
  const originalPrice = comparePrice > finalPrice ? comparePrice : basePrice;
  const hasDiscount = discountPercentage > 0 || comparePrice > finalPrice;

  return {
    finalPrice,
    originalPrice,
    priceLabel: `${formatPrice(finalPrice)} ₪`,
    originalPriceLabel: hasDiscount ? `${formatPrice(originalPrice)} ₪` : null,
    hasDiscount,
  };
};

const Wishlist = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { wishlistIds, toggleWishlist, wishlistProcessing, setWishlistIds } = useWishlist();
  const { addItem } = useCart();
  const [items, setItems] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWishlist = async () => {
      try {
        setLoading(true);

        if (token) {
          const response = await wishlistAPI.getWishlist(token);
          const productsResponse = Array.isArray(response?.data) ? response.data : [];
          setItems(productsResponse);
          // Sync wishlist IDs from context after API load to ensure consistency
          const validIds = productsResponse.map((p: any) => p.id);
          setWishlistIds(validIds);
          return;
        }

        if (wishlistIds.length === 0) {
          setItems([]);
          return;
        }

        const responses = await Promise.all(
          wishlistIds.map((id) => productsAPI.getProduct(id, true).catch(() => null))
        );

        const products = responses
          .map((response) => response?.data ?? null)
          .filter((item): item is WishlistProduct => item !== null);

        setItems(products);

        // Update wishlist IDs in context if some products failed to load (e.g. deleted)
        const validIds = products.map(p => p.id);
        if (validIds.length !== wishlistIds.length) {
          setWishlistIds(validIds);
        }
      } catch (error) {
        console.error("Error loading wishlist page:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, [token, wishlistIds.length]); // Use length as dependency to avoid infinite loops

  useEffect(() => {
    setItems((prev) => prev.filter((item) => wishlistIds.includes(item.id)));
  }, [wishlistIds]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 arabic">
        <Header showSearch={true} showActions={true} />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل المفضلة...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 arabic">
        <Header showSearch={true} showActions={true} />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="text-8xl mb-6">❤</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">المفضلة فارغة</h1>
            <p className="text-gray-600 mb-8">لم تقم بإضافة أي منتجات إلى المفضلة بعد</p>
            <Link
              to="/products"
              className="bg-brand-blue text-white px-8 py-3 rounded-lg hover:bg-emerald-700 transition-colors inline-flex items-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              تصفح المنتجات
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 arabic">
      <Header showSearch={true} showActions={true} />

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">المفضلة</h1>
            <div className="text-sm text-gray-500">{items.length} منتج</div>
          </div>

          <div className="space-y-4">
            {items.map((item) => {
              const image = item.cover_image || item.images?.[0]?.image_url || item.images?.[0]?.image_path || "/placeholder.svg";
              const discountPercentage = Number(item.discount_percentage || 0);
              const { finalPrice, originalPrice, priceLabel, originalPriceLabel, hasDiscount } = getWishlistPriceInfo(item);

              return (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex gap-4">
                    <Link to={`/product/${item.id}`} className="shrink-0">
                      <img
                        src={image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg bg-gray-50"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link to={`/product/${item.id}`} className="font-semibold text-gray-800 hover:text-emerald-600">
                        {item.name}
                      </Link>
                      <p className="text-sm text-gray-600 mt-1">{item.brand?.name || "منتج"}</p>

                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className="text-lg font-bold text-brand-green">{priceLabel}</span>
                        {hasDiscount && originalPriceLabel && (
                          <span className="text-sm text-gray-500 line-through">{originalPriceLabel}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-between gap-3">
                      <button
                        onClick={() => {
                          if (item.has_variants) {
                            navigate(`/product/${item.id}`);
                            return;
                          }

                          addItem({
                            id: item.id,
                            name: item.name,
                            price: finalPrice,
                            original_price: originalPrice,
                            discount_percentage: discountPercentage,
                            image,
                            brand: item.brand?.name || "منتج",
                          });
                        }}
                        className="text-sm bg-brand-blue text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        {item.has_variants ? "اختر المقاس/الخيارات" : "أضف للسلة"}
                      </button>

                      <button
                        onClick={() => toggleWishlist(item.id)}
                        disabled={!!wishlistProcessing[item.id]}
                        className="text-red-600 hover:text-red-700 p-1"
                        aria-label="إزالة من المفضلة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
