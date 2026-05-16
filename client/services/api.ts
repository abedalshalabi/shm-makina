// API Service for Abu Zaina Technologies
import { API_V1_BASE_URL } from "../config/env";

const API_BASE_URL = API_V1_BASE_URL;

// Site Settings API (public)
export const settingsAPI = {
  getSettings: async (group: string = 'header') => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings?group=${group}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching settings:", error);
      throw error;
    }
  },
  getCities: async () => {
    const response = await fetch(`${API_BASE_URL}/cities`);
    if (!response.ok) {
      throw new Error('Failed to fetch cities');
    }
    return response.json();
  },
};

// Analytics API
export const analyticsAPI = {
  trackVisit: async (noIncrement: boolean = false) => {
    try {
      const url = `${API_BASE_URL}/analytics/visit${noIncrement ? '?no_increment=1' : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error tracking visit:", error);
      return { count: 0 };
    }
  },
};

// Types
interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  district?: string;
  street?: string;
  building?: string;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  sku: string;
  stock_quantity: number;
  in_stock: boolean;
  rating: number;
  reviews_count: number;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  brand: {
    id: number;
    name: string;
    slug: string;
  };
  images: Array<{
    id: number;
    image_path: string;
    is_primary: boolean;
  }>;
}

interface CartItem {
  id: number;
  quantity: number;
  price: number;
  total: number;
  product: Product;
}

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  payment_method: string;
  order_status: string;
  payment_status: string;
  items: Array<{
    id: number;
    product_name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
}

// Auth API
export const authAPI = {
  // Register user
  register: async (userData: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
    city?: string;
    district?: string;
    street?: string;
    building?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  // Login user
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  forgotPassword: async (email: string) => {
    const response = await fetch(`${API_BASE_URL}/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    return response.json();
  },

  resetPassword: async (payload: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return response.json();
  },

  // Logout user
  logout: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  // Get current user
  getUser: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    return response.json();
  },

  // Update user profile
  updateProfile: async (token: string, userData: any) => {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return response.json();
  },
};

// Products API
export const productsAPI = {
  // Get all products
  getProducts: async (filters: {
    page?: number;
    per_page?: number;
    search?: string;
    category_id?: number;
    brand_id?: number;
    price_min?: number;
    price_max?: number;
    sort?: string;
    order?: string;
  } = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/products?${params}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    return response.json();
  },

  // Get single product
  getProduct: async (id: number, noIncrement: boolean = false) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}${noIncrement ? '?no_increment=1' : ''}`);
    return response.json();
  },

  // Get featured products
  getFeaturedProducts: async () => {
    const response = await fetch(`${API_BASE_URL}/products/featured`);
    return response.json();
  },

  // Get latest products
  getLatestProducts: async () => {
    const response = await fetch(`${API_BASE_URL}/products/latest`);
    return response.json();
  },

  // Get products by category
  getProductsByCategory: async (categorySlug: string) => {
    const response = await fetch(`${API_BASE_URL}/products/category/${categorySlug}`);
    return response.json();
  },

  // Get products by brand
  getProductsByBrand: async (brandSlug: string) => {
    const response = await fetch(`${API_BASE_URL}/products/brand/${brandSlug}`);
    return response.json();
  },
};

// Cart API
export const cartAPI = {
  // Get cart items
  getCart: async (token?: string) => {
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/cart`, { headers });
    return response.json();
  },

  // Add to cart
  addToCart: async (productId: number, quantity: number, variantId?: number, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/cart`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ product_id: productId, quantity, product_variant_id: variantId }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Add to cart failed:', response.status, errorData);
      throw new Error(errorData.message || 'Failed to add to cart');
    }
    return response.json();
  },

  // Update cart item
  updateCartItem: async (cartId: number, quantity: number, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/cart/${cartId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ quantity }),
    });
    return response.json();
  },

  // Remove from cart
  removeFromCart: async (cartId: number, token?: string) => {
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/cart/${cartId}`, {
      method: 'DELETE',
      headers
    });
    return response.json();
  },

  // Clear cart
  clearCart: async (token?: string) => {
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/cart`, {
      method: 'DELETE',
      headers
    });
    return response.json();
  },

  // Get cart summary
  getCartSummary: async (token?: string) => {
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/cart/summary`, { headers });
    return response.json();
  },
};

