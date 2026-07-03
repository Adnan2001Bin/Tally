import axios, { type AxiosRequestConfig } from "axios";
import { getApiBaseUrl } from "@/lib/config/api-url";
import { redirectToLogin } from "@/lib/auth/auth-routes";
import { getAccessToken } from "@/lib/auth/auth-storage";
import { refreshSession } from "@/lib/auth/refresh-session";

export const AXIOS_INSTANCE = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

AXIOS_INSTANCE.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const url = originalRequest?.url ?? "";

    if (status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (url.includes("/auth/refresh") || url.includes("/auth/login") || url.includes("/auth/register")) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const refreshed = await refreshSession();

    if (!refreshed) {
      if (typeof window !== "undefined") {
        redirectToLogin();
      }
      return Promise.reject(error);
    }

    const token = getAccessToken();
    if (token) {
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${token}`;
    }

    return AXIOS_INSTANCE(originalRequest);
  },
);

export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  return AXIOS_INSTANCE(config).then(({ data }) => data);
};

export default customInstance;
