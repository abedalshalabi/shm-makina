const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');
const ensureLeadingSlash = (value: string): string => {
  if (!value) return '';
  return value.startsWith('/') ? value : `/${value}`;
};

const normalizePath = (value: string | undefined): string => {
  if (!value) return '';
  const trimmed = trimTrailingSlash(value.trim());
  if (!trimmed || trimmed === '/') return '';
  return ensureLeadingSlash(trimmed);
};

const KNOWN_APP_ROUTES = new Set([
  'admin',
  'products',
  'product',
  'cart',
  'checkout',
  'order-success',
  'wishlist',
  'offers',
  'categories',
  'brands',
  'login',
  'forgot-password',
  'reset-password',
  'register',
  'dashboard',
  'about',
  'contact',
  'shipping',
  'returns',
  'warranty',
  'home-appliances',
  'personal-care',
  'kitchen',
  'cooling',
  'small-appliances',
  'washing',
  'cleaning',
  'electronics',
  'lighting',
  'tools',
]);

const resolveAbsoluteUrl = (value: string | undefined, origin: string): string => {
  if (!value) return '';
  const trimmed = trimTrailingSlash(value.trim());
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `${origin}${ensureLeadingSlash(trimmed)}`;
};

const isLocalHostLike = (host: string): boolean =>
  host === 'localhost' || host === '127.0.0.1';

const getRuntimeBasePath = (): string => {
  const segments = window.location.pathname.split('/').filter(Boolean);

  if (segments.length > 0 && !KNOWN_APP_ROUTES.has(segments[0])) {
    return `/${segments[0]}`;
  }

  return '';
};

const getConfiguredFrontendBasePath = () => {
  const explicitBasePath = normalizePath(import.meta.env.VITE_FRONTEND_BASE_PATH);
  if (explicitBasePath) {
    return explicitBasePath;
  }

  const frontendUrl = resolveAbsoluteUrl(import.meta.env.VITE_FRONTEND_URL, window.location.origin);
  if (!frontendUrl) {
    return getRuntimeBasePath();
  }

  const parsedUrl = new URL(frontendUrl);

  if (
    !import.meta.env.DEV &&
    isLocalHostLike(parsedUrl.hostname) &&
    !isLocalHostLike(window.location.hostname)
  ) {
    return getRuntimeBasePath();
  }

  const pathname = normalizePath(parsedUrl.pathname);
  return pathname;
};

export const BASE_PATH = getConfiguredFrontendBasePath();

const getBackendPublicUrl = () => {
  const configuredAbsoluteUrl = resolveAbsoluteUrl(import.meta.env.VITE_BACKEND_PUBLIC_URL, window.location.origin);
  if (configuredAbsoluteUrl) {
    return configuredAbsoluteUrl;
  }

  const configuredRelativePath = normalizePath(import.meta.env.VITE_BACKEND_PUBLIC_PATH);
  if (configuredRelativePath) {
    return `${window.location.origin}${configuredRelativePath}`;
  }

  if (import.meta.env.DEV) {
    return `http://${window.location.hostname}:8000`;
  }

  return `${window.location.origin}${BASE_PATH}`;
};

export const BASE_URL = getBackendPublicUrl();

export const API_BASE_URL = `${BASE_URL}/api`.replace(/\/$/, '');
export const API_V1_BASE_URL = `${API_BASE_URL}/v1`;

export const STORAGE_BASE_URL = `${BASE_URL}/storage`.replace(/\/$/, '');
const RUNTIME_THUMBNAILS_ENABLED =
  String(import.meta.env.VITE_ENABLE_RUNTIME_THUMBNAILS ?? "false").toLowerCase() === "true";

const extractStorageRelativePath = (path: string): string | null => {
  const normalized = path.replace(/\\/g, "/");

  if (normalized.includes('/storage/')) {
    return normalized.split('/storage/')[1] || null;
  }

  if (normalized.startsWith('/storage/')) {
    return normalized.slice('/storage/'.length);
  }

  if (normalized.startsWith('storage/')) {
    return normalized.slice('storage/'.length);
  }

  return null;
};

// Utility to get full storage URL for relative paths
export const getStorageUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  
  // Clean path: remove trailing slash if any
  const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;

  // إذا كان المسار يحتوي على كلمة storage، نقوم باستخلاص الجزء الذي يليها ودمجه مع عنوان السيرفر الحالي
  // هذا يحل مشكلة الروابط المخزنة كـ localhost في قاعدة البيانات
  const relativePath = extractStorageRelativePath(cleanPath);
  if (relativePath) {
    return `${STORAGE_BASE_URL}/${relativePath}`;
  }

  if (cleanPath === 'logo.webp' || cleanPath === '/logo.webp') return `${window.location.origin}${BASE_PATH}/logo.webp`;
  if (cleanPath.startsWith('http')) return cleanPath;
  if (cleanPath.startsWith('/storage')) return `${BASE_URL}${cleanPath}`;
  if (cleanPath.startsWith('storage')) return `${BASE_URL}/${cleanPath}`;
  if (cleanPath.startsWith('/')) return `${window.location.origin}${BASE_PATH}${cleanPath}`;
  
  return `${STORAGE_BASE_URL}/${cleanPath}`;
};

type OptimizedImageOptions = {
  width?: number;
  height?: number;
  quality?: number;
};

const toPositiveIntOrNull = (value: unknown): number | null => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  const parsed = Math.floor(numeric);
  return parsed > 0 ? parsed : null;
};

export const getOptimizedImageUrl = (
  path: string | null | undefined,
  options: OptimizedImageOptions = {}
): string => {
  if (!path) return "";

  const resolved = getStorageUrl(path);
  if (!resolved || resolved.startsWith("data:")) {
    return resolved;
  }

  // Runtime thumbnail generation can overload PHP when many images render at once.
  // Keep it opt-in so production can use direct static image serving by default.
  if (!RUNTIME_THUMBNAILS_ENABLED) {
    return resolved;
  }

  try {
    const resolvedUrl = new URL(resolved, window.location.origin);
    const backendUrl = new URL(BASE_URL, window.location.origin);
    if (resolvedUrl.origin !== backendUrl.origin && resolvedUrl.origin !== window.location.origin) {
      return resolved;
    }
  } catch {
    return resolved;
  }

  const relativePath = extractStorageRelativePath(resolved);
  if (!relativePath) {
    return resolved;
  }

  const lowerPath = relativePath.toLowerCase();
  if (lowerPath.endsWith(".svg")) {
    return resolved;
  }

  const params = new URLSearchParams();
  params.set("path", relativePath);

  const width = toPositiveIntOrNull(options.width);
  const height = toPositiveIntOrNull(options.height);
  const quality = toPositiveIntOrNull(options.quality);

  if (width) params.set("w", String(width));
  if (height) params.set("h", String(height));
  if (quality) params.set("q", String(quality));

  return `${API_V1_BASE_URL}/media/thumbnail?${params.toString()}`;
};

export const FACEBOOK_PIXEL_ID = import.meta.env.VITE_FACEBOOK_PIXEL_ID || '';
