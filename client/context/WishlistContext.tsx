import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { wishlistAPI } from "../services/api";
import { useAuth } from "./AuthContext";
import { toast } from "../hooks/use-toast";

interface WishlistContextType {
  wishlistIds: number[];
  wishlistProcessing: Record<number, boolean>;
  isWishlisted: (productId: number) => boolean;
  toggleWishlist: (productId: number) => Promise<void>;
  refreshWishlist: () => Promise<void>;
  setWishlistIds: (ids: number[]) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const GUEST_WISHLIST_KEY = "guest_wishlist";

const readGuestWishlist = (): number[] => {
  try {
    const raw = sessionStorage.getItem(GUEST_WISHLIST_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const ids: number[] = parsed
      .map((id: any) => Number(id))
      .filter((id: number) => Number.isInteger(id) && id > 0);
    
    return Array.from(new Set(ids));
  } catch {
    return [];
  }
};

const writeGuestWishlist = (ids: number[]) => {
  sessionStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(ids));
};

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { token, isAuthenticated } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<number[]>(() => {
    if (typeof window !== 'undefined') return readGuestWishlist();
    return [];
  });
  const [wishlistProcessing, setWishlistProcessing] = useState<Record<number, boolean>>({});
  const isInitialMount = useRef(true);

  const extractWishlistIds = (response: any): number[] => {
    const idsFromResponse = Array.isArray(response?.ids)
      ? response.ids
      : Array.isArray(response?.data)
        ? response.data
            .map((item: any) =>
              typeof item === "number"
                ? item
                : item?.id ?? item?.product_id ?? item?.product?.id ?? null
            )
            .filter((id: number | null) => typeof id === "number")
        : [];

    return idsFromResponse.map((id: number) => Number(id));
  };

  const loadWishlistFromApi = useCallback(async (authToken?: string) => {
    try {
      const response = await wishlistAPI.getWishlist(authToken);
      const ids = extractWishlistIds(response);
      setWishlistIds(ids);
      writeGuestWishlist(ids);
    } catch (error) {
      console.error("Failed to load wishlist from API:", error);
    }
  }, []);

  const loadWishlistFromSession = useCallback(async () => {
    const localIds = readGuestWishlist();
    setWishlistIds(localIds);
  }, []);

  useEffect(() => {
    if (!isAuthenticated && !isInitialMount.current) {
      writeGuestWishlist(wishlistIds);
    }
  }, [wishlistIds, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && token) {
      loadWishlistFromApi(token);
    }

    isInitialMount.current = false;
  }, [isAuthenticated, token, loadWishlistFromApi]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const guestWishlist = readGuestWishlist();
    if (guestWishlist.length === 0) return;

    const syncGuestWishlist = async () => {
      for (const productId of guestWishlist) {
        try {
          await wishlistAPI.addToWishlist(productId, token);
        } catch (error) {
          console.error("Failed to sync wishlist item", productId, error);
        }
      }

      sessionStorage.removeItem(GUEST_WISHLIST_KEY);
      await loadWishlistFromApi(token);
    };

    syncGuestWishlist();
  }, [isAuthenticated, token, loadWishlistFromApi]);

  const toggleWishlist = useCallback(async (productId: number) => {
    setWishlistProcessing((prev) => ({ ...prev, [productId]: true }));

    try {
      const exists = wishlistIds.includes(productId);

      if (isAuthenticated && token) {
        if (exists) {
          await wishlistAPI.removeFromWishlist(productId, token);
          setWishlistIds((prev) => prev.filter((id) => id !== productId));
          toast({
            title: "تمت الإزالة من المفضلة",
          });
        } else {
          await wishlistAPI.addToWishlist(productId, token);
          setWishlistIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
          toast({
            title: "تمت الإضافة إلى المفضلة",
          });
        }
      } else {
        if (exists) {
          setWishlistIds((prev) => prev.filter((id) => id !== productId));
          toast({
            title: "تمت الإزالة من المفضلة",
          });
        } else {
          setWishlistIds((prev) => [...prev, productId]);
          toast({
            title: "تمت الإضافة إلى المفضلة",
          });
        }
      }
    } catch (error) {
      console.error("Failed to update wishlist:", error);
    } finally {
      setWishlistProcessing((prev) => {
        const updated = { ...prev };
        delete updated[productId];
        return updated;
      });
    }
  }, [isAuthenticated, token, wishlistIds]);

  const refreshWishlist = useCallback(async () => {
    if (isAuthenticated && token) {
      await loadWishlistFromApi(token);
      return;
    }

    await loadWishlistFromSession();
  }, [isAuthenticated, token, loadWishlistFromApi, loadWishlistFromSession]);

  const value = useMemo<WishlistContextType>(() => ({
    wishlistIds,
    wishlistProcessing,
    isWishlisted: (productId: number) => wishlistIds.includes(productId),
    toggleWishlist,
    refreshWishlist,
    setWishlistIds,
  }), [wishlistIds, wishlistProcessing, toggleWishlist, refreshWishlist, setWishlistIds]);

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }

  return context;
};
