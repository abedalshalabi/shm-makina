import axios, { AxiosProgressEvent } from 'axios';
import { API_BASE_URL } from "../config/env";

const adminApi = axios.create({
  baseURL: API_BASE_URL,
  // Removed withCredentials: true to prevent session/cookie interference 
  // between different apps running on localhost. Bearer tokens are sufficient.
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach admin token to requests
adminApi.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // If the data is FormData, delete Content-Type header to let browser set it with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  
  return config;
}, error => {
  return Promise.reject(error);
});

// Interceptor to handle token expiration
adminApi.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      console.error('Session expired or unauthorized request to:', error.config?.url);
      
      // Only logout if it's not a failed login attempt (which also returns 401 sometimes)
      if (!error.config?.url?.includes('/admin/login')) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Admin Authentication API
export const adminAuthAPI = {
  async login(email: string, password: string) {
    const response = await adminApi.post('/v1/admin/login', { email, password });
    return response.data;
  },
  
  async logout() {
    const response = await adminApi.post('/v1/admin/logout');
    return response.data;
  },
  
  async getUser() {
    const response = await adminApi.get('/v1/admin/user');
    return response.data;
  },
  
  async changePassword(currentPassword: string, newPassword: string) {
    const response = await adminApi.post('/v1/admin/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    });
    return response.data;
  }
};

// Admin Dashboard API
export const adminDashboardAPI = {
  async getDashboard() {
    const response = await adminApi.get('/v1/admin/dashboard');
    return response.data;
  },
  
  async getAnalytics() {
    const response = await adminApi.get('/v1/admin/analytics');
    return response.data;
  }
};

// Admin Users API
export const adminUsersAPI = {
  async getUsers() {
    const response = await adminApi.get('/v1/admin/users');
    return response.data;
  },
  
  async createUser(userData: any) {
    const response = await adminApi.post('/v1/admin/users', userData);
    return response.data;
  },
  
  async getUser(id: string) {
    const response = await adminApi.get(`/v1/admin/users/${id}`);
    return response.data;
  },
  
  async updateUser(id: string, userData: any) {
    const response = await adminApi.put(`/v1/admin/users/${id}`, userData);
    return response.data;
  },
  
  async deleteUser(id: string) {
    const response = await adminApi.delete(`/v1/admin/users/${id}`);
    return response.data;
  },
  
  async getRoles() {
    const response = await adminApi.get('/v1/admin/roles');
    return response.data;
  },
  
  async getPermissions() {
    const response = await adminApi.get('/v1/admin/permissions');
    return response.data;
  }
};

// Admin Customers API
export const adminCustomersAPI = {
  async getCustomers(params: any = {}) {
    const response = await adminApi.get('/v1/admin/customers', { params });
    return response.data;
  },
  
  async getCustomer(id: string) {
    const response = await adminApi.get(`/v1/admin/customers/${id}`);
    return response.data;
  },

  async resetPassword(id: string, password: string, passwordConfirmation: string) {
    const response = await adminApi.post(`/v1/admin/customers/${id}/reset-password`, {
      password,
      password_confirmation: passwordConfirmation,
    });
    return response.data;
  }
};

// Admin Products API
export const adminProductsAPI = {
  async getProducts(filters: any = {}) {
    const response = await adminApi.get('/v1/admin/products', { params: filters });
    return response.data;
  },
  
  async getProduct(id: string) {
    const response = await adminApi.get(`/v1/admin/products/${id}`);
    return response.data;
  },
  
  async createProduct(productData: any) {
    // Check if productData is FormData
    const isFormData = productData instanceof FormData;
    const config: any = {
      headers: {
        'Accept': 'application/json',
      }
    };
    
    // Don't set Content-Type for FormData - let browser/axios set it automatically with boundary
    if (!isFormData) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    const response = await adminApi.post('/v1/admin/products', productData, config);
    return response.data;
  },
  
  async updateProduct(id: string, productData: any) {
    const isFormData = productData instanceof FormData;
    const config: any = {
      headers: {
        'Accept': 'application/json',
      }
    };
    
    // For FormData with file uploads, use POST with _method=PUT
    // This is because Laravel doesn't handle multipart/form-data well with PUT requests
    if (isFormData) {
      // Add _method field to simulate PUT request
      productData.append('_method', 'PUT');
      const response = await adminApi.post(`/v1/admin/products/${id}`, productData, config);
      return response.data;
    } else {
      config.headers['Content-Type'] = 'application/json';
      const response = await adminApi.put(`/v1/admin/products/${id}`, productData, config);
      return response.data;
    }
  },
  
  async deleteProduct(id: string) {
    const response = await adminApi.delete(`/v1/admin/products/${id}`);
    return response.data;
  },
  
  async deleteVariant(id: string) {
    const response = await adminApi.delete(`/v1/admin/variants/${id}`);
    return response.data;
  },
  
  async bulkApplyDiscount(productIds: number[], discountPercentage: number) {
    const response = await adminApi.post('/v1/admin/products/bulk-discount', {
      product_ids: productIds,
      discount_percentage: discountPercentage
    });
    return response.data;
  },

  async bulkUpdateStatus(productIds: number[], isActive: boolean) {
    const response = await adminApi.post('/v1/admin/products/bulk-status', {
      product_ids: productIds,
      is_active: isActive,
    });
    return response.data;
  },

  async bulkDelete(productIds: number[]) {
    const response = await adminApi.post('/v1/admin/products/bulk-delete', {
      product_ids: productIds
    });
    return response.data;
  },

  async bulkUpdateOffers(productIds: number[], showInOffers: boolean) {
    const response = await adminApi.post('/v1/admin/products/bulk-offers', {
      product_ids: productIds,
      show_in_offers: showInOffers,
    });
    return response.data;
  },

  async importProducts(
    formData: FormData,
    options?: {
      onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
    }
  ) {
    const response = await adminApi.post('/v1/admin/products/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: options?.onUploadProgress,
    });
    return response.data;
  },

  async uploadImportAssets(
    formData: FormData,
    options?: {
      onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
    }
  ) {
    const response = await adminApi.post('/v1/admin/products/import-assets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: options?.onUploadProgress,
    });
    return response.data;
  },

  async startImport(payload: {
    file_path: string;
    file_name: string;
    images_zip_path?: string | null;
    images_zip_name?: string | null;
  }) {
    const response = await adminApi.post('/v1/admin/products/import/start', payload);
    return response.data;
  },

  async getImportStatus(importId: number | string) {
    const response = await adminApi.get(`/v1/admin/products/import/${importId}`);
    return response.data;
  },

  async getImportInboxFiles() {
    const response = await adminApi.get('/v1/admin/products/import-inbox');
    return response.data;
  },

  async startImportFromInbox(payload: {
    file_path: string;
    images_zip_path?: string | null;
  }) {
    const response = await adminApi.post('/v1/admin/products/import/start-from-inbox', payload);
    return response.data;
  },

  async getImportTemplate() {
    const response = await adminApi.get('/v1/admin/products/import-template', {
      responseType: 'blob',
    });
    return response;
  }
};

