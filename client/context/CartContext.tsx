import { createContext, useContext, useReducer, ReactNode, useEffect, useCallback, useRef } from "react";
import { cartAPI } from "../services/api";
import { getStorageUrl } from "../config/env";
import { useAuth } from "./AuthContext";
import { toast } from "../hooks/use-toast";

interface CartItem {
  id: number;
  variant_id?: number;
  name: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  image: string;
  quantity: number;
  brand: string;
  type?: 'product' | 'offer';
  selected_options?: Record<string, string>;
  db_cart_id?: number; // Backend DB record ID
  stock_quantity?: number;
  manage_stock?: boolean;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  isLoading: boolean;
}

type CartAction =
  | { type: "SET_ITEMS"; payload: CartItem[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "UPDATE_QUANTITY"; payload: { id: number; variant_id?: number; quantity: number } }
  | { type: "REMOVE_ITEM"; payload: { id: number; variant_id?: number } }
  | { type: "CLEAR_CART" };

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
  isLoading: false,
};

const calculateTotals = (items: CartItem[]) => {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { total, itemCount };
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "SET_ITEMS": {
      const { total, itemCount } = calculateTotals(action.payload);
      return { ...state, items: action.payload, total, itemCount };
    }
    case "ADD_ITEM": {
      // Check if item already exists
      const existingItemIndex = state.items.findIndex(
        (i) => i.id === action.payload.id && i.variant_id === action.payload.variant_id
      );

      let newItems;
      if (existingItemIndex > -1) {
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      } else {
        newItems = [...state.items, action.payload];
      }
      const { total, itemCount } = calculateTotals(newItems);
      return { ...state, items: newItems, total, itemCount };
    }
    case "UPDATE_QUANTITY": {
      const newItems = state.items.map((item) =>
        item.id === action.payload.id && item.variant_id === action.payload.variant_id
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      const { total, itemCount } = calculateTotals(newItems);
      return { ...state, items: newItems, total, itemCount };
    }
    case "REMOVE_ITEM": {
      const newItems = state.items.filter(
        (item) => !(item.id === action.payload.id && item.variant_id === action.payload.variant_id)
      );
      const { total, itemCount } = calculateTotals(newItems);
      return { ...state, items: newItems, total, itemCount };
    }
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "CLEAR_CART":
      return { ...initialState };
    default:
      return state;
  }
};

