"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "../UI-Components/button";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { setAuthToken } from '../lib/axios-interceptor';

// API configuration - use environment variable or fallback to localhost
const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:8080/api/auth";

// User-friendly error messages for authentication
const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Invalid email or password. Please try again.",
  USER_EXISTS: "An account with this email already exists.",
  NETWORK_ERROR: "Unable to connect to the server. Please check your internet connection.",
  SERVER_ERROR: "Something went wrong. Please try again later.",
  WEAK_PASSWORD: "Password is too weak. Please use at least 8 characters.",
  INVALID_EMAIL: "Please enter a valid email address.",
  DEFAULT: "Authentication failed. Please try again.",
} as const;

/**
 * Extracts a user-friendly error message from an authentication error
 */
function getAuthErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return AUTH_ERROR_MESSAGES.DEFAULT;
  }

  const axiosError = error as AxiosError<string | { message?: string }>;

  if (!axiosError.response) {
    return AUTH_ERROR_MESSAGES.NETWORK_ERROR;
  }

  const status = axiosError.response.status;
  const data = axiosError.response.data;

  // Check for specific error messages from backend
  if (typeof data === "string") {
    if (data.toLowerCase().includes("already exists") || data.toLowerCase().includes("already registered")) {
      return AUTH_ERROR_MESSAGES.USER_EXISTS;
    }
    if (data.toLowerCase().includes("invalid") || data.toLowerCase().includes("incorrect")) {
      return AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS;
    }
    // Return the backend message if it's short and meaningful
    if (data.length < 150) {
      return data;
    }
  }

  switch (status) {
    case 400:
      return AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS;
    case 401:
      return AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS;
    case 409:
      return AUTH_ERROR_MESSAGES.USER_EXISTS;
    case 500:
    case 502:
    case 503:
      return AUTH_ERROR_MESSAGES.SERVER_ERROR;
    default:
      return AUTH_ERROR_MESSAGES.DEFAULT;
  }
}