// Admin Categories API
export const adminCategoriesAPI = {
  async getCategories(filters: any = {}) {
    const response = await adminApi.get('/v1/admin/categories', { params: filters });
    return response.data;
  },
  
  async getCategory(id: string) {
    const response = await adminApi.get(`/v1/admin/categories/${id}`);
    return response.data;
  },
  
  async createCategory(categoryData: any) {
    const isFormData = categoryData instanceof FormData;
    const config: any = {
      headers: {
        'Accept': 'application/json',
      }
    };
    
    if (!isFormData) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    const response = await adminApi.post('/v1/admin/categories', categoryData, config);
    return response.data;
  },
  
  async updateCategory(id: string, categoryData: any) {
    const isFormData = categoryData instanceof FormData;
    const config: any = {
      headers: {
        'Accept': 'application/json',
      }
    };
    
    if (isFormData) {
      categoryData.append('_method', 'PUT');
      const response = await adminApi.post(`/v1/admin/categories/${id}`, categoryData, config);
      return response.data;
    } else {
      config.headers['Content-Type'] = 'application/json';
      const response = await adminApi.put(`/v1/admin/categories/${id}`, categoryData, config);
      return response.data;
    }
  },
  
  async deleteCategory(id: string) {
    const response = await adminApi.delete(`/v1/admin/categories/${id}`);
    return response.data;
  },

  async bulkDelete(categoryIds: number[]) {
    const response = await adminApi.post('/v1/admin/categories/bulk-delete', {
      category_ids: categoryIds
    });
    return response.data;
  },

  async updateCategoryFilters(id: string, filters: any) {
    const response = await adminApi.put(`/v1/admin/categories/${id}/filters`, { filters });
    return response.data;
  },
  
  async syncFilters(id: string, filterIds: number[]) {
    const response = await adminApi.put(`/v1/admin/categories/${id}/filters-sync`, { filter_ids: filterIds });
    return response.data;
  }
};

