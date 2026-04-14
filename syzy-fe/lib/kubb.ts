/**
 * Kubb API Client Configuration
 * 
 * This file provides pre-configured Axios client settings and React Query configurations
 * for use with the generated API code from Kubb.
 */

import axios, { type AxiosRequestConfig, type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/features/auth/store/use-auth-store';

// Get API URL from environment
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7777';
const IS_MOCK = process.env.NEXT_PUBLIC_MOCK === 'true';

/**
 * Pre-configured Axios instance with base URL and interceptors
 */
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// In mock mode, replace the Axios HTTP adapter so apiClient.get/post/etc
// never touch the network — all requests are routed to the mock handler.
if (IS_MOCK) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { mockClient } = require('./mock/mock-client');
  apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    // Strip baseURL prefix to get the path the mock router expects
    let url = config.url || '';
    if (config.baseURL && url.startsWith(config.baseURL)) {
      url = url.slice(config.baseURL.length);
    }
    const res = await mockClient({
      url,
      method: (config.method || 'GET').toUpperCase(),
      params: config.params,
      data: config.data,
    });
    return { data: res.data, status: res.status, statusText: res.statusText, headers: res.headers || {}, config };
  };
}

// ── Kubb-compatible types & default export ────────────────────────
// These are used by the generated API client code (pluginClient importPath)

export type RequestConfig<TData = unknown> = {
  baseURL?: string;
  url?: string;
  method?: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD';
  params?: unknown;
  data?: TData | FormData;
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream';
  signal?: AbortSignal;
  validateStatus?: (status: number) => boolean;
  headers?: AxiosRequestConfig['headers'];
  paramsSerializer?: AxiosRequestConfig['paramsSerializer'];
};

export type ResponseConfig<TData = unknown> = {
  data: TData;
  status: number;
  statusText: string;
  headers: AxiosResponse['headers'];
};

export type ResponseErrorConfig<TError = unknown> = AxiosError<TError>;

export type Client = <TResponseData, TError = unknown, TRequestData = unknown>(
  config: RequestConfig<TRequestData>,
) => Promise<ResponseConfig<TResponseData>>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const client = async <TResponseData, _TError = unknown, TRequestData = unknown>(
  config: RequestConfig<TRequestData>,
): Promise<ResponseConfig<TResponseData>> => {
  return apiClient.request<TResponseData>(config as unknown as AxiosRequestConfig);
};

// Mock mode: swap to mock client when NEXT_PUBLIC_MOCK=true
let mockClientModule: { mockClient: typeof client } | null = null;
if (IS_MOCK) {
  // Dynamic require to avoid bundling mock code in production
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  mockClientModule = require('./mock/mock-client');
}
export default IS_MOCK && mockClientModule ? mockClientModule.mockClient : client;

// Token refresh queue
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token as string));
  failedQueue = [];
};

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const { accessToken } = useAuthStore.getState();
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;
      
      const { refreshToken, logout, setTokens } = useAuthStore.getState();

      if (!refreshToken) {
        logout();
        // Trigger auto re-login event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:token-expired'));
        }
        return Promise.reject(error);
      }

      try {
        // Call refresh endpoint
        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
        const { access_token: newAccessToken, refresh_token: newRefreshToken } = data;
        
        // Update tokens in store
        setTokens(newAccessToken, newRefreshToken);
        
        // Process queued requests
        processQueue(null, newAccessToken);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        processQueue(refreshError as Error, null);
        logout();
        
        // Trigger auto re-login event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:token-expired'));
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Handle other errors
    if (error.response) {
      const { status } = error.response;
      if (status !== 401) {
        // Only log non-401 errors to avoid noise
        console.error(`API Error ${status}`);
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * Base configuration with auth token
 */
export const withAuth: AxiosRequestConfig = {
  // Axios instance will handle auth via interceptor
};

/**
 * Standard configuration for most queries
 * - 5 minute cache time
 * - Refetch on window focus
 * - Refetch on reconnect
 */
export const $ = {
  client: withAuth,
  query: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1,
  },
};

/**
 * Live data configuration
 * - 30 second cache time
 * - Refetch every 30 seconds
 * - Refetch on window focus
 */
export const $live = {
  client: withAuth,
  query: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
  },
};

/**
 * Fresh data configuration
 * - No cache
 * - Always refetch
 */
export const $fresh = {
  client: withAuth,
  query: {
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always' as const,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1,
  },
};

/**
 * Background data configuration
 * - 15 minute cache time
 * - No automatic refetching
 */
export const $background = {
  client: withAuth,
  query: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 0,
  },
};

/**
 * Helper function to set auth token (deprecated - use useAuthStore instead)
 */
export function setAuthToken(token: string | null) {
  if (typeof window !== 'undefined') {
    const { setTokens } = useAuthStore.getState();
    if (token) {
      // For backward compatibility, store as both access and refresh
      setTokens(token, token);
    } else {
      useAuthStore.getState().logout();
    }
  }
}

/**
 * Helper function to get auth token (deprecated - use useAuthStore instead)
 */
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    const { accessToken } = useAuthStore.getState();
    return accessToken;
  }
  return null;
}
