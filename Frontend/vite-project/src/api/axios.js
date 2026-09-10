import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,  // Send HttpOnly cookies (access_token) with every request
});

// Request interceptor
api.interceptors.request.use((config) => {

    const isAdmin = window.location.pathname.startsWith("/admin");
    const token = localStorage.getItem(isAdmin ? "admin_access_token" : "access_token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;

});

// Response interceptor
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            !originalRequest.url?.includes("account/refresh-token/")
        ) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const isAdmin = window.location.pathname.startsWith("/admin");
            const refreshKey = isAdmin ? "admin_refresh_token" : "refresh_token";
            const refresh = localStorage.getItem(refreshKey);

            // User is already logged out or no refresh token
            if (!refresh) {
                isRefreshing = false;
                if (isAdmin) {
                    localStorage.removeItem("admin_access_token");
                    localStorage.removeItem("admin_refresh_token");
                    localStorage.removeItem("admin");
                    window.location.href = "/admin/login";
                } else {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh_token");
                    localStorage.removeItem("customer");
                    window.dispatchEvent(new Event("customer-logout"));
                }
                return Promise.reject(error);
            }

            try {
                const refreshEndpoint = API_BASE_URL.endsWith('/') 
                    ? `${API_BASE_URL}account/refresh-token/` 
                    : `${API_BASE_URL}/account/refresh-token/`;
                const res = await axios.post(
                    refreshEndpoint,
                    {
                        refresh,
                    }
                );

                const newAccess = res.data.access;

                localStorage.setItem(
                    isAdmin ? "admin_access_token" : "access_token",
                    newAccess
                );

                originalRequest.headers.Authorization =
                    `Bearer ${newAccess}`;

                processQueue(null, newAccess);
                return api(originalRequest);

            } catch (err) {
                processQueue(err, null);

                if (isAdmin) {
                    localStorage.removeItem("admin_access_token");
                    localStorage.removeItem("admin_refresh_token");
                    localStorage.removeItem("admin");
                    window.location.href = "/admin/login";
                } else {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh_token");
                    localStorage.removeItem("customer");
                    window.dispatchEvent(new Event("customer-logout"));
                }

                return Promise.reject(err);

            } finally {
                isRefreshing = false;
            }

        }

        return Promise.reject(error);

    }

);

export default api;