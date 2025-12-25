"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Search } from "lucide-react";
import api from "../lib/axios-interceptor";

interface Scrip {
  id?: string | number;
  name: string;
  token: string;
}

interface SearchInputProps{
  onScripSelect: (token : string, name: string)=> void;
}

export default function SearchInput({onScripSelect}:SearchInputProps){
  const [isFocused, setIsFocused] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [showDropDown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [suggestion, setSuggestion] = useState<Scrip[]>([]);

  // Fetch suggestions from API - wrapped in useCallback to prevent recreation
  const fetchSuggestions = useCallback(async (searchText: string) => {
    try {
      const res = await api.get(`/scriplist/search?q=${searchText}`);
      setSuggestion(res.data || []);
      setShowDropdown(true);
    } catch (error) {
      console.error("Search failed", error);
      setSuggestion([]);
      setShowDropdown(false);
    }
  }, []);

  // Debounce logic: wait for user to stop typing
  useEffect(() => {
    const delaybounceFn = setTimeout(() => {
      if (searchValue.length > 1) {
        fetchSuggestions(searchValue);
      } else {
        setSuggestion([]);
        setShowDropdown(false);
      }
    }, 300);
    return () => clearTimeout(delaybounceFn);
  }, [searchValue, fetchSuggestions]);

  const handleSelect = (scrip: Scrip) => {
    setSearchValue(scrip.name || "");
    setShowDropdown(false);
    setSuggestion([]);
    //Passing the token
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
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = () => {
    if (searchValue.trim()) {
      console.log("Searching for:", searchValue);
      setShowDropdown(false);
      setIsFocused(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleInputClick = () => {
    setIsFocused(true);
    if (suggestion.length > 0) {
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
          placeholder="Search..."
          className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
        />
        <button
          onClick={handleSearch}
          className="p-2 hover:bg-gray-100 transition-colors flex-shrink-0"
          aria-label="Search"
        >
          <Search size={18} strokeWidth={2} className="text-gray-500" />
        </button>
      </div>
      {showDropDown && suggestion.length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-b-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestion.map((scrip, idx) => (
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
    </div>
  );
}