// Orders API
export const ordersAPI = {
  // Create order
  createOrder: async (orderData: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    customer_city: string;
    customer_district: string;
    customer_street: string;
    customer_building: string;
    customer_additional_info?: string;
    payment_method: string;
    notes?: string;
    items: Array<{
      product_id: number;
      quantity: number;
      price: number;
      type?: 'product' | 'offer';
    }>;
  }) => {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include', // Include session cookie
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'فشل في إنشاء الطلب');
    }

    return response.json();
  },

  // Get order details
  getOrder: async (orderId: number) => {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`);
    return response.json();
  },

  // Get user orders
  getUserOrders: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/user/orders`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },
};

// Categories API
export const categoriesAPI = {
  // Get all categories (with children)
  getCategories: async () => {
    const response = await fetch(`${API_BASE_URL}/categories`);
    return response.json();
  },

  // Get main categories only
  getMainCategories: async () => {
    const response = await fetch(`${API_BASE_URL}/categories/main`);
    return response.json();
  },

  // Get single category
  getCategory: async (categorySlug: string) => {
    const response = await fetch(`${API_BASE_URL}/categories/${categorySlug}`);
    return response.json();
  },

  // Get subcategories for a category
  getSubcategories: async (categoryId: number) => {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/subcategories`);
    return response.json();
  },

  // Get filters for a category
  getCategoryFilters: async (categoryId: number) => {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/filters`);
    return response.json();
  },
};

// Brands API
export const brandsAPI = {
  // Get all brands
  getBrands: async () => {
    const response = await fetch(`${API_BASE_URL}/brands`);
    return response.json();
  },

  // Get single brand
  getBrand: async (brandSlug: string) => {
    const response = await fetch(`${API_BASE_URL}/brands/${brandSlug}`);
    return response.json();
  },
};

// Wishlist API
export const wishlistAPI = {
  // Get wishlist
  getWishlist: async (token?: string) => {
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE_URL}/wishlist`, {
      headers,
      credentials: 'include',
    });
    return response.json();
  },

  // Add to wishlist
  addToWishlist: async (productId: number, token?: string) => {
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE_URL}/wishlist/${productId}`, {
      method: 'POST',
      headers,
      credentials: 'include',
    });
    return response.json();
  },

  // Remove from wishlist
  removeFromWishlist: async (productId: number, token?: string) => {
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE_URL}/wishlist/${productId}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });
    return response.json();
  },
};

// Reviews API
export const reviewsAPI = {
  // Get product reviews
  getProductReviews: async (productId: number) => {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/reviews`);
    return response.json();
  },

  // Add review
  addReview: async (productId: number, reviewData: {
    rating: number;
    comment: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reviewData),
    });
    return response.json();
  },
};

// Offers API (public)
export const offersAPI = {
  // Get all active offers
  getOffers: async (type?: string) => {
    const url = type
      ? `${API_BASE_URL}/offers?type=${type}`
      : `${API_BASE_URL}/offers`;
    const response = await fetch(url);
    return response.json();
  },
};

// Contact API
export const contactAPI = {
  // Submit contact form
  submitContact: async (formData: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'حدث خطأ أثناء إرسال الرسالة');
    }

    return response.json();
  },
};

// Newsletter API
export const newsletterAPI = {
  subscribe: async (data: { email: string; source?: string }) => {
    const response = await fetch(`${API_BASE_URL}/newsletter/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'حدث خطأ أثناء الاشتراك');
    }

    return result;
  },
};

// Cities API (public)
export const citiesAPI = {
  getCities: async () => {
    const response = await fetch(`${API_BASE_URL}/cities`);
    if (!response.ok) {
      throw new Error('Failed to fetch cities');
    }
    return response.json();
  },
};

export const sliderAPI = {
  getSliderItems: async () => {
    const response = await fetch(`${API_BASE_URL}/slider`);
    if (!response.ok) {
      throw new Error('Failed to fetch slider items');
    }
    return response.json();
  },
};

// Export types
export type { User, Product, CartItem, Order };