export default function LoginPage() {
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);
  const [formData, setFormData] = useState({ firstName: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");

  const router = useRouter();

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    setErrorMessage("");
  };

  // Toggle between login and registration modes
  const toggleAuthMode = () => {
    setIsLoginMode(!isLoginMode);
    setErrorMessage("");
    setSuccessMessage("");
    setFormData({ firstName: "", email: "", password: "" });
  };

  // Validate form inputs
  const validateForm = (): string | null => {
    if (!formData.email.trim()) {
      return "Please enter your email address.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return AUTH_ERROR_MESSAGES.INVALID_EMAIL;
    }
    if (!formData.password.trim()) {
      return "Please enter your password.";
    }
    if (!isLoginMode) {
      if (!formData.firstName.trim()) {
        return "Please enter your name.";
      }
      if (formData.password.length < 6) {
        return "Password must be at least 6 characters long.";
      }
    }
    return null;
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate form before submission
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (isLoginMode) {
        // Login flow
        const response = await axios.post(`${AUTH_API_URL}/login`, {
          email: formData.email,
          password: formData.password,
        });

        const { token, user } = response.data;
        setAuthToken(token);

        const profile = {
          name: user?.firstName ?? user?.name ?? formData.firstName ?? "",
          email: user?.email ?? formData.email,
        };

        try {
          localStorage.setItem("userProfile", JSON.stringify(profile));
        } catch (storageError) {
          // Non-critical: continue even if profile can't be saved
          console.warn("Unable to persist user profile", storageError);
        }

        router.push("/dashboard");
      } else {
        // Registration flow
        await axios.post(`${AUTH_API_URL}/register`, {
          firstName: formData.firstName,
          email: formData.email,
          password: formData.password,
        });

        setSuccessMessage("Account created successfully! Please log in.");
        setIsLoginMode(true);
        setFormData({ ...formData, password: "" });
      }
    } catch (err) {
      const errorMsg = getAuthErrorMessage(err);
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login__page grid grid-cols-1 md:grid-cols-[35%_65%] h-screen bg-indigo-50">

      {/* --- LEFT SIDE: LOGIN FORM --- */}
      <div className="login__form flex justify-center items-center p-8">
        {/* Added w-full and max-w-md to control width properly */}
        <div className="login__form--content w-full max-w-sm space-y-8">

          <div className="text-center">
            <h1 className="text-4xl font-semibold text-gray-900">
              {isLoginMode ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="mt-2 text-base text-gray-500">Let&apos;s sign you in securely</p>
          </div>

          {/* Success Message Display */}
          {successMessage && (
            <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md border border-green-200 text-center">
              {successMessage}
            </div>
          )}

          {/* Error Message Display */}
          {errorMessage && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200 text-center">
              {errorMessage}
            </div>
          )}

          <div className="login__form--inputs space-y-4">

            {/* Name Input - Only visible during Registration */}
            {!isLoginMode && (
              <div className="relative__input-name relative animate-in fade-in slide-in-from-bottom-2">
                <input
                  type="text"
                  id="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  placeholder="Enter Your Name"
                  className="peer block w-full rounded-md border border-gray-300 px-3 py-3 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 placeholder-transparent"
                />
                <label
                  htmlFor="firstName"
                  className="absolute left-3 -top-2 px-1 text-xs text-gray-500 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-focus:-top-2 peer-focus:text-xs peer-focus:text-indigo-600"
                >
                  Full Name
                </label>
              </div>
            )}

            {/* Email Input Group */}
            <div className="relative__input-email relative">
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
                placeholder="Enter Your Email Address"
                className="peer block w-full rounded-md border border-gray-500 px-3 py-3 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 placeholder-transparent"
              />
              <label
                htmlFor="email"
                className="absolute left-3 -top-2 bg-indigo-50 px-1 text-xs text-gray-600 transition-all
                  peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm
                  peer-focus:-top-2 peer-focus:text-xs peer-focus:text-indigo-600"
              >
                Email Address
              </label>
            </div>

            {/* Password Input Group */}
            <div className="relative__input-password relative">
              <input
                type="password"
                id="password"
                placeholder="Enter Your Password"
                onChange={handleInputChange}
                disabled={isLoading}
                value={formData.password}
                className="peer block w-full rounded-md border border-gray-500 px-3 py-3 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 placeholder-transparent"
              />
              <label
                htmlFor="password"
                className="absolute left-3 -top-2 bg-indigo-50 px-1 text-xs text-gray-600 transition-all
                  peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm
                  peer-focus:-top-2 peer-focus:text-xs peer-focus:text-indigo-600"
              >
                {isLoginMode ? "Password" : "Create a Password"}
              </label>
            </div>
          </div>

          {/* Buttons Container */}
          <div className="login__form--actions flex flex-col space-y-4">
            {/* Primary Button */}
            <Button onClick={handleSubmit} disabled={isLoading} className="w-full py-3 justify-center items-center">
              {isLoading
                ? "Processing..."
                : (isLoginMode ? "Log in with Email" : "Create Account")
              }
            </Button>

            {/* Google Button */}
            <button disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26-1.19-.58z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Log in with Google
            </button>

            <div className="text-center text-sm text-gray-600 mt-4">
              {isLoginMode ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={toggleAuthMode}
                    className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={toggleAuthMode}
                    className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                  >
                    Log in
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* --- RIGHT SIDE: HERO SECTION --- */}
      <div className="relative hidden md:flex flex-col justify-center items-center p-12 text-white overflow-hidden">
        {/* Background Image */}
        <Image
          src="/asset-serve-dashboard.png"
          alt="Dashboard Preview"
          fill
          className="object-contain"
          priority
        />
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0" />

        {/* "What's New" Dropdown (Top Right) */}
        <div className="absolute top-6 right-6 z-10">
          <Button
            onClick={() => setIsWhatsNewOpen(!isWhatsNewOpen)}
          >
            ✨ What&apos;s New

          </Button>

          {/* Dropdown Content */}
          {isWhatsNewOpen && (
            <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-md bg-white p-4 shadow-lg text-gray-800 animate-in fade-in slide-in-from-top-2">
              <h3 className="font-bold text-sm mb-2 text-indigo-600">Latest Updates</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-green-500"></span>
                  <span>Tax Harvesting is live!</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-green-500"></span>
                  <span>New Area Charts for Portfolio</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-green-500"></span>
                  <span>Dark Mode (Coming Soon)</span>
                </li>
              </ul>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}