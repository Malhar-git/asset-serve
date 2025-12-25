import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api/v1",
});

// Auth utility functions
export const setAuthToken = (token: string) => {
  localStorage.setItem("jwt_token", token);
};

export const getAuthToken = () => {
  return localStorage.getItem("jwt_token");
};

export const removeAuthToken = () => {
  localStorage.removeItem("jwt_token");
};

// Request interceptor to add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    // Getting token from localStorage
    const token = typeof window !== "undefined" ? getAuthToken() : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      removeAuthToken();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