// Admin Brands API
export const adminBrandsAPI = {
  async getBrands(filters: any = {}) {
    const response = await adminApi.get('/v1/admin/brands', { params: filters });
    return response.data;
  },
  
  async getBrand(id: string) {
    const response = await adminApi.get(`/v1/admin/brands/${id}`);
    return response.data.data;
  },
  
  async createBrand(brandData: any) {
    const isFormData = brandData instanceof FormData;
    const config: any = {
      headers: {
        'Accept': 'application/json',
      }
    };
    
    // Don't set Content-Type for FormData - let browser/axios set it automatically with boundary
    if (!isFormData) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    const response = await adminApi.post('/v1/admin/brands', brandData, config);
    return response.data;
  },
  
  async updateBrand(id: string, brandData: any) {
    const isFormData = brandData instanceof FormData;
    const config: any = {
      headers: {
        'Accept': 'application/json',
      }
    };
    
    // For FormData with file uploads, use POST with _method=PUT
    // This is because Laravel doesn't handle multipart/form-data well with PUT requests
    if (isFormData) {
      // Add _method field to simulate PUT request
      brandData.append('_method', 'PUT');
      const response = await adminApi.post(`/v1/admin/brands/${id}`, brandData, config);
      return response.data;
    } else {
      config.headers['Content-Type'] = 'application/json';
      const response = await adminApi.put(`/v1/admin/brands/${id}`, brandData, config);
      return response.data;
    }
  },
  
  async deleteBrand(id: string) {
    const response = await adminApi.delete(`/v1/admin/brands/${id}`);
    return response.data;
  }
};

// Admin Orders API
export const adminOrdersAPI = {
  async getOrders(filters: any = {}) {
    const response = await adminApi.get('/v1/admin/orders', { params: filters });
    return response.data;
  },

  async exportOrders(filters: any = {}) {
    const response = await adminApi.get('/v1/admin/orders/export', {
      params: filters,
      responseType: 'blob', // Important for downloading files
    });
    return response.data;
  },

  async exportDetailedOrders(filters: any = {}) {
    const response = await adminApi.get('/v1/admin/orders/export-detailed', {
      params: filters,
      responseType: 'blob', // Important for downloading files
    });
    return response.data;
  },

  async createOrder(orderData: any) {
    const response = await adminApi.post('/v1/admin/orders', orderData);
    return response.data;
  },
  
  async getOrder(id: string) {
    const response = await adminApi.get(`/v1/admin/orders/${id}`);
    return response.data;
  },
  
  async updateOrder(id: string, orderData: any) {
    const response = await adminApi.put(`/v1/admin/orders/${id}`, orderData);
    return response.data;
  },
  
  async deleteOrder(id: string) {
    const response = await adminApi.delete(`/v1/admin/orders/${id}`);
    return response.data;
  },

  async sendCustomerEmail(id: string) {
    const response = await adminApi.post(`/v1/admin/orders/${id}/send-customer-email`);
    return response.data;
  },
  
  async getNewOrdersCount() {
    const response = await adminApi.get('/v1/admin/orders/new-count');
    return response.data;
  }
};

