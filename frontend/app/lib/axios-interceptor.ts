import axios, { AxiosError } from "axios";

// API configuration - use environment variable or fallback to localhost
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
});

// User-friendly error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR:
    "Unable to connect to the server. Please check your internet connection.",
  TIMEOUT_ERROR: "The request took too long. Please try again.",
  SERVER_ERROR: "Something went wrong on our end. Please try again later.",
  UNAUTHORIZED: "Your session has expired. Please log in again.",
  FORBIDDEN: "You don't have permission to access this resource.",
  NOT_FOUND: "The requested resource was not found.",
  VALIDATION_ERROR: "Please check your input and try again.",
  DEFAULT: "An unexpected error occurred. Please try again.",
} as const;

/**
 * Extracts a user-friendly error message from an Axios error
 */
export function getErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return ERROR_MESSAGES.DEFAULT;
  }

  const axiosError = error as AxiosError<{ message?: string; error?: string }>;

  // Network errors (no response received)
  if (!axiosError.response) {
    if (axiosError.code === "ECONNABORTED") {
      return ERROR_MESSAGES.TIMEOUT_ERROR;
    }
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  const status = axiosError.response.status;
  const serverMessage =
    axiosError.response.data?.message || axiosError.response.data?.error;

  // Use server message if available and meaningful
  if (
    serverMessage &&
    typeof serverMessage === "string" &&
    serverMessage.length < 200
  ) {
    return serverMessage;
  }

  // HTTP status code based messages
  switch (status) {
    case 400:
      return ERROR_MESSAGES.VALIDATION_ERROR;
    case 401:
      return ERROR_MESSAGES.UNAUTHORIZED;
    case 403:
      return ERROR_MESSAGES.FORBIDDEN;
    case 404:
      return ERROR_MESSAGES.NOT_FOUND;
    case 500:
    case 502:
    case 503:
    case 504:
      return ERROR_MESSAGES.SERVER_ERROR;
    default:
      return ERROR_MESSAGES.DEFAULT;
  }
}

// Auth utility functions
export const setAuthToken = (token: string) => {
  api.defaults.headers.common.Authorization = `Bearer ${token}`;

  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem("jwt_token", token);
  window.dispatchEvent(new Event("auth-token-updated"));
};

export const getAuthToken = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("jwt_token");
};

export const removeAuthToken = () => {
  delete api.defaults.headers.common.Authorization;

  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("jwt_token");
  window.dispatchEvent(new Event("auth-token-updated"));
};

const existingToken = typeof window !== "undefined" ? getAuthToken() : null;
if (existingToken) {
  api.defaults.headers.common.Authorization = `Bearer ${existingToken}`;
}

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

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      removeAuthToken();
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
