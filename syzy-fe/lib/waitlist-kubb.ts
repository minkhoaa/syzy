/**
 * Waitlist API Client — dedicated Axios instance for the syzy-be waitlist backend.
 * Mirrors the pattern in `lib/kubb.ts` but targets the waitlist service and uses
 * separate auth storage namespaces.
 */

import axios, {
  type InternalAxiosRequestConfig,
  type AxiosError,
  type AxiosResponse,
} from "axios";
import { useWaitlistMemberAuthStore } from "@/features/waitlist/store/use-waitlist-member-auth-store";
import { useWaitlistAdminAuthStore } from "@/features/waitlist/store/use-waitlist-admin-auth-store";

const WAITLIST_API_URL =
  process.env.NEXT_PUBLIC_WAITLIST_API_URL ?? "/api";
const IS_MOCK = process.env.NEXT_PUBLIC_MOCK === "true";

// ── Axios instance ─────────────────────────────────────────────────

export const waitlistApiClient = axios.create({
  baseURL: WAITLIST_API_URL,
  headers: { "Content-Type": "application/json" },
});

if (IS_MOCK) {
  // Route all requests through the mock handler in mock mode
  const { mockWaitlistClient } = require("./mock/mock-waitlist-client");
  waitlistApiClient.defaults.adapter = async (
    config: InternalAxiosRequestConfig,
  ) => {
    let url = config.url ?? "";
    if (config.baseURL && url.startsWith(config.baseURL)) {
      url = url.slice(config.baseURL.length);
    }
    const res = await mockWaitlistClient({
      url,
      method: (config.method ?? "GET").toUpperCase(),
      params: config.params,
      data: config.data,
    });
    return {
      data: res.data,
      status: res.status,
      statusText: res.statusText ?? "",
      headers: Object.fromEntries(
        Object.entries(res.headers ?? {}).map(([k, v]) => [k, String(v ?? "")]),
      ),
      config,
    };
  };
}

// ── Token refresh queue ─────────────────────────────────────────────

let isMemberRefreshing = false;
let memberFailedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processMemberQueue = (err: Error | null, token: string | null = null) => {
  memberFailedQueue.forEach((p) =>
    err ? p.reject(err) : p.resolve(token as string),
  );
  memberFailedQueue = [];
};

// ── Member auth interceptor ─────────────────────────────────────────

waitlistApiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window === "undefined") return config;
    const { accessToken } = useWaitlistMemberAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

waitlistApiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest =
      error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!originalRequest) return Promise.reject(error);

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      const isMemberEndpoint =
        !originalRequest.url?.startsWith("/admin") &&
        !originalRequest.url?.includes("/auth/admin");

      if (isMemberEndpoint && !isMemberRefreshing) {
        originalRequest._retry = true;
        isMemberRefreshing = true;

        const { refreshToken, logout } =
          useWaitlistMemberAuthStore.getState();

        if (!refreshToken) {
          logout();
          return Promise.reject(error);
        }

        try {
          const { data } = await axios.post(
            `${WAITLIST_API_URL}/auth/refresh`,
            { refreshToken },
          );
          const { accessToken: newAccess, refreshToken: newRefresh } = data;
          useWaitlistMemberAuthStore
            .getState()
            .setAuthState({
              accessToken: newAccess,
              refreshToken: newRefresh,
              member: useWaitlistMemberAuthStore.getState().member!,
            });
          processMemberQueue(null, newAccess);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return waitlistApiClient(originalRequest);
        } catch (refreshError) {
          processMemberQueue(refreshError as Error, null);
          logout();
          return Promise.reject(refreshError);
        } finally {
          isMemberRefreshing = false;
        }
      }
    }

    return Promise.reject(error);
  },
);

// ── Types ───────────────────────────────────────────────────────────

export type RequestConfig<TData = unknown> = {
  baseURL?: string;
  url?: string;
  method?: "GET" | "PUT" | "PATCH" | "POST" | "DELETE";
  params?: unknown;
  data?: TData | FormData;
  signal?: AbortSignal;
  validateStatus?: (status: number) => boolean;
  headers?: InternalAxiosRequestConfig["headers"];
};

export type ResponseConfig<TData = unknown> = {
  data: TData;
  status: number;
  statusText: string;
  headers: Record<string, string>;
};

const waitlistClient = async <
  TResponseData,
  _TError = unknown,
  TRequestData = unknown,
>(
  config: RequestConfig<TRequestData>,
): Promise<ResponseConfig<TResponseData>> => {
  const response = await waitlistApiClient.request<TResponseData>(
    config as unknown as InternalAxiosRequestConfig,
  );
  return {
    data: response.data,
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(
      Object.entries(response.headers).map(([k, v]) => [k, String(v ?? "")]),
    ),
  };
};

export default waitlistClient;

// ── React Query presets ─────────────────────────────────────────────

export const $waitlist = {
  client: {},
  query: {
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1,
  },
};

export const $waitlistFresh = {
  client: {},
  query: {
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always" as const,
    retry: 1,
  },
};
