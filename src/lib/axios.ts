import axios from "axios";
import { useAuthStore } from "@/features/auth/useAuthStore";

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

    // Zustand persist may store state under `state` or directly
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

    // fallback to localStorage (in case persist hasn't hydrated yet)
    if (!token && typeof window !== "undefined") {
      token = getTokenFromLocalStorage();
    }

    if (token) {
      config.headers = config.headers || {};
      // ensure header property exists and is set safely
      // some Axios versions use AxiosHeaders; using bracket notation is robust
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
      requestUrl.includes("/auth/reset-password");

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
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { accessToken, refreshToken, logout, login, role } =
        useAuthStore.getState();

      if (refreshToken && accessToken) {
        try {
          const res = await axios.post(
            `${apiClient.defaults.baseURL}/api/auth/refresh-token`,
            { accessToken, refreshToken },
          );

          if (res.data.success && res.data.data.isSuccess) {
            const newAuthData = res.data.data.data;
            login(
              newAuthData.retailerProfile,
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
          } else {
            // Handle case where request succeeds but data indicates failure
            processQueue(new Error("Refresh failed"));
            logout();
            window.location.href =
              role === "customer" ? "/login/customer" : "/login/retailer";
            return Promise.reject(error);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          logout();
          window.location.href =
            role === "customer" ? "/login/customer" : "/login/retailer";
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        logout();
        window.location.href =
          role === "customer" ? "/login/customer" : "/login/retailer";
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);
