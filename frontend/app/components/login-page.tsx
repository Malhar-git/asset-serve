"use client"; // Required for the dropdown state

import { useState } from "react";
import { Button } from "../UI-Components/button";

export default function LoginPage() {
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);

  return (
    <div className="login__page grid grid-cols-1 md:grid-cols-2 h-screen">

      {/* --- LEFT SIDE: LOGIN FORM --- */}
      <div className="login__form flex justify-center items-center bg-white p-8">
        {/* Added w-full and max-w-md to control width properly */}
        <div className="login__form--content w-full max-w-sm space-y-8">

          <div className="text-center">
            <h1 className="text-4xl font-semibold text-gray-900">Welcome Back</h1>
            <p className="mt-2 text-base text-gray-500">Let&apos;s sign you in securely</p>
          </div>

          <div className="login__form--inputs space-y-4">

            {/* Email Input Group */}
            <div className="relative__input-email relative">
              <input
                type="text"
                id="email"
                placeholder="Enter Your Email Address"
                className="peer block w-full rounded-md border border-gray-300 px-3 py-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 placeholder-transparent"
              />
              <label
                htmlFor="email"
                className="absolute left-3 top-[-8px] bg-white px-1 text-xs text-gray-500 transition-all
                  peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm
                  peer-focus:top-[-8px] peer-focus:text-xs peer-focus:text-blue-600"
              >
                Enter your Email Address
              </label>
            </div>

            {/* Password Input Group */}
            <div className="relative__input-password relative">
              <input
                type="password"
                id="password"
                placeholder="Enter Your Password"
                className="peer block w-full rounded-md border border-gray-300 px-3 py-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 placeholder-transparent"
              />
              <label
                htmlFor="password"
                className="absolute left-3 top-[-8px] bg-white px-1 text-xs text-gray-500 transition-all
                  peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm
                  peer-focus:top-[-8px] peer-focus:text-xs peer-focus:text-blue-600"
              >
                Enter your Password
              </label>
            </div>
          </div>

          {/* Buttons Container */}
          <div className="login__form--actions flex flex-col space-y-4">
            {/* Primary Button */}
            <Button variant="minimal" className="w-full py-3 justify-center items-center">
              Log in with Email
            </Button>

            {/* Google Button */}
            <button className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
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
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDE: HERO SECTION --- */}
      <div className="relative hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-blue-600 to-blue-800 p-12 text-white">

        {/* "What's New" Dropdown (Top Right) */}
        <div className="absolute top-6 right-6">
          <button
            onClick={() => setIsWhatsNewOpen(!isWhatsNewOpen)}
            className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20 transition-all backdrop-blur-sm"
          >
            ✨ What&apos;s New
            <svg
              className={`h-4 w-4 transition-transform ${isWhatsNewOpen ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Content */}
          {isWhatsNewOpen && (
            <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-md bg-white p-4 shadow-lg text-gray-800 animate-in fade-in slide-in-from-top-2">
              <h3 className="font-bold text-sm mb-2 text-blue-600">Latest Updates</h3>
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

        {/* Hero Content Placeholder */}
        <div className="text-center space-y-4 max-w-lg">
          <div className="h-64 w-full bg-white/10 rounded-xl backdrop-blur-md border border-white/20 flex items-center justify-center mb-8 shadow-2xl">
            <span className="text-blue-100 font-medium">Dashboard Preview</span>
          </div>
          <h2 className="text-3xl font-bold">Manage your Wealth Smarter</h2>
          <p className="text-blue-100">
            Track your portfolio, analyze market trends, and optimize your taxes all in one place.
          </p>
        </div>

      </div>
    </div>
  );
}