// Admin Reviews API
export const adminReviewsAPI = {
  async getReviews(filters: any = {}) {
    const response = await adminApi.get('/v1/admin/reviews', { params: filters });
    return response.data;
  },
  
  async updateReview(id: string, reviewData: any) {
    const response = await adminApi.put(`/v1/admin/reviews/${id}`, reviewData);
    return response.data;
  },
  
  async deleteReview(id: string) {
    const response = await adminApi.delete(`/v1/admin/reviews/${id}`);
    return response.data;
  }
};

// Site Settings API
export const adminSettingsAPI = {
  async getSettings(group: string = 'header') {
    const response = await adminApi.get(`/v1/admin/settings?group=${group}`);
    return response.data;
  },
  async getSetting(key: string) {
    const response = await adminApi.get(`/v1/admin/settings/${key}`);
    return response.data;
  },
  async updateSetting(key: string, data: { value: any; type?: string; group?: string; description?: string }) {
    const response = await adminApi.put(`/v1/admin/settings/${key}`, data);
    return response.data;
  },
  async bulkUpdate(settings: Array<{ key: string; value: any }>) {
    const response = await adminApi.post('/v1/admin/settings/bulk-update', { settings });
    return response.data;
  },
  async uploadImage(key: string, file: File) {
    const formData = new FormData();
    formData.append('image', file);
    const response = await adminApi.post(`/v1/admin/settings/${key}/upload-image`, formData);
    return response.data;
  },
  async uploadImageGeneral(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    const response = await adminApi.post(`/v1/admin/settings/upload-image`, formData);
    return response.data;
  }
};

// Admin Offers API
export const adminOffersAPI = {
  async getOffers(filters: any = {}) {
    const response = await adminApi.get('/v1/admin/offers', { params: filters });
    return response.data;
  },
  
  async getOffer(id: string) {
    const response = await adminApi.get(`/v1/admin/offers/${id}`);
    return response.data;
  },
  
  async createOffer(offerData: any) {
    const isFormData = offerData instanceof FormData;
    const config: any = {
      headers: {
        'Accept': 'application/json',
      }
    };
    
    if (!isFormData) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    const response = await adminApi.post('/v1/admin/offers', offerData, config);
    return response.data;
  },
  
  async updateOffer(id: string, offerData: any) {
    const isFormData = offerData instanceof FormData;
    const config: any = {
      headers: {
        'Accept': 'application/json',
      }
    };
    
    if (isFormData) {
      offerData.append('_method', 'PUT');
      const response = await adminApi.post(`/v1/admin/offers/${id}`, offerData, config);
      return response.data;
    } else {
      config.headers['Content-Type'] = 'application/json';
      const response = await adminApi.put(`/v1/admin/offers/${id}`, offerData, config);
      return response.data;
    }
  },
  
  async deleteOffer(id: string) {
    const response = await adminApi.delete(`/v1/admin/offers/${id}`);
    return response.data;
  }
};

// Admin Contact Messages API
export const adminContactMessagesAPI = {
  async getContactMessages(filters: any = {}) {
    const response = await adminApi.get('/v1/admin/contact-messages', { params: filters });
    return response.data;
  },
  
  async getContactMessage(id: string) {
    const response = await adminApi.get(`/v1/admin/contact-messages/${id}`);
    return response.data;
  },
  
  async updateStatus(id: string, status: 'new' | 'read' | 'replied') {
    const response = await adminApi.put(`/v1/admin/contact-messages/${id}/status`, { status });
    return response.data;
  },
  
  async deleteContactMessage(id: string) {
    const response = await adminApi.delete(`/v1/admin/contact-messages/${id}`);
    return response.data;
  }
};

