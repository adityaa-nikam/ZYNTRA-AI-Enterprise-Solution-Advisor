import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
});

// Request Interceptor: Attach Access Token if available
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Auto-refresh access token on 401
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/api/auth/login") &&
      !originalRequest.url.includes("/api/auth/register")
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken =
          localStorage.getItem("refreshToken") ||
          sessionStorage.getItem("refreshToken");

        if (refreshToken) {
          const res = await axios.post(
            `${API_URL}/api/auth/refresh-token`,
            { refreshToken }
          );

          if (res.data.success) {
            const newAccessToken = res.data.accessToken;

            if (localStorage.getItem("refreshToken")) {
              localStorage.setItem(
                "accessToken",
                newAccessToken
              );
            } else {
              sessionStorage.setItem(
                "accessToken",
                newAccessToken
              );
            }

            api.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${newAccessToken}`;

            originalRequest.headers[
              "Authorization"
            ] = `Bearer ${newAccessToken}`;

            return api(originalRequest);
          }
        }
      } catch (refreshErr) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
      }
    }

    return Promise.reject(error);
  }
);

export default api;