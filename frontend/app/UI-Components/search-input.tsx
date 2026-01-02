"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Search, AlertCircle } from "lucide-react";
import api from "../lib/axios-interceptor";

interface Scrip {
  id?: string | number;
  name: string;
  token: string;
}

interface SearchInputProps {
  onScripSelect: (token: string, name: string) => void;
}

export default function SearchInput({ onScripSelect }: SearchInputProps) {
  const [searchValue, setSearchValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<Scrip[]>([]);

  // Fetch suggestions from API
  const fetchSuggestions = useCallback(async (searchText: string) => {
    try {
      setIsSearching(true);
      setSearchError(null);
      const response = await api.get(`/scriplist/search?q=${searchText}`);
      setSuggestions(response.data || []);
      setShowDropdown(true);
    } catch {
      setSearchError("Unable to search. Please try again.");
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce logic: wait for user to stop typing
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchValue.length > 1) {
        fetchSuggestions(searchValue);
      } else {
        setSuggestions([]);
        setShowDropdown(false);
        setSearchError(null);
      }
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchValue, fetchSuggestions]);

  const handleSelect = (scrip: Scrip) => {
    setSearchValue(scrip.name || "");
    setShowDropdown(false);
    setSuggestions([]);
    setSearchError(null);
    onScripSelect(scrip.token, scrip.name);
  };

  // Handle close after clicking outside dropdown menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = () => {
    if (searchValue.trim()) {
      setShowDropdown(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  const handleInputClick = () => {
    if (suggestions.length > 0) {
      setShowDropdown(true);
    }
  };

  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>
      <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
        <input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value);
          }}
          onFocus={handleInputClick}
          onKeyDown={handleKeyDown}
          placeholder="Search stocks..."
          className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
        />
        {isSearching ? (
          <div className="p-2">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <button
            onClick={handleSearch}
            className="p-2 hover:bg-gray-100 transition-colors shrink-0"
            aria-label="Search"
          >
            <Search size={18} strokeWidth={2} className="text-gray-500" />
          </button>
        )}
      </div>

      {/* Error message */}
      {searchError && (
        <div className="absolute z-10 w-full bg-red-50 border border-red-200 rounded-b-lg shadow-lg p-2 flex items-center gap-2">
          <AlertCircle size={14} className="text-red-500" />
          <span className="text-xs text-red-600">{searchError}</span>
        </div>
      )}

      {/* Suggestions dropdown */}
      {showDropdown && suggestions.length > 0 && !searchError && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-b-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((scrip, idx) => (
            <div
              key={scrip.id || idx}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm"
              onClick={() => handleSelect(scrip)}
            >
              {scrip.name ?? String(scrip.id ?? "")}
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {showDropdown && suggestions.length === 0 && searchValue.length > 1 && !isSearching && !searchError && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-b-lg shadow-lg p-3 text-center">
          <span className="text-sm text-gray-500">No stocks found for &ldquo;{searchValue}&rdquo;</span>
        </div>
      )}
    </div>
  );
}