export const adminNewsletterSubscribersAPI = {
  async getSubscribers(filters: any = {}) {
    const response = await adminApi.get('/v1/admin/newsletter-subscribers', { params: filters });
    return response.data;
  },

  async exportSubscribers(filters: any = {}) {
    const response = await adminApi.get('/v1/admin/newsletter-subscribers-export', {
      params: filters,
      responseType: 'blob',
    });
    return response;
  },

  async getSubscriber(id: string) {
    const response = await adminApi.get(`/v1/admin/newsletter-subscribers/${id}`);
    return response.data;
  },

  async updateStatus(id: string, status: 'active' | 'unsubscribed') {
    const response = await adminApi.put(`/v1/admin/newsletter-subscribers/${id}/status`, { status });
    return response.data;
  },

  async deleteSubscriber(id: string) {
    const response = await adminApi.delete(`/v1/admin/newsletter-subscribers/${id}`);
    return response.data;
  }
};

// Admin Cities API
export const adminCitiesAPI = {
  async getCities(filters: any = {}) {
    const response = await adminApi.get('/v1/admin/cities', { params: filters });
    return response.data;
  },
  
  async getCity(id: string) {
    const response = await adminApi.get(`/v1/admin/cities/${id}`);
    return response.data;
  },
  
  async createCity(cityData: any) {
    const response = await adminApi.post('/v1/admin/cities', cityData);
    return response.data;
  },
  
  async updateCity(id: string, cityData: any) {
    const response = await adminApi.put(`/v1/admin/cities/${id}`, cityData);
    return response.data;
  },
  
  async deleteCity(id: string) {
    const response = await adminApi.delete(`/v1/admin/cities/${id}`);
    return response.data;
  }
};

export const adminSliderAPI = {
  async getSliderItems() {
    const response = await adminApi.get('/v1/admin/slider');
    return response.data;
  },
  
  async getSliderItem(id: string) {
    const response = await adminApi.get(`/v1/admin/slider/${id}`);
    return response.data;
  },
  
  async createSliderItem(sliderData: FormData) {
    const response = await adminApi.post('/v1/admin/slider', sliderData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  async updateSliderItem(id: string, sliderData: FormData) {
    const isFormData = sliderData instanceof FormData;
    const config: any = {
      headers: {
        'Accept': 'application/json',
      }
    };
    
    // For FormData with file uploads, use POST with _method=PUT
    // This is because Laravel doesn't handle multipart/form-data well with PUT requests
    if (isFormData) {
      // Add _method field to simulate PUT request
      sliderData.append('_method', 'PUT');
      const response = await adminApi.post(`/v1/admin/slider/${id}`, sliderData, config);
      return response.data;
    } else {
      config.headers['Content-Type'] = 'application/json';
      const response = await adminApi.put(`/v1/admin/slider/${id}`, sliderData, config);
      return response.data;
    }
  },
  
  async deleteSliderItem(id: string) {
    const response = await adminApi.delete(`/v1/admin/slider/${id}`);
    return response.data;
  }
};

// Admin Filters API (Global)
export const adminFiltersAPI = {
  async getFilters() {
    const response = await adminApi.get('/v1/admin/filters');
    return response.data;
  },
  
  async getFilter(id: string) {
    const response = await adminApi.get(`/v1/admin/filters/${id}`);
    return response.data;
  },
  
  async createFilter(filterData: any) {
    const response = await adminApi.post('/v1/admin/filters', filterData);
    return response.data;
  },
  
  async updateFilter(id: string, filterData: any) {
    const response = await adminApi.put(`/v1/admin/filters/${id}`, filterData);
    return response.data;
  },
  
  async deleteFilter(id: string) {
    const response = await adminApi.delete(`/v1/admin/filters/${id}`);
    return response.data;
  }
};

export default adminApi;
