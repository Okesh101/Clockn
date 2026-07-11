import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

const api = axios.create({
  baseURL: "/api/v1",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

const clearSession = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("admin");
  window.dispatchEvent(new CustomEvent("auth:logout"));
};

const redirectToAuth = () => {
  if (window.location.pathname !== "/auth") {
    window.location.assign("/auth");
  }
};

type RetriableConfig = AxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        clearSession();
        redirectToAuth();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          "/api/v1/auth/refresh",
          {},
          { headers: { Authorization: `Bearer ${refreshToken}` } },
        );

        const newAccessToken = data.access_token as string;
        localStorage.setItem("access_token", newAccessToken);

        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${newAccessToken}`,
        };
        return api(originalRequest);
      } catch (refreshError) {
        clearSession();
        redirectToAuth();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
