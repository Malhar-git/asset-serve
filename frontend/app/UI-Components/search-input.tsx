/* eslint-disable react-hooks/rules-of-hooks */
import { useRef, useState } from "react"
import { Search } from "lucide-react"

const searchInput = () => {
  const [isFocused, setIsFocused] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const inputRef = useRef(null);

  const handleSearch = () => {
    if (searchValue.trim()) {
      console.log('Searching for:', searchValue);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 min-800px">
      <div className="w-full max-w-2">
        <div className="relative">
          <div className="bg-gray-300 p-2 rounded">
            <div className="flex items-center bg-white relative">
              <input
                ref={inputRef}
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder="Search"
                className={`flex-1 px-4 py-2 text-lg outline-none transition-all ${isFocused ? 'ring-2 ring-blue-500' : ''}`}
                style={{ width: '200px' }}
              ></input>

              <button
                onClick={handleSearch}
                className="p-3 hover:bg-gray-100 transition-colors flex-shirnk-0"
                aria-label="Search"
              >

                <Search size={24} strokeWidth={2} className="text-gray-100" />

              </button>

              {isFocused && (
                <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none" />
              )}

              <div className="absolute top-0 right-0 h-full w-4 bg-gray-400 rounded-r" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}