import axios from "axios";
import { useAuthStore, type RetailerProfile, type UserRole } from "@/features/auth/useAuthStore";


type RefreshAuthData = {
  accessToken: string;
  refreshToken: string;
  retailerProfile?: RetailerProfile | null;
  customerProfile?: RetailerProfile | null;
  profile?: RetailerProfile | null;
  user?: RetailerProfile | null;
};

export const getProfileFromRefreshData = (
  authData: RefreshAuthData,
  role: UserRole | null,
  fallbackProfile: RetailerProfile | null,
): RetailerProfile | null => {
  if (role === "customer") {
    return (
      authData.customerProfile ??
      authData.profile ??
      authData.user ??
      fallbackProfile ??
      null
    );
  }

  if (role === "retailer") {
    return authData.retailerProfile ?? fallbackProfile ?? null;
  }

  return (
    authData.profile ??
    authData.user ??
    authData.retailerProfile ??
    authData.customerProfile ??
    fallbackProfile ??
    null
  );
};

export const getRefreshEndpointForRole = (role: UserRole | null): string =>
  role === "customer" ? "/api/customer/auth/refresh" : "/api/auth/refresh-token";

export const getLoginPathForRole = (role: UserRole | null): string =>
  role === "customer" ? "/login/customer" : "/login/retailer";

export const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL || "https://vfr-backend.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

function getTokenFromLocalStorage(): string | null {
  try {
    const raw = localStorage.getItem("wear-auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    return (
      parsed?.state?.accessToken ||
      parsed?.accessToken ||
      parsed?.access_token ||
      parsed?.token ||
      null
    );
  } catch {
    return null;
  }
}

apiClient.interceptors.request.use(
  (config) => {
    let token = useAuthStore.getState().accessToken;

    if (!token && typeof window !== "undefined") {
      token = getTokenFromLocalStorage();
    }

    if (token) {
      config.headers = config.headers || {};
      (config.headers as Record<string, string>)["Authorization"] =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const requestUrl = String(originalRequest?.url || "");
    const isAuthEndpoint =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/complete-profile") ||
      requestUrl.includes("/auth/forgot-password") ||
      requestUrl.includes("/auth/reset-password") ||
      requestUrl.includes("/auth/refresh") ||
      requestUrl.includes("/auth/refresh-token") ||
      requestUrl.includes("/auth/logout");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest._retry = true;
            originalRequest.headers = originalRequest.headers || {};
            (originalRequest.headers as Record<string, string>)["Authorization"] =
              `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { accessToken, refreshToken, logout, login, role, user } =
        useAuthStore.getState();

      if (refreshToken && accessToken) {
        try {
          const res = await axios.post(
            `${apiClient.defaults.baseURL}${getRefreshEndpointForRole(role)}`,
            { accessToken, refreshToken },
          );

          if (res.data.success && res.data.data.isSuccess) {
            const newAuthData = res.data.data.data as RefreshAuthData;
            const refreshedProfile = getProfileFromRefreshData(
              newAuthData,
              role,
              user,
            );

            if (!refreshedProfile) {
              throw new Error("Refresh response did not include a profile");
            }

            login(
              refreshedProfile,
              {
                accessToken: newAuthData.accessToken,
                refreshToken: newAuthData.refreshToken,
              },
              role || "retailer",
            );

            processQueue(null, newAuthData.accessToken);

            originalRequest.headers = originalRequest.headers || {};
            (originalRequest.headers as Record<string, string>)[
              "Authorization"
            ] = `Bearer ${newAuthData.accessToken}`;
            return apiClient(originalRequest);
          }

          processQueue(new Error("Refresh failed"));
          logout();
          window.location.href = getLoginPathForRole(role);
          return Promise.reject(error);
        } catch (refreshError) {
          processQueue(refreshError, null);
          logout();
          window.location.href = getLoginPathForRole(role);
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        logout();
        window.location.href = getLoginPathForRole(role);
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);