interface CartContextType {
  state: CartState;
  addItem: (item: Omit<CartItem, "quantity">) => Promise<void>;
  removeItem: (id: number, variant_id?: number) => Promise<void>;
  updateQuantity: (id: number, quantity: number, variant_id?: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const initCartState = (initial: CartState) => {
  if (typeof window !== 'undefined') {
    try {
      const localCart = localStorage.getItem('guest_cart');
      if (localCart) {
        const items = JSON.parse(localCart);
        const total = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
        const itemCount = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
        return { ...initial, items, total, itemCount };
      }
    } catch (e) {
      console.error("Corrupted local cart");
    }
  }
  return initial;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState, initCartState);
  const { token, isAuthenticated } = useAuth();
  const isInitialMount = useRef(true);

  const loadCartFromBackend = useCallback(async () => {
    if (!token) return;
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const response = await cartAPI.getCart(token);
      if (response && response.data) {
        const mappedItems: CartItem[] = response.data.map((item: any) => ({
          id: item.product.id,
          variant_id: item.product_variant_id,
          db_cart_id: item.id,
          name: item.product.name,
          price: Number(item.price),
          image: (() => {
            const imgPath =
              item.product.image ||
              item.product.cover_image ||
              item.product.images?.find((img: any) => img.is_primary)?.image_url ||
              item.product.images?.find((img: any) => img.is_primary)?.image_path ||
              item.product.images?.[0]?.image_url ||
              item.product.images?.[0]?.image_path ||
              '';
            if (!imgPath) return '';
            return getStorageUrl(imgPath);
          })(),
          quantity: item.quantity,
          brand: item.product.brand?.name || 'ماركة غير محددة',
          selected_options: item.variant_values,
          stock_quantity: item.stock_quantity,
          manage_stock: item.manage_stock
        }));
        dispatch({ type: "SET_ITEMS", payload: mappedItems });
      }
    } catch (error) {
      console.error("Failed to load cart from backend:", error);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [token]);

  const loadCartFromLocal = useCallback(() => {
    const localCart = localStorage.getItem('guest_cart');
    if (localCart) {
      try {
        const items = JSON.parse(localCart);
        dispatch({ type: "SET_ITEMS", payload: items });
      } catch (e) {
        console.error("Corrupted local cart");
      }
    }
  }, []);

  // Save to local storage when items change (only if NOT authenticated)
  useEffect(() => {
    if (!isAuthenticated && !isInitialMount.current) {
      localStorage.setItem('guest_cart', JSON.stringify(state.items));
    }
  }, [state.items, isAuthenticated]);

  // Initial load
  useEffect(() => {
    if (isAuthenticated && token) {
      loadCartFromBackend();
    }
    isInitialMount.current = false;
  }, [isAuthenticated, token, loadCartFromBackend]);

  // Sync guest cart to DB upon login
  useEffect(() => {
    if (isAuthenticated && token) {
      const guestCart = localStorage.getItem('guest_cart');
      if (guestCart) {
        try {
          const items = JSON.parse(guestCart);
          if (items.length > 0) {
            const sync = async () => {
              for (const item of items) {
                try {
                  await cartAPI.addToCart(item.id, item.quantity, item.variant_id, token);
                } catch (e) {
                  console.error("Failed to sync item", item.id);
                }
              }
              localStorage.removeItem('guest_cart');
              loadCartFromBackend();
            };
            sync();
          }
        } catch (e) {
          console.error("Sync error");
        }
      }
    }
  }, [isAuthenticated, token, loadCartFromBackend]);

  const addItem = async (item: Omit<CartItem, "quantity">) => {
    const existingItem = state.items.find(i => i.id === item.id && i.variant_id === item.variant_id);
    const currentQuantity = existingItem ? existingItem.quantity : 0;
    
    if (item.manage_stock && (currentQuantity + 1) > (item.stock_quantity || 0)) {
      toast({
        title: "عذراً، أقصى كمية متاحة",
        description: "الكمية المطلوبة تتجاوز المخزون المتوفر.",
        variant: "destructive",
      });
      return;
    }

    if (isAuthenticated && token) {
      try {
        await cartAPI.addToCart(item.id, 1, item.variant_id, token);
        loadCartFromBackend();
        toast({
          title: "تمت الإضافة إلى السلة",
          description: item.name,
          image: getStorageUrl(item.image) || "/placeholder.svg",
        });
      } catch (error) {
        console.error("Failed to add to cart on backend:", error);
        toast({
          title: "تعذر الإضافة إلى السلة",
          description: "حدث خطأ أثناء الاتصال بالخادم.",
          variant: "destructive",
        });
      }
    } else {
      dispatch({ type: "ADD_ITEM", payload: { ...item, quantity: 1 } });
      toast({
        title: "تمت الإضافة إلى السلة",
        description: item.name,
        image: getStorageUrl(item.image) || "/placeholder.svg",
      });
    }
  };

  const removeItem = async (id: number, variant_id?: number) => {
    const item = state.items.find(i => i.id === id && i.variant_id === variant_id);
    
    // Optimistic UI update
    dispatch({ type: "REMOVE_ITEM", payload: { id, variant_id } });

    if (isAuthenticated && token && item?.db_cart_id) {
      try {
        await cartAPI.removeFromCart(item.db_cart_id, token);
      } catch (error) {
        console.error("Failed to remove from cart on backend:", error);
        loadCartFromBackend(); // Rollback if failed
      }
    }
  };

  const updateQuantity = async (id: number, quantity: number, variant_id?: number) => {
    if (quantity < 1) return;

    const item = state.items.find(i => i.id === id && i.variant_id === variant_id);
    if (item && item.manage_stock && quantity > (item.stock_quantity || 0)) {
      toast({
        title: "عذراً، أقصى كمية متاحة",
        description: "لقد وصلت للحد الأقصى المتوفر من هذا المنتج.",
        variant: "destructive",
      });
      return;
    }

    // Optimistic UI update for instant feedback
    dispatch({ type: "UPDATE_QUANTITY", payload: { id, variant_id, quantity } });

    if (isAuthenticated && token && item?.db_cart_id) {
      try {
        await cartAPI.updateCartItem(item.db_cart_id, quantity, token);
      } catch (error) {
        console.error("Failed to update cart on backend:", error);
        toast({
          title: "فشل التحديث",
          description: "حدث خطأ أثناء الاتصال بالخادم.",
          variant: "destructive",
        });
        loadCartFromBackend(); // Rollback local state
      }
    }
  };

  const clearCart = async () => {
    if (isAuthenticated && token) {
      try {
        await cartAPI.clearCart(token);
        loadCartFromBackend();
      } catch (error) {
        console.error("Failed to clear cart on backend:", error);
      }
    } else {
      dispatch({ type: "CLEAR_CART" });
      localStorage.removeItem('guest_cart');
    }
  };

  const refreshCart = async () => {
    if (isAuthenticated && token) {
      await loadCartFromBackend();
    } else {
      loadCartFromLocal();
    }
  };

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
